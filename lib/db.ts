import path from "path";
import fs from "fs";
import type { BowArchive, BowVersion, TargetPoint, Equipment, ExportSummary, AnomalyAlert } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

export interface DatabaseShape {
  archives: BowArchive[];
  versions: BowVersion[];
  points: TargetPoint[];
  equipment: Equipment[];
  exports: ExportSummary[];
  anomalies: AnomalyAlert[];
}

const defaultDb: DatabaseShape = {
  archives: [],
  versions: [],
  points: [],
  equipment: [],
  exports: [],
  anomalies: [],
};

let cachedDb: DatabaseShape | null = null;
let lastMtime = 0;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getDb(): DatabaseShape {
  if (!fs.existsSync(DB_FILE)) {
    const fresh: DatabaseShape = JSON.parse(JSON.stringify(defaultDb));
    saveDb(fresh);
    return fresh;
  }
  const stat = fs.statSync(DB_FILE);
  if (!cachedDb || stat.mtimeMs !== lastMtime) {
    try {
      cachedDb = JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as DatabaseShape;
    } catch {
      cachedDb = JSON.parse(JSON.stringify(defaultDb)) as DatabaseShape;
    }
    lastMtime = stat.mtimeMs;
  }
  return cachedDb as DatabaseShape;
}

export function saveDb(db: DatabaseShape): void {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  cachedDb = db;
  const stat = fs.statSync(DB_FILE);
  lastMtime = stat.mtimeMs;
}

export async function initSchema(): Promise<void> {
  getDb();
}
