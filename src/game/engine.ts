import type {
  WaterClockConfig,
  EnvironmentState,
  CalibrationResult,
  Order,
  OrderWithStatus,
  GameLevel,
} from './types';
import { CUSTOMER_NAMES, ORDER_DESCRIPTIONS } from './levels';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getReputationLevelName(reputation: number): string {
  if (reputation >= 400) return '圣手';
  if (reputation >= 250) return '国工';
  if (reputation >= 150) return '名匠';
  if (reputation >= 80) return '师父';
  if (reputation >= 30) return '匠人';
  return '学徒';
}

export function calculateWaterFlowRate(
  holeDiameter: number,
  temperature: number
): number {
  const baseRate = Math.PI * Math.pow(holeDiameter / 2, 2) * 100;
  const tempFactor = 1 + (temperature - 20) * 0.015;
  return Math.max(0.1, baseRate * tempFactor);
}

export function simulateCalibration(
  config: WaterClockConfig,
  environment: EnvironmentState
): CalibrationResult {
  const { holeDiameter, scaleMarks, waterLevel, targetDuration } = config;
  const { temperature } = environment;

  const flowRate = calculateWaterFlowRate(holeDiameter, temperature);
  const totalWaterVolume = waterLevel * 1000;
  const emptyTime = totalWaterVolume / flowRate;

  const scaleFactor = scaleMarks / 100;
  const actualDuration = emptyTime * scaleFactor;

  const errorSeconds = actualDuration - targetDuration;
  const errorPercentage = (errorSeconds / targetDuration) * 100;
  const accuracy = Math.max(0, 1 - Math.abs(errorPercentage) / 100);
  const accuracyScore = Math.round(accuracy * 100);

  return {
    actualDuration: Math.round(actualDuration),
    targetDuration,
    errorSeconds: Math.round(errorSeconds),
    errorPercentage: Math.round(errorPercentage * 100) / 100,
    accuracyScore,
    passed: accuracy >= 0.7,
  };
}

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

export function generateOrder(
  level: GameLevel,
  dayIndex: number,
  orderIndex: number
): Order {
  const customerType = level.customerTypes[
    Math.floor(Math.random() * level.customerTypes.length)
  ];
  const customerName = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
  const description = ORDER_DESCRIPTIONS[Math.floor(Math.random() * ORDER_DESCRIPTIONS.length)];

  let baseDuration: number;
  let tolerance: number;
  let rewardCopper: number;
  let reputationReward: number;
  let difficulty: Order['difficulty'];

  switch (customerType) {
    case 'farmer':
      baseDuration = randomIntInRange(60, 180);
      tolerance = 30;
      rewardCopper = randomIntInRange(10, 25);
      reputationReward = 2;
      difficulty = 'easy';
      break;
    case 'merchant':
      baseDuration = randomIntInRange(120, 300);
      tolerance = 15;
      rewardCopper = randomIntInRange(20, 50);
      reputationReward = 4;
      difficulty = 'medium';
      break;
    case 'scholar':
      baseDuration = randomIntInRange(180, 420);
      tolerance = 10;
      rewardCopper = randomIntInRange(30, 70);
      reputationReward = 6;
      difficulty = 'medium';
      break;
    case 'official':
      baseDuration = randomIntInRange(300, 600);
      tolerance = 8;
      rewardCopper = randomIntInRange(60, 120);
      reputationReward = 10;
      difficulty = 'hard';
      break;
    case 'noble':
      baseDuration = randomIntInRange(240, 480);
      tolerance = 5;
      rewardCopper = randomIntInRange(80, 200);
      reputationReward = 15;
      difficulty = 'hard';
      break;
    default:
      baseDuration = randomIntInRange(60, 180);
      tolerance = 30;
      rewardCopper = 15;
      reputationReward = 2;
      difficulty = 'easy';
  }

  if (level.difficulty === 'medium') {
    tolerance = Math.max(3, Math.floor(tolerance * 0.8));
    rewardCopper = Math.floor(rewardCopper * 1.2);
  } else if (level.difficulty === 'hard') {
    tolerance = Math.max(2, Math.floor(tolerance * 0.6));
    rewardCopper = Math.floor(rewardCopper * 1.5);
    reputationReward = Math.floor(reputationReward * 1.3);
  }

  return {
    id: `order-${dayIndex}-${orderIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    customerName,
    customerType,
    targetDuration: baseDuration,
    targetTolerance: tolerance,
    rewardCopper,
    reputationReward,
    deadline: dayIndex + 2,
    dayIndex,
    difficulty,
    description,
  };
}

export function generateDailyOrders(level: GameLevel, dayIndex: number): OrderWithStatus[] {
  const orders: OrderWithStatus[] = [];
  for (let i = 0; i < level.ordersPerDay; i++) {
    const order = generateOrder(level, dayIndex, i);
    orders.push({
      ...order,
      status: 'pending',
    });
  }
  return orders;
}

export function advanceDayTemperature(
  currentTemp: number,
  level: GameLevel
): number {
  const change = randomInRange(
    -level.dailyTemperatureChange,
    level.dailyTemperatureChange
  );
  return clamp(
    currentTemp + change,
    level.temperatureRange[0],
    level.temperatureRange[1]
  );
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(Math.abs(seconds) / 60);
  const s = Math.floor(Math.abs(seconds) % 60);
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${m}分${s.toString().padStart(2, '0')}秒`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}分${s.toString().padStart(2, '0')}秒`;
}
