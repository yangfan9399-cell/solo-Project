import initSqlJs, { type Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, 'ancient_wells.db');

export type BatchStatus = 'consistent' | 'minor_deviation' | 'severe_conflict' | 'missing_evidence' | 'merged';

export interface Batch {
  id: string;
  batch_no: string;
  plaque_name: string;
  status: BatchStatus;
  created_at: string;
  updated_at: string;
  observer_a?: string;
  observer_b?: string;
  conflict_count: number;
  old_transcription?: string;
}

export interface Reading {
  id: string;
  batch_id: string;
  observer: string;
  rubbing_clarity: string;
  rust_level: string;
  inscription_damage: string;
  well_ring_direction: string;
  rubbing_image?: string;
  transcription: string;
  supplement_reading?: string;
  supplement_basis?: string;
  submitted_at: string;
}

export interface Conflict {
  id: string;
  batch_id: string;
  field_name: string;
  value_a: string;
  value_b: string;
  conflict_type: 'normal' | 'supplement';
  severity: 'minor' | 'severe';
  resolution?: string;
  resolved_value?: string;
  resolved_at?: string;
  resolver?: string;
}

export interface Consultation {
  id: string;
  batch_id: string;
  consultant: string;
  decision: 'merge' | 'keep_divergent' | 'return_for_evidence';
  notes: string;
  decisions_json: string;
  created_at: string;
}

type Row = Record<string, unknown>;

interface StmtRunner {
  run(...params: unknown[]): void;
  get<T = Row>(...params: unknown[]): T | undefined;
  all<T = Row>(...params: unknown[]): T[];
}

let dbInstance: Database | null = null;

export function getDB(): Database {
  if (!dbInstance) {
    throw new Error('Database not initialized yet');
  }
  return dbInstance;
}

function rowsToObjects(db: Database, sql: string, params: unknown[] = []): Row[] {
  const stmt = db.prepare(sql);
  stmt.bind(params as never[]);
  const rows: Row[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Row);
  }
  stmt.free();
  return rows;
}

function runSql(db: Database, sql: string, params: unknown[] = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params as never[]);
  stmt.step();
  stmt.free();
}

export function prepare(db: Database, sql: string): StmtRunner {
  return {
    run(...params: unknown[]) {
      runSql(db, sql, params);
      persistDB();
    },
    get<T = Row>(...params: unknown[]): T | undefined {
      const rows = rowsToObjects(db, sql, params);
      return rows[0] as T | undefined;
    },
    all<T = Row>(...params: unknown[]): T[] {
      return rowsToObjects(db, sql, params) as T[];
    },
  };
}

export function exec(db: Database, sql: string) {
  db.exec(sql);
  persistDB();
}

function persistDB() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.warn('Persist DB warning:', e);
  }
}

export async function initDatabase() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  let existingData: Uint8Array | null = null;
  try {
    if (fs.existsSync(DB_PATH)) {
      existingData = new Uint8Array(fs.readFileSync(DB_PATH));
    }
  } catch (e) {
    console.warn('Read existing DB warning:', e);
  }

  const db = existingData ? new SQL.Database(existingData) : new SQL.Database();
  dbInstance = db;

  initTables(db);
  const countRow = prepare(db, 'SELECT COUNT(*) as cnt FROM batches').get<{ cnt: number }>();
  if (!countRow || countRow.cnt === 0) {
    seedData(db);
  }

  return db;
}

