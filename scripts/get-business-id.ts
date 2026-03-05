// scripts/get-business-id.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const business = await prisma.business.findUnique({
    where: { slug: 'ares-demo-salon' }
  });
  console.log(business?.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
