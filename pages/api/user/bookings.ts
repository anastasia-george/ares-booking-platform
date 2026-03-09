// pages/api/user/bookings.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      service: { select: { name: true, durationMin: true, price: true } },
      business: { select: { name: true, slug: true } },
      review: { select: { id: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return res.status(200).json(bookings);
}
