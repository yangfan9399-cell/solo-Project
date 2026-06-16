import { getDb } from './db';
import type { Player, Level, PuzzlePiece, Crack, GameSession, Operation, ScoreRecord, RepairReport } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============= Player Repositories =============

export function getPlayer(id: string): Player | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, name, avatar, total_score as totalScore, levels_completed as levelsCompleted,
           total_pieces_placed as totalPiecesPlaced, perfect_repairs as perfectRepairs,
           created_at as createdAt, updated_at as updatedAt
    FROM players WHERE id = ?
  `).get(id) as any;
  return row || null;
}

export function createPlayer(name: string, avatar?: string): Player {
  const db = getDb();
  const now = Date.now();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO players (id, name, avatar, total_score, levels_completed, total_pieces_placed, perfect_repairs, created_at, updated_at)
    VALUES (?, ?, ?, 0, 0, 0, 0, ?, ?)
  `).run(id, name, avatar || null, now, now);
  return getPlayer(id)!;
}

export function updatePlayerStats(playerId: string, scoreDelta: number, completed: boolean, piecesDelta: number, perfect: boolean): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    UPDATE players 
    SET total_score = total_score + ?,
        levels_completed = levels_completed + ?,
        total_pieces_placed = total_pieces_placed + ?,
        perfect_repairs = perfect_repairs + ?,
        updated_at = ?
    WHERE id = ?
  `).run(scoreDelta, completed ? 1 : 0, piecesDelta, perfect ? 1 : 0, now, playerId);
}

export function listPlayers(): Player[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, avatar, total_score as totalScore, levels_completed as levelsCompleted,
           total_pieces_placed as totalPiecesPlaced, perfect_repairs as perfectRepairs,
           created_at as createdAt, updated_at as updatedAt
    FROM players ORDER BY total_score DESC, levels_completed DESC
  `).all() as Player[];
}

// ============= Level Repositories =============

export function getLevel(id: number): Level | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, name, description, difficulty, grid_rows as gridRows, grid_cols as gridCols,
           layers, time_limit as timeLimit, base_score as baseScore, era, location, pattern_type as patternType
    FROM levels WHERE id = ?
  `).get(id) as any;
  return row || null;
}

export function listLevels(): Level[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, name, description, difficulty, grid_rows as gridRows, grid_cols as gridCols,
           layers, time_limit as timeLimit, base_score as baseScore, era, location, pattern_type as patternType
    FROM levels ORDER BY id ASC
  `).all() as Level[];
}

export function insertLevel(level: Omit<Level, 'id'> & { id?: number }): number {
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO levels (id, name, description, difficulty, grid_rows, grid_cols, layers, time_limit, base_score, era, location, pattern_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    level.id || null,
    level.name,
    level.description,
    level.difficulty,
    level.gridRows,
    level.gridCols,
    level.layers,
    level.timeLimit,
    level.baseScore,
    level.era,
    level.location,
    level.patternType
  );
  return Number(info.lastInsertRowid);
}

export function getLevelPieces(levelId: number): PuzzlePiece[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, level_id as levelId, row, col, layer, group_id as groupId,
           pattern_data as patternData, base_rotation as baseRotation
    FROM puzzle_pieces WHERE level_id = ? ORDER BY layer, row, col
  `).all(levelId) as PuzzlePiece[];
}

export function getLevelCracks(levelId: number): Crack[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, level_id as levelId, piece_id_a as pieceIdA, piece_id_b as pieceIdB,
           points, severity, type
    FROM cracks WHERE level_id = ?
  `).all(levelId) as Crack[];
}

export function insertPiece(piece: PuzzlePiece): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO puzzle_pieces (id, level_id, row, col, layer, group_id, pattern_data, base_rotation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(piece.id, piece.levelId, piece.row, piece.col, piece.layer, piece.groupId, piece.patternData, piece.baseRotation);
}

