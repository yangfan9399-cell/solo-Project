import type { Operation, ScoreBreakdown, GameSession, Level } from '../types/game';

export interface RecalcInput {
  session: GameSession;
  level: Level;
  operations: Operation[];
}

const ENERGY_COSTS: Record<string, number> = {
  MOVE_UP: 10,
  MOVE_DOWN: 5,
  ADD_WEIGHT_LEFT: 3,
  ADD_WEIGHT_RIGHT: 3,
  REMOVE_WEIGHT_LEFT: 2,
  REMOVE_WEIGHT_RIGHT: 2,
  SWAP_WEIGHTS: 8,
  CHARGE_ENERGY: -25,
  EMERGENCY_BALANCE: 30,
};

export function calculateScore(input: RecalcInput): ScoreBreakdown {
  const { session, level, operations } = input;

  const baseScore = level.base_score;

  const floorBonus = session.current_floor >= level.target_floor
    ? Math.floor(level.target_floor * 50)
    : Math.floor(session.current_floor * 25);

  const startTime = new Date(session.start_time).getTime();
  const endTime = session.end_time ? new Date(session.end_time).getTime() : Date.now();
  const timePlayedSeconds = Math.floor((endTime - startTime) / 1000);
  const speedBonus = timePlayedSeconds < level.time_limit
    ? Math.floor((level.time_limit - timePlayedSeconds) * 5)
    : 0;

  const finalEnergyRatio = session.energy / session.max_energy;
  const energyBonus = Math.floor(finalEnergyRatio * 500);

  let balancePenalty = 0;
  let totalBalanceDeviation = 0;
  let peakImbalance = 0;
  for (const op of operations) {
    const deviation = Math.abs(op.balance_after);
    totalBalanceDeviation += deviation;
    peakImbalance = Math.max(peakImbalance, deviation);
    if (deviation > level.balance_threshold) {
      balancePenalty += Math.floor((deviation - level.balance_threshold) * 2);
    }
  }

  const avgBalance = operations.length > 0
    ? totalBalanceDeviation / operations.length
    : 0;
  const balanceBonus = avgBalance < level.balance_threshold * 0.5
    ? 800
    : avgBalance < level.balance_threshold
      ? 400
      : 0;

  const totalEnergyUsed = operations.reduce((sum, op) => {
    const cost = ENERGY_COSTS[op.type] || 0;
    return sum + Math.max(0, cost);
  }, 0);

  const floorsTraveled = session.current_floor;
  const expectedEnergyPerFloor = ENERGY_COSTS.MOVE_UP;
  const expectedTotal = floorsTraveled * expectedEnergyPerFloor + operations.length * 2;
  const efficiencyBonus = expectedTotal > 0 && totalEnergyUsed <= expectedTotal * 1.2
    ? Math.floor((1 - totalEnergyUsed / (expectedTotal * 1.2)) * 600)
    : 0;

  let operationPenalty = 0;
  if (operations.length > level.target_floor * 4) {
    operationPenalty = (operations.length - level.target_floor * 4) * 3;
  }

  let alarmPenalty = 0;
  let alarmCount = 0;
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (Math.abs(op.balance_after) > level.balance_threshold * 1.5) {
      alarmCount++;
    }
  }
  alarmPenalty = alarmCount * 50;

  const penalty = balancePenalty + operationPenalty + alarmPenalty;

  const won = session.status === 'won';
  const winBonus = won ? level.base_score * 2 : 0;

  const rawTotal = baseScore + floorBonus + speedBonus + energyBonus + balanceBonus + efficiencyBonus + winBonus - penalty;
  const total = Math.max(0, rawTotal);

  return {
    baseScore,
    floorBonus,
    speedBonus,
    energyBonus,
    balanceBonus,
    efficiencyBonus,
    penalty,
    total,
  };
}

export function validateOperation(
  opType: Operation['type'],
  currentEnergy: number,
  currentBalance: number,
  threshold: number
): { valid: boolean; reason?: string } {
  const cost = ENERGY_COSTS[opType] || 0;
  if (cost > 0 && currentEnergy < cost) {
    return { valid: false, reason: `能量不足: 需要 ${cost}，当前 ${currentEnergy}` };
  }
  if (Math.abs(currentBalance) > threshold * 2 && opType !== 'EMERGENCY_BALANCE' && opType !== 'SWAP_WEIGHTS') {
    return { valid: false, reason: `平衡严重失衡，请先调整配重或使用紧急平衡！` };
  }
  return { valid: true };
}

export function applyOperationToBalance(
  opType: Operation['type'],
  currentBalance: number,
  payload: Record<string, unknown>
): number {
  let delta = 0;
  switch (opType) {
    case 'MOVE_UP':
      delta = (currentBalance > 0 ? 1 : -1) * 2;
      break;
    case 'MOVE_DOWN':
      delta = (currentBalance > 0 ? -1 : 1) * 1;
      break;
    case 'ADD_WEIGHT_LEFT':
      delta = -((payload.mass as number) || 5);
      break;
    case 'ADD_WEIGHT_RIGHT':
      delta = (payload.mass as number) || 5;
      break;
    case 'REMOVE_WEIGHT_LEFT':
      delta = (payload.mass as number) || 5;
      break;
    case 'REMOVE_WEIGHT_RIGHT':
      delta = -((payload.mass as number) || 5);
      break;
    case 'SWAP_WEIGHTS':
      delta = -currentBalance;
      break;
    case 'EMERGENCY_BALANCE':
      delta = -currentBalance * 0.8;
      break;
    case 'CHARGE_ENERGY':
      delta = 0;
      break;
  }
  return currentBalance + delta;
}

export function getEnergyCost(opType: Operation['type']): number {
  return ENERGY_COSTS[opType] || 0;
}
