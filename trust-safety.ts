// trust-safety.ts
import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class TrustSafetyManager {

  /**
   * 1. BUSINESS VERIFICATION (Phase 6)
   * A business can only accept payments/bookings if 'verified' is true.
   * Admin sets this manually in MVP.
   */
  async verifyBusiness(businessId: string, adminId: string): Promise<void> {
    // 1. Check if admin
    // (In real app, check user role)
    
    // 2. Mark business verified
    await prisma.business.update({
      where: { id: businessId },
      data: { verified: true }
    });

    // 3. Log the action
    await prisma.auditLog.create({
      data: {
        action: "BUSINESS_VERIFIED",
        entityId: businessId,
        actorId: adminId
      }
    });
  }

  /**
   * 2. DISPUTE FLOW (Phase 6)
   * User or Business flags a completed booking (e.g. "Service not provided").
   * Moves booking to DISPUTED status for admin review.
   */
  async flagDispute(bookingId: string, reporterId: string, reason: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error("Booking not found");

    // Only allow dispute on COMPLETED or NO_SHOW bookings
    if (![BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(booking.status)) {
      throw new Error("CANNOT_DISPUTE: Booking is not completed.");
    }

    // Update status + Log
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.DISPUTED }
      }),
      prisma.auditLog.create({
        data: {
          action: "DISPUTE_OPENED",
          entityId: bookingId,
          actorId: reporterId,
          details: { reason }
        }
      })
    ]);
  }

  /**
   * 3. RATE LIMITING (Phase 6)
   * Prevent spam bookings from one user.
   * Simple logic: Max 5 pending bookings per user.
   */
  async checkRateLimit(userId: string): Promise<void> {
    const pendingCount = await prisma.booking.count({
      where: {
        userId,
        status: BookingStatus.PENDING
      }
    });

    if (pendingCount >= 5) {
      throw new Error("RATE_LIMIT_EXCEEDED: Too many pending bookings. Please complete or cancel existing ones.");
    }
  }
}
