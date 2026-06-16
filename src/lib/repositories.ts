import { getDb, runQuery, getQuery, allQuery } from './db';
import type { Player, Level, GameSession, Operation } from '../types/game';

export async function getAllPlayers(): Promise<Player[]> {
  const db = await getDb();
  return allQuery<Player>(db, 'SELECT * FROM players ORDER BY total_score DESC');
}

export async function getPlayerById(id: number): Promise<Player | null> {
  const db = await getDb();
  return getQuery<Player>(db, 'SELECT * FROM players WHERE id = ?', [id]);
}

export async function getPlayerByName(name: string): Promise<Player | null> {
  const db = await getDb();
  return getQuery<Player>(db, 'SELECT * FROM players WHERE name = ?', [name]);
}

export async function createPlayer(name: string, avatar: string = '👨‍🚀'): Promise<Player> {
  const db = await getDb();
  const result = runQuery(db, 'INSERT INTO players (name, avatar) VALUES (?, ?)', [name, avatar]);
  return (await getPlayerById(result.lastInsertRowid)) as Player;
}

export async function updatePlayerStats(playerId: number, scoreDelta: number, won: boolean): Promise<void> {
  const db = await getDb();
  runQuery(db, `
    UPDATE players
    SET total_score = total_score + ?,
        games_played = games_played + 1,
        games_won = games_won + ?,
        updated_at = datetime('now')
    WHERE id = ?
  `, [scoreDelta, won ? 1 : 0, playerId]);
}

export async function getAllLevels(): Promise<Level[]> {
  const db = await getDb();
  return allQuery<Level>(db, 'SELECT * FROM levels ORDER BY difficulty ASC, id ASC');
}

export async function getLevelById(id: number): Promise<Level | null> {
  const db = await getDb();
  return getQuery<Level>(db, 'SELECT * FROM levels WHERE id = ?', [id]);
}

export async function createSession(playerId: number, levelId: number): Promise<GameSession> {
  const db = await getDb();
  const level = await getLevelById(levelId);
  if (!level) throw new Error(`Level ${levelId} not found`);

  const defaultLeft = [5, 3];
  const defaultRight = [4, 2];

  const result = runQuery(db, `
    INSERT INTO game_sessions (player_id, level_id, status, current_floor, target_floor, energy, max_energy, balance, balance_threshold, left_weights, right_weights)
    VALUES (?, ?, 'playing', 0, ?, ?, ?, 0, ?, ?, ?)
  `, [
    playerId,
    levelId,
    level.target_floor,
    level.initial_energy,
    level.max_energy,
    level.balance_threshold,
    JSON.stringify(defaultLeft),
    JSON.stringify(defaultRight),
  ]);

  return (await getSessionById(result.lastInsertRowid)) as GameSession;
}

