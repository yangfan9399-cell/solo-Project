import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dbDir, 'game.db');

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;

async function initSql(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

async function ensureDbDir(): Promise<void> {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (!db) {
    const sql = await initSql();
    await ensureDbDir();
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new sql.Database(buffer);
    } else {
      db = new sql.Database();
    }
  }
  return db;
}

export function saveDb(): void {
  if (db) {
    const data = db.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

function stmtGet<T = any>(stmt: any, params: any[] = []): T | undefined {
  stmt.bind(params);
  if (stmt.step()) {
    const result = stmt.getAsObject() as T;
    stmt.free();
    return result;
  }
  stmt.free();
  return undefined;
}

function stmtAll<T = any>(stmt: any, params: any[] = []): T[] {
  const results: T[] = [];
  stmt.bind(params);
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

function stmtRun(stmt: any, params: any[] = []): { changes: number; lastInsertRowid: number } {
  stmt.bind(params);
  stmt.step();
  stmt.free();
  return { changes: 0, lastInsertRowid: 0 };
}

export interface Player {
  id: string;
  name: string;
  created_at: string;
  total_score: number;
  levels_completed: number;
}

export interface Level {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  target_text: string;
  scene_description: string;
  duration: number;
  target_timing_start: number;
  target_timing_end: number;
  target_font_style: string;
  target_font_size: number;
  min_score: number;
}

export interface Session {
  id: string;
  player_id: string;
  level_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  final_score: number | null;
}

export interface ActionRecord {
  id: number;
  session_id: string;
  action_type: string;
  action_data: string | null;
  timestamp: string;
}

export interface Work {
  id: string;
  player_id: string;
  level_id: string;
  session_id: string;
  subtitle_text: string;
  font_style: string;
  font_size: number;
  timing_start: number;
  timing_end: number;
  score: number;
  created_at: string;
}

export async function getPlayer(playerId: string): Promise<Player | undefined> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM players WHERE id = ?');
  return stmtGet<Player>(stmt, [playerId]);
}

export async function createPlayer(playerId: string, name: string): Promise<Player> {
  const db = await getDb();
  const stmt = db.prepare('INSERT INTO players (id, name) VALUES (?, ?)');
  stmtRun(stmt, [playerId, name]);
  saveDb();
  return (await getPlayer(playerId))!;
}

export async function updatePlayerScore(playerId: string, scoreToAdd: number): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    'UPDATE players SET total_score = total_score + ?, levels_completed = levels_completed + 1 WHERE id = ?'
  );
  stmtRun(stmt, [scoreToAdd, playerId]);
  saveDb();
}

export async function getAllLevels(): Promise<Level[]> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM levels ORDER BY difficulty, id');
  return stmtAll<Level>(stmt);
}

export async function getLevel(levelId: string): Promise<Level | undefined> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM levels WHERE id = ?');
  return stmtGet<Level>(stmt, [levelId]);
}

export async function createSession(
  sessionId: string,
  playerId: string,
  levelId: string
): Promise<Session> {
  const db = await getDb();
  const stmt = db.prepare(
    'INSERT INTO sessions (id, player_id, level_id) VALUES (?, ?, ?)'
  );
  stmtRun(stmt, [sessionId, playerId, levelId]);
  saveDb();
  return (await getSession(sessionId))!;
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmtGet<Session>(stmt, [sessionId]);
}

export async function getPlayerSessions(playerId: string): Promise<Session[]> {
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT * FROM sessions WHERE player_id = ? ORDER BY started_at DESC'
  );
  return stmtAll<Session>(stmt, [playerId]);
}

export async function completeSession(
  sessionId: string,
  score: number
): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    "UPDATE sessions SET status = 'completed', final_score = ?, ended_at = datetime('now') WHERE id = ?"
  );
  stmtRun(stmt, [score, sessionId]);
  saveDb();
}

export async function failSession(sessionId: string): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    "UPDATE sessions SET status = 'failed', ended_at = datetime('now') WHERE id = ?"
  );
  stmtRun(stmt, [sessionId]);
  saveDb();
}

export async function addAction(
  sessionId: string,
  actionType: string,
  actionData?: unknown
): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    'INSERT INTO action_history (session_id, action_type, action_data) VALUES (?, ?, ?)'
  );
  stmtRun(stmt, [
    sessionId,
    actionType,
    actionData ? JSON.stringify(actionData) : null
  ]);
  saveDb();
}

export async function getActionHistory(sessionId: string): Promise<ActionRecord[]> {
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT * FROM action_history WHERE session_id = ? ORDER BY id ASC'
  );
  return stmtAll<ActionRecord>(stmt, [sessionId]);
}

export async function createWork(work: Omit<Work, 'id' | 'created_at'>): Promise<Work> {
  const id = `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const db = await getDb();
  const stmt = db.prepare(
    `INSERT INTO works 
     (id, player_id, level_id, session_id, subtitle_text, font_style, font_size, timing_start, timing_end, score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmtRun(stmt, [
    id,
    work.player_id,
    work.level_id,
    work.session_id,
    work.subtitle_text,
    work.font_style,
    work.font_size,
    work.timing_start,
    work.timing_end,
    work.score
  ]);
  saveDb();
  return (await getWork(id))!;
}

export async function getWork(workId: string): Promise<Work | undefined> {
  const db = await getDb();
  const stmt = db.prepare('SELECT * FROM works WHERE id = ?');
  return stmtGet<Work>(stmt, [workId]);
}

export async function getPlayerWorks(playerId: string): Promise<Work[]> {
  const db = await getDb();
  const stmt = db.prepare(
    'SELECT * FROM works WHERE player_id = ? ORDER BY created_at DESC'
  );
  return stmtAll<Work>(stmt, [playerId]);
}

export async function getLevelBestScore(
  playerId: string,
  levelId: string
): Promise<number | null> {
  const db = await getDb();
  const stmt = db.prepare(
    "SELECT MAX(final_score) as best FROM sessions WHERE player_id = ? AND level_id = ? AND status = 'completed'"
  );
  const result = stmtGet<{ best: number | null }>(stmt, [playerId, levelId]);
  return result?.best ?? null;
}
