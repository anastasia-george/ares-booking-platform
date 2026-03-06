// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Stable IDs for re-runnable seeding
const SEED_SERVICE_ID = 'seed-svc-initial-consultation';

async function main() {
  console.log('Seeding database...');

  // 1. Business Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner@ares.dev' },
    update: {},
    create: {
      email: 'owner@ares.dev',
      name: 'Ares Owner',
      role: UserRole.BUSINESS_OWNER,
    },
  });

  // 2. Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ares.dev' },
    update: {},
    create: {
      email: 'admin@ares.dev',
      name: 'Ares Admin',
      role: UserRole.ADMIN,
    },
  });

  // 3. Business
  const business = await prisma.business.upsert({
    where: { slug: 'ares-demo-salon' },
    update: { verified: true },
    create: {
      ownerId: owner.id,
      name: 'Ares Demo Salon',
      slug: 'ares-demo-salon',
      verified: true,
      description: 'A professional appointment booking demo.',
    },
  });

  // 4. Service (upsert by stable ID — safe to re-run)
  const service = await prisma.service.upsert({
    where: { id: SEED_SERVICE_ID },
    update: { price: 5000 },
    create: {
      id: SEED_SERVICE_ID,
      businessId: business.id,
      name: 'Initial Consultation',
      description: 'A 30-minute introductory consultation.',
      durationMin: 30,
      bufferMin: 15,
      price: 5000, // $50.00
      isActive: true,
    },
  });

  // 5. Default Business Policy
  await prisma.businessPolicy.upsert({
    where: { businessId: business.id },
    update: {},
    create: {
      businessId: business.id,
      cancellationWindowHours: 24,
      lateCancellationRefundPct: 0,
      noShowFeePercent: 100,
      approvalMode: 'AUTO_CONFIRM',
      minLeadTimeHours: 2,
      maxLeadTimeDays: 60,
      depositRequired: true,
      depositPercent: 50,
    },
  });

  // 6. Availability (Mon–Fri 09:00–17:00) — replace on each run
  await prisma.availability.deleteMany({ where: { businessId: business.id } });
  await prisma.availability.createMany({
    data: [1, 2, 3, 4, 5].map((day) => ({
      businessId: business.id,
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00',
    })),
  });

  console.log('\n=== Seed Complete ===================');
  console.log(`Business ID : ${business.id}`);
  console.log(`Service  ID : ${service.id}`);
  console.log(`Owner    ID : ${owner.id}  (${owner.email})`);
  console.log(`Admin    ID : ${admin.id}  (${admin.email})`);
  console.log('=====================================\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
