import type { GameState, GameResult, Level } from '../types';
import { replayGameFromOriginalState } from './gameEngine';

export interface ScoreBreakdown {
  baseDeliveryScore: number;
  onTimeBonus: number;
  priorityBonus: number;
  anomalyResolutionBonus: number;
  timeBonus: number;
  efficiencyBonus: number;
  delayPenalty: number;
  lossPenalty: number;
  total: number;
}

export interface RecalculationResult {
  replayedState: GameState;
  breakdown: ScoreBreakdown;
}

export function calculateScoreBreakdown(state: GameState, level: Level): ScoreBreakdown {
  let baseDeliveryScore = 0;
  let onTimeBonus = 0;
  let priorityBonus = 0;
  let delayPenalty = 0;
  let lossPenalty = 0;

  for (const capsule of state.capsules) {
    if (capsule.status === 'delivered') {
      const priorityMultiplier = capsule.priority === 'critical' ? 3 : capsule.priority === 'express' ? 2 : 1;
      baseDeliveryScore += 100 * priorityMultiplier;

      if (capsule.deliveryTime <= capsule.maxDeliveryTime) {
        onTimeBonus += Math.round(50 * priorityMultiplier);
        priorityBonus += Math.round(50 * priorityMultiplier);
      }
    } else if (capsule.status === 'delayed' || capsule.deliveryTime > capsule.maxDeliveryTime) {
      delayPenalty += 100;
    } else if (capsule.status === 'lost') {
      lossPenalty += 200;
    }
  }

  const anomalyResolutionBonus = state.activeAnomalies
    .filter(a => a.resolved)
    .reduce((sum, a) => sum + 200 * a.config.severity, 0);

  const timeUsed = state.currentTime;
  const timeBonus = state.victory && timeUsed < level.timeLimit * 0.7
    ? Math.round((level.timeLimit - timeUsed) * 5)
    : 0;

  const operationsPerformed = state.operationHistory.filter(
    op => op.type === 'valve_adjust' || op.type === 'junction_switch' || op.type === 'anomaly_resolve'
  ).length;
  const optimalOperations = level.valves.length + level.junctions.length * 2 + level.anomalies.length;
  const efficiencyBonus = operationsPerformed <= optimalOperations * 1.5
    ? Math.round((1 - Math.min(1, (operationsPerformed - optimalOperations) / optimalOperations)) * 300)
    : 0;

  const total = Math.max(0, 
    baseDeliveryScore + 
    onTimeBonus + 
    priorityBonus + 
    anomalyResolutionBonus + 
    timeBonus + 
    efficiencyBonus - 
    delayPenalty - 
    lossPenalty
  );

  return {
    baseDeliveryScore,
    onTimeBonus,
    priorityBonus,
    anomalyResolutionBonus,
    timeBonus,
    efficiencyBonus,
    delayPenalty,
    lossPenalty,
    total
  };
}

export function recalculateFullFromOriginalState(
  originalGameState: GameState,
  level: Level
): RecalculationResult {
  const replayedState = replayGameFromOriginalState(originalGameState, level);
  const breakdown = calculateScoreBreakdown(replayedState, level);
  return { replayedState, breakdown };
}

export function calculateRating(score: number, minScore: number, victory: boolean): GameResult['rating'] {
  if (!victory) return 'F';
  
  const ratio = score / minScore;
  
  if (ratio >= 2.0) return 'S';
  if (ratio >= 1.7) return 'A';
  if (ratio >= 1.4) return 'B';
  if (ratio >= 1.1) return 'C';
  if (ratio >= 1.0) return 'D';
  return 'F';
}

export function createGameResult(
  state: GameState,
  level: Level,
  recalculatedBreakdown: ScoreBreakdown
): GameResult {
  const anomaliesResolved = state.activeAnomalies.filter(a => a.resolved).length;
  const operationsPerformed = state.operationHistory.filter(
    op => op.type === 'valve_adjust' || op.type === 'junction_switch' || op.type === 'anomaly_resolve'
  ).length;

  const rating = calculateRating(recalculatedBreakdown.total, level.minScore, state.victory);

  return {
    gameId: state.id,
    playerId: state.playerId,
    levelId: level.id,
    completedAt: Date.now(),
    victory: state.victory,
    finalScore: state.score,
    recalculatedScore: recalculatedBreakdown.total,
    deliveriesCompleted: state.deliveriesCompleted,
    deliveriesFailed: state.deliveriesFailed,
    timeUsed: state.currentTime,
    anomaliesResolved,
    operationsPerformed,
    rating
  };
}
