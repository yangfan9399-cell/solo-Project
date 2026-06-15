import type {
  WeatherType,
  PartName,
  StrikeOrderStep,
} from '~/types/game';

export const PARTS: PartName[] = ['pendulum', 'gearA', 'gearB', 'gearC', 'hammer', 'spring'];

export const WEATHER_CONFIG: Record<WeatherType, { temp: [number, number]; expansion: number; wearMultiplier: number; description: string }> = {
  sunny:  { temp: [20, 30], expansion: 0.000012,  wearMultiplier: 1.0,  description: '晴天：温度适中，金属轻微膨胀' },
  rainy:  { temp: [10, 18], expansion: 0.000008,  wearMultiplier: 1.3,  description: '雨天：潮湿阴冷，金属收缩，磨损加速' },
  snowy:  { temp: [-5, 3],  expansion: 0.000003,  wearMultiplier: 1.8,  description: '雪天：严寒下金属收缩严重，磨损剧增' },
  windy:  { temp: [5, 15],  expansion: 0.000007,  wearMultiplier: 1.5,  description: '大风：结构受力不均，部件摩擦加剧' },
  foggy:  { temp: [8, 15],  expansion: 0.000009,  wearMultiplier: 1.2,  description: '雾天：高湿度加速氧化，锈蚀风险高' },
};

export const VALID_STRIKE_ORDERS: StrikeOrderStep[][] = [
  ['gearA', 'gearB', 'gearC', 'hammer'],
  ['gearB', 'gearA', 'gearC', 'hammer'],
  ['gearA', 'gearC', 'gearB', 'hammer'],
  ['gearC', 'gearB', 'gearA', 'hammer'],
  ['gearB', 'gearC', 'gearA', 'hammer'],
];

export const BASE_PENDULUM_LENGTH = 994;
export const DEFAULT_GEAR_TEETH = { gearA: 48, gearB: 36, gearC: 24 };
export const MAX_DAYS = 7;
export const TARGET_ERROR_SECONDS = 2.0;
export const TOLERANCE_SECONDS = 3.0;
export const WEAR_PER_DAY_BASE = 3.5;
export const LUBRICATION_WEAR_REDUCTION = 0.55;

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  const p = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * p) / p;
}

export function pickWeather(scenario: 'normal' | 'wear_abnormal' | 'rollback', day: number): WeatherType {
  const weathers: WeatherType[] = ['sunny', 'rainy', 'snowy', 'windy', 'foggy'];
  if (scenario === 'normal') {
    return day <= 2 ? 'sunny' : weathers[randomInt(0, weathers.length - 1)];
  }
  if (scenario === 'wear_abnormal') {
    if (day <= 2) return 'sunny';
    if (day === 3) return 'snowy';
    if (day === 4) return 'snowy';
    return weathers[randomInt(3, 4)];
  }
  if (scenario === 'rollback') {
    if (day <= 3) return 'sunny';
    if (day === 4) return 'rainy';
    if (day === 5) return 'snowy';
    return weathers[randomInt(0, weathers.length - 1)];
  }
  return 'sunny';
}

export function getTemperature(weather: WeatherType): number {
  const cfg = WEATHER_CONFIG[weather];
  return randomFloat(cfg.temp[0], cfg.temp[1], 1);
}

export function calculateThermalExpansion(length: number, tempDelta: number, coeff: number): number {
  return length * (1 + coeff * tempDelta);
}

export function calculateIdealPendulumLength(targetSecondsPerBeat = 2.0): number {
  const g = 9.80665;
  return (g * targetSecondsPerBeat * targetSecondsPerBeat) / (4 * Math.PI * Math.PI) * 1000;
}

export function calculateErrorFromPendulum(
  actualLength: number,
  idealLength: number
): number {
  const ratio = Math.sqrt(actualLength / idealLength);
  const secondsPerDay = 86400;
  const error = (1 - 1 / ratio) * secondsPerDay;
  return Math.round(error * 100) / 100;
}

export function calculateErrorFromGearRatio(
  gears: { gearA: number; gearB: number; gearC: number },
  targetRatios = { a: 48, b: 36, c: 24 }
): number {
  const actualRatio = (gears.gearA / gears.gearB) * (gears.gearB / gears.gearC);
  const targetRatio = (targetRatios.a / targetRatios.b) * (targetRatios.b / targetRatios.c);
  const delta = Math.abs(actualRatio - targetRatio) / targetRatio;
  return Math.round(delta * 86400 * 0.05 * 100) / 100;
}

