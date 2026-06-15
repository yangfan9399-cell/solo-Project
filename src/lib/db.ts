// @ts-nocheck
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'silver-engraving.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
  }
  return dbInstance;
}

export function initDatabase(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS main_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_no TEXT UNIQUE NOT NULL,
      work_name TEXT NOT NULL,
      silversmith TEXT NOT NULL,
      chisel_set TEXT,
      main_chisels TEXT,
      material TEXT NOT NULL,
      material_weight REAL NOT NULL,
      start_date TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      status TEXT DEFAULT '进行中',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS annealing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      seq_no INTEGER NOT NULL,
      annealing_time TEXT NOT NULL,
      temperature REAL NOT NULL,
      duration INTEGER NOT NULL,
      cooling_method TEXT NOT NULL,
      hardness_before REAL,
      hardness_after REAL,
      operator TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pattern_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      pattern_stage TEXT NOT NULL,
      pattern_name TEXT NOT NULL,
      progress_pct INTEGER DEFAULT 0,
      start_time TEXT,
      end_time TEXT,
      duration_minutes INTEGER DEFAULT 0,
      chisels_used TEXT,
      issues TEXT,
      snapshot_image TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS result_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL UNIQUE,
      surface_defects TEXT,
      defect_severity TEXT,
      rework_count INTEGER DEFAULT 0,
      final_weight REAL,
      delivery_requirements TEXT,
      packaging TEXT,
      delivery_date TEXT,
      inspector TEXT,
      acceptance TEXT,
      acceptance_notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tool_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_code TEXT UNIQUE NOT NULL,
      tool_name TEXT NOT NULL,
      tool_type TEXT NOT NULL,
      spec TEXT,
      status TEXT DEFAULT '在用',
      usage_count INTEGER DEFAULT 0,
      last_maintenance TEXT,
      maintenance_cycle INTEGER DEFAULT 50,
      manufacturer TEXT,
      version TEXT DEFAULT 'v1',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photo_annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      pattern_progress_id INTEGER,
      photo_url TEXT NOT NULL,
      annotation_type TEXT DEFAULT '正常',
      annotation_text TEXT,
      annotator TEXT,
      annotation_time TEXT,
      resolved INTEGER DEFAULT 0,
      resolved_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id) ON DELETE CASCADE,
      FOREIGN KEY (pattern_progress_id) REFERENCES pattern_progress(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      version INTEGER DEFAULT 1,
      previous_version_id INTEGER,
      content_snapshot TEXT NOT NULL,
      issued_by TEXT,
      issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      recipient TEXT,
      signoff INTEGER DEFAULT 0,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id) ON DELETE CASCADE,
      FOREIGN KEY (previous_version_id) REFERENCES delivery_orders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS change_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      table_name TEXT NOT NULL,
      record_id INTEGER,
      change_type TEXT NOT NULL,
      change_reason TEXT,
      before_data TEXT,
      after_data TEXT,
      operator TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id) ON DELETE CASCADE
    );
  `);
}
