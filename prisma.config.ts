import { PrismaConfig } from '@prisma/client';

const config: PrismaConfig = {
  datasource: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
};

export default config;
