import { getDb } from "./db";
import {
  SPECIES,
  POOL_LOCATIONS,
  TOTAL_STEPS,
  getTideLevelAtStep,
  getTidePhaseAtStep,
  checkSpeciesVisible,
  getVisibleSpeciesAtPool,
} from "./gameData";
import type { GameSession, ObservationRecord, SessionResult, RecoveryTask, TidePhase } from "./types";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export function createNewSession(): GameSession {
  const db = getDb();
  const id = generateId();
  const session: GameSession = {
    id,
    createdAt: Date.now(),
    status: "active",
    currentTideLevel: getTideLevelAtStep(0, TOTAL_STEPS),
    currentTidePhase: getTidePhaseAtStep(0, TOTAL_STEPS),
    timeStep: 0,
    totalSteps: TOTAL_STEPS,
    researchPoints: 0,
    ecoScore: 100,
    tramplingCount: 0,
    route: [],
    visitedPools: [],
    recoveryBonusResearch: 0,
    recoveryBonusEco: 0,
  };

  const stmt = db.prepare(`
    INSERT INTO game_sessions
    (id, created_at, status, current_tide_level, current_tide_phase, time_step,
     total_steps, research_points, eco_score, trample_count, route, visited_pools,
     recovery_bonus_research, recovery_bonus_eco)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    session.id,
    session.createdAt,
    session.status,
    session.currentTideLevel,
    session.currentTidePhase,
    session.timeStep,
    session.totalSteps,
    session.researchPoints,
    session.ecoScore,
    session.tramplingCount,
    JSON.stringify(session.route),
    JSON.stringify(session.visitedPools),
    session.recoveryBonusResearch,
    session.recoveryBonusEco
  );

  return session;
}

export function getSession(sessionId: string): GameSession | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM game_sessions WHERE id = ?").get(sessionId) as any;
  if (!row) return null;
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    currentTideLevel: row.current_tide_level,
    currentTidePhase: row.current_tide_phase,
    timeStep: row.time_step,
    totalSteps: row.total_steps,
    researchPoints: row.research_points,
    ecoScore: row.eco_score,
    tramplingCount: row.trample_count,
    route: JSON.parse(row.route),
    visitedPools: JSON.parse(row.visited_pools),
    recoveryBonusResearch: row.recovery_bonus_research ?? 0,
    recoveryBonusEco: row.recovery_bonus_eco ?? 0,
  };
}

export function updateSession(session: GameSession) {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE game_sessions SET
      status = ?,
      current_tide_level = ?,
      current_tide_phase = ?,
      time_step = ?,
      research_points = ?,
      eco_score = ?,
      trample_count = ?,
      route = ?,
      visited_pools = ?,
      recovery_bonus_research = ?,
      recovery_bonus_eco = ?
    WHERE id = ?
  `);
  stmt.run(
    session.status,
    session.currentTideLevel,
    session.currentTidePhase,
    session.timeStep,
    session.researchPoints,
    session.ecoScore,
    session.tramplingCount,
    JSON.stringify(session.route),
    JSON.stringify(session.visitedPools),
    session.recoveryBonusResearch,
    session.recoveryBonusEco,
    session.id
  );
}

