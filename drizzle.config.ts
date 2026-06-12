import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL 环境变量未设置。请在 .env 中配置：\n" +
    "DATABASE_URL=postgresql://user:password@localhost:5432/container_seal"
  );
}

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    table: "__drizzle_migrations",
  },
});
