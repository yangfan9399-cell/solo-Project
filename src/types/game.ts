export interface Position {
  row: number;
  col: number;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  photoUrl: string;
  era: string;
  points: number;
  size: number;
  position: Position;
  orientation: "horizontal" | "vertical";
  discovered: boolean;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  gridSize: number;
  turbidity: number;
  maxDives: number;
  sonarPerDive: number;
  relics: Relic[];
  requiredRelics: number;
  backgroundStory: string;
}

export interface CellState {
  sonarScanned: boolean;
  sonarStrength: number;
  excavated: boolean;
  hasRelic: boolean;
  relicId?: string;
  revealed: boolean;
}

export interface DiveState {
  diveNumber: number;
  sonarUsed: number;
  cellsExcavated: number;
}

export interface GameState {
  levelId: string;
  gridSize: number;
  cells: CellState[][];
  relics: Relic[];
  currentDive: DiveState;
  maxDives: number;
  sonarPerDive: number;
  turbidity: number;
  discoveredRelics: string[];
  score: number;
  gameStatus: "playing" | "won" | "lost";
  startTime: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  completedLevels: string[];
  highestScores: Record<string, number>;
  gamesPlayed: number;
  createdAt: number;
}

export interface GameHistory {
  id: string;
  playerId: string;
  levelId: string;
  score: number;
  won: boolean;
  divesUsed: number;
  relicsFound: number;
  timestamp: number;
}

export interface GameSession {
  id: string;
  playerId: string;
  levelId: string;
  gameState: GameState;
  history: HistoryAction[];
  status: "active" | "completed" | "abandoned";
  createdAt: number;
  updatedAt: number;
}

export type ActionType = "sonar" | "excavate" | "new_dive";

export interface HistoryAction {
  type: ActionType;
  position?: Position;
  timestamp: number;
  previousState: {
    cells: CellState[][];
    discoveredRelics: string[];
    score: number;
    currentDive: DiveState;
  };
}

export interface ScoreCalculationRequest {
  levelId: string;
  relicsFound: string[];
  divesUsed: number;
  totalSonarScans: number;
  timeElapsed: number;
}

export interface ScoreCalculationResponse {
  baseScore: number;
  relicBonus: number;
  efficiencyBonus: number;
  timeBonus: number;
  totalScore: number;
  rank: "S" | "A" | "B" | "C" | "D";
}
