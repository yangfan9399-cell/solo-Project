export interface Player {
  id: string;
  name: string;
  avatar?: string;
  totalScore: number;
  levelsCompleted: number;
  totalPiecesPlaced: number;
  perfectRepairs: number;
  createdAt: number;
  updatedAt: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'master';
  gridRows: number;
  gridCols: number;
  layers: number;
  timeLimit: number;
  baseScore: number;
  era: string;
  location: string;
  patternType: string;
}

export interface PuzzlePiece {
  id: string;
  levelId: number;
  row: number;
  col: number;
  layer: number;
  groupId: string;
  patternData: string;
  baseRotation: number;
}

export interface Crack {
  id: string;
  levelId: number;
  pieceIdA: string;
  pieceIdB: string;
  points: string;
  severity: number;
  type: 'edge' | 'corner' | 'diagonal';
}

export interface GameSession {
  id: string;
  playerId: string;
  levelId: number;
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  startTime: number;
  endTime?: number;
  currentScore: number;
  stability: number;
  piecesPlaced: number;
  hintsUsed: number;
  undosUsed: number;
}

export interface Operation {
  id: string;
  sessionId: string;
  type: 'place' | 'remove' | 'rotate' | 'group' | 'ungroup';
  pieceId: string;
  beforeState: string;
  afterState: string;
  timestamp: number;
  sequence: number;
}

export interface ScoreRecord {
  id: string;
  sessionId: string;
  playerId: string;
  levelId: number;
  finalScore: number;
  accuracyBonus: number;
  speedBonus: number;
  stabilityBonus: number;
  layerBonus: number;
  deduction: number;
  rank: 'S' | 'A' | 'B' | 'C' | 'D';
  createdAt: number;
}

export interface RepairReport {
  id: string;
  sessionId: string;
  playerId: string;
  levelId: number;
  overallCondition: number;
  cracksRepaired: number;
  cracksRemaining: number;
  pieceIntegrity: number;
  alignmentAccuracy: number;
  stabilityIndex: number;
  historicalValue: number;
  comment: string;
  createdAt: number;
}

export interface PlacedPieceState {
  pieceId: string;
  row: number;
  col: number;
  layer: number;
  rotation: number;
  groupId?: string;
  isPlaced: boolean;
  placedAt?: number;
}
