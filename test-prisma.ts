import { prisma } from "./src/lib/prisma";

async function test() {
  try {
    const count = await prisma.owner.count();
    console.log("Prisma works! Owner count:", count);
  } catch (e) {
    console.error("Prisma error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