export function insertCrack(crack: Crack): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO cracks (id, level_id, piece_id_a, piece_id_b, points, severity, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(crack.id, crack.levelId, crack.pieceIdA, crack.pieceIdB, crack.points, crack.severity, crack.type);
}

// ============= Game Session Repositories =============

export function createSession(playerId: string, levelId: number): GameSession {
  const db = getDb();
  const now = Date.now();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO game_sessions (id, player_id, level_id, status, start_time, current_score, stability, pieces_placed, hints_used, undos_used)
    VALUES (?, ?, ?, 'in_progress', ?, 0, 0, 0, 0, 0)
  `).run(id, playerId, levelId, now);
  return getSession(id)!;
}

export function getSession(id: string): GameSession | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, player_id as playerId, level_id as levelId, status, start_time as startTime,
           end_time as endTime, current_score as currentScore, stability, pieces_placed as piecesPlaced,
           hints_used as hintsUsed, undos_used as undosUsed
    FROM game_sessions WHERE id = ?
  `).get(id) as any;
  return row || null;
}

export function updateSessionProgress(sessionId: string, score: number, stability: number, piecesPlaced: number, hintsUsed: number, undosUsed: number): void {
  const db = getDb();
  db.prepare(`
    UPDATE game_sessions SET current_score = ?, stability = ?, pieces_placed = ?, hints_used = ?, undos_used = ? WHERE id = ?
  `).run(score, stability, piecesPlaced, hintsUsed, undosUsed, sessionId);
}

export function completeSession(sessionId: string, status: 'completed' | 'failed' | 'abandoned'): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    UPDATE game_sessions SET status = ?, end_time = ? WHERE id = ?
  `).run(status, now, sessionId);
}

export function listPlayerSessions(playerId: string): GameSession[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, player_id as playerId, level_id as levelId, status, start_time as startTime,
           end_time as endTime, current_score as currentScore, stability, pieces_placed as piecesPlaced,
           hints_used as hintsUsed, undos_used as undosUsed
    FROM game_sessions WHERE player_id = ? ORDER BY start_time DESC LIMIT 50
  `).all(playerId) as GameSession[];
}

export function getPlayerActiveSession(playerId: string, levelId: number): GameSession | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, player_id as playerId, level_id as levelId, status, start_time as startTime,
           end_time as endTime, current_score as currentScore, stability, pieces_placed as piecesPlaced,
           hints_used as hintsUsed, undos_used as undosUsed
    FROM game_sessions WHERE player_id = ? AND level_id = ? AND status = 'in_progress'
    ORDER BY start_time DESC LIMIT 1
  `).get(playerId, levelId) as any;
  return row || null;
}

// ============= Operation (History) Repositories =============

export function recordOperation(op: Omit<Operation, 'id'>): Operation {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO operations (id, session_id, type, piece_id, before_state, after_state, timestamp, sequence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, op.sessionId, op.type, op.pieceId, op.beforeState, op.afterState, op.timestamp, op.sequence);
  return { ...op, id };
}

export function getSessionOperations(sessionId: string): Operation[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, session_id as sessionId, type, piece_id as pieceId, before_state as beforeState,
           after_state as afterState, timestamp, sequence
    FROM operations WHERE session_id = ? ORDER BY sequence ASC
  `).all(sessionId) as Operation[];
}

