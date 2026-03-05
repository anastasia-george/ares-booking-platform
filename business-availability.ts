// business-availability.ts
import { PrismaClient, Availability } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 1. WEEKLY SCHEDULE
 * Business defines standard operating hours per day.
 * Example: Mon-Fri 9am-5pm.
 */
export interface WeeklySchedule {
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

/**
 * 2. OVERRIDES / BLOCKED TIME
 * Specific dates where the business is closed or has different hours.
 * Example: "Closed Dec 25" or "Open late Feb 14".
 */
export interface AvailabilityOverride {
  date: string;       // "2023-12-25"
  isClosed: boolean;  // true = fully closed
  startTime?: string; // "10:00" (if open but modified)
  endTime?: string;   // "14:00"
}

export class AvailabilityManager {
  
  /**
   * SET WEEKLY SCHEDULE
   * Saves the standard operating hours for a business.
   */
  async setWeeklySchedule(businessId: string, schedule: WeeklySchedule[]): Promise<Availability[]> {
    // 1. Clear existing schedule for this business
    await prisma.availability.deleteMany({ where: { businessId } });

    // 2. Create new schedule entries
    const operations = schedule.map(slot => 
      prisma.availability.create({
        data: {
          businessId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      })
    );

    return await prisma.$transaction(operations);
  }

  /**
   * CHECK IF OPEN
   * Returns true if the business is open at a specific Date/Time.
   * Checks: Weekly Schedule -> Overrides -> Existing Bookings (handled by Engine)
   */
  async isBusinessOpen(businessId: string, queryDate: Date): Promise<boolean> {
    const dayOfWeek = queryDate.getUTCDay();
    const timeString = queryDate.toISOString().slice(11, 16); // "HH:MM"

    // 1. Check for Override (e.g. Holiday)
    const override = await prisma.availabilityOverride.findFirst({
      where: {
        businessId,
        date: queryDate.toISOString().slice(0, 10) // "YYYY-MM-DD"
      }
    });

    if (override) {
      if (override.isClosed) return false;
      // If open with modified hours, check time
      return timeString >= (override.startTime || "00:00") && 
             timeString < (override.endTime || "23:59");
    }

    // 2. Check Weekly Schedule
    const schedule = await prisma.availability.findFirst({
      where: {
        businessId,
        dayOfWeek
      }
    });

    if (!schedule) return false; // Closed today

    return timeString >= schedule.startTime && timeString < schedule.endTime;
  }
}
