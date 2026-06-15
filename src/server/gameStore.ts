import {
  insertSession,
  getAllSessions,
  getSessionById,
  insertAction,
  insertActionsBatch,
  getActionsBySession,
  insertMaturityHistory,
  getMaturityHistoryBySession,
  insertGameResult,
  getGameResultsBySession,
  initDatabase,
} from "./db";
import type { GameRuntimeState } from "./gameEngine";
import type {
  GameSession,
  GameAction,
  TeaMaturityHistory,
  GameResult,
} from "../types/game";

initDatabase();

const activeGames: Map<string, GameRuntimeState> = new Map();

export function getActiveGame(sessionId: string): GameRuntimeState | undefined {
  return activeGames.get(sessionId);
}

export function setActiveGame(state: GameRuntimeState): void {
  activeGames.set(state.session.id, state);
}

export function removeActiveGame(sessionId: string): void {
  activeGames.delete(sessionId);
}

function normalizeSession(row: any): GameSession {
  if (!row) return null as any;
  return {
    id: row.id,
    name: row.name,
    seedType: row.seedType || row.seed_type,
    phase: row.phase,
    currentTime: row.currentTime ?? row.current_time,
    totalRevenue: row.totalRevenue ?? row.total_revenue,
    windIntensity: row.windIntensity ?? row.wind_intensity,
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at,
  };
}

function denormalizeSession(session: GameSession): any {
  return {
    id: session.id,
    name: session.name,
    seedType: session.seedType,
    phase: session.phase,
    currentTime: session.currentTime,
    totalRevenue: session.totalRevenue,
    windIntensity: session.windIntensity,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    seed_type: session.seedType,
    current_time: session.currentTime,
    total_revenue: session.totalRevenue,
    wind_intensity: session.windIntensity,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
  };
}

export function saveSession(session: GameSession): void {
  insertSession(denormalizeSession(session));
}

export function getSession(sessionId: string): GameSession | null {
  const row = getSessionById(sessionId);
  return row ? normalizeSession(row) : null;
}

export function listSessions(): GameSession[] {
  return getAllSessions().map(normalizeSession);
}

function normalizeAction(row: any): GameAction {
  return {
    id: row.id,
    sessionId: row.sessionId ?? row.session_id,
    actionType: row.actionType ?? row.action_type,
    targetId: row.targetId ?? row.target_id,
    timestamp: row.timestamp ?? row.game_time,
    realTimestamp: row.realTimestamp ?? row.real_time,
    details: typeof row.details === "string" ? JSON.parse(row.details) : row.details,
  };
}

function denormalizeAction(action: GameAction): any {
  return {
    id: action.id,
    sessionId: action.sessionId,
    actionType: action.actionType,
    targetId: action.targetId,
    timestamp: action.timestamp,
    realTimestamp: action.realTimestamp,
    details: JSON.stringify(action.details),
    session_id: action.sessionId,
    action_type: action.actionType,
    target_id: action.targetId,
    game_time: action.timestamp,
    real_time: action.realTimestamp,
  };
}

export function saveAction(action: GameAction): void {
  insertAction(denormalizeAction(action));
}

export function saveActions(actions: GameAction[]): void {
  if (actions.length === 0) return;
  insertActionsBatch(actions.map(denormalizeAction));
}