export function getLastOperation(sessionId: string): Operation | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, session_id as sessionId, type, piece_id as pieceId, before_state as beforeState,
           after_state as afterState, timestamp, sequence
    FROM operations WHERE session_id = ? ORDER BY sequence DESC LIMIT 1
  `).get(sessionId) as any;
  return row || null;
}

export function getNextSequence(sessionId: string): number {
  const db = getDb();
  const result = db.prepare(`SELECT COALESCE(MAX(sequence), -1) as maxSeq FROM operations WHERE session_id = ?`).get(sessionId) as any;
  return (result?.maxSeq ?? -1) + 1;
}

// ============= Score Record Repositories =============

export function insertScoreRecord(record: Omit<ScoreRecord, 'id'>): ScoreRecord {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO score_records (id, session_id, player_id, level_id, final_score, accuracy_bonus, speed_bonus, stability_bonus, layer_bonus, deduction, rank, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, record.sessionId, record.playerId, record.levelId, record.finalScore, record.accuracyBonus, record.speedBonus, record.stabilityBonus, record.layerBonus, record.deduction, record.rank, record.createdAt);
  return { ...record, id };
}

export function getScoreBySession(sessionId: string): ScoreRecord | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, session_id as sessionId, player_id as playerId, level_id as levelId, final_score as finalScore,
           accuracy_bonus as accuracyBonus, speed_bonus as speedBonus, stability_bonus as stabilityBonus,
           layer_bonus as layerBonus, deduction, rank, created_at as createdAt
    FROM score_records WHERE session_id = ?
  `).get(sessionId) as any;
  return row || null;
}

export function getLevelBestScore(levelId: number, playerId?: string): ScoreRecord | null {
  const db = getDb();
  const row = (playerId
    ? db.prepare(`
        SELECT id, session_id as sessionId, player_id as playerId, level_id as levelId, final_score as finalScore,
               accuracy_bonus as accuracyBonus, speed_bonus as speedBonus, stability_bonus as stabilityBonus,
               layer_bonus as layerBonus, deduction, rank, created_at as createdAt
        FROM score_records WHERE level_id = ? AND player_id = ? ORDER BY final_score DESC LIMIT 1
      `).get(levelId, playerId)
    : db.prepare(`
        SELECT id, session_id as sessionId, player_id as playerId, level_id as levelId, final_score as finalScore,
               accuracy_bonus as accuracyBonus, speed_bonus as speedBonus, stability_bonus as stabilityBonus,
               layer_bonus as layerBonus, deduction, rank, created_at as createdAt
        FROM score_records WHERE level_id = ? ORDER BY final_score DESC LIMIT 1
      `).get(levelId)) as any;
  return row || null;
}

export function listPlayerScores(playerId: string): ScoreRecord[] {
  const db = getDb();
  return db.prepare(`
    SELECT id, session_id as sessionId, player_id as playerId, level_id as levelId, final_score as finalScore,
           accuracy_bonus as accuracyBonus, speed_bonus as speedBonus, stability_bonus as stabilityBonus,
           layer_bonus as layerBonus, deduction, rank, created_at as createdAt
    FROM score_records WHERE player_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(playerId) as ScoreRecord[];
}

// ============= Repair Report Repositories =============

export function insertRepairReport(report: Omit<RepairReport, 'id'>): RepairReport {
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO repair_reports (id, session_id, player_id, level_id, overall_condition, cracks_repaired, cracks_remaining,
                                piece_integrity, alignment_accuracy, stability_index, historical_value, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, report.sessionId, report.playerId, report.levelId, report.overallCondition, report.cracksRepaired, report.cracksRemaining,
         report.pieceIntegrity, report.alignmentAccuracy, report.stabilityIndex, report.historicalValue, report.comment, report.createdAt);
  return { ...report, id };
}

export function getReportBySession(sessionId: string): RepairReport | null {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, session_id as sessionId, player_id as playerId, level_id as levelId,
           overall_condition as overallCondition, cracks_repaired as cracksRepaired, cracks_remaining as cracksRemaining,
           piece_integrity as pieceIntegrity, alignment_accuracy as alignmentAccuracy, stability_index as stabilityIndex,
           historical_value as historicalValue, comment, created_at as createdAt
    FROM repair_reports WHERE session_id = ?
  `).get(sessionId) as any;
  return row || null;
}

// ============= App State =============

export function getAppState(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(key) as any;
  return row?.value ?? null;
}

export function setAppState(key: string, value: string): void {
  const db = getDb();
  const now = Date.now();
  db.prepare(`
    INSERT INTO app_state (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}
