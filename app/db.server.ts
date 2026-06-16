import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DBData {
  players: any[];
  levels: any[];
  exhibits: any[];
  sessions: any[];
  operations: any[];
}

const defaultData: DBData = {
  players: [],
  levels: [],
  exhibits: [],
  sessions: [],
  operations: [],
};

let cachedData: DBData | null = null;
let lastRead = 0;
const CACHE_TTL = 100;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDB(): DBData {
  const now = Date.now();
  if (cachedData && now - lastRead < CACHE_TTL) {
    return cachedData;
  }
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    cachedData = JSON.parse(JSON.stringify(defaultData));
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedData, null, 2));
    lastRead = now;
    return cachedData as DBData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    cachedData = JSON.parse(raw) as DBData;
  } catch {
    cachedData = JSON.parse(JSON.stringify(defaultData));
  }
  lastRead = now;
  return cachedData as DBData;
}

export function writeDB(data: DBData): void {
  ensureDataDir();
  cachedData = data;
  lastRead = Date.now();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

export function initDB(): void {
  readDB();
}
