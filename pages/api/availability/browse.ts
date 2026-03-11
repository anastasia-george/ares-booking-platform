// pages/api/availability/browse.ts
// GET /api/availability/browse?filter=today|tomorrow|week|weekend&suburb=&state=
// Returns businesses that have availability matching the filter, with nextAvailable per business.
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getSlotsForDate } from '../../../lib/availability';

type Filter = 'today' | 'tomorrow' | 'week' | 'weekend';

function getDateRange(filter: Filter): string[] {
  const today = new Date();
  const dates: string[] = [];

  switch (filter) {
    case 'today': {
      dates.push(today.toISOString().slice(0, 10));
      break;
    }
    case 'tomorrow': {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() + 1);
      dates.push(d.toISOString().slice(0, 10));
      break;
    }
    case 'week': {
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      break;
    }
    case 'weekend': {
      // Find next Saturday and Sunday within 7 days
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setUTCDate(d.getUTCDate() + i);
        const dow = d.getUTCDay();
        if (dow === 0 || dow === 6) {
          dates.push(d.toISOString().slice(0, 10));
        }
      }
      break;
    }
  }

  return dates;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { filter, suburb, state } = req.query;
  const validFilters: Filter[] = ['today', 'tomorrow', 'week', 'weekend'];

  if (!filter || !validFilters.includes(filter as Filter)) {
    return res.status(400).json({ error: 'filter is required (today|tomorrow|week|weekend).' });
  }

  try {
    const datesToCheck = getDateRange(filter as Filter);

    // Fetch businesses with active services, optional location filter
    const where: any = { services: { some: { isActive: true } } };
    if (suburb) where.suburb = { contains: suburb as string, mode: 'insensitive' };
    if (state) where.state = state as string;

    const businesses = await prisma.business.findMany({
      where,
      select: {
        id: true,
        slug: true,
        name: true,
        suburb: true,
        state: true,
        verified: true,
        services: {
          where: { isActive: true },
          select: { id: true, price: true, category: true, durationMin: true, bufferMin: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
      },
      take: 100,
    });

    const results: Array<{
      businessId: string;
      slug: string;
      name: string;
      suburb: string | null;
      state: string | null;
      verified: boolean;
      category: string | null;
      minPrice: number;
      nextAvailable: string | null;
      slotsCount: number;
    }> = [];

    for (const biz of businesses) {
      const service = biz.services[0];
      if (!service) continue;

      let nextAvailable: string | null = null;
      let slotsCount = 0;

      for (const dateStr of datesToCheck) {
        const slots = await getSlotsForDate(
          biz.id,
          dateStr,
          service.durationMin,
          service.bufferMin
        );
        slotsCount += slots.length;
        if (slots.length > 0 && !nextAvailable) {
          nextAvailable = slots[0];
        }
      }

      if (slotsCount > 0) {
        results.push({
          businessId: biz.id,
          slug: biz.slug,
          name: biz.name,
          suburb: biz.suburb ?? null,
          state: biz.state ?? null,
          verified: biz.verified,
          category: service.category ?? null,
          minPrice: service.price,
          nextAvailable,
          slotsCount,
        });
      }
    }

    // Sort by soonest available
    results.sort((a, b) => {
      if (!a.nextAvailable) return 1;
      if (!b.nextAvailable) return -1;
      return a.nextAvailable.localeCompare(b.nextAvailable);
    });

    return res.status(200).json({ filter, businesses: results, count: results.length });
  } catch (error) {
    console.error('[GET /api/availability/browse]', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
