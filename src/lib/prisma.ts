import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function buildAdapterFromEnv() {
  try {
    const url = process.env.DATABASE_URL || '';
    if (!url || !url.startsWith('postgresql')) return null;

    const parsed = new URL(url);
    const pool = new Pool({
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
      user: decodeURIComponent(parsed.username || 'postgres'),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname.replace(/^\//, '') || 'postgres',
      ssl: parsed.searchParams.get('sslmode') === 'require' ? true : undefined
    });
    return new PrismaPg(pool);
  } catch (e) {
    console.warn('Failed to create PrismaPg adapter:', (e as Error).message);
    return null;
  }
}

const adapter = buildAdapterFromEnv();

const prisma = adapter
  ? new PrismaClient({ adapter })
  : new PrismaClient();

export default prisma;