function parseWeights(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw as number[];
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function hydrateSession(raw: Record<string, unknown>): GameSession {
  const s = { ...raw } as unknown as Record<string, unknown>;
  s.leftWeights = parseWeights(raw.left_weights);
  s.rightWeights = parseWeights(raw.right_weights);
  delete s.left_weights;
  delete s.right_weights;
  return s as unknown as GameSession;
}

export async function getSessionById(id: number): Promise<GameSession | null> {
  const db = await getDb();
  const raw = getQuery<Record<string, unknown>>(db, 'SELECT * FROM game_sessions WHERE id = ?', [id]);
  if (!raw) return null;
  return hydrateSession(raw);
}

export async function getSessionsByPlayer(playerId: number, limit: number = 20): Promise<GameSession[]> {
  const db = await getDb();
  const rows = allQuery<Record<string, unknown>>(db, `
    SELECT * FROM game_sessions
    WHERE player_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [playerId, limit]);
  return rows.map(hydrateSession);
}

export async function getActiveSessionByPlayer(playerId: number): Promise<GameSession | null> {
  const db = await getDb();
  const raw = getQuery<Record<string, unknown>>(db, `
    SELECT * FROM game_sessions
    WHERE player_id = ? AND status = 'playing'
    ORDER BY created_at DESC
    LIMIT 1
  `, [playerId]);
  if (!raw) return null;
  return hydrateSession(raw);
}

export async function updateSession(
  id: number,
  updates: Partial<Pick<GameSession, 'status' | 'score' | 'current_floor' | 'energy' | 'balance'>>
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  values.push(id);
  runQuery(db, `
    UPDATE game_sessions
    SET ${fields}, updated_at = datetime('now')
    WHERE id = ?
  `, values);
}

export async function finishSession(
  id: number,
  status: 'won' | 'lost' | 'abandoned',
  score: number
): Promise<void> {
  const db = await getDb();
  runQuery(db, `
    UPDATE game_sessions
    SET status = ?, score = ?, end_time = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `, [status, score, id]);
}

export async function getOperationsBySession(sessionId: number): Promise<Operation[]> {
  const db = await getDb();
  type Row = Operation & {
    payload: string | null;
    left_weights_before?: unknown;
    left_weights_after?: unknown;
    right_weights_before?: unknown;
    right_weights_after?: unknown;
  };
  const rows = allQuery<Row>(db, `
    SELECT * FROM operations
    WHERE session_id = ?
    ORDER BY sequence ASC
  `, [sessionId]);

  return rows.map((row) => {
    const r = { ...row } as unknown as Record<string, unknown>;
    if (row.payload && typeof row.payload === 'string') {
      try {
        r.payload = JSON.parse(row.payload);
      } catch {
        r.payload = {};
      }
    }
    r.leftWeightsBefore = parseWeights(row.left_weights_before);
    r.leftWeightsAfter = parseWeights(row.left_weights_after);
    r.rightWeightsBefore = parseWeights(row.right_weights_before);
    r.rightWeightsAfter = parseWeights(row.right_weights_after);
    delete r.left_weights_before;
    delete r.left_weights_after;
    delete r.right_weights_before;
    delete r.right_weights_after;
    return r as unknown as Operation;
  });
}

export async function getOperationCount(sessionId: number): Promise<number> {
  const db = await getDb();
  const result = getQuery<{ cnt: number }>(db, 'SELECT COUNT(*) as cnt FROM operations WHERE session_id = ?', [sessionId]);
  return result?.cnt ?? 0;
}

export async function addOperation(
  op: Omit<Operation, 'id' | 'timestamp'> & {
    leftWeightsBefore?: number[];
    leftWeightsAfter?: number[];
    rightWeightsBefore?: number[];
    rightWeightsAfter?: number[];
  }
): Promise<Operation> {
  const db = await getDb();
  const payloadStr = op.payload ? JSON.stringify(op.payload) : null;
  const result = runQuery(db, `
    INSERT INTO operations (
      session_id, type, payload, floor_before, floor_after,
      balance_before, balance_after, energy_before, energy_after, sequence,
      left_weights_before, left_weights_after, right_weights_before, right_weights_after
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    op.session_id,
    op.type,
    payloadStr,
    op.floor_before,
    op.floor_after,
    op.balance_before,
    op.balance_after,
    op.energy_before,
    op.energy_after,
    op.sequence,
    op.leftWeightsBefore ? JSON.stringify(op.leftWeightsBefore) : null,
    op.leftWeightsAfter ? JSON.stringify(op.leftWeightsAfter) : null,
    op.rightWeightsBefore ? JSON.stringify(op.rightWeightsBefore) : null,
    op.rightWeightsAfter ? JSON.stringify(op.rightWeightsAfter) : null,
  ]);

  const db2 = await getDb();
  const inserted = getQuery<Operation & { payload: string | null }>(db2, 'SELECT * FROM operations WHERE id = ?', [result.lastInsertRowid]);
  if (inserted) {
    if (inserted.payload && typeof inserted.payload === 'string') {
      try {
        (inserted as unknown as Record<string, unknown>).payload = JSON.parse(inserted.payload);
      } catch {
        (inserted as unknown as Record<string, unknown>).payload = {};
      }
    }
  }
  return inserted as Operation;
}

export async function deleteLastOperation(sessionId: number): Promise<Operation | null> {
  const db = await getDb();
  const lastOp = getQuery<Operation & { payload: string | null }>(db, `
    SELECT * FROM operations
    WHERE session_id = ?
    ORDER BY sequence DESC
    LIMIT 1
  `, [sessionId]);
  if (!lastOp) return null;
  runQuery(db, 'DELETE FROM operations WHERE id = ?', [lastOp.id]);
  return lastOp as Operation;
}

export async function getLeaderboard(levelId?: number, limit: number = 10): Promise<Array<{
  rank: number;
  player_name: string;
  player_id: number;
  score: number;
  level_id: number;
  level_name: string;
  time_played: number;
  created_at: string;
}>> {
  const db = await getDb();
  const baseQuery = `
    SELECT
      p.name as player_name,
      p.id as player_id,
      gs.score,
      gs.level_id,
      l.name as level_name,
      COALESCE(
        (julianday(COALESCE(gs.end_time, datetime('now'))) - julianday(gs.start_time)) * 86400,
        0
      ) as time_played,
      gs.created_at
    FROM game_sessions gs
    JOIN players p ON gs.player_id = p.id
    JOIN levels l ON gs.level_id = l.id
    WHERE gs.status = 'won'
  `;
  const query = levelId
    ? `${baseQuery} AND gs.level_id = ? ORDER BY gs.score DESC LIMIT ?`
    : `${baseQuery} ORDER BY gs.score DESC LIMIT ?`;

  const rows = levelId
    ? allQuery<Record<string, unknown>>(db, query, [levelId, limit])
    : allQuery<Record<string, unknown>>(db, query, [limit]);

  return rows.map((row, idx) => ({
    rank: idx + 1,
    player_name: row.player_name as string,
    player_id: row.player_id as number,
    score: row.score as number,
    level_id: row.level_id as number,
    level_name: row.level_name as string,
    time_played: Math.round(row.time_played as number),
    created_at: row.created_at as string,
  }));
}
