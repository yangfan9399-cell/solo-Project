import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: 'postgres://localhost:5432/printflow',
});

export const db = drizzle(pool, { schema });

export type Db = typeof db;
