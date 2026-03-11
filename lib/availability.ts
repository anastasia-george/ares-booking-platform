// lib/availability.ts
// Shared availability logic used by API routes, SSR, and components.
import { BookingStatus } from '@prisma/client';
import prisma from './prisma';

const SLOT_STEP_MINUTES = 15;
const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

/**
 * Get open/close times for a business on a specific date.
 * Checks overrides first, then falls back to weekly schedule.
 * Returns null if the business is closed on that date.
 */
export async function getBusinessHours(
  businessId: string,
  dateStr: string // "YYYY-MM-DD"
): Promise<{ startTime: string; endTime: string } | null> {
  // 1. Check date-specific override
  const override = await prisma.availabilityOverride.findFirst({
    where: { businessId, date: dateStr },
  });

  if (override) {
    if (override.isClosed) return null;
    if (override.startTime && override.endTime) {
      return { startTime: override.startTime, endTime: override.endTime };
    }
  }

  // 2. Fall back to weekly schedule
  const queryDate = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = queryDate.getUTCDay();

  const schedule = await prisma.availability.findFirst({
    where: { businessId, dayOfWeek },
  });

  if (!schedule) return null;
  return { startTime: schedule.startTime, endTime: schedule.endTime };
}

/**
 * Compute available time slots for a business on a specific date.
 * Filters out slots that conflict with existing bookings.
 */
export async function getSlotsForDate(
  businessId: string,
  dateStr: string,
  durationMin: number,
  bufferMin: number = 0
): Promise<string[]> {
  const hours = await getBusinessHours(businessId, dateStr);
  if (!hours) return [];

  const totalSlotDuration = durationMin + bufferMin;
  const slots: string[] = [];
  let current = new Date(`${dateStr}T${hours.startTime}:00.000Z`);
  const dayEnd = new Date(`${dateStr}T${hours.endTime}:00.000Z`);
  const now = new Date();

  while (current.getTime() + totalSlotDuration * 60000 <= dayEnd.getTime()) {
    // Skip slots in the past
    if (current.getTime() > now.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + totalSlotDuration * 60000);

      const conflict = await prisma.booking.findFirst({
        where: {
          businessId,
          status: { in: ACTIVE_STATUSES },
          AND: [
            { startTime: { lt: slotEnd } },
            { endTime: { gt: slotStart } },
          ],
        },
      });

      if (!conflict) {
        slots.push(slotStart.toISOString());
      }
    }

    current = new Date(current.getTime() + SLOT_STEP_MINUTES * 60000);
  }

  return slots;
}

/**
 * Scan forward N days from today for a business/service.
 * Returns a map of dates to slot arrays, plus the first available slot.
 */
export async function getNextAvailability(
  businessId: string,
  durationMin: number,
  bufferMin: number = 0,
  days: number = 7
): Promise<{
  dates: Record<string, string[]>;
  nextAvailable: string | null;
  totalSlots: number;
}> {
  const dates: Record<string, string[]> = {};
  let nextAvailable: string | null = null;
  let totalSlots = 0;

  const today = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    const slots = await getSlotsForDate(businessId, dateStr, durationMin, bufferMin);
    if (slots.length > 0) {
      dates[dateStr] = slots;
      totalSlots += slots.length;
      if (!nextAvailable) {
        nextAvailable = slots[0];
      }
    }
  }

  return { dates, nextAvailable, totalSlots };
}

/**
 * Lightweight check: does this business have ANY availability today?
 * Returns the count of available slots and the first slot time.
 */
export async function getAvailabilityToday(
  businessId: string,
  durationMin: number,
  bufferMin: number = 0
): Promise<{ slotsToday: number; firstSlot: string | null }> {
  const todayStr = new Date().toISOString().slice(0, 10);
  const slots = await getSlotsForDate(businessId, todayStr, durationMin, bufferMin);
  return { slotsToday: slots.length, firstSlot: slots[0] ?? null };
}

/**
 * For homepage SSR: compute next available slot for a business
 * using its cheapest/first active service. Lightweight — checks
 * up to 7 days ahead but stops at the first date with availability.
 */
export async function getNextAvailableForBusiness(
  businessId: string
): Promise<{ nextAvailable: string | null; slotsToday: number }> {
  // Get first active service for duration info
  const service = await prisma.service.findFirst({
    where: { businessId, isActive: true },
    select: { durationMin: true, bufferMin: true },
    orderBy: { price: 'asc' },
  });

  if (!service) return { nextAvailable: null, slotsToday: 0 };

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  let nextAvailable: string | null = null;
  let slotsToday = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);

    const slots = await getSlotsForDate(
      businessId,
      dateStr,
      service.durationMin,
      service.bufferMin
    );

    if (slots.length > 0) {
      if (!nextAvailable) nextAvailable = slots[0];
      if (dateStr === todayStr) slotsToday = slots.length;
      if (nextAvailable) break; // We only need the first available
    }
  }

  // If nextAvailable is today, still need slotsToday count
  if (nextAvailable && slotsToday === 0) {
    const nextDate = nextAvailable.slice(0, 10);
    if (nextDate === todayStr) {
      const slots = await getSlotsForDate(
        businessId,
        todayStr,
        service.durationMin,
        service.bufferMin
      );
      slotsToday = slots.length;
    }
  }

  return { nextAvailable, slotsToday };
}
