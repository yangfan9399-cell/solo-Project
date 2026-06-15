import fs from 'fs';
import path from 'path';
import type { DBData, TableName } from './types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'silver-engraving.json');

const EMPTY_DB: DBData = {
  main_records: [],
  annealing_records: [],
  pattern_progress: [],
  result_records: [],
  tool_inventory: [],
  photo_annotations: [],
  delivery_orders: [],
  change_logs: [],
  sequences: {},
};

const WRITE_LOCK: { locked: boolean; queue: (() => void)[] } = { locked: false, queue: [] };

function acquireLock(): Promise<void> {
  return new Promise((resolve) => {
    if (!WRITE_LOCK.locked) {
      WRITE_LOCK.locked = true;
      resolve();
    } else {
      WRITE_LOCK.queue.push(resolve);
    }
  });
}

function releaseLock(): void {
  const next = WRITE_LOCK.queue.shift();
  if (next) {
    next();
  } else {
    WRITE_LOCK.locked = false;
  }
}

let memoryCache: DBData | null = null;
let cacheMtimeMs = 0;

function readRaw(): DBData {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const clone = JSON.parse(JSON.stringify(EMPTY_DB)) as DBData;
    fs.writeFileSync(DB_PATH, JSON.stringify(clone, null, 2), 'utf-8');
    cacheMtimeMs = Date.now();
    memoryCache = clone;
    return clone;
  }
  const stat = fs.statSync(DB_PATH);
  const mtime = stat.mtimeMs;
  if (memoryCache && mtime === cacheMtimeMs) {
    return memoryCache;
  }
  const content = fs.readFileSync(DB_PATH, 'utf-8');
  const parsed = JSON.parse(content) as DBData;
  for (const k of Object.keys(EMPTY_DB) as (keyof DBData)[]) {
    if (!(k in parsed)) {
      (parsed as any)[k] = (EMPTY_DB as any)[k];
    }
  }
  if (!parsed.sequences) parsed.sequences = {};
  memoryCache = parsed;
  cacheMtimeMs = mtime;
  return parsed;
}

async function writeRaw(db: DBData): Promise<void> {
  await acquireLock();
  try {
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmp, DB_PATH);
    const stat = fs.statSync(DB_PATH);
    memoryCache = db;
    cacheMtimeMs = stat.mtimeMs;
  } finally {
    releaseLock();
  }
}

export function nextId(db: DBData, table: TableName): number {
  const key = table + ':id';
  const current = db.sequences[key] || 0;
  const next = current + 1;
  db.sequences[key] = next;
  return next;
}

export function nowISO(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

export function loadDB(): DBData {
  return readRaw();
}

export async function saveDB(db: DBData): Promise<void> {
  await writeRaw(db);
}

export async function mutate<T>(fn: (db: DBData) => Promise<T> | T): Promise<T> {
  const db = readRaw();
  const result = await fn(db);
  await writeRaw(db);
  return result;
}

export function getTable<T = any>(db: DBData, table: TableName): T[] {
  return (db as any)[table] as T[];
}

export function findAll<T = any>(db: DBData, table: TableName, filter?: Partial<T>): T[] {
  const rows = getTable<T>(db, table);
  if (!filter) return rows.slice();
  return rows.filter((r) => {
    for (const k of Object.keys(filter) as (keyof T)[]) {
      const fv = filter[k];
      if (fv === undefined || fv === null) continue;
      if (r[k] !== fv) return false;
    }
    return true;
  });
}

export function findOne<T = any>(db: DBData, table: TableName, filter: Partial<T>): T | undefined {
  return findAll<T>(db, table, filter)[0];
}

export function findById<T extends { id: number } = any>(db: DBData, table: TableName, id: number): T | undefined {
  return findOne<T>(db, table, { id } as any);
}

export function insertRow<T extends { id: number }>(db: DBData, table: TableName, row: Omit<T, 'id' | 'created_at' | 'updated_at'> & Partial<T>): T {
  const id = nextId(db, table);
  const ts = nowISO();
  const newRow: any = { ...(row as any), id, created_at: ts };
  if (table === 'main_records' || table === 'result_records' || table === 'tool_inventory') {
    newRow.updated_at = ts;
  }
  (db as any)[table].push(newRow);
  return newRow as T;
}

export function updateRow<T extends { id: number }>(db: DBData, table: TableName, id: number, patch: Partial<T>): T | undefined {
  const rows = getTable<T>(db, table);
  const idx = rows.findIndex((r: any) => r.id === id);
  if (idx === -1) return undefined;
  const merged: any = { ...(rows[idx] as any), ...(patch as any) };
  if (table === 'main_records' || table === 'result_records' || table === 'tool_inventory') {
    merged.updated_at = nowISO();
  }
  rows[idx] = merged;
  return merged as T;
}

export function deleteRow(db: DBData, table: TableName, id: number): boolean {
  const rows = getTable<any>(db, table);
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);

  if (table === 'main_records') {
    const cascade: TableName[] = [
      'annealing_records', 'pattern_progress', 'result_records',
      'photo_annotations', 'delivery_orders', 'change_logs',
    ];
    for (const ct of cascade) {
      (db as any)[ct] = (db as any)[ct].filter((r: any) => r.main_record_id !== id);
    }
  }
  if (table === 'pattern_progress') {
    db.photo_annotations = db.photo_annotations.map((p) =>
      p.pattern_progress_id === id ? { ...p, pattern_progress_id: null } : p
    );
  }
  if (table === 'delivery_orders') {
    db.delivery_orders = db.delivery_orders.map((d) =>
      d.previous_version_id === id ? { ...d, previous_version_id: null } : d
    );
  }
  return true;
}
