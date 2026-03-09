// prisma/seed.ts
import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_BUSINESSES = [
  {
    ownerEmail: 'lashes@demo.modelcall.app',
    ownerName: 'Sophie Chen',
    slug: 'glow-lash-studio-surry-hills',
    name: 'Glow Lash Studio',
    suburb: 'Surry Hills',
    city: 'Sydney',
    state: 'NSW',
    bio: 'Level 2 lash artist perfecting my volume and hybrid techniques. I offer free and discounted model calls to build my portfolio — you get stunning lashes, I get practice!',
    instagramHandle: 'glowlashstudio',
    services: [
      {
        id: 'seed-svc-classic-lashes',
        name: 'Classic Full Set',
        category: 'Lashes',
        price: 0,
        originalPrice: 12000,
        durationMin: 90,
        bufferMin: 15,
        description: 'Full classic lash set — perfect for a natural, everyday look.',
      },
      {
        id: 'seed-svc-lash-fill',
        name: 'Lash Fill (2–3 weeks)',
        category: 'Lashes',
        price: 2000,
        originalPrice: 8000,
        durationMin: 60,
        bufferMin: 15,
        description: '2–3 week infill to keep your lashes full.',
      },
    ],
  },
  {
    ownerEmail: 'nails@demo.modelcall.app',
    ownerName: 'Priya Sharma',
    slug: 'polished-by-priya-bondi',
    name: 'Polished by Priya',
    suburb: 'Bondi',
    city: 'Sydney',
    state: 'NSW',
    bio: 'Nail tech student specialising in gel and acrylic extensions. Looking for patient models to help me practise nail art and nail enhancement techniques.',
    instagramHandle: 'polishedbypriya',
    services: [
      {
        id: 'seed-svc-gel-manicure',
        name: 'Gel Manicure',
        category: 'Nails',
        price: 0,
        originalPrice: 7500,
        durationMin: 75,
        bufferMin: 10,
        description: 'Full gel manicure with cuticle care and colour of your choice.',
      },
      {
        id: 'seed-svc-acrylic-extensions',
        name: 'Acrylic Full Set',
        category: 'Nails',
        price: 3000,
        originalPrice: 11000,
        durationMin: 120,
        bufferMin: 15,
        description: 'Acrylic nail extensions with gel colour overlay.',
      },
    ],
  },
  {
    ownerEmail: 'facials@demo.modelcall.app',
    ownerName: 'Mia Thornton',
    slug: 'radiance-skin-studio-newtown',
    name: 'Radiance Skin Studio',
    suburb: 'Newtown',
    city: 'Sydney',
    state: 'NSW',
    bio: 'Qualified beauty therapist expanding my skin treatment skills. Offering complimentary facials and skin treatments in exchange for honest feedback and portfolio photos.',
    instagramHandle: 'radianceskinstudio',
    services: [
      {
        id: 'seed-svc-express-facial',
        name: 'Express Facial',
        category: 'Facials',
        price: 0,
        originalPrice: 9000,
        durationMin: 45,
        bufferMin: 15,
        description: 'Cleanse, exfoliate, mask and moisturise — great introduction facial.',
      },
      {
        id: 'seed-svc-hydrating-facial',
        name: 'Hydrating Deep Treatment',
        category: 'Facials',
        price: 2500,
        originalPrice: 14000,
        durationMin: 75,
        bufferMin: 15,
        description: 'Advanced hydrating facial with LED therapy and serum infusion.',
      },
    ],
  },
];

async function main() {
  console.log('Seeding ModelCall demo data…');

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@modelcall.app' },
    update: {},
    create: {
      email: 'admin@modelcall.app',
      name: 'ModelCall Admin',
      role: UserRole.ADMIN,
    },
  });

  for (const demo of DEMO_BUSINESSES) {
    // Owner user
    const owner = await prisma.user.upsert({
      where: { email: demo.ownerEmail },
      update: {},
      create: {
        email: demo.ownerEmail,
        name: demo.ownerName,
        role: UserRole.BUSINESS_OWNER,
      },
    });

    // Business
    const business = await prisma.business.upsert({
      where: { slug: demo.slug },
      update: {
        verified: true,
        isAcceptingModels: true,
        suburb: demo.suburb,
        city: demo.city,
        state: demo.state,
        bio: demo.bio,
        instagramHandle: demo.instagramHandle,
      },
      create: {
        ownerId: owner.id,
        name: demo.name,
        slug: demo.slug,
        verified: true,
        isAcceptingModels: true,
        suburb: demo.suburb,
        city: demo.city,
        state: demo.state,
        bio: demo.bio,
        instagramHandle: demo.instagramHandle,
      },
    });

    // Services
    for (const svc of demo.services) {
      await prisma.service.upsert({
        where: { id: svc.id },
        update: { price: svc.price, originalPrice: svc.originalPrice, isActive: true },
        create: {
          id: svc.id,
          businessId: business.id,
          name: svc.name,
          category: svc.category,
          price: svc.price,
          originalPrice: svc.originalPrice,
          durationMin: svc.durationMin,
          bufferMin: svc.bufferMin,
          description: svc.description,
          isActive: true,
        },
      });
    }

    // Default policy
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
        depositRequired: false,
        depositPercent: 0,
      },
    });

    // Availability Tue–Sat 09:00–18:00
    await prisma.availability.deleteMany({ where: { businessId: business.id } });
    await prisma.availability.createMany({
      data: [2, 3, 4, 5, 6].map((day) => ({
        businessId: business.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
      })),
    });

    console.log(`  ✓ ${demo.name} (${demo.suburb})`);
  }

  console.log(`  ✓ Admin: ${admin.email}`);
  console.log('\nSeed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
