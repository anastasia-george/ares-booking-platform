// pages/api/business/[id]/services.ts
// GET   /api/business/[id]/services       — list services (public)
// POST  /api/business/[id]/services       — create service (owner only)
// PATCH /api/business/[id]/services?sid=x — update service (owner only)
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import { UserRole } from '@prisma/client';

async function requireOwnerOrAdmin(req: NextApiRequest, res: NextApiResponse, businessId: string) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return null;
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return null;
  const ok = business.ownerId === session.user.id || session.user.role === UserRole.ADMIN;
  return ok ? session : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: businessId, sid } = req.query;

  if (req.method === 'GET') {
    const services = await prisma.service.findMany({
      where: { businessId: businessId as string, isActive: true },
      orderBy: { name: 'asc' },
    });
    return res.status(200).json(services);
  }

  if (req.method === 'POST') {
    const session = await requireOwnerOrAdmin(req, res, businessId as string);
    if (!session) return res.status(403).json({ error: 'FORBIDDEN' });

    const { name, description, price, originalPrice, category, durationMin, bufferMin } = req.body;
    if (!name || price === undefined || !durationMin) {
      return res.status(400).json({ error: 'name, price, and durationMin are required.' });
    }

    const service = await prisma.service.create({
      data: {
        businessId: businessId as string,
        name,
        description: description ?? null,
        price: Number(price),
        originalPrice: originalPrice != null ? Number(originalPrice) : null,
        category: category ?? null,
        durationMin: Number(durationMin),
        bufferMin: Number(bufferMin ?? 15),
      },
    });
    return res.status(201).json(service);
  }

  if (req.method === 'PATCH') {
    const session = await requireOwnerOrAdmin(req, res, businessId as string);
    if (!session) return res.status(403).json({ error: 'FORBIDDEN' });
    if (!sid) return res.status(400).json({ error: 'sid (serviceId) query param required.' });

    const { name, description, price, originalPrice, category, durationMin, bufferMin, isActive } = req.body;
    const service = await prisma.service.update({
      where: { id: sid as string },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: Number(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice != null ? Number(originalPrice) : null }),
        ...(category !== undefined && { category: category ?? null }),
        ...(durationMin !== undefined && { durationMin: Number(durationMin) }),
        ...(bufferMin !== undefined && { bufferMin: Number(bufferMin) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });
    return res.status(200).json(service);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
