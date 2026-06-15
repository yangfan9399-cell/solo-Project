import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { SPECIES, POOL_LOCATIONS } from "./gameData";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "tidal_pool.db");

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const isNewDb = !fs.existsSync(DB_PATH);
  dbInstance = new Database(DB_PATH);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("foreign_keys = ON");

  initSchema(dbInstance);
  if (isNewDb) {
    seedBaseData(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS species (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      description TEXT NOT NULL,
      preferred_tide TEXT NOT NULL,
      min_tide_level REAL NOT NULL,
      max_tide_level REAL NOT NULL,
      rarity TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pool_locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      description TEXT NOT NULL,
      species_ids TEXT NOT NULL,
      eco_sensitivity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      current_tide_level REAL NOT NULL,
      current_tide_phase TEXT NOT NULL,
      time_step INTEGER NOT NULL,
      total_steps INTEGER NOT NULL,
      research_points INTEGER NOT NULL,
      eco_score INTEGER NOT NULL,
      trample_count INTEGER NOT NULL,
      route TEXT NOT NULL,
      visited_pools TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS observation_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      pool_id TEXT NOT NULL,
      species_id TEXT NOT NULL,
      tide_level REAL NOT NULL,
      tide_phase TEXT NOT NULL,
      time_step INTEGER NOT NULL,
      trampled INTEGER NOT NULL,
      noted INTEGER NOT NULL,
      note TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS historical_conditions (
      id TEXT PRIMARY KEY,
      species_type TEXT NOT NULL,
      species_id TEXT NOT NULL,
      tide_level REAL NOT NULL,
      tide_phase TEXT NOT NULL,
      pool_id TEXT NOT NULL,
      observed_count INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_results (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      total_observations INTEGER NOT NULL,
      unique_species INTEGER NOT NULL,
      missed_species INTEGER NOT NULL,
      trample_penalty INTEGER NOT NULL,
      missed_tide_penalty INTEGER NOT NULL,
      research_points INTEGER NOT NULL,
      eco_score INTEGER NOT NULL,
      final_score INTEGER NOT NULL,
      recovery_tasks TEXT NOT NULL,
      completed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recovery_tasks (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      points_reward INTEGER NOT NULL,
      completed INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS notebook_entries (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      species_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    );
  `);

  try { db.prepare("ALTER TABLE game_sessions ADD COLUMN recovery_bonus_research INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}
  try { db.prepare("ALTER TABLE game_sessions ADD COLUMN recovery_bonus_eco INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}
  try { db.prepare("ALTER TABLE session_results ADD COLUMN pre_recovery_research INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}
  try { db.prepare("ALTER TABLE session_results ADD COLUMN pre_recovery_eco INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}
  try { db.prepare("ALTER TABLE session_results ADD COLUMN pre_recovery_final INTEGER NOT NULL DEFAULT 0").run(); } catch (_) {}
}

export function resetDb() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  dbInstance = null;
  getDb();
}

function seedBaseData(db: Database.Database) {
  for (const sp of SPECIES) {
    db.prepare(
      `INSERT OR IGNORE INTO species (id, type, name, emoji, description, preferred_tide, min_tide_level, max_tide_level, rarity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      sp.id,
      sp.type,
      sp.name,
      sp.emoji,
      sp.description,
      JSON.stringify(sp.preferredTide),
      sp.minTideLevel,
      sp.maxTideLevel,
      sp.rarity
    );
  }

  for (const pool of POOL_LOCATIONS) {
    db.prepare(
      `INSERT OR IGNORE INTO pool_locations (id, name, emoji, description, species_ids, eco_sensitivity)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(pool.id, pool.name, pool.emoji, pool.description, JSON.stringify(pool.speciesIds), pool.ecoSensitivity);
  }
}
