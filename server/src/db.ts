import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/water_quality.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT NOT NULL,
      department TEXT NOT NULL,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      address TEXT NOT NULL,
      area TEXT NOT NULL,
      population INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS repair_teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      leader TEXT NOT NULL,
      leader_phone TEXT NOT NULL,
      members TEXT NOT NULL,
      area TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS water_quality_tests (
      id TEXT PRIMARY KEY,
      test_date TEXT NOT NULL,
      location_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      ph REAL NOT NULL,
      turbidity REAL NOT NULL,
      residual_chlorine REAL NOT NULL,
      coliform REAL NOT NULL,
      status TEXT DEFAULT 'normal',
      tested_by TEXT NOT NULL,
      tester_name TEXT NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS repair_reports (
      id TEXT PRIMARY KEY,
      report_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      affected_area TEXT,
      affected_population INTEGER,
      urgency TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      reported_by TEXT,
      reporter_name TEXT,
      reporter_role TEXT,
      assigned_to TEXT,
      assignee_name TEXT,
      water_stop_needed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES repair_teams(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      order_no TEXT UNIQUE NOT NULL,
      repair_report_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      team_id TEXT NOT NULL,
      team_name TEXT NOT NULL,
      team_members TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      estimated_start TEXT,
      estimated_end TEXT,
      actual_start TEXT,
      actual_end TEXT,
      materials_used TEXT,
      work_summary TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repair_report_id) REFERENCES repair_reports(id),
      FOREIGN KEY (team_id) REFERENCES repair_teams(id)
    );

    CREATE TABLE IF NOT EXISTS water_stop_notices (
      id TEXT PRIMARY KEY,
      notice_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      affected_area TEXT NOT NULL,
      affected_population INTEGER,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'scheduled',
      published INTEGER DEFAULT 0,
      published_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recheck_records (
      id TEXT PRIMARY KEY,
      water_quality_test_id TEXT NOT NULL,
      recheck_date TEXT NOT NULL,
      ph REAL NOT NULL,
      turbidity REAL NOT NULL,
      residual_chlorine REAL NOT NULL,
      coliform REAL NOT NULL,
      result TEXT NOT NULL,
      rechecked_by TEXT NOT NULL,
      rechecker_name TEXT NOT NULL,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (water_quality_test_id) REFERENCES water_quality_tests(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      target_roles TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database initialized successfully');
  return db;
}

export default db;
