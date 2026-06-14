import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'tape_archive.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let dbInstance: Database | null = null;
let initPromise: Promise<void> | null = null;

async function initDatabase(): Promise<void> {
  if (dbInstance) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file: string) =>
        path.join(process.cwd(), 'node_modules/sql.js/dist', file),
    });

    let existingData: Buffer | null = null;
    if (fs.existsSync(DB_PATH)) {
      try {
        existingData = fs.readFileSync(DB_PATH);
      } catch (e) {
        existingData = null;
      }
    }

    dbInstance = existingData
      ? new SQL.Database(new Uint8Array(existingData))
      : new SQL.Database();

    initializeSchema(dbInstance);
    persistDatabase();
  })();

  return initPromise;
}

function persistDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const tmpPath = DB_PATH + '.tmp';
    fs.writeFileSync(tmpPath, buffer);
    fs.renameSync(tmpPath, DB_PATH);
  } catch (e) {
    console.error('Failed to persist database:', e);
  }
}

function initializeSchema(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      batch_description TEXT NOT NULL,
      tape_count INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      total_intelligibility REAL DEFAULT 0,
      total_fidelity REAL DEFAULT 0,
      total_material_cost REAL DEFAULT 0,
      total_repair_time_ms INTEGER DEFAULT 0,
      final_score REAL DEFAULT 0,
      grade TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS tape_details (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tape_index INTEGER NOT NULL,
      label TEXT NOT NULL,
      defects TEXT NOT NULL,
      original_waveform TEXT NOT NULL,
      current_waveform TEXT NOT NULL,
      breakpoints TEXT NOT NULL,
      speed_drift REAL NOT NULL DEFAULT 0,
      noise_level REAL NOT NULL DEFAULT 0,
      applied_speed REAL NOT NULL DEFAULT 1,
      noise_reduction_level REAL NOT NULL DEFAULT 0,
      splices TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS repair_history (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tape_detail_id TEXT,
      action_type TEXT NOT NULL,
      action_data TEXT NOT NULL,
      previous_state TEXT,
      timestamp INTEGER NOT NULL,
      sequence_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS result_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      tape_detail_id TEXT NOT NULL,
      cleaning_method TEXT NOT NULL,
      cleaning_cost REAL NOT NULL,
      final_waveform TEXT NOT NULL,
      intelligibility REAL NOT NULL,
      fidelity REAL NOT NULL,
      material_cost REAL NOT NULL,
      repair_time_ms INTEGER NOT NULL,
      has_excessive_noise_reduction INTEGER NOT NULL DEFAULT 0,
      has_bad_splice INTEGER NOT NULL DEFAULT 0,
      voice_detail_loss REAL NOT NULL DEFAULT 0,
      jump_artifacts INTEGER NOT NULL DEFAULT 0,
      correlation_coefficient REAL NOT NULL DEFAULT 0,
      jump_penalty_sum REAL NOT NULL DEFAULT 0,
      detail_penalty_value REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  addColumnIfMissing(db, 'result_records', 'correlation_coefficient', 'REAL NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'result_records', 'jump_penalty_sum', 'REAL NOT NULL DEFAULT 0');
  addColumnIfMissing(db, 'result_records', 'detail_penalty_value', 'REAL NOT NULL DEFAULT 0');
}

function addColumnIfMissing(db: Database, table: string, column: string, definition: string): void {
  try {
    const cols = db.exec(`PRAGMA table_info(${table})`);
    const colNames: string[] = [];
    if (cols.length > 0) {
      for (const row of cols[0].values) {
        colNames.push(String(row[1]));
      }
    }
    if (!colNames.includes(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (e) {
    // ignore
  }
}

export async function getDb(): Promise<Database> {
  await initDatabase();
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}

export function persist(): void {
  persistDatabase();
}

export interface SqlRow {
  [key: string]: any;
}

export function rowsToObjects(result: { columns: string[]; values: any[][] }): SqlRow[] {
  if (!result || !result.columns) return [];
  return result.values.map((row) => {
    const obj: SqlRow = {};
    result.columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}
