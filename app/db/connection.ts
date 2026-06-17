import initSqlJs, { Database as SqlJsDb } from 'sql.js';
import path from 'node:path';
import fs from 'node:fs';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'compass-ledger.db');

let dbInstance: SqlJsDb | null = null;
let initPromise: Promise<void> | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    ensureDataDir();
    const SQL = await initSqlJs();
    let buffer: Buffer | null = null;
    if (fs.existsSync(DB_PATH)) {
      buffer = fs.readFileSync(DB_PATH);
    }
    dbInstance = buffer ? new SQL.Database(buffer) : new SQL.Database();
    dbInstance.run('PRAGMA foreign_keys = ON');
  })();
  return initPromise;
}

export async function getDb(): Promise<SqlJsDb> {
  if (!dbInstance) await initDb();
  return dbInstance!;
}

export function saveDb(): void {
  if (dbInstance) {
    ensureDataDir();
    const data = dbInstance.export();
    const buf = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buf);
  }
}

export function closeDb(): void {
  if (dbInstance) {
    saveDb();
    dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
}

export function run(db: SqlJsDb, sql: string, params: Record<string, unknown> = {}): { changes: number; lastInsertRowid: number } {
  const stmt = db.prepare(sql);
  stmt.bind(params as any);
  stmt.step();
  stmt.free();
  saveDb();
  const lastId = db.exec('SELECT last_insert_rowid() AS id')[0]?.values?.[0]?.[0] as number || 0;
  const changes = db.exec('SELECT changes() AS c')[0]?.values?.[0]?.[0] as number || 0;
  return { changes, lastInsertRowid: lastId };
}

export function getOne<T = Record<string, unknown>>(db: SqlJsDb, sql: string, params: Record<string, unknown> = {}): T | undefined {
  const stmt = db.prepare(sql);
  stmt.bind(params as any);
  const cols = stmt.getColumnNames();
  let row: T | undefined;
  if (stmt.step()) {
    const values = stmt.getAsObject() as unknown as T;
    row = values;
  }
  stmt.free();
  return row;
}

export function getAll<T = Record<string, unknown>>(db: SqlJsDb, sql: string, params: Record<string, unknown> = {}): T[] {
  const results = db.exec(sql, params as any);
  if (results.length === 0) return [];
  const result = results[0];
  return result.values.map(row => {
    const obj: Record<string, unknown> = {};
    result.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

export const DB_FILE_PATH = DB_PATH;
