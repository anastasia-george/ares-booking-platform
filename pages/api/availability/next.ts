// pages/api/availability/next.ts
// GET /api/availability/next?businessId=xxx&serviceId=xxx&days=14
// Scans forward N days and returns all dates with available slots,
// plus the earliest available slot timestamp.
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getSlotsForDate } from '../../../lib/availability';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { businessId, serviceId, days: daysParam } = req.query;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required.' });
  }

  const days = Math.min(Number(daysParam) || 7, 30); // cap at 30

  try {
    // Resolve service duration + buffer
    let durationMin = 60;
    let bufferMin = 0;

    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId as string },
      });
      if (!service || !service.isActive) {
        return res.status(400).json({ error: 'Service not found or inactive.' });
      }
      durationMin = service.durationMin;
      bufferMin = service.bufferMin;
    } else {
      // Fall back to cheapest active service
      const service = await prisma.service.findFirst({
        where: { businessId: businessId as string, isActive: true },
        orderBy: { price: 'asc' },
      });
      if (service) {
        durationMin = service.durationMin;
        bufferMin = service.bufferMin;
      }
    }

    const dates: Record<string, string[]> = {};
    let nextAvailable: string | null = null;
    let totalSlots = 0;
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().slice(0, 10);

      const slots = await getSlotsForDate(
        businessId as string,
        dateStr,
        durationMin,
        bufferMin
      );

      if (slots.length > 0) {
        dates[dateStr] = slots;
        totalSlots += slots.length;
        if (!nextAvailable) {
          nextAvailable = slots[0];
        }
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ dates, nextAvailable, totalSlots });
  } catch (error) {
    console.error('[GET /api/availability/next]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
