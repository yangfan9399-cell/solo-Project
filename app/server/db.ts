import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bell_tower.db');

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_uuid TEXT UNIQUE NOT NULL,
      player_name TEXT NOT NULL DEFAULT 'Anonymous',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      status TEXT NOT NULL DEFAULT 'playing',
      current_day INTEGER NOT NULL DEFAULT 1,
      total_days INTEGER NOT NULL DEFAULT 7,
      seed_scenario TEXT NOT NULL DEFAULT 'normal',
      final_score INTEGER
    );

    CREATE TABLE IF NOT EXISTS adjustment_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      pendulum_length_before REAL NOT NULL,
      pendulum_length_after REAL NOT NULL,
      weather_today TEXT NOT NULL,
      temperature REAL NOT NULL,
      metal_expansion_coeff REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      operator_note TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS gear_ratio_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      gearA_teeth_before INTEGER NOT NULL,
      gearA_teeth_after INTEGER NOT NULL,
      gearB_teeth_before INTEGER NOT NULL,
      gearB_teeth_after INTEGER NOT NULL,
      gearC_teeth_before INTEGER NOT NULL,
      gearC_teeth_after INTEGER NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      reason TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS calibration_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      lubrication_level_before REAL NOT NULL,
      lubrication_level_after REAL NOT NULL,
      strike_order_before TEXT NOT NULL,
      strike_order_after TEXT NOT NULL,
      error_seconds REAL NOT NULL,
      target_error REAL NOT NULL DEFAULT 2.0,
      pass_threshold INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS part_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      part_name TEXT NOT NULL,
      wear_level REAL NOT NULL,
      max_wear REAL NOT NULL DEFAULT 100,
      needs_repair INTEGER NOT NULL DEFAULT 0,
      last_repaired_day INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS error_data_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      error_seconds REAL NOT NULL,
      target REAL NOT NULL DEFAULT 2.0,
      tolerance REAL NOT NULL DEFAULT 3.0
    );

    CREATE TABLE IF NOT EXISTS maintenance_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      day INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      before_state TEXT NOT NULL,
      after_state TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_uuid ON game_sessions(session_uuid);
    CREATE INDEX IF NOT EXISTS idx_details_session ON adjustment_details(session_id);
    CREATE INDEX IF NOT EXISTS idx_gears_session ON gear_ratio_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_results_session ON calibration_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_parts_session ON part_states(session_id);
    CREATE INDEX IF NOT EXISTS idx_error_session ON error_data_points(session_id);
    CREATE INDEX IF NOT EXISTS idx_events_session ON maintenance_events(session_id);
  `);
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
