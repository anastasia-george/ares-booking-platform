// scripts/geocode-businesses.ts
// Backfill latitude/longitude for businesses missing coordinates.
// Uses Nominatim (free, no API key). Respects 1 req/sec rate limit.
//
// Run: node scripts/run-prisma.js -- && npx tsx scripts/geocode-businesses.ts
// Or:  node -e "..." to load env then run this

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';
import { geocodeAU } from '../lib/geocode';

const prisma = new PrismaClient();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const businesses = await prisma.business.findMany({
    where: {
      latitude: null,
      OR: [
        { suburb: { not: null } },
        { city: { not: null } },
        { state: { not: null } },
      ],
    },
    select: { id: true, name: true, suburb: true, city: true, state: true },
  });

  console.log(`Found ${businesses.length} businesses to geocode.\n`);

  for (const biz of businesses) {
    const result = await geocodeAU(biz.suburb, biz.city, biz.state);

    if (result) {
      await prisma.business.update({
        where: { id: biz.id },
        data: { latitude: result.lat, longitude: result.lng },
      });
      console.log(`  ✓ ${biz.name}: ${result.lat}, ${result.lng}`);
    } else {
      console.log(`  ✗ ${biz.name}: no result for "${[biz.suburb, biz.city, biz.state].filter(Boolean).join(', ')}"`);
    }

    // Respect Nominatim rate limit
    await sleep(1100);
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
