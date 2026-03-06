// pages/api/admin/disputes.ts
// GET   /api/admin/disputes  — list all disputes (filterable by status)
// PATCH /api/admin/disputes  — resolve a dispute (body: { disputeId, verdict, resolution, refund? })
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';
import { TrustSafetyManager } from '../../../trust-safety';
import { PaymentManager } from '../../../stripe-payments';

const trustSafetyManager = new TrustSafetyManager();
const paymentManager = new PaymentManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'FORBIDDEN: Admin only.' });
  }

  if (req.method === 'GET') {
    const { status } = req.query;
    const disputes = await prisma.dispute.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            service: { select: { name: true } },
            business: { select: { name: true } },
          },
        },
        reporter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(disputes);
  }

  if (req.method === 'PATCH') {
    const { disputeId, verdict, resolution, refundAmountCents } = req.body;

    if (!disputeId || !verdict || !resolution) {
      return res.status(400).json({ error: 'disputeId, verdict, and resolution are required.' });
    }

    if (!['RESOLVED_FOR_CUSTOMER', 'RESOLVED_FOR_BUSINESS'].includes(verdict)) {
      return res.status(400).json({ error: 'verdict must be RESOLVED_FOR_CUSTOMER or RESOLVED_FOR_BUSINESS.' });
    }

    try {
      // Resolve the dispute (updates reputation)
      await trustSafetyManager.resolveDispute(
        disputeId,
        session.user.id,
        verdict,
        resolution
      );

      // If resolved for customer, optionally trigger a refund
      if (verdict === 'RESOLVED_FOR_CUSTOMER' && refundAmountCents !== undefined) {
        const dispute = await prisma.dispute.findUnique({
          where: { id: disputeId },
          select: { bookingId: true },
        });
        if (dispute) {
          await paymentManager.refundPayment(dispute.bookingId, refundAmountCents);
        }
      }

      return res.status(200).json({ message: 'Dispute resolved.' });
    } catch (err: any) {
      console.error('[PATCH /api/admin/disputes]', err);
      return res.status(400).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
