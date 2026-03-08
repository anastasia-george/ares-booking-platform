// pages/api/debug-db.ts — TEMPORARY: delete after diagnosis
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const businesses = await prisma.business.findMany({
      where: { verified: true },
      select: { id: true, name: true, verified: true },
    });
    res.status(200).json({ ok: true, count: businesses.length, businesses });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message, code: err?.code });
  }
}
