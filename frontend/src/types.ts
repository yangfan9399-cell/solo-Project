export type CellType = 'empty' | 'wall' | 'start' | 'end' | 'event' | 'trap' | 'reward' | 'hidden';

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  lit: boolean;
  groove?: string;
  reverseMark?: boolean;
  eventId?: string;
}

export type EventType = 'reward' | 'risk' | 'failure' | 'info' | 'hidden';

export interface GameEvent {
  id: string;
  name: string;
  type: EventType;
  description: string;
  effect: {
    lightValue?: number;
    riskA?: number;
    rewardD?: number;
    failureB?: number;
    steps?: number;
  };
}

export interface GameField {
  lightValue: number;
  grooveTracing: string[];
  reverseMark: number;
  riskA: number;
  rewardD: number;
  failureB: number;
}

export type DifficultyKey = 'A' | 'D' | 'B';

export interface MazeConfig {
  key: DifficultyKey;
  name: string;
  description: string;
  width: number;
  height: number;
  grid: Cell[][];
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  events: Record<string, GameEvent>;
  initialField: GameField;
  winCondition: string;
  loseCondition: string;
  hiddenTrigger?: {
    type: 'path_count' | 'light_threshold' | 'reverse_mark';
    value: number;
    eventId: string;
  };
}

export interface StepRecord {
  step: number;
  position: { x: number; y: number };
  field: GameField;
  eventsTriggered: string[];
  timestamp: number;
}

export interface GameSession {
  id: string;
  mazeKey: DifficultyKey;
  currentPos: { x: number; y: number };
  path: { x: number; y: number }[];
  field: GameField;
  steps: StepRecord[];
  status: 'playing' | 'won' | 'lost';
  hiddenTriggered: boolean;
  startTime: number;
}

export interface Settlement {
  finalScore: number;
  lightScore: number;
  stepScore: number;
  bonusScore: number;
  grade: string;
  details: string[];
}

export interface MazeMeta {
  key: DifficultyKey;
  name: string;
  description: string;
}
