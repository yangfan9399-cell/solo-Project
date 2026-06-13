import { defineConfig } from "drizzle-kit";
import { DATABASE_URL } from "./app/config";

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: DATABASE_URL,
  },
});
