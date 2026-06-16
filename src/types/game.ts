export interface Player {
  id: number;
  name: string;
  avatar: string;
  total_score: number;
  games_played: number;
  games_won: number;
  created_at: string;
  updated_at: string;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: number;
  target_floor: number;
  initial_energy: number;
  max_energy: number;
  balance_threshold: number;
  time_limit: number;
  base_score: number;
  created_at: string;
}

export interface GameSession {
  id: number;
  player_id: number;
  level_id: number;
  status: 'playing' | 'won' | 'lost' | 'abandoned';
  score: number;
  current_floor: number;
  target_floor: number;
  energy: number;
  max_energy: number;
  balance: number;
  balance_threshold: number;
  leftWeights: number[];
  rightWeights: number[];
  start_time: string;
  end_time: string | null;
  created_at: string;
  updated_at: string;
}

export type OperationType =
  | 'MOVE_UP'
  | 'MOVE_DOWN'
  | 'ADD_WEIGHT_LEFT'
  | 'ADD_WEIGHT_RIGHT'
  | 'REMOVE_WEIGHT_LEFT'
  | 'REMOVE_WEIGHT_RIGHT'
  | 'SWAP_WEIGHTS'
  | 'CHARGE_ENERGY'
  | 'EMERGENCY_BALANCE';

export interface Operation {
  id: number;
  session_id: number;
  type: OperationType;
  payload: Record<string, unknown>;
  floor_before: number;
  floor_after: number;
  balance_before: number;
  balance_after: number;
  energy_before: number;
  energy_after: number;
  leftWeightsBefore: number[];
  leftWeightsAfter: number[];
  rightWeightsBefore: number[];
  rightWeightsAfter: number[];
  timestamp: string;
  sequence: number;
}

export interface WeightBlock {
  id: string;
  mass: number;
  side: 'left' | 'right' | 'storage';
  color: string;
}

export interface GameState {
  sessionId: number;
  levelId: number;
  playerId: number;
  currentFloor: number;
  targetFloor: number;
  energy: number;
  maxEnergy: number;
  leftWeights: WeightBlock[];
  rightWeights: WeightBlock[];
  storageWeights: WeightBlock[];
  balance: number;
  balanceThreshold: number;
  timeRemaining: number;
  operations: Operation[];
  status: 'playing' | 'won' | 'lost';
  isAlarmActive: boolean;
}

export interface ScoreBreakdown {
  baseScore: number;
  floorBonus: number;
  speedBonus: number;
  energyBonus: number;
  balanceBonus: number;
  efficiencyBonus: number;
  penalty: number;
  total: number;
}

export interface LeaderboardEntry {
  rank: number;
  player_name: string;
  player_id: number;
  score: number;
  level_id: number;
  level_name: string;
  time_played: number;
  created_at: string;
}