function initTables(db: Database) {
  exec(db, `
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      batch_no TEXT UNIQUE NOT NULL,
      plaque_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'missing_evidence',
      observer_a TEXT,
      observer_b TEXT,
      conflict_count INTEGER NOT NULL DEFAULT 0,
      old_transcription TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      observer TEXT NOT NULL,
      rubbing_clarity TEXT NOT NULL,
      rust_level TEXT NOT NULL,
      inscription_damage TEXT NOT NULL,
      well_ring_direction TEXT NOT NULL,
      rubbing_image TEXT,
      transcription TEXT NOT NULL,
      supplement_reading TEXT,
      supplement_basis TEXT,
      submitted_at TEXT NOT NULL,
      UNIQUE(batch_id, observer)
    );

    CREATE TABLE IF NOT EXISTS conflicts (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      field_name TEXT NOT NULL,
      value_a TEXT NOT NULL,
      value_b TEXT NOT NULL,
      conflict_type TEXT NOT NULL DEFAULT 'normal',
      severity TEXT NOT NULL DEFAULT 'minor',
      resolution TEXT,
      resolved_value TEXT,
      resolved_at TEXT,
      resolver TEXT
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      consultant TEXT NOT NULL,
      decision TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      decisions_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);
}

function seedData(db: Database) {
  const now = new Date().toISOString();
  const nowOffset = (mins: number) => new Date(Date.now() - mins * 60000).toISOString();

  const insertBatch = prepare(db, `
    INSERT INTO batches (id, batch_no, plaque_name, status, observer_a, observer_b, conflict_count, old_transcription, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReading = prepare(db, `
    INSERT INTO readings (id, batch_id, observer, rubbing_clarity, rust_level, inscription_damage, well_ring_direction, rubbing_image, transcription, supplement_reading, supplement_basis, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertConflict = prepare(db, `
    INSERT INTO conflicts (id, batch_id, field_name, value_a, value_b, conflict_type, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const batches: Batch[] = [
    {
      id: 'b-001',
      batch_no: 'GJ-2024-001',
      plaque_name: '龙泉古井铭',
      status: 'consistent',
      observer_a: '张守正',
      observer_b: '李铭远',
      conflict_count: 0,
      created_at: nowOffset(6000),
      updated_at: nowOffset(5000),
    },
    {
      id: 'b-002',
      batch_no: 'GJ-2024-002',
      plaque_name: '青石巷井铭',
      status: 'minor_deviation',
      observer_a: '张守正',
      observer_b: '李铭远',
      conflict_count: 2,
      created_at: nowOffset(5000),
      updated_at: nowOffset(4000),
    },
    {
      id: 'b-003',
      batch_no: 'GJ-2024-003',
      plaque_name: '双泉井铭',
      status: 'severe_conflict',
      observer_a: '张守正',
      observer_b: '李铭远',
      conflict_count: 5,
      old_transcription: '咸平三年造此井泉以供民汲',
      created_at: nowOffset(4000),
      updated_at: nowOffset(3000),
    },
    {
      id: 'b-004',
      batch_no: 'GJ-2024-004',
      plaque_name: '翠微井铭',
      status: 'missing_evidence',
      observer_a: '张守正',
      conflict_count: 0,
      created_at: nowOffset(3000),
      updated_at: nowOffset(2000),
    },
    {
      id: 'b-005',
      batch_no: 'GJ-2024-005',
      plaque_name: '涌金井铭',
      status: 'merged',
      observer_a: '张守正',
      observer_b: '李铭远',
      conflict_count: 3,
      created_at: nowOffset(2000),
      updated_at: nowOffset(1000),
    },
  ];

  for (const b of batches) insertBatch.run(b.id, b.batch_no, b.plaque_name, b.status, b.observer_a ?? null, b.observer_b ?? null, b.conflict_count, b.old_transcription ?? null, b.created_at, b.updated_at);

  const readings: Reading[] = [
    {
      id: 'r-001a', batch_id: 'b-001', observer: '张守正',
      rubbing_clarity: '清晰', rust_level: '轻微', inscription_damage: '无',
      well_ring_direction: '南',
      transcription: '龙泉古井，开凿于唐贞观十年，惠及乡里，百世其昌。',
      submitted_at: nowOffset(5500),
    },
    {
      id: 'r-001b', batch_id: 'b-001', observer: '李铭远',
      rubbing_clarity: '清晰', rust_level: '轻微', inscription_damage: '无',
      well_ring_direction: '南',
      transcription: '龙泉古井，开凿于唐贞观十年，惠及乡里，百世其昌。',
      submitted_at: nowOffset(5200),
    },
    {
      id: 'r-002a', batch_id: 'b-002', observer: '张守正',
      rubbing_clarity: '较清晰', rust_level: '中度', inscription_damage: '局部',
      well_ring_direction: '东南',
      transcription: '青石巷井，明万历二十年孟春立，里人共建。',
      supplement_reading: '碑首依稀可见「永宁」二字',
      supplement_basis: '结合周边同期器物形制推断',
      submitted_at: nowOffset(4500),
    },
    {
      id: 'r-002b', batch_id: 'b-002', observer: '李铭远',
      rubbing_clarity: '清晰', rust_level: '中度', inscription_damage: '局部',
      well_ring_direction: '东',
      transcription: '青石巷井，明万历二十年孟春立，里人共建。',
      supplement_reading: '碑首依稀可见「永安」二字',
      supplement_basis: '参考《宁州志》街巷条目',
      submitted_at: nowOffset(4200),
    },
    {
      id: 'r-003a', batch_id: 'b-003', observer: '张守正',
      rubbing_clarity: '较清晰', rust_level: '重度', inscription_damage: '严重',
      well_ring_direction: '西',
      transcription: '咸平三年造此井泉以供民汲，双泉并涌，故名双泉。',
      supplement_reading: '补「双泉并涌」为原碑所缺',
      supplement_basis: '据《咸平县志》记载补全',
      submitted_at: nowOffset(3500),
    },
    {
      id: 'r-003b', batch_id: 'b-003', observer: '李铭远',
      rubbing_clarity: '模糊', rust_level: '中度', inscription_damage: '严重',
      well_ring_direction: '西北',
      transcription: '元丰三年凿此双井以利行人，岁久不涸。',
      supplement_reading: '补「元丰三年」为年号',
      supplement_basis: '据井圈形制断代为北宋晚期',
      submitted_at: nowOffset(3200),
    },
    {
      id: 'r-004a', batch_id: 'b-004', observer: '张守正',
      rubbing_clarity: '较清晰', rust_level: '轻微', inscription_damage: '局部',
      well_ring_direction: '北',
      transcription: '翠微山麓有泉眼，凿井以供山寺及往来客旅。',
      submitted_at: nowOffset(2200),
    },
    {
      id: 'r-005a', batch_id: 'b-005', observer: '张守正',
      rubbing_clarity: '清晰', rust_level: '无', inscription_damage: '无',
      well_ring_direction: '东北',
      transcription: '涌金井，相传掘时见金沙随水而出，因以为名。',
      submitted_at: nowOffset(1800),
    },
    {
      id: 'r-005b', batch_id: 'b-005', observer: '李铭远',
      rubbing_clarity: '较清晰', rust_level: '无', inscription_damage: '无',
      well_ring_direction: '东北',
      transcription: '涌金井，相传掘时见金砂随水而出，因以为名。',
      submitted_at: nowOffset(1500),
    },
  ];

  for (const r of readings) insertReading.run(r.id, r.batch_id, r.observer, r.rubbing_clarity, r.rust_level, r.inscription_damage, r.well_ring_direction, r.rubbing_image ?? null, r.transcription, r.supplement_reading ?? null, r.supplement_basis ?? null, r.submitted_at);

  const conflicts = [
    ['c-002-1', 'b-002', 'rubbing_clarity', '较清晰', '清晰', 'normal', 'minor'],
    ['c-002-2', 'b-002', 'well_ring_direction', '东南', '东', 'normal', 'minor'],
    ['c-003-1', 'b-003', 'rubbing_clarity', '较清晰', '模糊', 'normal', 'minor'],
    ['c-003-2', 'b-003', 'rust_level', '重度', '中度', 'normal', 'minor'],
    ['c-003-3', 'b-003', 'well_ring_direction', '西', '西北', 'normal', 'severe'],
    ['c-003-4', 'b-003', 'transcription', '咸平三年造此井泉以供民汲，双泉并涌，故名双泉。', '元丰三年凿此双井以利行人，岁久不涸。', 'normal', 'severe'],
    ['c-003-5', 'b-003', 'supplement_reading', '补「双泉并涌」为原碑所缺', '补「元丰三年」为年号', 'supplement', 'severe'],
    ['c-005-1', 'b-005', 'rubbing_clarity', '清晰', '较清晰', 'normal', 'minor'],
    ['c-005-2', 'b-005', 'transcription', '涌金井，相传掘时见金沙随水而出，因以为名。', '涌金井，相传掘时见金砂随水而出，因以为名。', 'normal', 'minor'],
    ['c-005-3', 'b-005', 'well_ring_direction', '东北', '东北', 'normal', 'minor'],
  ];

  for (const c of conflicts) insertConflict.run(...c);

  const insertConsultation = prepare(db, `
    INSERT INTO consultations (id, batch_id, consultant, decision, notes, decisions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertConsultation.run(
    'con-005-1', 'b-005', '王审之', 'merge',
    '释文差异仅为「金沙/金砂」通假，采信A说；清晰度与方位字段采信B说。',
    JSON.stringify({
      rubbing_clarity: { decision: 'adopt_b' },
      transcription: { decision: 'adopt_a' },
      well_ring_direction: { decision: 'adopt_a', custom_value: '东北' },
    }),
    nowOffset(800),
  );
}
