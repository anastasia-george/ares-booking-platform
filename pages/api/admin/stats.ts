// pages/api/admin/stats.ts
// GET /api/admin/stats — platform overview stats for admin dashboard
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { UserRole, BookingStatus } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'FORBIDDEN: Admin only.' });
  }

  const [
    totalUsers,
    totalBusinesses,
    verifiedBusinesses,
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    noShowBookings,
    disputedBookings,
    openDisputes,
    recentBookings,
    flaggedUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.business.count({ where: { verified: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
    prisma.booking.count({ where: { status: BookingStatus.NO_SHOW } }),
    prisma.booking.count({ where: { status: BookingStatus.DISPUTED } }),
    prisma.dispute.count({ where: { status: 'OPEN' } }),
    prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
        business: { select: { name: true } },
      },
    }),
    prisma.reputationScore.count({ where: { score: { lt: 50 } } }),
  ]);

  return res.status(200).json({
    users: { total: totalUsers, flagged: flaggedUsers },
    businesses: { total: totalBusinesses, verified: verifiedBusinesses },
    bookings: {
      total: totalBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings,
      completed: completedBookings,
      noShow: noShowBookings,
      disputed: disputedBookings,
    },
    disputes: { open: openDisputes },
    recentBookings,
  });
}
