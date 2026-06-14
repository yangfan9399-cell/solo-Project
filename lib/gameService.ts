import { v4 as uuidv4 } from 'uuid';
import { getDb } from './db';
import {
  generateOriginalWaveform,
  applyDefects,
  applyCleaning,
  applySplice,
  applySpeedCorrection,
  applyNoiseReduction,
  analyzeWaveforms,
  calculateMetrics,
  CLEANING_COSTS,
} from './waveform';
import type {
  GameSession,
  TapeDetail,
  RepairHistory,
  ResultRecord,
  RepairActionType,
  CleaningMethod,
  SeedType,
} from './types';
import type { SessionSeed, TapeSeedConfig } from './seeds';

function now(): number {
  return Date.now();
}

export function createSessionFromSeed(seed: SessionSeed): GameSession {
  const db = getDb();
  const sessionId = uuidv4();
  const session: GameSession = {
    id: sessionId,
    label: seed.label,
    batchDescription: seed.description,
    tapeCount: seed.tapes.length,
    status: 'active',
    startedAt: now(),
    completedAt: null,
    totalIntelligibility: 0,
    totalFidelity: 0,
    totalMaterialCost: 0,
    totalRepairTimeMs: 0,
    finalScore: 0,
    grade: '',
  };

  const insertSession = db.prepare(
    `INSERT INTO game_sessions (id, label, batch_description, tape_count, status, started_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  insertSession.run(
    session.id,
    session.label,
    session.batchDescription,
    session.tapeCount,
    session.status,
    session.startedAt
  );

  for (const tapeSeed of seed.tapes) {
    createTapeDetail(sessionId, tapeSeed);
  }

  addHistory(sessionId, null, 'register_tape', {
    seedId: seed.id,
    seedType: seed.seedType,
    tapeCount: seed.tapes.length,
  });

  return session;
}

function createTapeDetail(sessionId: string, tapeSeed: TapeSeedConfig): TapeDetail {
  const db = getDb();
  const tapeId = uuidv4();
  const originalWaveform = generateOriginalWaveform(tapeSeed.seed);
  const { waveform, breakpoints, speedDrift, noiseLevel } = applyDefects(
    originalWaveform,
    tapeSeed.defects,
    tapeSeed.seed
  );

  const detail: TapeDetail = {
    id: tapeId,
    sessionId,
    tapeIndex: tapeSeed.index,
    label: tapeSeed.label,
    defects: tapeSeed.defects,
    originalWaveform,
    currentWaveform: waveform,
    breakpoints,
    speedDrift,
    noiseLevel,
    appliedSpeed: 1,
    noiseReductionLevel: 0,
    splices: [],
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  };

  const insert = db.prepare(
    `INSERT INTO tape_details (id, session_id, tape_index, label, defects, original_waveform, current_waveform,
      breakpoints, speed_drift, noise_level, applied_speed, noise_reduction_level, splices, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run(
    detail.id,
    detail.sessionId,
    detail.tapeIndex,
    detail.label,
    JSON.stringify(detail.defects),
    JSON.stringify(detail.originalWaveform),
    JSON.stringify(detail.currentWaveform),
    JSON.stringify(detail.breakpoints),
    detail.speedDrift,
    detail.noiseLevel,
    detail.appliedSpeed,
    detail.noiseReductionLevel,
    JSON.stringify(detail.splices),
    detail.status,
    detail.createdAt,
    detail.updatedAt
  );

  return detail;
}

export function getSession(sessionId: string): GameSession | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(sessionId) as any;
  if (!row) return null;
  return rowToSession(row);
}

export function getTapeDetails(sessionId: string): TapeDetail[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM tape_details WHERE session_id = ? ORDER BY tape_index')
    .all(sessionId) as any[];
  return rows.map(rowToTapeDetail);
}

export function getTapeDetail(tapeId: string): TapeDetail | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM tape_details WHERE id = ?').get(tapeId) as any;
  if (!row) return null;
  return rowToTapeDetail(row);
}

