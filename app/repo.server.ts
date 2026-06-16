import { readDB, writeDB } from "./db.server";
import type {
  ExhibitDef,
  GameSession,
  LevelConfig,
  LightSource,
  Operation,
  OperationType,
  PlacedExhibit,
  Player,
  SessionStatus,
} from "./types";
import { v4 as uuid } from "uuid";

export function createPlayer(name: string): Player {
  const now = Date.now();
  const id = uuid();
  const db = readDB();
  const player: Player = { id, name, createdAt: now, lastPlayedAt: now };
  db.players.push(player);
  writeDB(db);
  return player;
}

export function getPlayer(id: string): Player | null {
  const db = readDB();
  return db.players.find((p) => p.id === id) ?? null;
}

export function getAllPlayers(): Player[] {
  const db = readDB();
  return [...db.players].sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
}

export function updatePlayerLastPlayed(id: string): void {
  const db = readDB();
  const p = db.players.find((p) => p.id === id);
  if (p) {
    p.lastPlayedAt = Date.now();
    writeDB(db);
  }
}

export function getAllLevels(): LevelConfig[] {
  const db = readDB();
  return [...db.levels]
    .sort((a, b) => a.created_at - b.created_at)
    .map((row) =>
      typeof row.config_json === "string"
        ? (JSON.parse(row.config_json) as LevelConfig)
        : (row.config_json as LevelConfig)
    );
}

export function getLevel(id: string): LevelConfig | null {
  const db = readDB();
  const row = db.levels.find((l) => l.id === id);
  if (!row) return null;
  return typeof row.config_json === "string"
    ? (JSON.parse(row.config_json) as LevelConfig)
    : (row.config_json as LevelConfig);
}

export function insertLevel(config: LevelConfig): void {
  const db = readDB();
  const idx = db.levels.findIndex((l) => l.id === config.id);
  const record = {
    id: config.id,
    name: config.name,
    description: config.description,
    config_json: config,
    created_at: Date.now(),
  };
  if (idx >= 0) {
    db.levels[idx] = record;
  } else {
    db.levels.push(record);
  }
  writeDB(db);
}

export function getAllExhibitDefs(): Record<string, ExhibitDef> {
  const db = readDB();
  const result: Record<string, ExhibitDef> = {};
  for (const row of db.exhibits) {
    const def = typeof row.def_json === "string" ? JSON.parse(row.def_json) : row.def_json;
    result[def.id] = def as ExhibitDef;
  }
  return result;
}

export function insertExhibitDef(def: ExhibitDef): void {
  const db = readDB();
  const idx = db.exhibits.findIndex((e) => e.id === def.id);
  const record = { id: def.id, name: def.name, def_json: def };
  if (idx >= 0) {
    db.exhibits[idx] = record;
  } else {
    db.exhibits.push(record);
  }
  writeDB(db);
}

function rowToSession(row: any): GameSession {
  return {
    id: row.id,
    playerId: row.player_id,
    levelId: row.level_id,
    status: row.status as SessionStatus,
    score: row.score,
    exhibits: (typeof row.exhibits_json === "string"
      ? JSON.parse(row.exhibits_json)
      : row.exhibits_json) as PlacedExhibit[],
    lights: (typeof row.lights_json === "string"
      ? JSON.parse(row.lights_json)
      : row.lights_json) as LightSource[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export function createSession(playerId: string, levelId: string): GameSession {
  const now = Date.now();
  const id = uuid();
  const db = readDB();
  const session = {
    id,
    player_id: playerId,
    level_id: levelId,
    status: "in_progress" as SessionStatus,
    score: 0,
    exhibits_json: [],
    lights_json: [],
    created_at: now,
    updated_at: now,
    completed_at: null,
  };
  db.sessions.push(session);
  writeDB(db);
  updatePlayerLastPlayed(playerId);
  return rowToSession(session);
}

export function getSession(id: string): GameSession | null {
  const db = readDB();
  const row = db.sessions.find((s) => s.id === id);
  if (!row) return null;
  return rowToSession(row);
}

export function getPlayerSessions(playerId: string): GameSession[] {
  const db = readDB();
  return db.sessions
    .filter((s) => s.player_id === playerId)
    .sort((a, b) => b.updated_at - a.updated_at)
    .map(rowToSession);
}

export function updateSessionState(
  id: string,
  exhibits: PlacedExhibit[],
  lights: LightSource[]
): void {
  const db = readDB();
  const s = db.sessions.find((s) => s.id === id);
  if (s) {
    s.exhibits_json = exhibits;
    s.lights_json = lights;
    s.updated_at = Date.now();
    writeDB(db);
  }
}

export function updateSessionScore(id: string, score: number): void {
  const db = readDB();
  const s = db.sessions.find((s) => s.id === id);
  if (s) {
    s.score = score;
    s.updated_at = Date.now();
    writeDB(db);
  }
}

export function completeSession(
  id: string,
  status: "completed" | "failed",
  score: number
): void {
  const now = Date.now();
  const db = readDB();
  const s = db.sessions.find((s) => s.id === id);
  if (s) {
    s.status = status;
    s.score = score;
    s.completed_at = now;
    s.updated_at = now;
    writeDB(db);
  }
}

export function deleteSession(id: string): void {
  const db = readDB();
  db.operations = db.operations.filter((o) => o.session_id !== id);
  db.sessions = db.sessions.filter((s) => s.id !== id);
  writeDB(db);
}

export function addOperation(
  sessionId: string,
  type: OperationType,
  data: Record<string, unknown>
): Operation {
  const id = uuid();
  const now = Date.now();
  const db = readDB();
  const op = {
    id,
    session_id: sessionId,
    op_type: type,
    data_json: data,
    timestamp: now,
  };
  db.operations.push(op);
  writeDB(db);
  return { id, sessionId, type, data, timestamp: now };
}

export function getSessionOperations(sessionId: string): Operation[] {
  const db = readDB();
  return db.operations
    .filter((o) => o.session_id === sessionId)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      type: row.op_type as OperationType,
      data: typeof row.data_json === "string" ? JSON.parse(row.data_json) : row.data_json,
      timestamp: row.timestamp,
    }));
}

export function getTopScores(
  levelId: string,
  limit = 10
): { player: Player; session: GameSession }[] {
  const db = readDB();
  const playerMap = new Map<string, any>();
  for (const p of db.players) {
    playerMap.set(p.id, p);
  }
  return db.sessions
    .filter((s) => s.level_id === levelId && s.status === "completed")
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => ({
      player: {
        id: row.player_id,
        name: playerMap.get(row.player_id)?.name ?? "Unknown",
        createdAt: playerMap.get(row.player_id)?.created_at ?? 0,
        lastPlayedAt: playerMap.get(row.player_id)?.last_played_at ?? 0,
      },
      session: rowToSession(row),
    }));
}
