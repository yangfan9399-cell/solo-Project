export type GameLevelId = 'wu' | 'ding' | 'wei';

export interface Position {
  x: number;
  y: number;
}

export interface Cell {
  id: string;
  position: Position;
  type: 'empty' | 'wall' | 'goal' | 'switch' | 'door' | 'crystal' | 'mechanism';
  label?: string;
  activated?: boolean;
  linkedMechanismId?: string;
}

export interface PlayerState {
  position: Position;
  crystals: number;
  switchesActivated: string[];
}

export interface GameBoard {
  width: number;
  height: number;
  cells: Cell[];
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  effect: {
    lineValue?: number;
    measureSlot?: number;
    balanceMark?: number;
    wuRisk?: number;
    dingReward?: number;
    weiFailFactor?: number;
    crystals?: number;
  };
  choices?: {
      label: string;
      effect: GameEvent['effect'];
    }[];
  trigger?: 'step' | 'crystal' | 'switch' | 'manual';
  cooldown?: number;
}

export interface GameState {
  levelId: GameLevelId;
  turn: number;
  lineValue: number;
  measureSlot: number;
  balanceMark: number;
  wuRisk: number;
  dingReward: number;
  weiFailFactor: number;
  player1: PlayerState;
  player2: PlayerState;
  board: GameBoard;
  events: GameEvent[];
  eventHistory: string[];
  status: 'playing' | 'win' | 'lose';
  hiddenTriggered: boolean;
}

export interface ReplayStep {
  step: number;
  state: GameState;
  action: {
    player: 1 | 2;
    action: 'move' | 'activate' | 'event';
    direction?: Position | string;
    description: string;
  };
  timestamp: number;
}

export interface GameResult {
  levelId: GameLevelId;
  won: boolean;
  finalLineValue: number;
  finalBalanceMark: number;
  dingReward: number;
  wuRisk: number;
  weiFailFactor: number;
  totalSteps: number;
  cooperationScore: number;
  hiddenTriggered: boolean;
  details: string;
}
