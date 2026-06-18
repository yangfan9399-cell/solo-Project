export type GamePhase = 'wu' | 'ding' | 'ji';

export interface LanternNode {
  id: string;
  x: number;
  y: number;
  name: string;
  initialMeasurement: number;
  type: 'beacon' | 'tower' | 'buoy' | 'gate';
}

export interface MergeSlot {
  id: string;
  name: string;
  capacity: number;
  resourceType: 'candle' | 'oil' | 'breeze' | 'talisman';
  requiredForId?: string;
}

export interface GameMap {
  phase: GamePhase;
  phaseName: string;
  width: number;
  height: number;
  nodes: LanternNode[];
  slots: MergeSlot[];
  background: string;
}

export interface GameEvent {
  id: string;
  phase: GamePhase;
  round: number;
  type: 'blessing' | 'hazard' | 'mystery' | 'choice';
  title: string;
  description: string;
  effects: EventEffect[];
  choices?: EventChoice[];
}

export interface EventEffect {
  target: 'measurement' | 'slot' | 'stain' | 'wuRisk' | 'dingReward' | 'jiFailure' | 'resource';
  targetId?: string;
  delta: number;
}

export interface EventChoice {
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface StainMark {
  id: string;
  nodeId: string;
  intensity: number;
  round: number;
}

export interface ResourceAllocation {
  slotId: string;
  amount: number;
}

export interface StepRecord {
  stepIndex: number;
  round: number;
  allocations: ResourceAllocation[];
  eventId?: string;
  choiceIndex?: number;
  measurements: Record<string, number>;
  wuRisk: number;
  dingReward: number;
  jiFailure: number;
  stains: StainMark[];
  remainingResources: Record<string, number>;
  timestamp: number;
}

export interface SettleResult {
  phase: GamePhase;
  phaseName: string;
  victory: boolean;
  finalScore: number;
  measurementScore: number;
  wuRiskPenalty: number;
  dingRewardBonus: number;
  jiFailurePenalty: number;
  stainPenalty: number;
  efficiencyBonus: number;
  hiddenConditionTriggered: boolean;
  hiddenConditionName?: string;
  stepsCount: number;
  details: SettleDetailItem[];
}

export interface SettleDetailItem {
  label: string;
  value: number;
  weight: number;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  maxRounds: number;
  measurements: Record<string, number>;
  slotFill: Record<string, number>;
  resources: Record<string, number>;
  wuRisk: number;
  dingReward: number;
  jiFailure: number;
  stains: StainMark[];
  steps: StepRecord[];
  currentEvent?: GameEvent;
  eventHistory: string[];
  hiddenFlags: Record<string, boolean>;
  gameOver: boolean;
}

export interface PhaseConfig {
  phase: GamePhase;
  phaseName: string;
  description: string;
  teaching: boolean;
  maxRounds: number;
  initialResources: Record<string, number>;
  victoryThreshold: number;
  hiddenCondition?: HiddenCondition;
  eventPool: string[];
  winFormula: (s: GameState, steps: StepRecord[]) => { score: number; victory: boolean; details: SettleDetailItem[]; hiddenTriggered: boolean; hiddenName?: string };
}

export interface HiddenCondition {
  name: string;
  description: string;
  check: (s: GameState, steps: StepRecord[]) => boolean;
  bonus: number;
}
