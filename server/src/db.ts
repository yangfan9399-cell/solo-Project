import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'app.db');

let SQL: initSqlJs.SqlJsStatic;
let db!: initSqlJs.Database;

export async function initDatabase(): Promise<void> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => path.join(process.cwd(), 'node_modules/sql.js/dist', file)
    });
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  let dbData: Uint8Array | null = null;
  if (fs.existsSync(dbPath)) {
    try {
      dbData = fs.readFileSync(dbPath);
    } catch (e) {
      console.warn('Existing database file found but could not be read:', e);
    }
  }

  db = dbData ? new SQL.Database(dbData) : new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL CHECK(role IN ('reporter', 'admin', 'producer')),
      department TEXT,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS equipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      model TEXT,
      serial_number TEXT UNIQUE,
      purchase_date TEXT,
      purchase_price REAL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'in_use', 'maintenance', 'damaged', 'scrapped')),
      location TEXT,
      specification TEXT,
      description TEXT,
      accessories TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shooting_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      reporter_id INTEGER NOT NULL,
      reporter_name TEXT NOT NULL,
      shooting_location TEXT,
      shooting_start_time TEXT NOT NULL,
      shooting_end_time TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
      producer_id INTEGER,
      producer_name TEXT,
      approved_at TEXT,
      completed_at TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (producer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_no TEXT UNIQUE NOT NULL,
      task_id INTEGER,
      equipment_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      requester_id INTEGER NOT NULL,
      requester_name TEXT NOT NULL,
      expected_pickup_time TEXT NOT NULL,
      expected_return_time TEXT NOT NULL,
      actual_pickup_time TEXT,
      actual_return_time TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'picked_up', 'returned', 'overdue', 'cancelled')),
      approver_id INTEGER,
      approver_name TEXT,
      approved_at TEXT,
      pickup_handler_id INTEGER,
      pickup_handler_name TEXT,
      return_handler_id INTEGER,
      return_handler_name TEXT,
      purpose TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES shooting_tasks(id),
      FOREIGN KEY (equipment_id) REFERENCES equipments(id),
      FOREIGN KEY (requester_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS media_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      capacity TEXT NOT NULL,
      brand TEXT,
      equipment_id INTEGER,
      equipment_name TEXT,
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'in_use', 'damaged', 'lost')),
      current_user_id INTEGER,
      current_user_name TEXT,
      borrow_time TEXT,
      expected_return_time TEXT,
      description TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id)
    );

    CREATE TABLE IF NOT EXISTS damage_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      equipment_id INTEGER NOT NULL,
      equipment_name TEXT NOT NULL,
      reporter_id INTEGER NOT NULL,
      reporter_name TEXT NOT NULL,
      damage_type TEXT NOT NULL CHECK(damage_type IN ('minor', 'moderate', 'severe')),
      description TEXT NOT NULL,
      occurred_time TEXT NOT NULL,
      location TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'repairing', 'repaired', 'scrapped')),
      handler_id INTEGER,
      handler_name TEXT,
      repair_cost REAL,
      repair_result TEXT,
      resolved_at TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipments(id),
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS overdue_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('reservation', 'media_card')),
      related_id INTEGER NOT NULL,
      related_no TEXT NOT NULL,
      equipment_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      due_time TEXT NOT NULL,
      overdue_days INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'notified', 'resolved')),
      notified_at TEXT,
      resolved_at TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS media_card_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_card_id INTEGER NOT NULL,
      media_card_code TEXT NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('borrow', 'return', 'damage_return', 'loss', 'repair', 'scrap')),
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      handler_id INTEGER,
      handler_name TEXT,
      reservation_id INTEGER,
      reservation_no TEXT,
      borrow_time TEXT,
      expected_return_time TEXT,
      actual_return_time TEXT,
      return_status TEXT CHECK(return_status IN ('normal', 'damaged', 'lost')),
      damage_report_id INTEGER,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (media_card_id) REFERENCES media_cards(id),
      FOREIGN KEY (reservation_id) REFERENCES reservations(id),
      FOREIGN KEY (damage_report_id) REFERENCES damage_reports(id)
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_equipment ON reservations(equipment_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_requester ON reservations(requester_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_shooting_tasks_reporter ON shooting_tasks(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_shooting_tasks_status ON shooting_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_equipment ON damage_reports(equipment_id);
    CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);
    CREATE INDEX IF NOT EXISTS idx_overdue_reminders_status ON overdue_reminders(status);
    CREATE INDEX IF NOT EXISTS idx_media_cards_status ON media_cards(status);
    CREATE INDEX IF NOT EXISTS idx_media_card_records_card_id ON media_card_records(media_card_id);
    CREATE INDEX IF NOT EXISTS idx_media_card_records_user_id ON media_card_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_media_card_records_reservation_id ON media_card_records(reservation_id);
  `);

  saveDatabase();
  console.log('Database initialized successfully');
}

function saveDatabase(): void {
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

function escapeParam(param: any): string {
  if (param === null || param === undefined) return 'NULL';
  if (typeof param === 'string') {
    return "'" + param.replace(/'/g, "''") + "'";
  }
  if (typeof param === 'boolean') return param ? '1' : '0';
  return String(param);
}

function interpolateSql(sql: string, params: any[]): string {
  let result = sql;
  for (const param of params) {
    result = result.replace('?', escapeParam(param));
  }
  return result;
}

export async function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    try {
      const fullSql = interpolateSql(sql, params);
      db.run(fullSql);
      const lastID = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0] as number;
      const changes = db.getRowsModified();
      saveDatabase();
      resolve({ lastID, changes });
    } catch (error) {
      reject(error);
    }
  });
}

export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    try {
      const fullSql = interpolateSql(sql, params);
      const results = db.exec(fullSql);
      if (results.length === 0 || results[0].values.length === 0) {
        resolve(undefined);
        return;
      }
      const columns = results[0].columns;
      const values = results[0].values[0];
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = values[idx];
      });
      resolve(obj as T);
    } catch (error) {
      reject(error);
    }
  });
}

export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    try {
      const fullSql = interpolateSql(sql, params);
      const results = db.exec(fullSql);
      if (results.length === 0) {
        resolve([]);
        return;
      }
      const columns = results[0].columns;
      const values = results[0].values;
      const rows = values.map((row: any[]) => {
        const obj: any = {};
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx];
        });
        return obj as T;
      });
      resolve(rows);
    } catch (error) {
      reject(error);
    }
  });
}

export async function exec(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      db.run(sql);
      saveDatabase();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

export { db };
export default db;
