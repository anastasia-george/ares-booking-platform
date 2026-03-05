// prisma/seed.ts
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Business Owner
  const owner = await prisma.user.upsert({
    where: { email: 'ares@example.com' },
    update: {},
    create: {
      email: 'ares@example.com',
      name: 'Ares Operator',
      role: UserRole.BUSINESS_OWNER
    }
  });

  // 2. Create Business
  const business = await prisma.business.upsert({
    where: { slug: 'ares-demo-salon' },
    update: {},
    create: {
      ownerId: owner.id,
      name: 'Ares Demo Salon',
      slug: 'ares-demo-salon',
      verified: true,
      description: 'A test business for our MVP.'
    }
  });

  console.log(`Created business: ${business.name}`);

  // 3. Create Service
  const service = await prisma.service.create({
    data: {
      businessId: business.id,
      name: 'Initial Consultation',
      description: 'A 30-minute chat to discuss needs.',
      durationMin: 30,
      price: 5000, // $50.00
      isActive: true
    }
  });

  console.log(`Created service: ${service.name}`);

  // 4. Set Availability (Mon-Fri, 9am - 5pm)
  const days = [1, 2, 3, 4, 5]; // Mon-Fri
  for (const day of days) {
    await prisma.availability.create({
      data: {
        businessId: business.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00'
      }
    });
  }

  console.log('Availability set (Mon-Fri, 9-5).');
  console.log('Seeding complete! 🌱');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
