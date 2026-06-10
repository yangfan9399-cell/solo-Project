import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaSqlite } from 'prisma-adapter-sqlite';

const adapter = new PrismaSqlite({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export { prisma };