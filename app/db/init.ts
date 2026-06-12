import { db, pgClient } from "./index";
import { sql, eq } from "drizzle-orm";
import { users } from "./schema";
import fs from "node:fs";
import path from "node:path";

let initialized = false;
let initPromise: Promise<void> | null = null;

async function runMigrations() {
  const drizzleDir = path.resolve(process.cwd(), "drizzle");
  const files = fs.readdirSync(drizzleDir).filter(f => f.endsWith(".sql")).sort();
  if (files.length === 0) throw new Error("No migration files found");
  
  const migrationFilePath = path.join(drizzleDir, files[files.length - 1]);
  const migrationSql = fs.readFileSync(migrationFilePath, "utf-8");
  
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const stmt of statements) {
    await pgClient.exec(stmt);
  }
  
  await pgClient.exec(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id serial PRIMARY KEY,
      hash varchar(255) NOT NULL,
      created_at timestamp DEFAULT now() NOT NULL
    );
  `);
  
  await db.execute(sql`INSERT INTO __drizzle_migrations (hash) VALUES ('0000_bent_the_captain')`);
}

async function checkTablesExist(): Promise<boolean> {
  try {
    const result = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'records', 'nodes', 'attachments', 'evidence_items')
    `);
    return result.rows.length === 5;
  } catch {
    return false;
  }
}

async function checkSeedDataExists(): Promise<boolean> {
  try {
    const result = await db.select().from(users).limit(1);
    return result.length > 0;
  } catch {
    return false;
  }
}

async function runSeed() {
  const { seed } = await import("./seed");
  await seed();
}

export async function initDatabase(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log("🗄️  初始化嵌入式 PostgreSQL 数据库...");
    
    const tablesExist = await checkTablesExist();
    
    if (!tablesExist) {
      console.log("📋 执行数据库迁移...");
      await runMigrations();
      console.log("✅ 数据库迁移完成");
    }
    
    const seedExists = await checkSeedDataExists();
    
    if (!seedExists) {
      console.log("🌱 导入种子数据...");
      await runSeed();
      console.log("✅ 种子数据导入完成");
    }
    
    initialized = true;
    console.log("✅ 数据库初始化完成");
  })();
  
  return initPromise;
}

export async function ensureDbReady(): Promise<void> {
  if (!initialized) {
    await initDatabase();
  }
}
