// pages/api/admin/bookings.ts
// GET  /api/admin/bookings — list all bookings with full context (admin only)
// POST /api/admin/bookings/refund — trigger a manual refund (admin only)
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';
import { PaymentManager } from '../../../stripe-payments';

const paymentManager = new PaymentManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'FORBIDDEN: Admin only.' });
  }

  if (req.method === 'GET') {
    const { status, businessId, userId, page = '1' } = req.query;
    const PAGE_SIZE = 50;
    const skip = (Number(page) - 1) * PAGE_SIZE;

    const where: any = {};
    if (status) where.status = status;
    if (businessId) where.businessId = businessId;
    if (userId) where.userId = userId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          service: { select: { name: true } },
          business: { select: { name: true, slug: true } },
          dispute: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.booking.count({ where }),
    ]);

    return res.status(200).json({ bookings, total, page: Number(page), pageSize: PAGE_SIZE });
  }

  if (req.method === 'POST') {
    // Manual refund trigger: { bookingId, amountCents? }
    const { bookingId, amountCents } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required.' });

    try {
      await paymentManager.refundPayment(bookingId, amountCents);
      return res.status(200).json({ message: 'Refund processed.' });
    } catch (err: any) {
      return res.status(400).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