export function getRepairHistory(sessionId: string, tapeDetailId?: string): RepairHistory[] {
  const db = getDb();
  let stmt;
  if (tapeDetailId) {
    stmt = db.prepare(
      'SELECT * FROM repair_history WHERE session_id = ? AND tape_detail_id = ? ORDER BY sequence_number'
    );
    return (stmt.all(sessionId, tapeDetailId) as any[]).map(rowToHistory);
  }
  stmt = db.prepare(
    'SELECT * FROM repair_history WHERE session_id = ? ORDER BY sequence_number'
  );
  return (stmt.all(sessionId) as any[]).map(rowToHistory);
}

export function getResultRecords(sessionId: string): ResultRecord[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM result_records WHERE session_id = ? ORDER BY created_at')
    .all(sessionId) as any[];
  return rows.map(rowToResultRecord);
}

export function selectCleaning(
  sessionId: string,
  tapeDetailId: string,
  method: CleaningMethod
): { tape: TapeDetail; cost: number } {
  const db = getDb();
  const tape = getTapeDetail(tapeDetailId);
  if (!tape) throw new Error('Tape not found');

  const previousState = captureTapeState(tape);
  const cost = CLEANING_COSTS[method] || 0;

  const cleaned = applyCleaning(tape.currentWaveform, method, tape.noiseLevel);
  const updatedAt = now();

  const update = db.prepare(
    `UPDATE tape_details SET current_waveform = ?, status = ?, updated_at = ? WHERE id = ?`
  );
  update.run(JSON.stringify(cleaned), 'in_progress', updatedAt, tapeDetailId);

  tape.currentWaveform = cleaned;
  tape.status = 'in_progress';
  tape.updatedAt = updatedAt;

  addHistory(sessionId, tapeDetailId, 'select_cleaning', { method, cost }, previousState);
  return { tape, cost };
}

export function spliceBreak(
  sessionId: string,
  tapeDetailId: string,
  position: number
): { tape: TapeDetail; isCorrect: boolean } {
  const db = getDb();
  const tape = getTapeDetail(tapeDetailId);
  if (!tape) throw new Error('Tape not found');

  const previousState = captureTapeState(tape);

  const nearestBp = tape.breakpoints.reduce(
    (best, bp) => {
      const d = Math.abs(bp.position - position);
      return d < best.distance ? { bp, distance: d } : best;
    },
    { bp: tape.breakpoints[0], distance: Infinity }
  );

  const isCorrect = nearestBp && nearestBp.distance < 5;
  const newSplices = [...tape.splices.filter((s) => Math.abs(s.position - position) >= 5), { position, isCorrect }];
  const splicedWaveform = applySplice(tape.currentWaveform, tape.breakpoints, newSplices);
  const updatedAt = now();

  const update = db.prepare(
    `UPDATE tape_details SET current_waveform = ?, splices = ?, status = ?, updated_at = ? WHERE id = ?`
  );
  update.run(JSON.stringify(splicedWaveform), JSON.stringify(newSplices), 'in_progress', updatedAt, tapeDetailId);

  tape.currentWaveform = splicedWaveform;
  tape.splices = newSplices;
  tape.status = 'in_progress';
  tape.updatedAt = updatedAt;

  addHistory(
    sessionId,
    tapeDetailId,
    'splice_break',
    { position, nearestBreakpoint: nearestBp?.bp.position, isCorrect, distance: nearestBp?.distance },
    previousState
  );

  return { tape, isCorrect };
}

