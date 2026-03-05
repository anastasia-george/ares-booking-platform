// pages/api/user/bookings.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  // 1. Fetch User's Bookings
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: { service: true },
    orderBy: { startTime: 'desc' }
  });

  return res.status(200).json(bookings);
}
