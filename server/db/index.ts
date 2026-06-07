import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const { Pool } = pg;

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDb(databaseUrl?: string) {
  if (!db) {
    const url = databaseUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cleaning_db';
    const pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
  }
  return db;
}
