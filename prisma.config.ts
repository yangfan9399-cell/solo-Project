import { defineConfig } from 'prisma/config';

const databaseUrl =
  process.env.DATABASE_URL?.startsWith('postgresql://') ||
  process.env.DATABASE_URL?.startsWith('postgres://')
    ? process.env.DATABASE_URL
    : 'postgresql://postgres:postgres@localhost:5432/kindergarten_pickup?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
