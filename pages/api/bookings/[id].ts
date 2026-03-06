// pages/api/bookings/[id].ts
// GET  /api/bookings/[id] — fetch booking detail
// PATCH /api/bookings/[id] — update status (CANCEL, COMPLETE, NO_SHOW)
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import { BookingEngine } from '../../../booking-engine';
import { PaymentManager } from '../../../stripe-payments';
import { getPolicy, isLateCancellation, calculateCancellationRefund } from '../../../business-policy';
import { recordCompleted, recordNoShow, recordLateCancellation } from '../../../lib/reputation';
import {
  sendCancellationNotice,
  sendNoShowNotice,
} from '../../../notification-manager';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';

const bookingEngine = new BookingEngine();
const paymentManager = new PaymentManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const bookingId = id as string;

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const actorId = session.user.id;
  const actorRole = session.user.role;

  // GET /api/bookings/[id]
  if (req.method === 'GET') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: { select: { id: true, name: true, email: true } }, service: true, dispute: true },
    });
    if (!booking) return res.status(404).json({ error: 'Not Found' });

    // Only the booking owner, the business owner, or an admin may view the full record
    const isOwner = booking.userId === actorId;
    const business = await prisma.business.findUnique({ where: { id: booking.businessId } });
    const isBusinessOwner = business?.ownerId === actorId;
    const isAdmin = actorRole === UserRole.ADMIN;
    if (!isOwner && !isBusinessOwner && !isAdmin) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    return res.status(200).json(booking);
  }

  // PATCH /api/bookings/[id]
  if (req.method === 'PATCH') {
    const { status, cancellationReason } = req.body;

    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: { select: { id: true, email: true, name: true } },
          service: { select: { name: true } },
          business: { select: { ownerId: true, name: true } },
        },
      });
      if (!booking) return res.status(404).json({ error: 'Not Found' });

      const isBookingUser = booking.userId === actorId;
      const isBusinessOwner = booking.business.ownerId === actorId;
      const isAdmin = actorRole === UserRole.ADMIN;

      // --- CANCELLATION ---
      if (status === 'CANCELLED_BY_USER' || status === 'CANCELLED_BY_BUSINESS') {
        const isBusiness = status === 'CANCELLED_BY_BUSINESS';

        // Auth: user can cancel their own booking; business owner can cancel their bookings; admin can always cancel
        if (isBusiness && !isBusinessOwner && !isAdmin)
          return res.status(403).json({ error: 'FORBIDDEN' });
        if (!isBusiness && !isBookingUser && !isAdmin)
          return res.status(403).json({ error: 'FORBIDDEN' });

        // Policy: determine refund amount
        const policy = await getPolicy(booking.businessId);
        const deposit = booking.depositAmount ?? 0;
        const refundCents = calculateCancellationRefund(policy, deposit, booking.startTime);

        // Track late cancellation reputation impact (user only)
        if (!isBusiness && isLateCancellation(policy, booking.startTime) && deposit > 0) {
          await recordLateCancellation(booking.userId);
        }

        // Process Stripe refund / cancel hold
        if (deposit > 0) {
          await paymentManager.refundPayment(bookingId, refundCents);
        } else {
          await paymentManager.cancelHold(bookingId);
        }

        const updated = await bookingEngine.cancelBooking(
          bookingId,
          cancellationReason || 'No reason provided',
          actorId,
          isBusiness
        );

        // Notify user
        const serviceDate = booking.startTime.toISOString().slice(0, 10);
        await sendCancellationNotice({
          toEmail: booking.user.email!,
          userId: booking.userId,
          bookingId,
          serviceName: booking.service.name,
          date: serviceDate,
          cancelledBy: isBusiness ? 'business' : 'user',
          refundAmount: refundCents,
        });

        return res.status(200).json(updated);
      }

      // --- COMPLETION ---
      if (status === 'COMPLETED') {
        if (!isBusinessOwner && !isAdmin)
          return res.status(403).json({ error: 'FORBIDDEN: Only business owner or admin can mark complete.' });

        const updated = await bookingEngine.completeBooking(bookingId, actorId);
        await paymentManager.capturePayment(bookingId);
        await recordCompleted(booking.userId);

        return res.status(200).json(updated);
      }

      // --- NO-SHOW ---
      if (status === 'NO_SHOW') {
        if (!isBusinessOwner && !isAdmin)
          return res.status(403).json({ error: 'FORBIDDEN: Only business owner or admin can mark no-show.' });

        const policy = await getPolicy(booking.businessId);
        await paymentManager.chargeNoShowFee(bookingId, policy.noShowFeePercent);
        const updated = await bookingEngine.markNoShow(bookingId, actorId);
        await recordNoShow(booking.userId);

        const deposit = booking.depositAmount ?? booking.price;
        const fee = Math.round(deposit * (policy.noShowFeePercent / 100));
        await sendNoShowNotice({
          userEmail: booking.user.email!,
          userId: booking.userId,
          bookingId,
          serviceName: booking.service.name,
          date: booking.startTime.toISOString().slice(0, 10),
          feeChargedCents: fee,
        });

        return res.status(200).json(updated);
      }

      return res.status(400).json({ error: 'INVALID_STATUS', message: `Unknown status transition: ${status}` });

    } catch (error: any) {
      console.error('[PATCH /api/bookings/[id]]', error);
      return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
