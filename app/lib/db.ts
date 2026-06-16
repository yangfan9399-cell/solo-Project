import initSqlJs, { type Database as SqlJsDatabase, type BindParams } from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DB_DIR, "wafer-game.db");

let _db: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
  } else {
    _db = new SQL.Database();
  }

  _db.run("PRAGMA foreign_keys = ON");
  return _db;
}

export function saveDb(db: SqlJsDatabase) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export function closeDb() {
  if (_db) {
    saveDb(_db);
    _db.close();
    _db = null;
  }
}

export function runAll(db: SqlJsDatabase, sql: string, params?: BindParams): void {
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
}

export function getAll<T = Record<string, unknown>>(db: SqlJsDatabase, sql: string, params?: BindParams): T[] {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function getOne<T = Record<string, unknown>>(db: SqlJsDatabase, sql: string, params?: BindParams): T | undefined {
  const results = getAll<T>(db, sql, params);
  return results[0];
}

export function runInsert(db: SqlJsDatabase, sql: string, params: BindParams): number {
  db.run(sql, params);
  const result = getOne<{ id: number }>(db, "SELECT last_insert_rowid() as id");
  return result?.id ?? 0;
}

export interface Player {
  id: number;
  name: string;
  created_at: string;
  total_score: number;
  levels_completed: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: number;
  wafer_image_config: string;
  defect_types: string;
  target_precision: number;
  target_recall: number;
  time_limit_seconds: number;
  order_index: number;
}

export interface WaferImage {
  id: number;
  level_id: number;
  image_data: string;
  defects_json: string;
  width: number;
  height: number;
}

export interface GameSession {
  id: number;
  player_id: number;
  level_id: number;
  status: "in_progress" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  score: number | null;
  annotations_json: string;
  confusion_matrix_json: string | null;
  training_set_json: string | null;
  elapsed_seconds: number;
}

export interface OperationHistory {
  id: number;
  session_id: number;
  operation_type: "add" | "remove" | "modify";
  annotation_before_json: string | null;
  annotation_after_json: string;
  created_at: string;
}

export type DefectType = "scratch" | "particle" | "edge";

export interface DefectAnnotation {
  id: string;
  type: DefectType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GroundTruthDefect {
  type: DefectType;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface ConfusionMatrix {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface ScoringResult {
  base_score: number;
  precision_bonus: number;
  recall_bonus: number;
  f1_score: number;
  time_bonus: number;
  total_score: number;
  confusion_matrix: ConfusionMatrix;
}
