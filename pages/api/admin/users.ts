// pages/api/admin/users.ts
// GET /api/admin/users — list all users with reputation scores (admin only)
// PATCH /api/admin/users — update user role (admin only)
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'FORBIDDEN: Admin only.' });
  }

  if (req.method === 'GET') {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        reputation: {
          select: { score: true, noShowCount: true, lateCancelCount: true, completedCount: true },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(users);
  }

  if (req.method === 'PATCH') {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ error: 'userId and role are required.' });
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${Object.values(UserRole).join(', ')}` });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    return res.status(200).json(updated);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
