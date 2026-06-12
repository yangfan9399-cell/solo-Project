import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL 环境变量未设置。请在 .env 中配置：\n" +
    "DATABASE_URL=postgresql://user:password@localhost:5432/container_seal\n" +
    "然后执行 `npm run db:migrate && npm run db:seed` 初始化数据库"
  );
}

const client = postgres(databaseUrl, { max: 10, idle_timeout: 30 });

export const db = drizzle(client, { schema });
