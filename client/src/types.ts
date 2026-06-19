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

export interface HistoryStep {
  stepIndex: number;
  eventId: string | null;
  timestamp: number;
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

export interface StageInfo {
  id: GameStageId;
  name: string;
  description: string;
  maxSteps: number;
  winCondition: { type: string; target: number };
  hasHidden: boolean;
}
