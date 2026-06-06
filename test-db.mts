import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./src/db/schema";
import "dotenv/config";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  try {
    const result = await db.execute("SELECT 1 as test");
    console.log("DB connected:", result.rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
  }
}

main();