export function adjustSpeed(
  sessionId: string,
  tapeDetailId: string,
  speed: number
): { tape: TapeDetail; deviation: number } {
  const db = getDb();
  const tape = getTapeDetail(tapeDetailId);
  if (!tape) throw new Error('Tape not found');

  const previousState = captureTapeState(tape);
  const clampedSpeed = Math.max(0.7, Math.min(1.3, speed));

  let current = applyCleaning(tape.originalWaveform, 'rewind_cycle', tape.noiseLevel);
  const originalWithDefects = applyDefects(tape.originalWaveform, tape.defects, tape.tapeIndex + 5).waveform;
  current = [...originalWithDefects];

  if (tape.splices.length > 0) {
    current = applySplice(current, tape.breakpoints, tape.splices);
  }
  current = applySpeedCorrection(current, tape.speedDrift, clampedSpeed);

  const { waveform: afterNr } = applyNoiseReduction(current, tape.noiseReductionLevel);
  const updatedAt = now();

  const update = db.prepare(
    `UPDATE tape_details SET current_waveform = ?, applied_speed = ?, status = ?, updated_at = ? WHERE id = ?`
  );
  update.run(JSON.stringify(afterNr), clampedSpeed, 'in_progress', updatedAt, tapeDetailId);

  tape.currentWaveform = afterNr;
  tape.appliedSpeed = clampedSpeed;
  tape.status = 'in_progress';
  tape.updatedAt = updatedAt;

  const deviation = Math.abs(1 - clampedSpeed);
  addHistory(
    sessionId,
    tapeDetailId,
    'adjust_speed',
    { speed: clampedSpeed, drift: tape.speedDrift, deviation },
    previousState
  );

  return { tape, deviation };
}

export function applyNoiseReductionAction(
  sessionId: string,
  tapeDetailId: string,
  level: number
): { tape: TapeDetail; detailLoss: number; isExcessive: boolean } {
  const db = getDb();
  const tape = getTapeDetail(tapeDetailId);
  if (!tape) throw new Error('Tape not found');

  const previousState = captureTapeState(tape);
  const clampedLevel = Math.max(0, Math.min(1, level));

  let current = applyCleaning(tape.originalWaveform, 'rewind_cycle', tape.noiseLevel);
  const originalWithDefects = applyDefects(tape.originalWaveform, tape.defects, tape.tapeIndex + 5).waveform;
  current = [...originalWithDefects];

  if (tape.splices.length > 0) {
    current = applySplice(current, tape.breakpoints, tape.splices);
  }
  current = applySpeedCorrection(current, tape.speedDrift, tape.appliedSpeed);

  const { waveform: result, detailLoss } = applyNoiseReduction(current, clampedLevel);
  const isExcessive = clampedLevel > 0.7;
  const updatedAt = now();

  const update = db.prepare(
    `UPDATE tape_details SET current_waveform = ?, noise_reduction_level = ?, status = ?, updated_at = ? WHERE id = ?`
  );
  update.run(JSON.stringify(result), clampedLevel, 'in_progress', updatedAt, tapeDetailId);

  tape.currentWaveform = result;
  tape.noiseReductionLevel = clampedLevel;
  tape.status = 'in_progress';
  tape.updatedAt = updatedAt;

  addHistory(
    sessionId,
    tapeDetailId,
    'apply_noise_reduction',
    { level: clampedLevel, detailLoss, isExcessive },
    previousState
  );

  return { tape, detailLoss, isExcessive };
}

