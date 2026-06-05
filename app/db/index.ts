import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/park_permit";

const queryClient = postgres(databaseUrl);
export const db = drizzle(queryClient, { schema });
