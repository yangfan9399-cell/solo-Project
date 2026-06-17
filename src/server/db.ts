import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbDir = join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'mineral-archive.db');

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;
let saveTimeout: any = null;

function saveToDisk() {
  if (!dbInstance) return;
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    const data = dbInstance!.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    saveTimeout = null;
  }, 50);
}

export function flushSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initSql(): Promise<SqlJsStatic> {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    const sql = await initSql();
    
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      dbInstance = new sql.Database(buffer);
    } else {
      dbInstance = new sql.Database();
      saveToDisk();
    }
    
    dbInstance.exec('PRAGMA foreign_keys = ON');
  }
  return dbInstance;
}

function toObjects(columns: string[], values: any[][]): any[] {
  return values.map(row => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

export interface Stmt {
  run(params?: any[]): void;
  get(params?: any[]): any | null;
  all(params?: any[]): any[];
}

export async function prepare(sql: string): Promise<Stmt> {
  const db = await getDb();
  const statement = db.prepare(sql);
  
  return {
    run(params: any[] = []) {
      statement.run(params);
      saveToDisk();
      statement.reset();
    },
    get(params: any[] = []) {
      statement.bind(params);
      if (statement.step()) {
        const result = statement.getAsObject();
        statement.reset();
        return result;
      }
      statement.reset();
      return null;
    },
    all(params: any[] = []) {
      statement.bind(params);
      const results: any[] = [];
      while (statement.step()) {
        results.push(statement.getAsObject());
      }
      statement.reset();
      return results;
    },
  };
}

export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  db.exec(sql);
  saveToDisk();
}

export async function initDatabase() {
  const db = await getDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS sample_boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      rows INTEGER NOT NULL DEFAULT 10,
      columns INTEGER NOT NULL DEFAULT 10,
      location TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS thin_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_number TEXT NOT NULL,
      mineral_name TEXT NOT NULL,
      mineral_formula TEXT,
      crystal_system TEXT,
      locality TEXT,
      collection_date TEXT,
      collector TEXT,
      thin_section_number TEXT NOT NULL UNIQUE,
      thickness_micrometers INTEGER NOT NULL DEFAULT 30,
      cover_slip INTEGER NOT NULL DEFAULT 1,
      mounting_medium TEXT,
      grain_size_mm REAL,
      rock_type TEXT,
      alteration_degree INTEGER DEFAULT 0,
      sample_box_id INTEGER,
      box_position TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      current_version INTEGER NOT NULL DEFAULT 1,
      is_deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS micrographs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('ppl', 'xpl', 'cnl')),
      magnification INTEGER NOT NULL,
      scale_bar_micrometers INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      analyzer_angle INTEGER,
      accessory_plate TEXT,
      exposure_ms INTEGER,
      notes TEXT,
      captured_at TEXT,
      captured_by TEXT
    );

    CREATE TABLE IF NOT EXISTS mineral_optics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL UNIQUE,
      relief REAL NOT NULL,
      refractive_index_min REAL,
      refractive_index_max REAL,
      birefringence REAL,
      optic_sign TEXT CHECK(optic_sign IN ('positive', 'negative', 'unknown')),
      optic_axis_angle REAL,
      extinction_type TEXT CHECK(extinction_type IN ('parallel', 'symmetrical', 'oblique', 'undulose')),
      extinction_angle REAL,
      pleochroism TEXT,
      pleochroism_colors TEXT,
      absorption_formula TEXT,
      twinning_type TEXT CHECK(twinning_type IN ('simple', 'polysynthetic', 'cyclic', 'none')),
      twinning_description TEXT,
      zoning INTEGER NOT NULL DEFAULT 0,
      inclusions_description TEXT
    );

    CREATE TABLE IF NOT EXISTS interference_colors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      mineral_grain_id TEXT,
      "order" INTEGER NOT NULL,
      color_name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      estimated_birefringence REAL NOT NULL,
      thickness_micrometers INTEGER NOT NULL,
      grain_orientation TEXT NOT NULL CHECK(grain_orientation IN ('parallel', 'inclined', 'perpendicular')),
      is_anomalous INTEGER NOT NULL DEFAULT 0,
      anomalous_description TEXT,
      accessory_plate_used TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS cleavages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      mineral_grain_id TEXT,
      quality TEXT NOT NULL CHECK(quality IN ('perfect', 'good', 'distinct', 'indistinct', 'absent')),
      number_of_directions INTEGER NOT NULL,
      angle_between_directions REAL,
      cleavage_trace TEXT,
      parting_description TEXT,
      fracture_type TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS associations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      associated_mineral TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      textural_relation TEXT NOT NULL,
      abundance_percent INTEGER NOT NULL DEFAULT 0,
      grain_size_mm REAL,
      paragenetic_stage TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS version_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      change_type TEXT NOT NULL CHECK(change_type IN ('create', 'update', 'revert')),
      field_name TEXT,
      old_value TEXT,
      new_value TEXT,
      change_description TEXT NOT NULL,
      changed_by TEXT,
      changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      batch_id TEXT
    );

    CREATE TABLE IF NOT EXISTS data_anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_id INTEGER NOT NULL,
      anomaly_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      field_name TEXT,
      current_value TEXT,
      expected_range TEXT,
      description TEXT NOT NULL,
      detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      resolver_note TEXT
    );

    CREATE TABLE IF NOT EXISTS box_slots (
      box_id INTEGER NOT NULL,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      section_id INTEGER,
      label TEXT,
      PRIMARY KEY (box_id, row, col)
    );

    CREATE INDEX IF NOT EXISTS idx_sections_mineral ON thin_sections(mineral_name);
    CREATE INDEX IF NOT EXISTS idx_sections_locality ON thin_sections(locality);
    CREATE INDEX IF NOT EXISTS idx_sections_box ON thin_sections(sample_box_id);
    CREATE INDEX IF NOT EXISTS idx_micrographs_section ON micrographs(section_id);
    CREATE INDEX IF NOT EXISTS idx_version_section ON version_history(section_id);
    CREATE INDEX IF NOT EXISTS idx_anomalies_section ON data_anomalies(section_id);
    CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON data_anomalies(severity);
  `);
  
  flushSave();
  console.log('数据库初始化完成');
  return db;
}

export function closeDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
