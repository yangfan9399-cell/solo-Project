import Database from 'better-sqlite3'
import type { Database as DB } from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

let db: DB | null = null

export function getDatabase(): DB {
  if (!db) {
    const dbPath = path.resolve(process.cwd(), 'data', 'tooling.db')
    const dbDir = path.dirname(dbPath)
    
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }
    
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    
    initializeDatabase(db)
  }
  return db
}

function initializeDatabase(db: DB) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'operator', 'quality')),
      department TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      specification TEXT,
      manufacturer TEXT,
      model TEXT,
      serial_number TEXT,
      measurement_range TEXT,
      accuracy TEXT,
      department TEXT,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'borrowed', 'calibrating', 'maintenance', 'scrapped')),
      calibration_cycle_days INTEGER NOT NULL DEFAULT 365,
      last_calibration_date TEXT,
      next_calibration_date TEXT,
      purchase_date TEXT,
      price REAL DEFAULT 0,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER NOT NULL,
      tool_code TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      applicant_id INTEGER NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_department TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expected_return_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue')),
      approver_id INTEGER,
      approver_name TEXT,
      approval_remark TEXT,
      approved_at TEXT,
      handover_person_id INTEGER,
      handover_person_name TEXT,
      handed_over_at TEXT,
      return_inspector_id INTEGER,
      return_inspector_name TEXT,
      return_condition TEXT,
      returned_at TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tool_id) REFERENCES tools(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS calibration_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER NOT NULL,
      tool_code TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      planned_date TEXT NOT NULL,
      actual_date TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'passed', 'failed')),
      calibration_agency TEXT,
      certificate_number TEXT,
      calibration_result TEXT,
      next_calibration_date TEXT,
      cost REAL,
      inspector_id INTEGER,
      inspector_name TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tool_id) REFERENCES tools(id)
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER,
      tool_code TEXT,
      reporter_id INTEGER NOT NULL,
      reporter_name TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'processing', 'resolved', 'closed')),
      handler_id INTEGER,
      handler_name TEXT,
      handle_result TEXT,
      handled_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tool_id) REFERENCES tools(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tools_status ON tools(status);
    CREATE INDEX IF NOT EXISTS idx_tools_next_calibration ON tools(next_calibration_date);
    CREATE INDEX IF NOT EXISTS idx_borrow_records_status ON borrow_records(status);
    CREATE INDEX IF NOT EXISTS idx_borrow_records_tool_id ON borrow_records(tool_id);
    CREATE INDEX IF NOT EXISTS idx_calibration_records_tool_id ON calibration_records(tool_id);
    CREATE INDEX IF NOT EXISTS idx_calibration_records_status ON calibration_records(status);
    CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
  `)

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, name, role, department)
      VALUES (?, ?, ?, ?)
    `)
    insertUser.run('admin', '系统管理员', 'admin', '质量部')
    insertUser.run('operator1', '张三', 'operator', '生产一部')
    insertUser.run('operator2', '李四', 'operator', '生产二部')
    insertUser.run('quality1', '王质量', 'quality', '质量部')
  }
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  const db = getDatabase()
  return db.prepare(sql).all(...params) as T[]
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const db = getDatabase()
  return (db.prepare(sql).get(...params) as T) || null
}

export function execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  const db = getDatabase()
  const result = db.prepare(sql).run(...params)
  return {
    changes: result.changes,
    lastInsertRowid: Number(result.lastInsertRowid)
  }
}

export function transaction<T>(fn: () => T): T {
  const db = getDatabase()
  return db.transaction(fn)()
}
