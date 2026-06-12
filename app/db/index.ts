import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "postgresql://yangfan@localhost:5432/container_seal";

const client = postgres(databaseUrl, { max: 5 });

export const db = drizzle(client, { schema });
