process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/reservoir_gate?schema=public";
process.env.PRISMA_QUERY_ENGINE_TYPE = "binary";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('Testing connection...');
  const count = await prisma.dispatchOrder.count();
  console.log('Current order count:', count);
  await prisma.$disconnect();
}

test().catch(e => {
  console.error(e);
  process.exit(1);
});
