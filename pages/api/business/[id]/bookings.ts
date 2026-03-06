// pages/api/business/[id]/bookings.ts
// GET /api/business/[id]/bookings
// Returns all bookings for a business. Accessible by the business owner and ADMIN only.
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import { UserRole } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { id: businessId } = req.query;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  // Verify caller owns this business OR is admin
  const business = await prisma.business.findUnique({ where: { id: businessId as string } });
  if (!business) return res.status(404).json({ error: 'Business not found.' });

  const isOwner = business.ownerId === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'FORBIDDEN: You do not have access to this business.' });
  }

  const bookings = await prisma.booking.findMany({
    where: { businessId: businessId as string },
    include: {
      user: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, durationMin: true } },
      dispute: { select: { id: true, status: true, reason: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return res.status(200).json(bookings);
}
