export interface Point {
  x: number;
  y: number;
}

export type FoldType = "flat" | "valley" | "mountain" | "tube" | "triangle";

export interface PaperSegment {
  id: string;
  start: Point;
  end: Point;
  foldType: FoldType;
  thickness: number;
  width: number;
  strength: number;
  length: number;
}

export interface Bridge {
  id: string;
  name: string;
  segments: PaperSegment[];
  totalPaperLength: number;
  createdAt: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  span: number;
  maxPaperLength: number;
  paperWidth: number;
  paperThickness: number;
  paperStrength: number;
  targetWeight: number;
  difficulty: "easy" | "medium" | "hard";
  leftAnchor: Point;
  rightAnchor: Point;
}

export type GameStatus = "designing" | "testing" | "success" | "failed";

export interface GameSession {
  id: string;
  playerId: string;
  levelId: number;
  status: GameStatus;
  bridge: Bridge | null;
  maxWeightHeld: number;
  breakPoint: Point | null;
  breakSegmentId: string | null;
  score: number;
  startTime: number;
  endTime: number | null;
  operationHistory: Operation[];
  historyStack: Bridge[];
  historyIndex: number;
}

export type OperationType =
  | "add_segment"
  | "remove_segment"
  | "move_segment"
  | "change_fold"
  | "set_bridge_name"
  | "initial"
  | "snapshot";

export interface Operation {
  id: string;
  type: OperationType;
  timestamp: number;
  data: Record<string, unknown>;
  snapshot: Bridge;
}

export interface Player {
  id: string;
  name: string;
  createdAt: number;
  totalScore: number;
  levelsCompleted: number;
  avatar?: string;
}

export interface LeaderboardEntry {
  id: number;
  playerName: string;
  levelId: number;
  score: number;
  maxWeight: number;
  createdAt: number;
}

export interface PhysicsResult {
  success: boolean;
  maxWeight: number;
  breakPoint: Point | null;
  breakSegmentId: string | null;
  stressMap: { segmentId: string; maxStress: number }[];
}

export interface ShareableBridge {
  id: string;
  bridge: Bridge;
  levelId: number;
  maxWeight: number;
  score: number;
  playerName: string;
  createdAt: number;
}
