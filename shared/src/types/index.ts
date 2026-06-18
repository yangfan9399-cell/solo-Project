export interface Position {
  x: number;
  y: number;
}

export enum TileType {
  START = "START",
  END = "END",
  PATH = "PATH",
  OBSTACLE = "OBSTACLE",
  CORAL_BELL = "CORAL_BELL",
  SWITCH = "SWITCH",
  HAZARD = "HAZARD",
  REWARD = "REWARD",
  TRANSLATE = "TRANSLATE",
  OVERWRITE = "OVERWRITE"
}

export interface MapTile {
  type: TileType;
  id: string;
  label?: string;
  note?: string;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: MapTile[][];
  start: Position;
  end: Position;
  description: string;
}

export type GameEventType = "risk" | "reward" | "translate" | "overwrite" | "hidden";

export type GameEventTriggerType = "position" | "step" | "value";

export interface GameEventTrigger {
  type: GameEventTriggerType;
  position?: Position;
  step?: number;
  value?: {
    field: keyof GameField;
    operator: ">" | "<" | ">=" | "<=" | "==" | "!=";
    threshold: number;
  };
}

export type GameEventScope = "si" | "shen" | "wu" | "all";

export interface GameEventEffect {
  field?: keyof GameField;
  delta?: number;
  setValue?: number;
  customLogic?: string;
}

export interface GameEvent {
  id: string;
  type: GameEventType;
  trigger: GameEventTrigger;
  effect: GameEventEffect;
  message: string;
  scope: GameEventScope;
}

export interface GameField {
  trackSwitchValue: number;
  translationSlot: number;
  overwriteMark: number;
  siRisk: number;
  shenReward: number;
  wuFailFactor: number;
}

export interface GameStep {
  stepIndex: number;
  positionFrom: Position;
  positionTo: Position;
  fieldBefore: GameField;
  fieldAfter: GameField;
  triggeredEventIds: string[];
  timestamp: number;
}

export type GameLevelId = "si" | "shen" | "wu";

export enum WinFormula {
  REACH_END_WITH_REWARD = "REACH_END_WITH_REWARD",
  NO_RISK_AND_REACH = "NO_RISK_AND_REACH",
  HIDDEN_TRIGGERED_AND_END = "HIDDEN_TRIGGERED_AND_END"
}

export interface WinFormulaParams {
  minReward?: number;
  maxRisk?: number;
  requiredHiddenEventIds?: string[];
}

export interface GameLevel {
  id: GameLevelId;
  name: string;
  map: GameMap;
  initialField: GameField;
  events: GameEvent[];
  winFormula: WinFormula;
  winFormulaParams: WinFormulaParams;
  description: string;
  tutorial?: string;
}

export interface ReplayState {
  levelId: GameLevelId;
  steps: GameStep[];
  currentStepIndex: number;
  createdAt: number;
  savedAt: number;
}

export interface SettlementResult {
  success: boolean;
  finalField: GameField;
  totalReward: number;
  riskLevel: number;
  formulaHit: boolean;
  reason: string;
  debugTrace: string[];
}