export function rollbackToHistory(
  sessionId: string,
  tapeDetailId: string,
  historyId: string
): { tape: TapeDetail; rolledBackActions: number } {
  const db = getDb();
  const history = getRepairHistory(sessionId, tapeDetailId);
  const targetIdx = history.findIndex((h) => h.id === historyId);
  if (targetIdx < 0) throw new Error('History entry not found');

  const targetEntry = history[targetIdx];
  const tape = getTapeDetail(tapeDetailId);
  if (!tape) throw new Error('Tape not found');

  const previousState = captureTapeState(tape);
  const prevState = targetEntry.previousState;

  let newWaveform = tape.currentWaveform;
  let newSpeed = tape.appliedSpeed;
  let newNrLevel = tape.noiseReductionLevel;
  let newSplices = tape.splices;

  if (prevState && typeof prevState === 'object') {
    if ('currentWaveform' in prevState && Array.isArray((prevState as any).currentWaveform)) {
      newWaveform = (prevState as any).currentWaveform;
    }
    if ('appliedSpeed' in prevState) {
      newSpeed = (prevState as any).appliedSpeed;
    }
    if ('noiseReductionLevel' in prevState) {
      newNrLevel = (prevState as any).noiseReductionLevel;
    }
    if ('splices' in prevState && Array.isArray((prevState as any).splices)) {
      newSplices = (prevState as any).splices;
    }
  }

  const actionsAfter = history.length - 1 - targetIdx;
  const updatedAt = now();

  const update = db.prepare(
    `UPDATE tape_details SET current_waveform = ?, applied_speed = ?, noise_reduction_level = ?, splices = ?, updated_at = ? WHERE id = ?`
  );
  update.run(
    JSON.stringify(newWaveform),
    newSpeed,
    newNrLevel,
    JSON.stringify(newSplices),
    updatedAt,
    tapeDetailId
  );

  tape.currentWaveform = newWaveform;
  tape.appliedSpeed = newSpeed;
  tape.noiseReductionLevel = newNrLevel;
  tape.splices = newSplices;
  tape.updatedAt = updatedAt;

  addHistory(
    sessionId,
    tapeDetailId,
    'rollback',
    { targetHistoryId: historyId, targetAction: targetEntry.actionType, rolledBackActions: actionsAfter },
    previousState
  );

  return { tape, rolledBackActions: actionsAfter };
}

export function recalculateTape(
  sessionId: string,
  tapeDetailId: string
): { tape: TapeDetail; analysis: ReturnType<typeof analyzeWaveforms> } {
  const db = getDb();
  const tape = getTapeDetail(tapeDetailId);
  if (!tape) throw new Error('Tape not found');

  const previousState = captureTapeState(tape);

  let current = applyCleaning(tape.originalWaveform, 'rewind_cycle', tape.noiseLevel);
  const originalWithDefects = applyDefects(tape.originalWaveform, tape.defects, tape.tapeIndex + 5).waveform;
  current = [...originalWithDefects];

  if (tape.splices.length > 0) {
    current = applySplice(current, tape.breakpoints, tape.splices);
  }
  current = applySpeedCorrection(current, tape.speedDrift, tape.appliedSpeed);
  const { waveform: finalWave } = applyNoiseReduction(current, tape.noiseReductionLevel);

  const analysis = analyzeWaveforms(tape.originalWaveform, finalWave, tape.splices, tape.noiseReductionLevel);
  const updatedAt = now();

  const update = db.prepare(
    `UPDATE tape_details SET current_waveform = ?, status = ?, updated_at = ? WHERE id = ?`
  );
  update.run(JSON.stringify(finalWave), 'in_progress', updatedAt, tapeDetailId);

  tape.currentWaveform = finalWave;
  tape.status = 'in_progress';
  tape.updatedAt = updatedAt;

  addHistory(sessionId, tapeDetailId, 'recalculate', {
    metrics: calculateMetrics(tape.originalWaveform, finalWave, analysis, tape.noiseReductionLevel, 0),
  }, previousState);

  return { tape, analysis };
}

