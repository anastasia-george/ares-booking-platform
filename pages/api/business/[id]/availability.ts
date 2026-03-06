// pages/api/business/[id]/availability.ts
// GET /api/business/[id]/availability — fetch weekly schedule + overrides
// PUT /api/business/[id]/availability — replace weekly schedule (owner only)
// POST /api/business/[id]/availability/override — add/update a date override
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import { UserRole } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: businessId } = req.query;
  const session = await getServerSession(req, res, authOptions);

  const business = await prisma.business.findUnique({ where: { id: businessId as string } });
  if (!business) return res.status(404).json({ error: 'Business not found.' });

  if (req.method === 'GET') {
    const [schedule, overrides] = await Promise.all([
      prisma.availability.findMany({ where: { businessId: businessId as string }, orderBy: { dayOfWeek: 'asc' } }),
      prisma.availabilityOverride.findMany({ where: { businessId: businessId as string }, orderBy: { date: 'asc' } }),
    ]);
    return res.status(200).json({ schedule, overrides });
  }

  // Mutations require owner or admin
  if (!session?.user?.id) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const isOwner = business.ownerId === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'FORBIDDEN' });

  if (req.method === 'PUT') {
    // Replace entire weekly schedule
    const { schedule } = req.body as { schedule: { dayOfWeek: number; startTime: string; endTime: string }[] };
    if (!Array.isArray(schedule)) return res.status(400).json({ error: 'schedule array is required.' });

    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { businessId: businessId as string } }),
      ...schedule.map((s) =>
        prisma.availability.create({
          data: {
            businessId: businessId as string,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          },
        })
      ),
    ]);
    return res.status(200).json({ message: 'Schedule updated.' });
  }

  if (req.method === 'POST') {
    // Add or update a date override
    const { date, isClosed, startTime, endTime } = req.body;
    if (!date || isClosed === undefined) {
      return res.status(400).json({ error: 'date and isClosed are required.' });
    }

    const existing = await prisma.availabilityOverride.findFirst({
      where: { businessId: businessId as string, date },
    });

    if (existing) {
      const updated = await prisma.availabilityOverride.update({
        where: { id: existing.id },
        data: { isClosed, startTime: startTime ?? null, endTime: endTime ?? null },
      });
      return res.status(200).json(updated);
    } else {
      const created = await prisma.availabilityOverride.create({
        data: {
          businessId: businessId as string,
          date,
          isClosed,
          startTime: startTime ?? null,
          endTime: endTime ?? null,
        },
      });
      return res.status(201).json(created);
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
