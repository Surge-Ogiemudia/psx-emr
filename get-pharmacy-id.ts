import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const pharmacies = await prisma.pharmacy.findMany({
    select: { id: true, name: true, subdomain: true }
  });
  console.log(JSON.stringify(pharmacies, null, 2));
}

main().finally(() => prisma.$disconnect());
