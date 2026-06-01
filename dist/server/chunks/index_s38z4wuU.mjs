import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "visitor.db");
let _db = null;
function getDb() {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}
function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee','security','admin')),
      department TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_type TEXT NOT NULL DEFAULT '身份证',
      id_number TEXT NOT NULL,
      company TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_name TEXT NOT NULL,
      visitor_phone TEXT NOT NULL,
      visitor_id_type TEXT NOT NULL DEFAULT '身份证',
      visitor_id_number TEXT NOT NULL,
      visitor_company TEXT,
      visitee_id INTEGER NOT NULL REFERENCES users(id),
      purpose TEXT NOT NULL,
      expected_arrival TEXT NOT NULL,
      expected_leave TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','approved','rejected','checked_in','checked_out','timeout','cancelled')),
      notes TEXT,
      approved_by INTEGER REFERENCES users(id),
      approved_at TEXT,
      rejected_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id),
      check_in_time TEXT,
      check_out_time TEXT,
      verified_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER REFERENCES appointments(id),
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_visitee ON appointments(visitee_id);
    CREATE INDEX IF NOT EXISTS idx_blacklist_visitor ON blacklist(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  `);
}

export { getDb as g };
