// pages/api/business/[id]/bookings.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id: businessId } = req.query;
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  // TODO: Add strict Business Owner check
  // if (session.user.role !== 'BUSINESS_OWNER') ...

  // 1. Fetch Bookings for this Business
  const bookings = await prisma.booking.findMany({
    where: { businessId: businessId as string },
    include: {
      user: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, name: true, durationMin: true } }
    },
    orderBy: { startTime: 'desc' }
  });

  return res.status(200).json(bookings);
}
