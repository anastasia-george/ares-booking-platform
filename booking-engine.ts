import { BookingStatus, Booking } from '@prisma/client';
import prisma from './lib/prisma';
import { getPolicy } from './business-policy';

// Statuses that represent a booking slot being "taken"
const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

export class BookingEngine {
  /**
   * 1. CREATE BOOKING
   * Atomically creates a booking after:
   *   a) Validating policy (lead time, advance limit)
   *   b) Checking for double-booking
   *   c) Fetching real service price
   * Returns booking in PENDING_PAYMENT status.
   * Payment must be authorised separately via /api/payments/intent.
   */
  async createBooking(
    userId: string,
    businessId: string,
    serviceId: string,
    startTime: Date,
    notes?: string
  ): Promise<Booking> {
    // A. Fetch service (price + duration)
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error('SERVICE_NOT_FOUND: Service does not exist.');
    if (!service.isActive) throw new Error('SERVICE_INACTIVE: This service is no longer available.');
    if (service.businessId !== businessId)
      throw new Error('SERVICE_MISMATCH: Service does not belong to this business.');

    // B. Fetch business policy
    const policy = await getPolicy(businessId);

    // C. Validate lead time
    const nowMs = Date.now();
    const startMs = startTime.getTime();
    const hoursUntilStart = (startMs - nowMs) / (1000 * 60 * 60);

    if (hoursUntilStart < policy.minLeadTimeHours) {
      throw new Error(
        `LEAD_TIME_VIOLATION: Bookings must be made at least ${policy.minLeadTimeHours} hour(s) in advance.`
      );
    }
    if (hoursUntilStart > policy.maxLeadTimeDays * 24) {
      throw new Error(
        `ADVANCE_LIMIT_VIOLATION: Cannot book more than ${policy.maxLeadTimeDays} days in advance.`
      );
    }

    // D. Calculate end time (service duration + buffer)
    const totalMinutes = service.durationMin + service.bufferMin;
    const endTime = new Date(startMs + totalMinutes * 60000);

    // E. Atomic transaction: conflict check + create
    return await prisma.$transaction(async (tx) => {
      // Double-booking guard — any overlapping active booking blocks this slot
      const conflict = await tx.booking.findFirst({
        where: {
          businessId,
          status: { in: ACTIVE_STATUSES },
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      });

      if (conflict) {
        throw new Error('SLOT_UNAVAILABLE: Time slot is already booked.');
      }

      const booking = await tx.booking.create({
        data: {
          userId,
          businessId,
          serviceId,
          startTime,
          endTime,
          status: BookingStatus.PENDING_PAYMENT,
          price: service.price,
          notes: notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_CREATED',
          entityId: booking.id,
          actorId: userId,
          details: { startTime, endTime, price: service.price },
        },
      });

      return booking;
    });
  }

  /**
   * 2. CONFIRM BOOKING (called after payment authorisation succeeds)
   * Moves PENDING_PAYMENT -> PENDING (MANUAL mode) or CONFIRMED (AUTO_CONFIRM mode).
   */
  async confirmAfterPayment(
    bookingId: string,
    paymentIntentId: string,
    depositAmountCents: number
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== BookingStatus.PENDING_PAYMENT)
      throw new Error('INVALID_STATE: Booking is not awaiting payment.');

    const policy = await getPolicy(booking.businessId);
    const newStatus =
      policy.approvalMode === 'AUTO_CONFIRM'
        ? BookingStatus.CONFIRMED
        : BookingStatus.PENDING;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: newStatus,
          paymentId: paymentIntentId,
          paymentStatus: 'authorized',
          depositAmount: depositAmountCents,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_PAYMENT_AUTHORISED',
          entityId: bookingId,
          actorId: 'SYSTEM',
          details: { newStatus, paymentIntentId, depositAmountCents },
        },
      });

      return updated;
    });
  }

  /**
   * 3. CANCEL BOOKING
   * Cancels a booking by user or business. Caller is responsible for
   * triggering the appropriate Stripe refund after this succeeds.
   */
  async cancelBooking(
    bookingId: string,
    reason: string,
    actorId: string,
    isBusiness: boolean
  ): Promise<Booking> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found.');

    const cancellable: BookingStatus[] = [
      BookingStatus.PENDING_PAYMENT,
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
    ];
    if (!cancellable.includes(booking.status)) {
      throw new Error(`INVALID_STATE: Cannot cancel a booking in status ${booking.status}.`);
    }

    const newStatus = isBusiness
      ? BookingStatus.CANCELLED_BY_BUSINESS
      : BookingStatus.CANCELLED_BY_USER;

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus, paymentStatus: 'refunded' },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_CANCELLED',
          entityId: bookingId,
          actorId,
          details: { reason, byBusiness: isBusiness, previousStatus: booking.status },
        },
      });

      return updated;
    });
  }

  /**
   * 4. COMPLETE BOOKING
   * Moves CONFIRMED -> COMPLETED. Caller must capture Stripe payment after this.
   */
  async completeBooking(bookingId: string, actorId: string): Promise<Booking> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== BookingStatus.CONFIRMED)
      throw new Error('INVALID_STATE: Only CONFIRMED bookings can be completed.');

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED, paymentStatus: 'paid' },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_COMPLETED',
          entityId: bookingId,
          actorId,
        },
      });

      return updated;
    });
  }

  /**
   * 5. MARK NO-SHOW
   * Moves CONFIRMED -> NO_SHOW. Only allowed after booking end time.
   * Caller is responsible for charging the no-show fee via Stripe.
   */
  async markNoShow(bookingId: string, actorId: string): Promise<Booking> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found.');
    if (booking.status !== BookingStatus.CONFIRMED)
      throw new Error('INVALID_STATE: Only CONFIRMED bookings can be marked no-show.');
    if (new Date() < booking.endTime)
      throw new Error('CANNOT_MARK_NOSHOW: Booking end time has not passed yet.');

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.NO_SHOW, paymentStatus: 'charged_no_show' },
      });

      await tx.auditLog.create({
        data: {
          action: 'BOOKING_NO_SHOW',
          entityId: bookingId,
          actorId,
          details: { userId: booking.userId },
        },
      });

      return updated;
    });
  }
}
