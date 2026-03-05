// pages/api/availability/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { AvailabilityManager } from '../../business-availability';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const availabilityManager = new AvailabilityManager();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { businessId, date, durationMin } = req.query;

  if (!businessId || !date || !durationMin) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const queryDate = new Date(date as string); // "2023-10-27"
    const serviceDuration = parseInt(durationMin as string);

    // 1. Get Base Schedule for this Day
    const dayOfWeek = queryDate.getUTCDay();
    const schedule = await prisma.availability.findFirst({
      where: {
        businessId: businessId as string,
        dayOfWeek
      }
    });

    if (!schedule) {
      return res.status(200).json({ slots: [] }); // Closed today
    }

    // 2. Generate potential slots (e.g. every 15 mins)
    // Start: 09:00, End: 17:00
    const slots: string[] = [];
    let currentTime = new Date(`${queryDate.toISOString().slice(0, 10)}T${schedule.startTime}:00.000Z`);
    const endTime = new Date(`${queryDate.toISOString().slice(0, 10)}T${schedule.endTime}:00.000Z`);

    while (currentTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime.getTime() + serviceDuration * 60000);

      // 3. Check for Conflicts (Existing Bookings)
      const conflict = await prisma.booking.findFirst({
        where: {
          businessId: businessId as string,
          status: { notIn: ['CANCELLED_BY_USER', 'CANCELLED_BY_BUSINESS'] },
          AND: [
            { startTime: { lt: slotEnd } },
            { endTime: { gt: slotStart } }
          ]
        }
      });

      if (!conflict) {
        slots.push(slotStart.toISOString());
      }

      // Increment by 15 mins (standard step)
      currentTime = new Date(currentTime.getTime() + 15 * 60000);
    }

    return res.status(200).json({ 
      date: queryDate.toISOString().slice(0, 10),
      slots 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
