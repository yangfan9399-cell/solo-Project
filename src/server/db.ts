import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "tea-garden-store.json");

interface StorageData {
  game_sessions: any[];
  game_actions: any[];
  tea_maturity_history: any[];
  game_results: any[];
}

let inMemoryCache: StorageData = {
  game_sessions: [],
  game_actions: [],
  tea_maturity_history: [],
  game_results: [],
};

let initialized = false;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromDisk() {
  ensureDataDir();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      inMemoryCache = {
        game_sessions: parsed.game_sessions || [],
        game_actions: parsed.game_actions || [],
        tea_maturity_history: parsed.tea_maturity_history || [],
        game_results: parsed.game_results || [],
      };
    } catch (e) {
      console.warn("Failed to load storage file, using empty store", e);
    }
  }
}

let pendingWrite: any = null;
function saveToDisk() {
  ensureDataDir();
  if (pendingWrite) return;
  pendingWrite = setTimeout(() => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryCache, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save storage:", e);
    }
    pendingWrite = null;
  }, 100);
}

export function initDatabase() {
  if (initialized) return;
  loadFromDisk();
  initialized = true;
  console.log("Local JSON storage initialized at:", DB_FILE);
}

/* ================ game_sessions ================ */

export function insertSession(session: any): void {
  initDatabase();
  const idx = inMemoryCache.game_sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    inMemoryCache.game_sessions[idx] = session;
  } else {
    inMemoryCache.game_sessions.unshift(session);
  }
  saveToDisk();
}

export function getAllSessions(): any[] {
  initDatabase();
  return inMemoryCache.game_sessions.slice().sort((a, b) => b.createdAt - a.createdAt);
}

export function getSessionById(id: string): any | undefined {
  initDatabase();
  return inMemoryCache.game_sessions.find((s) => s.id === id);
}

/* ================ game_actions ================ */

export function insertAction(action: any): void {
  initDatabase();
  inMemoryCache.game_actions.push(action);
  saveToDisk();
}

export function insertActionsBatch(actions: any[]): void {
  initDatabase();
  for (const a of actions) inMemoryCache.game_actions.push(a);
  saveToDisk();
}

export function getActionsBySession(sessionId: string): any[] {
  initDatabase();
  return inMemoryCache.game_actions.filter((a) => a.sessionId === sessionId);
}

/* ================ tea_maturity_history ================ */

export function insertMaturityHistory(records: any[]): void {
  initDatabase();
  for (const r of records) inMemoryCache.tea_maturity_history.push(r);
  saveToDisk();
}

export function getMaturityHistoryBySession(sessionId: string): any[] {
  initDatabase();
  return inMemoryCache.tea_maturity_history.filter((r) => r.sessionId === sessionId);
}

/* ================ game_results ================ */

export function insertGameResult(result: any): void {
  initDatabase();
  inMemoryCache.game_results.push(result);
  saveToDisk();
}

export function getGameResultsBySession(sessionId: string): any[] {
  initDatabase();
  return inMemoryCache.game_results.filter((r) => r.sessionId === sessionId);
}

export const DB = {
  init: initDatabase,
  close: () => {
    if (pendingWrite) {
      clearTimeout(pendingWrite);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(inMemoryCache, null, 2), "utf-8");
      } catch {}
      pendingWrite = null;
    }
  },
};
