import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Prisma connected successfully:', result);
  } catch (error) {
    console.error('Prisma error:', error.message);
    console.error('Cause:', error.cause?.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
