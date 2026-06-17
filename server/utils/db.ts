import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

let _db: SqlJsDatabase | null = null
const DB_PATH = resolve(__dirname, '../../incense-data.db')

function getWasmBinary(): Buffer {
  const possiblePaths = [
    resolve(__dirname, '../../node_modules/sql.js/dist/sql-wasm.wasm'),
    resolve(__dirname, '../../../sql.js/dist/sql-wasm.wasm'),
  ]
  for (const p of possiblePaths) {
    if (existsSync(p)) return readFileSync(p)
  }
  throw new Error('sql-wasm.wasm not found')
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (_db) return _db
  const SQL = await initSqlJs({ wasmBinary: getWasmBinary() })
  if (existsSync(DB_PATH)) {
    const buf = readFileSync(DB_PATH)
    _db = new SQL.Database(buf)
  } else {
    _db = new SQL.Database()
  }
  _db.run('PRAGMA foreign_keys = ON')
  return _db
}

export function saveDb(): void {
  if (!_db) return
  const data = _db.export()
  const dir = dirname(DB_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, Buffer.from(data))
}

export interface Formula {
  id: number
  name: string
  description: string
  version: number
  top_note: string
  middle_note: string
  base_note: string
  burning_time_min: number
  burning_time_max: number
  longevity_hours: number
  status: 'draft' | 'testing' | 'approved' | 'archived'
  created_at: string
  updated_at: string
}

export interface FormulaMaterial {
  id: number
  formula_id: number
  material_name: string
  ratio: number
  unit: string
  note_type: 'top' | 'middle' | 'base'
  batch_id: number | null
}

export interface Batch {
  id: number
  formula_id: number
  formula_version: number
  batch_code: string
  production_date: string
  quantity: number
  status: 'pending' | 'producing' | 'testing' | 'completed' | 'failed'
  notes: string
  created_at: string
}

export interface Evaluation {
  id: number
  formula_id: number
  batch_id: number
  evaluator: string
  scent_score: number
  longevity_score: number
  stability_score: number
  overall_score: number
  top_note_rating: number
  middle_note_rating: number
  base_note_rating: number
  burning_time_actual: number
  longevity_actual_hours: number
  comments: string
  is_blind: number
  evaluated_at: string
}

export interface BlindReview {
  id: number
  evaluation_id: number
  reviewer_name: string
  guess_formula: string
  guess_accuracy: 'correct' | 'partial' | 'wrong'
  preference_score: number
  notes: string
  reviewed_at: string
}

export interface Inventory {
  id: number
  material_name: string
  category: string
  current_stock: number
  unit: string
  min_threshold: number
  unit_cost: number
  supplier: string
  last_restocked: string
}

export interface InventoryLog {
  id: number
  inventory_id: number
  change_amount: number
  change_type: 'consumption' | 'restock' | 'adjustment'
  related_batch_id: number | null
  notes: string
  created_at: string
}

export interface FormulaVersion {
  id: number
  formula_id: number
  version: number
  snapshot: string
  change_note: string
  created_at: string
}

export async function initDb(): Promise<void> {
  const db = await getDb()

  db.run(`
    CREATE TABLE IF NOT EXISTS formulas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      version INTEGER DEFAULT 1,
      top_note TEXT DEFAULT '',
      middle_note TEXT DEFAULT '',
      base_note TEXT DEFAULT '',
      burning_time_min REAL DEFAULT 0,
      burning_time_max REAL DEFAULT 0,
      longevity_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','testing','approved','archived')),
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS formula_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      material_name TEXT NOT NULL,
      ratio REAL NOT NULL,
      unit TEXT DEFAULT 'g',
      note_type TEXT DEFAULT 'middle' CHECK(note_type IN ('top','middle','base')),
      batch_id INTEGER,
      FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      formula_version INTEGER DEFAULT 1,
      batch_code TEXT NOT NULL UNIQUE,
      production_date TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','producing','testing','completed','failed')),
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      evaluator TEXT NOT NULL,
      scent_score REAL DEFAULT 0,
      longevity_score REAL DEFAULT 0,
      stability_score REAL DEFAULT 0,
      overall_score REAL DEFAULT 0,
      top_note_rating REAL DEFAULT 0,
      middle_note_rating REAL DEFAULT 0,
      base_note_rating REAL DEFAULT 0,
      burning_time_actual REAL DEFAULT 0,
      longevity_actual_hours REAL DEFAULT 0,
      comments TEXT DEFAULT '',
      is_blind INTEGER DEFAULT 0,
      evaluated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS blind_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evaluation_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      guess_formula TEXT DEFAULT '',
      guess_accuracy TEXT DEFAULT 'wrong' CHECK(guess_accuracy IN ('correct','partial','wrong')),
      preference_score REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      reviewed_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (evaluation_id) REFERENCES evaluations(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_name TEXT NOT NULL UNIQUE,
      category TEXT DEFAULT '',
      current_stock REAL DEFAULT 0,
      unit TEXT DEFAULT 'g',
      min_threshold REAL DEFAULT 100,
      unit_cost REAL DEFAULT 0,
      supplier TEXT DEFAULT '',
      last_restocked TEXT DEFAULT ''
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      change_amount REAL NOT NULL,
      change_type TEXT NOT NULL CHECK(change_type IN ('consumption','restock','adjustment')),
      related_batch_id INTEGER,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS formula_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      formula_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      change_note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE
    )
  `)

  saveDb()
}

export function queryAll<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results: T[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return results
}

export function queryOne<T = any>(db: SqlJsDatabase, sql: string, params: any[] = []): T | undefined {
  const results = queryAll<T>(db, sql, params)
  return results[0]
}

export function runStatement(db: SqlJsDatabase, sql: string, params: any[] = []): void {
  db.run(sql, params)
  saveDb()
}

export function getLastInsertRowId(db: SqlJsDatabase): number {
  const result = queryOne<{ id: number }>(db, 'SELECT last_insert_rowid() as id')
  return result?.id ?? 0
}
