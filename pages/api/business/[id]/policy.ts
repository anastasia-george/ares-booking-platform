// pages/api/business/[id]/policy.ts
// GET  /api/business/[id]/policy — fetch current policy
// PUT  /api/business/[id]/policy — update policy (owner + admin only)
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import prisma from '../../../../lib/prisma';
import { getPolicy, upsertPolicy } from '../../../../business-policy';
import { UserRole } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: businessId } = req.query;
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const business = await prisma.business.findUnique({ where: { id: businessId as string } });
  if (!business) return res.status(404).json({ error: 'Business not found.' });

  const isOwner = business.ownerId === session.user.id;
  const isAdmin = session.user.role === UserRole.ADMIN;
  if (!isOwner && !isAdmin) return res.status(403).json({ error: 'FORBIDDEN' });

  if (req.method === 'GET') {
    const policy = await getPolicy(businessId as string);
    return res.status(200).json(policy);
  }

  if (req.method === 'PUT') {
    const updated = await upsertPolicy(businessId as string, req.body);
    return res.status(200).json(updated);
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
