import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Database, MasterRecord, DetailRecord, HistoryRecord, ResultRecord, Snapshot } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadDb(): Database {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const emptyDb: Database = {
      masters: [],
      details: [],
      histories: [],
      results: [],
      snapshots: [],
    };
    saveDb(emptyDb);
    return emptyDb;
  }
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(content) as Database;
}

export function saveDb(db: Database): void {
  ensureDataDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function now(): string {
  return new Date().toISOString();
}

export const masterService = {
  getAll(): MasterRecord[] {
    const db = loadDb();
    return db.masters.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById(id: string): MasterRecord | undefined {
    const db = loadDb();
    return db.masters.find(m => m.id === id);
  },

  create(data: Omit<MasterRecord, 'id' | 'createdAt' | 'updatedAt'>): MasterRecord {
    const db = loadDb();
    const record: MasterRecord = {
      ...data,
      id: generateId('master'),
      createdAt: now(),
      updatedAt: now(),
    };
    db.masters.push(record);
    saveDb(db);
    return record;
  },

  update(id: string, data: Partial<MasterRecord>): MasterRecord | undefined {
    const db = loadDb();
    const idx = db.masters.findIndex(m => m.id === id);
    if (idx === -1) return undefined;
    db.masters[idx] = { ...db.masters[idx], ...data, updatedAt: now() };
    saveDb(db);
    return db.masters[idx];
  },
};

export const detailService = {
  getByMasterId(masterId: string): DetailRecord[] {
    const db = loadDb();
    return db.details.filter(d => d.masterId === masterId).sort((a, b) => a.elevation - b.elevation);
  },

  create(data: Omit<DetailRecord, 'id' | 'createdAt' | 'updatedAt'>): DetailRecord {
    const db = loadDb();
    const record: DetailRecord = {
      ...data,
      id: generateId('detail'),
      createdAt: now(),
      updatedAt: now(),
    };
    db.details.push(record);
    saveDb(db);
    return record;
  },

  update(id: string, data: Partial<DetailRecord>): DetailRecord | undefined {
    const db = loadDb();
    const idx = db.details.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    db.details[idx] = { ...db.details[idx], ...data, updatedAt: now() };
    saveDb(db);
    return db.details[idx];
  },
};

export const historyService = {
  getByMasterId(masterId: string): HistoryRecord[] {
    const db = loadDb();
    return db.histories.filter(h => h.masterId === masterId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  create(data: Omit<HistoryRecord, 'id' | 'createdAt'>): HistoryRecord {
    const db = loadDb();
    const record: HistoryRecord = {
      ...data,
      id: generateId('history'),
      createdAt: now(),
    };
    db.histories.push(record);
    saveDb(db);
    return record;
  },
};

export const resultService = {
  getByMasterId(masterId: string): ResultRecord | undefined {
    const db = loadDb();
    return db.results.find(r => r.masterId === masterId);
  },

  create(data: Omit<ResultRecord, 'id' | 'createdAt' | 'updatedAt'>): ResultRecord {
    const db = loadDb();
    const record: ResultRecord = {
      ...data,
      id: generateId('result'),
      createdAt: now(),
      updatedAt: now(),
    };
    db.results.push(record);
    saveDb(db);
    return record;
  },

  update(masterId: string, data: Partial<ResultRecord>): ResultRecord | undefined {
    const db = loadDb();
    const idx = db.results.findIndex(r => r.masterId === masterId);
    if (idx === -1) return undefined;
    db.results[idx] = { ...db.results[idx], ...data, updatedAt: now() };
    saveDb(db);
    return db.results[idx];
  },
};

export function createSnapshot(masterId: string, name: string): Snapshot | undefined {
  const db = loadDb();
  const master = db.masters.find(m => m.id === masterId);
  if (!master) return undefined;

  const details = db.details.filter(d => d.masterId === masterId);
  const histories = db.histories.filter(h => h.masterId === masterId);
  const result = db.results.find(r => r.masterId === masterId);
  if (!result) return undefined;

  const snapshot: Snapshot = {
    id: generateId('snapshot'),
    masterId,
    version: master.version,
    name,
    createdAt: now(),
    masterData: { ...master },
    details: details.map(d => ({ ...d })),
    histories: histories.map(h => ({ ...h })),
    result: { ...result },
  };

  db.snapshots.push(snapshot);
  saveDb(db);
  return snapshot;
}

export function getSnapshotsByMasterId(masterId: string): Snapshot[] {
  const db = loadDb();
  return db.snapshots.filter(s => s.masterId === masterId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function restoreFromSnapshot(snapshotId: string): boolean {
  const db = loadDb();
  const snapshot = db.snapshots.find(s => s.id === snapshotId);
  if (!snapshot) return false;

  const masterIdx = db.masters.findIndex(m => m.id === snapshot.masterId);
  if (masterIdx !== -1) {
    db.masters[masterIdx] = { ...snapshot.masterData, updatedAt: now() };
  }

  db.details = db.details.filter(d => d.masterId !== snapshot.masterId);
  db.details.push(...snapshot.details.map(d => ({ ...d })));

  db.histories = db.histories.filter(h => h.masterId !== snapshot.masterId);
  db.histories.push(...snapshot.histories.map(h => ({ ...h })));

  const resultIdx = db.results.findIndex(r => r.masterId === snapshot.masterId);
  if (resultIdx !== -1) {
    db.results[resultIdx] = { ...snapshot.result, updatedAt: now() };
  }

  saveDb(db);
  return true;
}
