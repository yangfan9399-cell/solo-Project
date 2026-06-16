import { getDb, runQuery, runInsert, runUpdate } from "./db";
import type {
  Player,
  Level,
  GameSession,
  Bridge,
  Operation,
  LeaderboardEntry,
  ShareableBridge,
} from "@/types/game";

function parseBridge(data: string | null): Bridge | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as Bridge;
  } catch {
    return null;
  }
}

function parseOperations(data: string | null): Operation[] {
  if (!data) return [];
  try {
    return JSON.parse(data) as Operation[];
  } catch {
    return [];
  }
}

function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    avatar: (row.avatar as string) ?? undefined,
    totalScore: row.total_score as number,
    levelsCompleted: row.levels_completed as number,
    createdAt: row.created_at as number,
  };
}

function rowToLevel(row: Record<string, unknown>): Level {
  return {
    id: row.id as number,
    name: row.name as string,
    description: row.description as string,
    span: row.span as number,
    maxPaperLength: row.max_paper_length as number,
    paperWidth: row.paper_width as number,
    paperThickness: row.paper_thickness as number,
    paperStrength: row.paper_strength as number,
    targetWeight: row.target_weight as number,
    difficulty: row.difficulty as "easy" | "medium" | "hard",
    leftAnchor: {
      x: row.left_anchor_x as number,
      y: row.left_anchor_y as number,
    },
    rightAnchor: {
      x: row.right_anchor_x as number,
      y: row.right_anchor_y as number,
    },
  };
}

function rowToSession(row: Record<string, unknown>): GameSession {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    levelId: row.level_id as number,
    status: row.status as GameSession["status"],
    bridge: parseBridge(row.bridge_data as string | null),
    maxWeightHeld: row.max_weight_held as number,
    breakPoint:
      row.break_point_x !== null && row.break_point_y !== null
        ? { x: row.break_point_x as number, y: row.break_point_y as number }
        : null,
    breakSegmentId: (row.break_segment_id as string) ?? null,
    score: row.score as number,
    startTime: row.start_time as number,
    endTime: (row.end_time as number) ?? null,
    operationHistory: parseOperations(row.operation_history as string | null),
  };
}

function rowToLeaderboardEntry(row: Record<string, unknown>): LeaderboardEntry {
  return {
    id: row.id as number,
    playerName: row.player_name as string,
    levelId: row.level_id as number,
    score: row.score as number,
    maxWeight: row.max_weight as number,
    createdAt: row.created_at as number,
  };
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  await getDb();
  const rows = runQuery("SELECT * FROM players WHERE id = ?", [playerId]);
  if (rows.length === 0) return null;
  return rowToPlayer(rows[0] as Record<string, unknown>);
}

export async function createOrUpdatePlayer(
  playerId: string,
  name: string,
  avatar?: string
): Promise<Player> {
  await getDb();
  const existing = await getPlayer(playerId);

  if (existing) {
    if (avatar) {
      runUpdate("UPDATE players SET name = ?, avatar = ? WHERE id = ?", [
        name,
        avatar,
        playerId,
      ]);
    } else {
      runUpdate("UPDATE players SET name = ? WHERE id = ?", [name, playerId]);
    }
    return getPlayer(playerId) as Promise<Player>;
  }

  runInsert(
    "INSERT INTO players (id, name, avatar, total_score, levels_completed, created_at) VALUES (?, ?, ?, 0, 0, ?)",
    [playerId, name, avatar ?? null, Date.now()]
  );

  return getPlayer(playerId) as Promise<Player>;
}

export async function updatePlayerScore(
  playerId: string,
  scoreToAdd: number,
  levelCompleted: boolean
): Promise<void> {
  await getDb();
  if (levelCompleted) {
    runUpdate(
      "UPDATE players SET total_score = total_score + ?, levels_completed = levels_completed + 1 WHERE id = ?",
      [scoreToAdd, playerId]
    );
  } else {
    runUpdate(
      "UPDATE players SET total_score = total_score + ? WHERE id = ?",
      [scoreToAdd, playerId]
    );
  }
}

export async function getAllLevels(): Promise<Level[]> {
  await getDb();
  const rows = runQuery("SELECT * FROM levels ORDER BY id ASC");
  return rows.map((row) => rowToLevel(row as Record<string, unknown>));
}

