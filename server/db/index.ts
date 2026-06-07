import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const runtimeConfig = useRuntimeConfig();

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function useDb() {
  if (!db) {
    const queryClient = postgres(runtimeConfig.databaseUrl);
    db = drizzle(queryClient, { schema });
  }
  return db;
}