export function calculateErrorFromLubrication(lubricationLevel: number): number {
  if (lubricationLevel >= 85) return 0;
  const error = (100 - lubricationLevel) * 0.15;
  return Math.round(error * 100) / 100;
}

export function calculateErrorFromStrikeOrder(
  order: StrikeOrderStep[],
  idealOrder: StrikeOrderStep[] = VALID_STRIKE_ORDERS[0]
): number {
  let mismatches = 0;
  for (let i = 0; i < order.length; i++) {
    if (order[i] !== idealOrder[i]) mismatches++;
  }
  return Math.round(mismatches * 4.5 * 100) / 100;
}

export function calculateErrorFromWear(
  partWears: Record<PartName, number>
): number {
  let totalError = 0;
  for (const part of PARTS) {
    const wear = partWears[part];
    if (wear > 70) totalError += (wear - 70) * 0.25;
    else if (wear > 40) totalError += (wear - 40) * 0.08;
  }
  return Math.round(totalError * 100) / 100;
}

export function calculateTotalError(params: {
  actualPendulumLength: number;
  idealPendulumLength: number;
  gears: { gearA: number; gearB: number; gearC: number };
  lubricationLevel: number;
  strikeOrder: StrikeOrderStep[];
  partWears: Record<PartName, number>;
}): number {
  const e1 = calculateErrorFromPendulum(params.actualPendulumLength, params.idealPendulumLength);
  const e2 = calculateErrorFromGearRatio(params.gears);
  const e3 = calculateErrorFromLubrication(params.lubricationLevel);
  const e4 = calculateErrorFromStrikeOrder(params.strikeOrder);
  const e5 = calculateErrorFromWear(params.partWears);
  return Math.round((e1 + e2 + e3 + e4 + e5) * 100) / 100;
}

export function calculateWearForDay(
  currentWear: Record<PartName, number>,
  weather: WeatherType,
  lubricationLevel: number,
  scenario: 'normal' | 'wear_abnormal' | 'rollback',
  day: number
): Record<PartName, number> {
  const wearMultiplier = WEATHER_CONFIG[weather].wearMultiplier;
  const lubFactor = lubricationLevel >= 85
    ? LUBRICATION_WEAR_REDUCTION
    : lubricationLevel >= 60
    ? 0.8
    : 1.0;
  const scenarioMultiplier =
    scenario === 'wear_abnormal' ? (day >= 3 ? 1.8 : 1.0) :
    scenario === 'rollback' ? (day >= 5 ? 1.5 : 1.0) : 1.0;

  const result: Record<PartName, number> = {} as Record<PartName, number>;
  for (const part of PARTS) {
    const partWearFactor =
      part === 'pendulum' ? 1.2 :
      part === 'hammer' ? 1.5 :
      part === 'spring' ? 1.3 : 1.0;
    const delta = WEAR_PER_DAY_BASE * wearMultiplier * lubFactor * partWearFactor * scenarioMultiplier;
    result[part] = Math.min(100, Math.round((currentWear[part] + delta) * 100) / 100);
  }
  return result;
}

export function repairPart(wear: number): number {
  return Math.max(0, Math.round((wear - 75) * 100) / 100);
}

export function calculateScore(params: {
  dailyErrors: number[];
  adjustmentsCount: number;
  repairCount: number;
  finalError: number;
  targetError: number;
}): number {
  const { dailyErrors, adjustmentsCount, repairCount, finalError, targetError } = params;
  let score = 1000;
  for (const err of dailyErrors) {
    if (err <= targetError) score += 50;
    else if (err <= TOLERANCE_SECONDS) score += 20;
    else if (err <= 10) score -= 15;
    else score -= Math.min(80, (err - 10) * 2);
  }
  score -= adjustmentsCount * 5;
  score -= repairCount * 20;
  if (finalError <= targetError) score += 300;
  else if (finalError <= TOLERANCE_SECONDS) score += 150;
  else score -= 200;
  return Math.max(0, Math.round(score));
}

export function generateUuid(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export function serializeOrder(order: StrikeOrderStep[]): string {
  return order.join(',');
}

export function deserializeOrder(s: string): StrikeOrderStep[] {
  return s.split(',') as StrikeOrderStep[];
}
