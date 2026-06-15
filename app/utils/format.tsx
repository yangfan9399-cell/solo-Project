import type { WeatherType, StrikeOrderStep } from '~/types/game';

export const WEATHER_ICON: Record<WeatherType, string> = {
  sunny: '☀️',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
  foggy: '🌫️',
};

export const WEATHER_NAME: Record<WeatherType, string> = {
  sunny: '晴天',
  rainy: '雨天',
  snowy: '雪天',
  windy: '大风',
  foggy: '雾天',
};

export const PART_NAME_CN: Record<string, string> = {
  pendulum: '钟摆',
  gearA: '齿轮A',
  gearB: '齿轮B',
  gearC: '齿轮C',
  hammer: '报时锤',
  spring: '发条弹簧',
};

export const STRIKE_NAME_CN: Record<StrikeOrderStep, string> = {
  gearA: '齿轮A',
  gearB: '齿轮B',
  gearC: '齿轮C',
  hammer: '报时锤',
};

export const SCENARIO_NAME: Record<string, string> = {
  normal: '正常校准',
  wear_abnormal: '磨损挑战',
  rollback: '回滚修正',
};

export function classError(val: number, target = 2, tolerance = 3): 'good' | 'warn' | 'bad' {
  if (val <= target) return 'good';
  if (val <= tolerance) return 'warn';
  return 'bad';
}

export function classWear(val: number): 'low' | 'mid' | 'high' {
  if (val < 40) return 'low';
  if (val < 70) return 'mid';
  return 'high';
}

export function formatNumber(n: number, dec = 2): string {
  if (isNaN(n) || !isFinite(n)) return '—';
  return n.toFixed(dec);
}

export function formatSigned(n: number, dec = 2): string {
  if (isNaN(n) || !isFinite(n)) return '—';
  const s = n.toFixed(dec);
  return n > 0 ? `+${s}` : s;
}
