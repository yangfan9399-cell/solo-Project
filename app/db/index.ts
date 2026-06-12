import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.resolve(process.cwd(), ".pglite-data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const client = new PGlite(path.join(dataDir, "container_seal.db"));

export const db = drizzle(client, { schema });
export const pgClient = client;
