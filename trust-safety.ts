// trust-safety.ts
import { BookingStatus, DisputeStatus, UserRole } from '@prisma/client';
import prisma from './lib/prisma';

export class TrustSafetyManager {
  /**
   * 1. BUSINESS VERIFICATION
   * Admin marks a business as verified, enabling it to accept bookings/payments.
   * ADMIN role check is enforced here.
   */
  async verifyBusiness(businessId: string, adminId: string): Promise<void> {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('FORBIDDEN: Only admins can verify businesses.');
    }

    await prisma.business.update({
      where: { id: businessId },
      data: { verified: true },
    });

    await prisma.auditLog.create({
      data: {
        action: 'BUSINESS_VERIFIED',
        entityId: businessId,
        actorId: adminId,
      },
    });
  }

  /**
   * 2. OPEN DISPUTE
   * Creates a Dispute record and marks the booking DISPUTED.
   * Only allowed on COMPLETED or NO_SHOW bookings.
   * Must be called by the customer (user) or an admin.
   */
  async openDispute(bookingId: string, reporterId: string, reason: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found.');

    const disputable: BookingStatus[] = [BookingStatus.COMPLETED, BookingStatus.NO_SHOW];
    if (!disputable.includes(booking.status)) {
      throw new Error('CANNOT_DISPUTE: Disputes can only be raised on completed or no-show bookings.');
    }

    // Prevent duplicate disputes
    const existing = await prisma.dispute.findUnique({ where: { bookingId } });
    if (existing) throw new Error('DISPUTE_EXISTS: A dispute is already open for this booking.');

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.DISPUTED },
      }),
      prisma.dispute.create({
        data: {
          bookingId,
          reporterId,
          reason,
          status: DisputeStatus.OPEN,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'DISPUTE_OPENED',
          entityId: bookingId,
          actorId: reporterId,
          details: { reason },
        },
      }),
    ]);
  }

  /**
   * 3. RESOLVE DISPUTE
   * Admin resolves the dispute with a verdict and optional resolution note.
   * Updates reputation based on outcome.
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    verdict: 'RESOLVED_FOR_CUSTOMER' | 'RESOLVED_FOR_BUSINESS',
    resolution: string
  ): Promise<void> {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new Error('FORBIDDEN: Only admins can resolve disputes.');
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });
    if (!dispute) throw new Error('Dispute not found.');
    if (dispute.status === DisputeStatus.RESOLVED_FOR_CUSTOMER ||
        dispute.status === DisputeStatus.RESOLVED_FOR_BUSINESS ||
        dispute.status === DisputeStatus.CLOSED) {
      throw new Error('DISPUTE_CLOSED: This dispute has already been resolved.');
    }

    await prisma.$transaction([
      prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: verdict as DisputeStatus,
          resolution,
          resolvedBy: adminId,
        },
      }),
      prisma.auditLog.create({
        data: {
          action: 'DISPUTE_RESOLVED',
          entityId: dispute.bookingId,
          actorId: adminId,
          details: { verdict, resolution },
        },
      }),
    ]);

    // Reputation impact (imported lazily to avoid circular deps)
    const { recordDisputeWon, recordDisputeLost } = await import('./lib/reputation');
    if (verdict === 'RESOLVED_FOR_BUSINESS') {
      await recordDisputeLost(dispute.booking.userId);
    } else {
      await recordDisputeWon(dispute.booking.userId);
    }
  }

  /**
   * 4. RATE LIMITING
   * Max 5 bookings in PENDING_PAYMENT or PENDING status per user.
   * Prevents slot-hoarding without payment.
   */
  async checkRateLimit(userId: string): Promise<void> {
    const count = await prisma.booking.count({
      where: {
        userId,
        status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.PENDING] },
      },
    });

    if (count >= 5) {
      throw new Error(
        'RATE_LIMIT_EXCEEDED: You have too many pending bookings. Complete or cancel existing ones first.'
      );
    }
  }

  /**
   * 5. CHECK BUSINESS VERIFIED
   * Throws if the business is not yet verified.
   * Call before accepting any booking for a business.
   */
  async requireVerifiedBusiness(businessId: string): Promise<void> {
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new Error('Business not found.');
    if (!business.verified) {
      throw new Error('UNVERIFIED_BUSINESS: This business is not yet verified to accept bookings.');
    }
  }
}
