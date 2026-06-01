import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'visitor.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
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

export type UserRole = 'employee' | 'security' | 'admin';
export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'checked_in' | 'checked_out' | 'timeout' | 'cancelled';
export type IdType = '身份证' | '护照' | '驾照' | '其他';

export interface User {
  id: number;
  name: string;
  role: UserRole;
  department: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
}

export interface Visitor {
  id: number;
  name: string;
  phone: string;
  id_type: IdType;
  id_number: string;
  company: string | null;
  created_at: string;
}

export interface BlacklistEntry {
  id: number;
  visitor_id: number;
  visitor_name?: string;
  visitor_id_number?: string;
  reason: string;
  created_by: number | null;
  created_at: string;
}

export interface Appointment {
  id: number;
  visitor_name: string;
  visitor_phone: string;
  visitor_id_type: IdType;
  visitor_id_number: string;
  visitor_company: string | null;
  visitee_id: number;
  visitee_name?: string;
  visitee_department?: string;
  purpose: string;
  expected_arrival: string;
  expected_leave: string;
  status: AppointmentStatus;
  notes: string | null;
  approved_by: number | null;
  approved_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: number;
  appointment_id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  verified_by: number | null;
  notes: string | null;
  created_at: string;
}

export interface Notification {
  id: number;
  appointment_id: number | null;
  user_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}
