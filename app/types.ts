export type PlayerId = string;
export type LevelId = string;
export type SessionId = string;
export type OperationId = string;

export interface Player {
  id: PlayerId;
  name: string;
  createdAt: number;
  lastPlayedAt: number;
}

export type ExhibitType = "painting" | "sculpture" | "relic" | "photograph";

export interface ExhibitDef {
  id: string;
  type: ExhibitType;
  name: string;
  lightMin: number;
  lightMax: number;
  sensitivity: number;
  size: { w: number; h: number };
}

export interface PlacedExhibit {
  id: string;
  defId: string;
  x: number;
  y: number;
}

export interface LightSource {
  id: string;
  x: number;
  y: number;
  intensity: number;
  radius: number;
}

export interface LevelConfig {
  id: LevelId;
  name: string;
  description: string;
  gridW: number;
  gridH: number;
  availableExhibits: string[];
  availableLights: number;
  targetScore: number;
  maxLightTotal: number;
  pathCells: { x: number; y: number }[];
  entrance: { x: number; y: number };
  exit: { x: number; y: number };
}

export type OperationType =
  | "PLACE_EXHIBIT"
  | "REMOVE_EXHIBIT"
  | "MOVE_EXHIBIT"
  | "PLACE_LIGHT"
  | "REMOVE_LIGHT"
  | "ADJUST_LIGHT";

export interface Operation {
  id: OperationId;
  sessionId: SessionId;
  type: OperationType;
  data: Record<string, unknown>;
  timestamp: number;
}

export type SessionStatus = "in_progress" | "completed" | "failed";

export interface GameSession {
  id: SessionId;
  playerId: PlayerId;
  levelId: LevelId;
  status: SessionStatus;
  score: number;
  exhibits: PlacedExhibit[];
  lights: LightSource[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
}

export interface HeatmapCell {
  x: number;
  y: number;
  intensity: number;
}

export interface ScoreBreakdown {
  exhibitSafety: number;
  lightEfficiency: number;
  pathVisibility: number;
  placementQuality: number;
  penalty: number;
  total: number;
}
