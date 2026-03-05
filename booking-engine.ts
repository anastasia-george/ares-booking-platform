import { PrismaClient, BookingStatus, Booking } from '@prisma/client';

const prisma = new PrismaClient();

export class BookingEngine {
  
  /**
   * 1. CREATE BOOKING
   * Atomic transaction to prevent double-booking.
   */
  async createBooking(
    userId: string,
    businessId: string,
    serviceId: string,
    startTime: Date,
    durationMin: number
  ): Promise<Booking> {
    
    // Calculate end time
    const endTime = new Date(startTime.getTime() + durationMin * 60000);

    return await prisma.$transaction(async (tx) => {
      // A. Check for overlaps (The "Lock")
      // We look for any booking that starts before our end AND ends after our start
      // status: NOT cancelled
      const conflict = await tx.booking.findFirst({
        where: {
          businessId,
          status: {
            notIn: [BookingStatus.CANCELLED_BY_USER, BookingStatus.CANCELLED_BY_BUSINESS]
          },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } }
          ]
        }
      });

      if (conflict) {
        throw new Error("SLOT_UNAVAILABLE: Time slot is already booked.");
      }

      // B. Create the booking
      const booking = await tx.booking.create({
        data: {
          userId,
          businessId,
          serviceId,
          startTime,
          endTime,
          status: BookingStatus.PENDING, // Default to Pending until payment/approval
          price: 0 // TODO: Fetch service price
        }
      });

      // C. Log the action
      await tx.auditLog.create({
        data: {
          action: "BOOKING_CREATED",
          entityId: booking.id,
          actorId: userId,
          details: { startTime, endTime }
        }
      });

      return booking;
    });
  }

  /**
   * 2. CANCEL BOOKING
   * Handles user or business cancellations.
   */
  async cancelBooking(bookingId: string, reason: string, isBusiness: boolean): Promise<Booking> {
    const newStatus = isBusiness 
      ? BookingStatus.CANCELLED_BY_BUSINESS 
      : BookingStatus.CANCELLED_BY_USER;

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus }
      });

      await tx.auditLog.create({
        data: {
          action: "BOOKING_CANCELLED",
          entityId: bookingId,
          details: { reason, byBusiness: isBusiness }
        }
      });

      return booking;
    });
  }

  /**
   * 3. NO-SHOW STATE MACHINE
   * Moves a booking from Confirmed -> No-Show.
   * Only allowed if current time > booking end time.
   */
  async markNoShow(bookingId: string, adminId: string): Promise<Booking> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");

    if (new Date() < booking.endTime) {
      throw new Error("CANNOT_MARK_NOSHOW: Booking has not ended yet.");
    }

    return await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.NO_SHOW }
    });
  }
}
