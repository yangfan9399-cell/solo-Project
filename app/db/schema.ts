import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "fishway.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbInstance: (DatabaseSync & { _inTx?: boolean }) | null = null;

export function getDb(): DatabaseSync & { _inTx?: boolean } {
  if (dbInstance) return dbInstance;
  const db = new DatabaseSync(DB_PATH) as DatabaseSync & { _inTx?: boolean };
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db._inTx = false;
  initSchema(db);
  dbInstance = db;
  return dbInstance;
}

export function runInTransaction<T>(db: DatabaseSync & { _inTx?: boolean }, fn: () => T): T {
  if (db._inTx) {
    return fn();
  }
  db._inTx = true;
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  } finally {
    db._inTx = false;
  }
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      station_name TEXT NOT NULL,
      river_name TEXT NOT NULL,
      river_type TEXT NOT NULL DEFAULT 'mountain',
      fish_type TEXT NOT NULL DEFAULT 'general',
      designer TEXT NOT NULL DEFAULT '未指定',
      status TEXT NOT NULL DEFAULT 'draft',
      description TEXT,
      has_anomaly INTEGER NOT NULL DEFAULT 0,
      anomaly_count INTEGER NOT NULL DEFAULT 0,
      current_version TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_tag TEXT NOT NULL,
      batch_no TEXT NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 0,
      author TEXT NOT NULL DEFAULT '系统',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, version_tag)
    );

    CREATE TABLE IF NOT EXISTS cross_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      station_no TEXT NOT NULL,
      name TEXT NOT NULL,
      width REAL NOT NULL DEFAULT 0,
      depth REAL NOT NULL DEFAULT 0,
      slope REAL NOT NULL DEFAULT 0,
      area REAL NOT NULL DEFAULT 0,
      wetted_perimeter REAL NOT NULL DEFAULT 0,
      hydraulic_radius REAL NOT NULL DEFAULT 0,
      bottom_elevation REAL NOT NULL DEFAULT 0,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS water_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      upstream_level REAL NOT NULL DEFAULT 0,
      downstream_level REAL NOT NULL DEFAULT 0,
      water_depth REAL NOT NULL DEFAULT 0,
      flow_rate REAL NOT NULL DEFAULT 0,
      measure_date TEXT NOT NULL DEFAULT (date('now')),
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES cross_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS roughnesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      n_value REAL NOT NULL DEFAULT 0.035,
      type TEXT NOT NULL DEFAULT 'mixed',
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES cross_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS obstacles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'other',
      position_m REAL NOT NULL DEFAULT 0,
      height_m REAL NOT NULL DEFAULT 0,
      width_m REAL NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES cross_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS flow_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      segment_index INTEGER NOT NULL DEFAULT 0,
      start_m REAL NOT NULL DEFAULT 0,
      end_m REAL NOT NULL DEFAULT 0,
      velocity_ms REAL NOT NULL DEFAULT 0,
      depth_m REAL NOT NULL DEFAULT 0,
      suitability TEXT NOT NULL DEFAULT 'safe',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES cross_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS unsuitable_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      section_id INTEGER NOT NULL,
      zone_type TEXT NOT NULL,
      start_m REAL NOT NULL DEFAULT 0,
      end_m REAL NOT NULL DEFAULT 0,
      max_velocity REAL NOT NULL DEFAULT 0,
      min_depth REAL NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES cross_sections(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS anomaly_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      version_id INTEGER NOT NULL,
      section_id INTEGER,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      field TEXT,
      value TEXT,
      message TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES versions(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES cross_sections(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
    CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
    CREATE INDEX IF NOT EXISTS idx_versions_project ON versions(project_id);
    CREATE INDEX IF NOT EXISTS idx_sections_project ON cross_sections(project_id);
    CREATE INDEX IF NOT EXISTS idx_sections_version ON cross_sections(version_id);
    CREATE INDEX IF NOT EXISTS idx_segments_section ON flow_segments(section_id);
    CREATE INDEX IF NOT EXISTS idx_zones_section ON unsuitable_zones(section_id);
    CREATE INDEX IF NOT EXISTS idx_anomalies_project ON anomaly_records(project_id);
  `);
}
