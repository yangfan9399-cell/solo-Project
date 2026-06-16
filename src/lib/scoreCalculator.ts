import type { GameState, GameResult, Level } from '../types';
import { tickGame } from './gameEngine';

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

export function recalculateScoreFromHistory(
  originalGameState: GameState,
  level: Level
): ScoreBreakdown {
  const operations = originalGameState.operationHistory;
  const originalStartTime = originalGameState.startTime;

  const simState: GameState = {
    id: originalGameState.id,
    levelId: originalGameState.levelId,
    playerId: originalGameState.playerId,
    startTime: originalStartTime,
    currentTime: 0,
    isPaused: false,
    isGameOver: false,
    victory: false,
    score: 0,
    deliveriesCompleted: 0,
    deliveriesFailed: 0,
    valves: JSON.parse(JSON.stringify(level.valves)),
    junctions: JSON.parse(JSON.stringify(level.junctions)),
    pipes: JSON.parse(JSON.stringify(level.pipes)),
    capsules: [],
    stations: JSON.parse(JSON.stringify(level.stations)),
    activeAnomalies: [],
    operationHistory: []
  };

  const sortedOps = [...operations].sort((a, b) => a.timestamp - b.timestamp);

  let simTime = 0;
  const tickStep = 0.016;

  for (const op of sortedOps) {
    const targetSimTime = (op.timestamp - originalStartTime) / 1000;

    while (simTime < targetSimTime && !simState.isGameOver) {
      const delta = Math.min(tickStep, targetSimTime - simTime);
      tickGame(simState, level, delta);
      simTime += delta;
    }

    switch (op.type) {
      case 'valve_adjust': {
        const valve = simState.valves.find(v => v.id === op.targetId);
        if (valve) {
          valve.pressure = op.newValue as number;
        }
        break;
      }
      case 'junction_switch': {
        const junction = simState.junctions.find(j => j.id === op.targetId);
        if (junction) {
          junction.direction = op.newValue as GameState['junctions'][0]['direction'];
        }
        break;
      }
      case 'anomaly_resolve': {
        const anomaly = simState.activeAnomalies.find(a => a.config.id === op.targetId);
        if (anomaly && !anomaly.resolved) {
          anomaly.resolved = true;
          simState.score += 200 * anomaly.config.severity;
        }
        break;
      }
    }

    simState.operationHistory.push(op);
  }

  while (simTime < originalGameState.currentTime && !simState.isGameOver) {
    const delta = Math.min(tickStep, originalGameState.currentTime - simTime);
    tickGame(simState, level, delta);
    simTime += delta;
  }

  simState.isGameOver = originalGameState.isGameOver;
  simState.victory = originalGameState.victory;
  simState.currentTime = originalGameState.currentTime;

  return calculateScoreBreakdown(simState, level);
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