export function recordObservation(params: {
  sessionId: string;
  poolId: string;
  speciesId: string;
  tideLevel: number;
  tidePhase: TidePhase;
  timeStep: number;
  trampled: boolean;
  note?: string;
}): ObservationRecord {
  const db = getDb();
  const id = generateId();
  const record: ObservationRecord = {
    id,
    sessionId: params.sessionId,
    poolId: params.poolId,
    speciesId: params.speciesId,
    tideLevel: params.tideLevel,
    tidePhase: params.tidePhase,
    timeStep: params.timeStep,
    trampled: params.trampled,
    noted: !!params.note,
    note: params.note,
    timestamp: Date.now(),
  };

  const stmt = db.prepare(`
    INSERT INTO observation_records
    (id, session_id, pool_id, species_id, tide_level, tide_phase, time_step,
     trampled, noted, note, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    record.id,
    record.sessionId,
    record.poolId,
    record.speciesId,
    record.tideLevel,
    record.tidePhase,
    record.timeStep,
    record.trampled ? 1 : 0,
    record.noted ? 1 : 0,
    record.note || null,
    record.timestamp
  );

  updateHistoricalCondition(params.speciesId, params.tideLevel, params.tidePhase, params.poolId);

  return record;
}

export function getSessionObservations(sessionId: string): ObservationRecord[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM observation_records WHERE session_id = ? ORDER BY time_step").all(sessionId) as any[];
  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    poolId: row.pool_id,
    speciesId: row.species_id,
    tideLevel: row.tide_level,
    tidePhase: row.tide_phase,
    timeStep: row.time_step,
    trampled: row.trampled === 1,
    noted: row.noted === 1,
    note: row.note,
    timestamp: row.timestamp,
  }));
}

function updateHistoricalCondition(speciesId: string, tideLevel: number, tidePhase: TidePhase, poolId: string) {
  const db = getDb();
  const species = SPECIES.find((s) => s.id === speciesId);
  if (!species) return;

  const existing = db
    .prepare(
      `SELECT * FROM historical_conditions
       WHERE species_id = ? AND tide_phase = ? AND pool_id = ?
       ORDER BY ABS(tide_level - ?) LIMIT 1`
    )
    .get(speciesId, tidePhase, poolId, tideLevel) as any;

  if (existing) {
    db.prepare(
      `UPDATE historical_conditions SET observed_count = observed_count + 1, last_seen = ? WHERE id = ?`
    ).run(Date.now(), existing.id);
  } else {
    const id = generateId();
    db.prepare(
      `INSERT INTO historical_conditions (id, species_type, species_id, tide_level, tide_phase, pool_id, observed_count, last_seen)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`
    ).run(id, species.type, speciesId, tideLevel, tidePhase, poolId, Date.now());
  }
}

export function getHistoricalConditions() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM historical_conditions ORDER BY last_seen DESC").all() as any[];
  return rows.map((row) => ({
    id: row.id,
    speciesType: row.species_type,
    speciesId: row.species_id,
    tideLevel: row.tide_level,
    tidePhase: row.tide_phase,
    poolId: row.pool_id,
    observedCount: row.observed_count,
    lastSeen: row.last_seen,
  }));
}

export function addNotebookEntry(sessionId: string, speciesId: string, content: string) {
  const db = getDb();
  const id = generateId();
  db.prepare(
    `INSERT INTO notebook_entries (id, session_id, species_id, content, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(id, sessionId, speciesId, content, Date.now());
  return { id, sessionId, speciesId, content, createdAt: Date.now() };
}

export function getNotebookEntries(sessionId: string) {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM notebook_entries WHERE session_id = ? ORDER BY created_at").all(sessionId) as any[];
  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    speciesId: row.species_id,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export function recalculateSessionScore(sessionId: string): SessionResult {
  const db = getDb();
  const session = getSession(sessionId);
  if (!session) throw new Error("Session not found");

  const observations = getSessionObservations(sessionId);

  const observedSpecies = new Set(observations.map((o) => o.speciesId));
  const totalObservations = observations.length;
  const uniqueSpecies = observedSpecies.size;

  const allPoolSpecies = new Set(POOL_LOCATIONS.flatMap((p) => p.speciesIds));
  const missedSpecies = allPoolSpecies.size - uniqueSpecies;

  const trampleCount = observations.filter((o) => o.trampled).length;
  const tramplingPenalty = trampleCount * 8;

  const missedTidePenalty = Math.max(0, session.totalSteps - observations.length) * 3;

  const baseResearch = uniqueSpecies * 20 + observations.filter((o) => o.noted).length * 5;
  const preRecoveryResearch = Math.max(0, baseResearch - missedTidePenalty);

  const preRecoveryEco = Math.max(0, 100 - tramplingPenalty);

  const recoveryBonusResearch = session.recoveryBonusResearch || 0;
  const recoveryBonusEco = session.recoveryBonusEco || 0;

  const researchPoints = preRecoveryResearch + recoveryBonusResearch;
  const ecoScore = Math.min(100, preRecoveryEco + recoveryBonusEco);
  const finalScore = researchPoints + ecoScore;
  const preRecoveryFinal = preRecoveryResearch + preRecoveryEco;

  const existingCompleted = db
    .prepare("SELECT type FROM recovery_tasks WHERE session_id = ? AND completed = 1")
    .all(sessionId)
    .map((r: any) => r.type);

  db.prepare("DELETE FROM recovery_tasks WHERE session_id = ? AND completed = 0").run(sessionId);

  const newTasks = generateRecoveryTasks(sessionId, trampleCount, missedSpecies, preRecoveryEco);
  const recoveryTasks: RecoveryTask[] = [];

  for (const task of newTasks) {
    if (existingCompleted.includes(task.type)) continue;
    db.prepare(
      `INSERT INTO recovery_tasks (id, session_id, type, description, points_reward, completed)
       VALUES (?, ?, ?, ?, ?, 0)`
    ).run(task.id, task.sessionId, task.type, task.description, task.pointsReward);
    recoveryTasks.push(task);
  }

  const keptCompleted = db
    .prepare("SELECT * FROM recovery_tasks WHERE session_id = ? AND completed = 1")
    .all(sessionId) as any[];
  for (const row of keptCompleted) {
    recoveryTasks.push({
      id: row.id,
      sessionId: row.session_id,
      type: row.type,
      description: row.description,
      pointsReward: row.points_reward,
      completed: true,
    });
  }

  const allTaskIds = recoveryTasks.map((t) => t.id);

  const result: SessionResult = {
    id: generateId(),
    sessionId,
    totalObservations,
    uniqueSpecies,
    missedSpecies,
    tramplingPenalty,
    missedTidePenalty,
    researchPoints,
    ecoScore,
    finalScore,
    recoveryTasksAssigned: allTaskIds,
    completedAt: Date.now(),
    preRecoveryResearch,
    preRecoveryEco,
    preRecoveryFinal,
  };

  const existing = db.prepare("SELECT id FROM session_results WHERE session_id = ?").get(sessionId) as any;
  if (existing) {
    db.prepare(`DELETE FROM session_results WHERE id = ?`).run(existing.id);
  }

  db.prepare(
    `INSERT INTO session_results
     (id, session_id, total_observations, unique_species, missed_species, trample_penalty,
      missed_tide_penalty, research_points, eco_score, final_score, recovery_tasks, completed_at,
      pre_recovery_research, pre_recovery_eco, pre_recovery_final)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    result.id,
    result.sessionId,
    result.totalObservations,
    result.uniqueSpecies,
    result.missedSpecies,
    result.tramplingPenalty,
    result.missedTidePenalty,
    result.researchPoints,
    result.ecoScore,
    result.finalScore,
    JSON.stringify(result.recoveryTasksAssigned),
    result.completedAt,
    result.preRecoveryResearch,
    result.preRecoveryEco,
    result.preRecoveryFinal
  );

  return result;
}

function generateRecoveryTasks(sessionId: string, trampleCount: number, missedSpecies: number, ecoScore: number): RecoveryTask[] {
  const tasks: RecoveryTask[] = [];

  if (trampleCount > 0) {
    tasks.push({
      id: generateId(),
      sessionId,
      type: "trampling",
      description: `修复因踩踏破坏的 ${trampleCount} 处潮池生态环境`,
      pointsReward: trampleCount * 10,
      completed: false,
    });
  }

  if (missedSpecies > 0) {
    tasks.push({
      id: generateId(),
      sessionId,
      type: "missed_tide",
      description: `在正确潮位重新寻找 ${missedSpecies} 种未观测到的生物`,
      pointsReward: missedSpecies * 15,
      completed: false,
    });
  }

  if (ecoScore < 80) {
    tasks.push({
      id: generateId(),
      sessionId,
      type: "low_eco",
      description: `参与潮池生态恢复志愿活动，提升生态评分`,
      pointsReward: 25,
      completed: false,
    });
  }

  return tasks;
}

export function getSessionResult(sessionId: string): SessionResult | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM session_results WHERE session_id = ?").get(sessionId) as any;
  if (!row) return null;
  return {
    id: row.id,
    sessionId: row.session_id,
    totalObservations: row.total_observations,
    uniqueSpecies: row.unique_species,
    missedSpecies: row.missed_species,
    tramplingPenalty: row.trample_penalty,
    missedTidePenalty: row.missed_tide_penalty,
    researchPoints: row.research_points,
    ecoScore: row.eco_score,
    finalScore: row.final_score,
    recoveryTasksAssigned: JSON.parse(row.recovery_tasks),
    completedAt: row.completed_at,
    preRecoveryResearch: row.pre_recovery_research ?? 0,
    preRecoveryEco: row.pre_recovery_eco ?? 0,
    preRecoveryFinal: row.pre_recovery_final ?? 0,
  };
}

export function getRecoveryTasks(sessionId: string): RecoveryTask[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM recovery_tasks WHERE session_id = ?").all(sessionId) as any[];
  return rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    type: row.type,
    description: row.description,
    pointsReward: row.points_reward,
    completed: row.completed === 1,
  }));
}

export function completeRecoveryTask(taskId: string): RecoveryTask | null {
  const db = getDb();
  const task = db.prepare("SELECT * FROM recovery_tasks WHERE id = ?").get(taskId) as any;
  if (!task) return null;
  if (task.completed === 1) {
    return {
      id: task.id,
      sessionId: task.session_id,
      type: task.type,
      description: task.description,
      pointsReward: task.points_reward,
      completed: true,
    };
  }

  db.prepare("UPDATE recovery_tasks SET completed = 1 WHERE id = ?").run(taskId);

  const session = getSession(task.session_id);
  if (session) {
    session.recoveryBonusResearch += task.points_reward;
    if (task.type === "trampling" || task.type === "low_eco") {
      session.recoveryBonusEco = Math.min(100, session.recoveryBonusEco + 10);
    }
    updateSession(session);
  }

  return {
    id: task.id,
    sessionId: task.session_id,
    type: task.type,
    description: task.description,
    pointsReward: task.points_reward,
    completed: true,
  };
}
