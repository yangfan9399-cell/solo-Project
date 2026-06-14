import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'tape_archive.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) return dbInstance;

  dbInstance = new Database(DB_PATH);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');
  initializeSchema(dbInstance);
  return dbInstance;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      batch_description TEXT NOT NULL,
      tape_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      total_intelligibility REAL DEFAULT 0,
      total_fidelity REAL DEFAULT 0,
      total_material_cost REAL DEFAULT 0,
      total_repair_time_ms INTEGER DEFAULT 0,
      final_score REAL DEFAULT 0,
      grade TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tape_details (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tape_index INTEGER NOT NULL,
      label TEXT NOT NULL,
      defects TEXT NOT NULL,
      original_waveform TEXT NOT NULL,
      current_waveform TEXT NOT NULL,
      breakpoints TEXT NOT NULL,
      speed_drift REAL NOT NULL DEFAULT 0,
      noise_level REAL NOT NULL DEFAULT 0,
      applied_speed REAL NOT NULL DEFAULT 1,
      noise_reduction_level REAL NOT NULL DEFAULT 0,
      splices TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS repair_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tape_detail_id TEXT,
      action_type TEXT NOT NULL,
      action_data TEXT NOT NULL,
      previous_state TEXT,
      timestamp INTEGER NOT NULL,
      sequence_number INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (tape_detail_id) REFERENCES tape_details(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS result_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tape_detail_id TEXT NOT NULL,
      cleaning_method TEXT NOT NULL,
      cleaning_cost REAL NOT NULL,
      final_waveform TEXT NOT NULL,
      intelligibility REAL NOT NULL,
      fidelity REAL NOT NULL,
      material_cost REAL NOT NULL,
      repair_time_ms INTEGER NOT NULL,
      has_excessive_noise_reduction INTEGER NOT NULL DEFAULT 0,
      has_bad_splice INTEGER NOT NULL DEFAULT 0,
      voice_detail_loss REAL NOT NULL DEFAULT 0,
      jump_artifacts INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (tape_detail_id) REFERENCES tape_details(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tape_details_session ON tape_details(session_id);
    CREATE INDEX IF NOT EXISTS idx_repair_history_session ON repair_history(session_id);
    CREATE INDEX IF NOT EXISTS idx_repair_history_tape ON repair_history(tape_detail_id);
    CREATE INDEX IF NOT EXISTS idx_result_records_session ON result_records(session_id);
  `);
}
