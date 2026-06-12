import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/noise_complaint";

let sql: ReturnType<typeof postgres>;
let db: ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __db__: ReturnType<typeof drizzle<typeof schema>> | undefined;
  var __sql__: ReturnType<typeof postgres> | undefined;
}

if (process.env.NODE_ENV === "production") {
  sql = postgres(databaseUrl);
  db = drizzle(sql, { schema });
} else {
  if (!global.__db__) {
    global.__sql__ = postgres(databaseUrl);
    global.__db__ = drizzle(global.__sql__, { schema });
  }
  db = global.__db__!;
  sql = global.__sql__!;
}

export { db, sql };
