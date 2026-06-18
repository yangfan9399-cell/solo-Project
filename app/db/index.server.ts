import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "vinyl_cleaning.db");

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS vinyl_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      catalog_no TEXT NOT NULL UNIQUE,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      year INTEGER,
      genre TEXT,
      condition TEXT CHECK(condition IN ('M','NM','VG+','VG','G+','G')),
      weight INTEGER,
      pressing TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cleaning_solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      type TEXT CHECK(type IN ('enzymatic','alcohol','distilled','surfactant','mixed')),
      ph REAL,
      dilution_ratio TEXT,
      volume_ml INTEGER,
      opened_date TEXT,
      expiry_date TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cleaning_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_code TEXT NOT NULL UNIQUE,
      record_id INTEGER NOT NULL,
      solution_id INTEGER NOT NULL,
      brush_type TEXT,
      brush_count INTEGER DEFAULT 0,
      ultrasonic_minutes INTEGER DEFAULT 0,
      ultrasonic_temp_c REAL,
      rinse_count INTEGER DEFAULT 0,
      drying_method TEXT,
      drying_minutes INTEGER DEFAULT 0,
      operator TEXT,
      pre_noise_level REAL DEFAULT 0,
      post_noise_level REAL DEFAULT 0,
      crackle_reduction REAL DEFAULT 0,
      result_rating INTEGER CHECK(result_rating BETWEEN 1 AND 5),
      anomalies TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      cleaned_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')),
      version INTEGER DEFAULT 1,
      FOREIGN KEY (record_id) REFERENCES vinyl_records(id) ON DELETE CASCADE,
      FOREIGN KEY (solution_id) REFERENCES cleaning_solutions(id)
    );

    CREATE TABLE IF NOT EXISTS batch_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      field_changed TEXT,
      old_value TEXT,
      new_value TEXT,
      changed_at TEXT DEFAULT (datetime('now')),
      changed_by TEXT,
      FOREIGN KEY (batch_id) REFERENCES cleaning_batches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audition_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      batch_id INTEGER,
      side TEXT CHECK(side IN ('A','B')) NOT NULL,
      track_no INTEGER,
      noise_level REAL DEFAULT 0,
      crackles INTEGER DEFAULT 0,
      pops INTEGER DEFAULT 0,
      surface_noise REAL DEFAULT 0,
      distortion INTEGER DEFAULT 0,
      warble INTEGER DEFAULT 0,
      inner_groove_distortion INTEGER DEFAULT 0,
      listener TEXT,
      equipment TEXT,
      notes TEXT DEFAULT '',
      auditioned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (record_id) REFERENCES vinyl_records(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES cleaning_batches(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS maintenance_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT CHECK(type IN ('brush_replace','solution_refill','ultrasonic_filter','machine_calibration','pad_replace')) NOT NULL,
      target TEXT NOT NULL,
      threshold_count INTEGER,
      threshold_date TEXT,
      current_count INTEGER DEFAULT 0,
      is_triggered INTEGER DEFAULT 0,
      last_maintenance TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_batches_record ON cleaning_batches(record_id);
    CREATE INDEX IF NOT EXISTS idx_batches_solution ON cleaning_batches(solution_id);
    CREATE INDEX IF NOT EXISTS idx_auditions_record ON audition_logs(record_id);
    CREATE INDEX IF NOT EXISTS idx_versions_batch ON batch_versions(batch_id);
  `);
}

initSchema();

export default db;