export function completeTapeRepair(
  sessionId: string,
  tapeDetailId: string,
  cleaningMethod: CleaningMethod,
  repairTimeMs: number
): ResultRecord {
  const db = getDb();
  const tape = getTapeDetail(tapeDetailId);
  const session = getSession(sessionId);
  if (!tape || !session) throw new Error('Session or tape not found');

  const analysis = analyzeWaveforms(tape.originalWaveform, tape.currentWaveform, tape.splices, tape.noiseReductionLevel);
  const { detailLoss } = applyNoiseReduction(tape.currentWaveform, tape.noiseReductionLevel);
  const { intelligibility, fidelity } = calculateMetrics(
    tape.originalWaveform,
    tape.currentWaveform,
    analysis,
    tape.noiseReductionLevel,
    detailLoss
  );

  const cleaningCost = CLEANING_COSTS[cleaningMethod] || 0;
  const spliceMaterialCost = tape.splices.length * 1.5;
  const totalMaterialCost = cleaningCost + spliceMaterialCost;

  const hasExcessive = tape.noiseReductionLevel > 0.6;
  const hasBadSplice = tape.splices.some((s) => !s.isCorrect);

  const resultId = uuidv4();
  const result: ResultRecord = {
    id: resultId,
    sessionId,
    tapeDetailId,
    cleaningMethod,
    cleaningCost,
    finalWaveform: tape.currentWaveform,
    intelligibility,
    fidelity,
    materialCost: totalMaterialCost,
    repairTimeMs,
    hasExcessiveNoiseReduction: hasExcessive,
    hasBadSplice,
    voiceDetailLoss: detailLoss,
    jumpArtifacts: analysis.jumpPoints.length,
    createdAt: now(),
  };

  const insert = db.prepare(
    `INSERT INTO result_records (id, session_id, tape_detail_id, cleaning_method, cleaning_cost, final_waveform,
      intelligibility, fidelity, material_cost, repair_time_ms, has_excessive_noise_reduction,
      has_bad_splice, voice_detail_loss, jump_artifacts, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run(
    result.id,
    result.sessionId,
    result.tapeDetailId,
    result.cleaningMethod,
    result.cleaningCost,
    JSON.stringify(result.finalWaveform),
    result.intelligibility,
    result.fidelity,
    result.materialCost,
    result.repairTimeMs,
    result.hasExcessiveNoiseReduction ? 1 : 0,
    result.hasBadSplice ? 1 : 0,
    result.voiceDetailLoss,
    result.jumpArtifacts,
    result.createdAt
  );

  const update = db.prepare(`UPDATE tape_details SET status = ?, updated_at = ? WHERE id = ?`);
  update.run('completed', now(), tapeDetailId);

  addHistory(sessionId, tapeDetailId, 'complete_repair', {
    cleaningMethod,
    intelligibility,
    fidelity,
    materialCost: totalMaterialCost,
    repairTimeMs,
    hasExcessive,
    hasBadSplice,
  });

  return result;
}

export function completeSession(sessionId: string): GameSession {
  const db = getDb();
  const session = getSession(sessionId);
  if (!session) throw new Error('Session not found');

  const results = getResultRecords(sessionId);
  if (results.length < session.tapeCount) {
    throw new Error(`还剩 ${session.tapeCount - results.length} 盘磁带未完成修复`);
  }

  const totalIntelligibility = results.reduce((s, r) => s + r.intelligibility, 0) / results.length;
  const totalFidelity = results.reduce((s, r) => s + r.fidelity, 0) / results.length;
  const totalMaterialCost = results.reduce((s, r) => s + r.materialCost, 0);
  const totalRepairTimeMs = results.reduce((s, r) => s + r.repairTimeMs, 0);

  const timeScore = Math.max(0, 100 - totalRepairTimeMs / 1000);
  const costScore = Math.max(0, 100 - totalMaterialCost * 2);
  const finalScore =
    totalIntelligibility * 0.4 + totalFidelity * 0.3 + timeScore * 0.15 + costScore * 0.15;

  let grade = 'F';
  if (finalScore >= 90) grade = 'S';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';

  const completedAt = now();
  const update = db.prepare(
    `UPDATE game_sessions SET status = ?, completed_at = ?, total_intelligibility = ?,
     total_fidelity = ?, total_material_cost = ?, total_repair_time_ms = ?, final_score = ?, grade = ?
     WHERE id = ?`
  );
  update.run(
    'completed',
    completedAt,
    totalIntelligibility,
    totalFidelity,
    totalMaterialCost,
    totalRepairTimeMs,
    finalScore,
    grade,
    sessionId
  );

  return {
    ...session,
    status: 'completed',
    completedAt,
    totalIntelligibility,
    totalFidelity,
    totalMaterialCost,
    totalRepairTimeMs,
    finalScore,
    grade,
  };
}

function addHistory(
  sessionId: string,
  tapeDetailId: string | null,
  actionType: RepairActionType,
  actionData: Record<string, unknown>,
  previousState: Record<string, unknown> | null = null
): void {
  const db = getDb();
  const historyId = uuidv4();
  const timestamp = now();
  const seqRow = db
    .prepare('SELECT COALESCE(MAX(sequence_number), -1) AS max_seq FROM repair_history WHERE session_id = ?')
    .get(sessionId) as { max_seq: number };
  const sequenceNumber = seqRow.max_seq + 1;

  const insert = db.prepare(
    `INSERT INTO repair_history (id, session_id, tape_detail_id, action_type, action_data, previous_state, timestamp, sequence_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insert.run(
    historyId,
    sessionId,
    tapeDetailId,
    actionType,
    JSON.stringify(actionData),
    previousState ? JSON.stringify(previousState) : null,
    timestamp,
    sequenceNumber
  );
}

function captureTapeState(tape: TapeDetail): Record<string, unknown> {
  return {
    currentWaveform: [...tape.currentWaveform],
    appliedSpeed: tape.appliedSpeed,
    noiseReductionLevel: tape.noiseReductionLevel,
    splices: [...tape.splices],
    status: tape.status,
  };
}

function rowToSession(row: any): GameSession {
  return {
    id: row.id,
    label: row.label,
    batchDescription: row.batch_description,
    tapeCount: row.tape_count,
    status: row.status as GameSession['status'],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    totalIntelligibility: row.total_intelligibility || 0,
    totalFidelity: row.total_fidelity || 0,
    totalMaterialCost: row.total_material_cost || 0,
    totalRepairTimeMs: row.total_repair_time_ms || 0,
    finalScore: row.final_score || 0,
    grade: row.grade || '',
  };
}

function rowToTapeDetail(row: any): TapeDetail {
  return {
    id: row.id,
    sessionId: row.session_id,
    tapeIndex: row.tape_index,
    label: row.label,
    defects: JSON.parse(row.defects),
    originalWaveform: JSON.parse(row.original_waveform),
    currentWaveform: JSON.parse(row.current_waveform),
    breakpoints: JSON.parse(row.breakpoints),
    speedDrift: row.speed_drift,
    noiseLevel: row.noise_level,
    appliedSpeed: row.applied_speed,
    noiseReductionLevel: row.noise_reduction_level,
    splices: JSON.parse(row.splices || '[]'),
    status: row.status as TapeDetail['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToHistory(row: any): RepairHistory {
  return {
    id: row.id,
    sessionId: row.session_id,
    tapeDetailId: row.tape_detail_id,
    actionType: row.action_type as RepairActionType,
    actionData: JSON.parse(row.action_data || '{}'),
    previousState: row.previous_state ? JSON.parse(row.previous_state) : null,
    timestamp: row.timestamp,
    sequenceNumber: row.sequence_number,
  };
}

function rowToResultRecord(row: any): ResultRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    tapeDetailId: row.tape_detail_id,
    cleaningMethod: row.cleaning_method as CleaningMethod,
    cleaningCost: row.cleaning_cost,
    finalWaveform: JSON.parse(row.final_waveform),
    intelligibility: row.intelligibility,
    fidelity: row.fidelity,
    materialCost: row.material_cost,
    repairTimeMs: row.repair_time_ms,
    hasExcessiveNoiseReduction: !!row.has_excessive_noise_reduction,
    hasBadSplice: !!row.has_bad_splice,
    voiceDetailLoss: row.voice_detail_loss,
    jumpArtifacts: row.jump_artifacts,
    createdAt: row.created_at,
  };
}

export function listAllSessions(): GameSession[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM game_sessions ORDER BY started_at DESC').all() as any[];
  return rows.map(rowToSession);
}