export async function getLevel(levelId: number): Promise<Level | null> {
  await getDb();
  const rows = runQuery("SELECT * FROM levels WHERE id = ?", [levelId]);
  if (rows.length === 0) return null;
  return rowToLevel(rows[0] as Record<string, unknown>);
}

export async function createGameSession(
  sessionId: string,
  playerId: string,
  levelId: number
): Promise<GameSession> {
  await getDb();
  const now = Date.now();

  runInsert(
    `INSERT INTO game_sessions
     (id, player_id, level_id, status, bridge_data, max_weight_held, score, start_time, operation_history)
     VALUES (?, ?, ?, 'designing', NULL, 0, 0, ?, '[]')`,
    [sessionId, playerId, levelId, now]
  );

  return getGameSession(sessionId) as Promise<GameSession>;
}

export async function getGameSession(
  sessionId: string
): Promise<GameSession | null> {
  await getDb();
  const rows = runQuery("SELECT * FROM game_sessions WHERE id = ?", [sessionId]);
  if (rows.length === 0) return null;
  return rowToSession(rows[0] as Record<string, unknown>);
}

export async function updateGameSessionBridge(
  sessionId: string,
  bridge: Bridge,
  operations: Operation[]
): Promise<void> {
  await getDb();
  runUpdate(
    "UPDATE game_sessions SET bridge_data = ?, operation_history = ? WHERE id = ?",
    [JSON.stringify(bridge), JSON.stringify(operations), sessionId]
  );
}

export async function finishGameSession(
  sessionId: string,
  status: "success" | "failed",
  maxWeight: number,
  breakPoint: { x: number; y: number } | null,
  breakSegmentId: string | null,
  score: number
): Promise<void> {
  await getDb();
  runUpdate(
    `UPDATE game_sessions
     SET status = ?, max_weight_held = ?, break_point_x = ?, break_point_y = ?,
         break_segment_id = ?, score = ?, end_time = ?
     WHERE id = ?`,
    [
      status,
      maxWeight,
      breakPoint?.x ?? null,
      breakPoint?.y ?? null,
      breakSegmentId,
      score,
      Date.now(),
      sessionId,
    ]
  );
}

export async function getPlayerSessions(
  playerId: string,
  limit = 20
): Promise<GameSession[]> {
  await getDb();
  const rows = runQuery(
    "SELECT * FROM game_sessions WHERE player_id = ? ORDER BY start_time DESC LIMIT ?",
    [playerId, limit]
  );
  return rows.map((row) => rowToSession(row as Record<string, unknown>));
}

export async function getLeaderboard(
  levelId: number,
  limit = 10
): Promise<LeaderboardEntry[]> {
  await getDb();
  const rows = runQuery(
    "SELECT * FROM leaderboard WHERE level_id = ? ORDER BY score DESC LIMIT ?",
    [levelId, limit]
  );
  return rows.map((row) => rowToLeaderboardEntry(row as Record<string, unknown>));
}

export async function addLeaderboardEntry(
  playerName: string,
  levelId: number,
  score: number,
  maxWeight: number
): Promise<number> {
  await getDb();
  return runInsert(
    "INSERT INTO leaderboard (player_name, level_id, score, max_weight, created_at) VALUES (?, ?, ?, ?, ?)",
    [playerName, levelId, score, maxWeight, Date.now()]
  );
}

export async function shareBridge(
  shareId: string,
  bridge: Bridge,
  levelId: number,
  maxWeight: number,
  score: number,
  playerName: string
): Promise<ShareableBridge> {
  await getDb();
  const now = Date.now();

  runInsert(
    `INSERT INTO shared_bridges (id, bridge_data, level_id, max_weight, score, player_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [shareId, JSON.stringify(bridge), levelId, maxWeight, score, playerName, now]
  );

  return {
    id: shareId,
    bridge,
    levelId,
    maxWeight,
    score,
    playerName,
    createdAt: now,
  };
}

export async function getSharedBridge(
  shareId: string
): Promise<ShareableBridge | null> {
  await getDb();
  const rows = runQuery("SELECT * FROM shared_bridges WHERE id = ?", [shareId]);
  if (rows.length === 0) return null;

  const row = rows[0] as Record<string, unknown>;
  return {
    id: row.id as string,
    bridge: JSON.parse(row.bridge_data as string) as Bridge,
    levelId: row.level_id as number,
    maxWeight: row.max_weight as number,
    score: row.score as number,
    playerName: row.player_name as string,
    createdAt: row.created_at as number,
  };
}
