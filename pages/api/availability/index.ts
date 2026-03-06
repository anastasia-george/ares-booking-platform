// pages/api/availability/index.ts
// GET /api/availability?businessId=xxx&serviceId=xxx&date=YYYY-MM-DD
// Returns available booking slots for a given business, service, and date.
// Slot step is fixed at 15 minutes. Slots that overlap existing bookings or fall
// outside the business schedule (including overrides and buffer time) are excluded.
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { BookingStatus } from '@prisma/client';

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

const SLOT_STEP_MINUTES = 15;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { businessId, serviceId, date } = req.query;

  if (!businessId || !date) {
    return res.status(400).json({ error: 'businessId and date are required.' });
  }

  try {
    const dateStr = date as string; // "YYYY-MM-DD"
    const queryDate = new Date(`${dateStr}T00:00:00.000Z`);
    if (isNaN(queryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Resolve service duration + buffer if serviceId provided
    let serviceDuration = 60; // default minutes if no serviceId
    let bufferMin = 0;
    if (serviceId) {
      const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
      if (!service || !service.isActive) {
        return res.status(400).json({ error: 'Service not found or inactive.' });
      }
      serviceDuration = service.durationMin;
      bufferMin = service.bufferMin;
    }
    const totalSlotDuration = serviceDuration + bufferMin; // total time slot must be blocked

    // 1. Check for override on this specific date
    const override = await prisma.availabilityOverride.findFirst({
      where: { businessId: businessId as string, date: dateStr },
    });

    if (override?.isClosed) {
      return res.status(200).json({ date: dateStr, slots: [] }); // Explicitly closed
    }

    // 2. Determine open/close times from override or weekly schedule
    let openTime: string;
    let closeTime: string;

    if (override && !override.isClosed && override.startTime && override.endTime) {
      openTime = override.startTime;
      closeTime = override.endTime;
    } else {
      const dayOfWeek = queryDate.getUTCDay();
      const schedule = await prisma.availability.findFirst({
        where: { businessId: businessId as string, dayOfWeek },
      });
      if (!schedule) {
        return res.status(200).json({ date: dateStr, slots: [] }); // No schedule for this day
      }
      openTime = schedule.startTime;
      closeTime = schedule.endTime;
    }

    // 3. Generate candidate slots stepping by SLOT_STEP_MINUTES
    const slots: string[] = [];
    let current = new Date(`${dateStr}T${openTime}:00.000Z`);
    const dayEnd = new Date(`${dateStr}T${closeTime}:00.000Z`);

    while (current.getTime() + totalSlotDuration * 60000 <= dayEnd.getTime()) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + totalSlotDuration * 60000);

      // 4. Check for conflicting active bookings
      const conflict = await prisma.booking.findFirst({
        where: {
          businessId: businessId as string,
          status: { in: ACTIVE_STATUSES },
          AND: [
            { startTime: { lt: slotEnd } },
            { endTime: { gt: slotStart } },
          ],
        },
      });

      if (!conflict) {
        slots.push(slotStart.toISOString());
      }

      current = new Date(current.getTime() + SLOT_STEP_MINUTES * 60000);
    }

    return res.status(200).json({ date: dateStr, slots });

  } catch (error) {
    console.error('[GET /api/availability]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