export function getSessionActions(sessionId: string): GameAction[] {
  return getActionsBySession(sessionId)
    .map(normalizeAction)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function normalizeMaturity(row: any): TeaMaturityHistory {
  return {
    id: row.id,
    sessionId: row.sessionId ?? row.session_id,
    teaPlantId: row.teaPlantId ?? row.tea_plant_id,
    altitude: row.altitude,
    matureStartTime: row.matureStartTime ?? row.mature_start_time,
    matureEndTime: row.matureEndTime ?? row.mature_end_time,
    quality: row.quality,
    timestamp: row.timestamp ?? row.recorded_at,
  };
}

function denormalizeMaturity(rec: TeaMaturityHistory): any {
  return {
    id: rec.id,
    sessionId: rec.sessionId,
    teaPlantId: rec.teaPlantId,
    altitude: rec.altitude,
    matureStartTime: rec.matureStartTime,
    matureEndTime: rec.matureEndTime,
    quality: rec.quality,
    timestamp: rec.timestamp,
    session_id: rec.sessionId,
    tea_plant_id: rec.teaPlantId,
    mature_start_time: rec.matureStartTime,
    mature_end_time: rec.matureEndTime,
    recorded_at: rec.timestamp,
  };
}

export function saveMaturityHistory(records: TeaMaturityHistory[]): void {
  if (records.length === 0) return;
  insertMaturityHistory(records.map(denormalizeMaturity));
}

export function getMaturityHistory(sessionId: string): TeaMaturityHistory[] {
  return getMaturityHistoryBySession(sessionId)
    .map(normalizeMaturity)
    .sort((a, b) => a.timestamp - b.timestamp);
}

function normalizeResult(row: any): GameResult {
  const sdetails = row.settlementDetails ?? row.settlement_details;
  let details: any = {};
  if (sdetails) {
    if (typeof sdetails === "string") {
      try {
        details = JSON.parse(sdetails);
      } catch {}
    } else {
      details = sdetails;
    }
  }
  return {
    id: row.id,
    sessionId: row.sessionId ?? row.session_id,
    totalTeaPicked: row.totalTeaPicked ?? row.total_tea_picked,
    premiumCount: row.premiumCount ?? row.premium_count,
    normalCount: row.normalCount ?? row.normal_count,
    degradedCount: row.degradedCount ?? row.degraded_count,
    totalRevenue: row.totalRevenue ?? row.total_revenue,
    windAffectedCount: row.windAffectedCount ?? row.wind_affected_count,
    conflictCount: row.conflictCount ?? row.conflict_count,
    settlementDetails: details,
    calculatedAt: row.calculatedAt ?? row.calculated_at,
  };
}

function denormalizeResult(r: GameResult): any {
  return {
    id: r.id,
    sessionId: r.sessionId,
    totalTeaPicked: r.totalTeaPicked,
    premiumCount: r.premiumCount,
    normalCount: r.normalCount,
    degradedCount: r.degradedCount,
    totalRevenue: r.totalRevenue,
    windAffectedCount: r.windAffectedCount,
    conflictCount: r.conflictCount,
    settlementDetails: JSON.stringify(r.settlementDetails),
    calculatedAt: r.calculatedAt,
    session_id: r.sessionId,
    total_tea_picked: r.totalTeaPicked,
    premium_count: r.premiumCount,
    normal_count: r.normalCount,
    degraded_count: r.degradedCount,
    total_revenue: r.totalRevenue,
    wind_affected_count: r.windAffectedCount,
    conflict_count: r.conflictCount,
    settlement_details: JSON.stringify(r.settlementDetails),
    calculated_at: r.calculatedAt,
  };
}

export function saveGameResult(result: GameResult): void {
  insertGameResult(denormalizeResult(result));
}

export function getGameResults(sessionId: string): GameResult[] {
  return getGameResultsBySession(sessionId)
    .map(normalizeResult)
    .sort((a, b) => a.calculatedAt - b.calculatedAt);
}

export function persistGameState(state: GameRuntimeState): void {
  setActiveGame(state);
  saveSession(state.session);

  const existingActions = getSessionActions(state.session.id);
  const existingActionIds = new Set(existingActions.map((a) => a.id));
  const newActions = state.actions.filter((a) => !existingActionIds.has(a.id));
  if (newActions.length > 0) {
    saveActions(newActions);
  }

  const existingM = getMaturityHistory(state.session.id);
  const existingMIds = new Set(existingM.map((m) => m.id));
  const newM = state.maturityHistory.filter((m) => !existingMIds.has(m.id));
  if (newM.length > 0) {
    saveMaturityHistory(newM);
  }
}
