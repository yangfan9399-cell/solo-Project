export type GameStageId = 'yin' | 'ding' | 'gui';

export interface GameSlot {
  id: number;
  lit: boolean;
  value: number;
}

export interface PatrolTrace {
  position: number;
  direction: 1 | -1;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'repair' | 'risk' | 'reward' | 'special';
  cost: number;
  effect: {
    mergeValue?: number;
    slots?: { lit?: boolean; value?: number; target?: 'all' | 'random' | 'first-dark' };
    patrol?: number;
    riskYin?: number;
    rewardDing?: number;
    failGui?: number;
  };
}

export interface StepDelta {
  eventName: string | null;
  isSkip: boolean;
  mergeValue: number;
  riskYin: number;
  rewardDing: number;
  failGui: number;
  slotsLit: number;
  patrolMove: number;
}

export interface GameStep {
  stepIndex: number;
  eventId: string | null;
  state: GameState;
  timestamp: number;
  delta: StepDelta;
}

export interface GameState {
  stageId: GameStageId;
  stepIndex: number;
  mergeValue: number;
  slots: GameSlot[];
  patrol: PatrolTrace;
  riskYin: number;
  rewardDing: number;
  failGui: number;
  availableEvents: GameEvent[];
  isGameOver: boolean;
  isWin: boolean;
  failReason?: string;
  hiddenTriggered?: boolean;
}

export interface GameSettlement {
  stageId: GameStageId;
  isWin: boolean;
  finalMergeValue: number;
  stepsUsed: number;
  score: number;
  rank: string;
  details: string[];
  failReason?: string;
  hiddenBonus?: boolean;
}

export interface GameSession {
  sessionId: string;
  currentState: GameState;
  history: GameStep[];
  createdAt: number;
  updatedAt: number;
}

export interface StageConfig {
  id: GameStageId;
  name: string;
  description: string;
  initialMergeValue: number;
  slotCount: number;
  initialLitSlots: number;
  patrolStart: number;
  patrolSpeed: number;
  riskYinThreshold: number;
  rewardDingThreshold: number;
  failGuiThreshold: number;
  winCondition: {
    type: 'merge-value' | 'all-lit' | 'patrol-cycle' | 'hidden';
    target: number;
  };
  maxSteps: number;
  eventPool: GameEvent[];
  eventsPerStep: number;
  hiddenCondition?: {
    type: 'merge-threshold' | 'no-risk' | 'perfect-lit';
    value: number;
  };
}
