export type LevelId = 'wu' | 'ding' | 'wei';

export interface GameField {
  traceValue: number;
  measureSlot: number;
  balanceMark: number;
  wuRisk: number;
  dingReward: number;
  weiFailFactor: number;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  category: 'trace' | 'measure' | 'balance' | 'risk' | 'reward' | 'fail';
  effect: Partial<GameField>;
  cost: number;
}

export interface GameStep {
  stepIndex: number;
  timestamp: number;
  eventId: string;
  fieldAfter: GameField;
  note?: string;
}

export interface LevelConfig {
  id: LevelId;
  name: string;
  subtitle: string;
  description: string;
  initialField: GameField;
  targetCondition: (field: GameField) => boolean;
  targetText: string;
  failCondition: (field: GameField) => boolean;
  failText: string;
  availableEvents: GameEvent[];
  maxSteps: number;
  mapNodes: { id: string; x: number; y: number; label: string; type: 'start' | 'mid' | 'end' | 'hidden' }[];
  mapPaths: [string, string][];
  hiddenCondition?: (field: GameField, steps: GameStep[]) => boolean;
  hiddenText?: string;
}

export interface GameState {
  levelId: LevelId;
  currentField: GameField;
  steps: GameStep[];
  isFinished: boolean;
  isWin: boolean;
  hiddenTriggered: boolean;
  message: string;
}

export interface Settlement {
  levelId: LevelId;
  isWin: boolean;
  hiddenTriggered: boolean;
  finalTraceValue: number;
  totalSteps: number;
  rewardScore: number;
  riskPenalty: number;
  efficiencyBonus: number;
  totalScore: number;
  stepReview: { step: number; eventId: string; contribution: number }[];
  detailText: string;
}
