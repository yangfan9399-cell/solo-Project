import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;
let SQL: SqlJsStatic | null = null;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'space_elevator.db');

export function getDataDir(): string {
  return DATA_DIR;
}

export function getDbPath(): string {
  return DB_PATH;
}

async function getSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

export async function initDb(): Promise<Database> {
  if (db) return db;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const Sql = await getSql();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new Sql.Database(buffer);
  } else {
    db = new Sql.Database();
  }

  if (db) {
    createSchema(db);
    persistDb();
  }

  return db as Database;
}

export async function getDb(): Promise<Database> {
  if (!db) {
    return initDb();
  }
  return db;
}

export function persistDb(): void {
  if (!db) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function closeDb(): void {
  if (db) {
    persistDb();
    db.close();
    db = null;
  }
}

function createSchema(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      avatar TEXT DEFAULT '👨‍🚀',
      total_score INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER NOT NULL DEFAULT 1,
      target_floor INTEGER NOT NULL,
      initial_energy INTEGER NOT NULL DEFAULT 100,
      max_energy INTEGER NOT NULL DEFAULT 100,
      balance_threshold REAL NOT NULL DEFAULT 20.0,
      time_limit INTEGER NOT NULL DEFAULT 300,
      base_score INTEGER NOT NULL DEFAULT 1000,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      level_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'playing',
      score INTEGER DEFAULT 0,
      current_floor INTEGER NOT NULL DEFAULT 0,
      target_floor INTEGER NOT NULL,
      energy INTEGER NOT NULL,
      max_energy INTEGER NOT NULL,
      balance REAL NOT NULL DEFAULT 0,
      balance_threshold REAL NOT NULL,
      left_weights TEXT DEFAULT '[5,3]',
      right_weights TEXT DEFAULT '[4,2]',
      start_time TEXT NOT NULL DEFAULT (datetime('now')),
      end_time TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (level_id) REFERENCES levels(id)
    );

    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      payload TEXT,
      floor_before INTEGER NOT NULL,
      floor_after INTEGER NOT NULL,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      energy_before INTEGER NOT NULL,
      energy_after INTEGER NOT NULL,
      left_weights_before TEXT,
      left_weights_after TEXT,
      right_weights_before TEXT,
      right_weights_after TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      sequence INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
    );
  `);

  try {
    const cols = db.exec("PRAGMA table_info(game_sessions)");
    const colNames = cols[0]?.values.map((r) => r[1]) || [];
    if (!colNames.includes("left_weights")) {
      db.run("ALTER TABLE game_sessions ADD COLUMN left_weights TEXT DEFAULT '[5,3]'");
      db.run("ALTER TABLE game_sessions ADD COLUMN right_weights TEXT DEFAULT '[4,2]'");
    }
  } catch (e) {
    // ignore
  }

  try {
    const cols = db.exec("PRAGMA table_info(operations)");
    const colNames = cols[0]?.values.map((r) => r[1]) || [];
    if (!colNames.includes("left_weights_before")) {
      db.run("ALTER TABLE operations ADD COLUMN left_weights_before TEXT");
      db.run("ALTER TABLE operations ADD COLUMN left_weights_after TEXT");
      db.run("ALTER TABLE operations ADD COLUMN right_weights_before TEXT");
      db.run("ALTER TABLE operations ADD COLUMN right_weights_after TEXT");
    }
  } catch (e) {
    // ignore
  }
}

export function runQuery(db: Database, sql: string, params: unknown[] = []): { lastInsertRowid: number; changes: number } {
  db.run(sql, params as never);
  const result = db.exec('SELECT last_insert_rowid() as id, changes() as ch');
  persistDb();
  if (result.length > 0 && result[0].values.length > 0) {
    return {
      lastInsertRowid: result[0].values[0][0] as number,
      changes: result[0].values[0][1] as number,
    };
  }
  return { lastInsertRowid: 0, changes: 0 };
}

export function getQuery<T = unknown>(db: Database, sql: string, params: unknown[] = []): T | null {
  const results = db.exec(sql, params as never);
  if (results.length === 0 || results[0].values.length === 0) {
    return null;
  }
  const columns = results[0].columns;
  const values = results[0].values[0];
  const obj: Record<string, unknown> = {};
  columns.forEach((col: string, i: number) => {
    obj[col] = values[i];
  });
  return obj as T;
}

export function allQuery<T = unknown>(db: Database, sql: string, params: unknown[] = []): T[] {
  const results = db.exec(sql, params as never);
  if (results.length === 0) {
    return [];
  }
  const columns = results[0].columns;
  return results[0].values.map((row: unknown[]) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}
