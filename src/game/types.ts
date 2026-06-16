export type HoleSize = number;
export type ScaleMark = number;

export interface WaterClockConfig {
  holeDiameter: number;
  scaleMarks: number;
  waterLevel: number;
  targetDuration: number;
}

export interface EnvironmentState {
  temperature: number;
  humidity: number;
}

export interface CalibrationResult {
  actualDuration: number;
  targetDuration: number;
  errorSeconds: number;
  errorPercentage: number;
  accuracyScore: number;
  passed: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerType: 'noble' | 'merchant' | 'scholar' | 'farmer' | 'official';
  targetDuration: number;
  targetTolerance: number;
  rewardCopper: number;
  reputationReward: number;
  deadline: number;
  dayIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'completed' | 'failed' | 'expired';

export interface OrderWithStatus extends Order {
  status: OrderStatus;
  actualResult?: CalibrationResult;
  completedAt?: number;
}

export interface PlayerProfile {
  id: string;
  name: string;
  createdAt: number;
  copper: number;
  reputation: number;
  reputationLevel: number;
  totalOrdersCompleted: number;
  totalOrdersFailed: number;
  bestAccuracy: number;
  currentLevel: number;
  completedLevels: number[];
}

export interface GameLevel {
  id: number;
  name: string;
  description: string;
  days: number;
  startCopper: number;
  startReputation: number;
  temperatureRange: [number, number];
  dailyTemperatureChange: number;
  ordersPerDay: number;
  customerTypes: Order['customerType'][];
  difficulty: 'easy' | 'medium' | 'hard';
  passCondition: {
    minReputation: number;
    minCopper: number;
    minAccuracy: number;
  };
}

export interface GameSession {
  id: string;
  playerId: string;
  levelId: number;
  startedAt: number;
  currentDay: number;
  totalDays: number;
  copper: number;
  reputation: number;
  orders: OrderWithStatus[];
  completedOrders: OrderWithStatus[];
  environment: EnvironmentState;
  waterClock: WaterClockConfig;
  history: ActionHistory[];
  historyIndex: number;
  status: 'playing' | 'won' | 'lost' | 'abandoned';
  finalScore?: number;
  finalResult?: SettleResult;
}

export type ActionType =
  | 'adjust_hole'
  | 'adjust_scale'
  | 'accept_order'
  | 'complete_order'
  | 'skip_day'
  | 'calibrate';

export interface ActionHistory {
  id: string;
  type: ActionType;
  timestamp: number;
  dayIndex: number;
  payload: Record<string, unknown>;
  snapshotBefore: {
    copper: number;
    reputation: number;
    waterClock: WaterClockConfig;
    orders: OrderWithStatus[];
  };
}

export interface SettleResult {
  sessionId: string;
  playerId: string;
  levelId: number;
  won: boolean;
  copperEarned: number;
  copperFinal: number;
  reputationEarned: number;
  reputationFinal: number;
  averageAccuracy: number;
  ordersCompleted: number;
  ordersFailed: number;
  ordersExpired: number;
  serverCalculatedScore: number;
  passConditionMet: {
    minReputation: boolean;
    minCopper: boolean;
    minAccuracy: boolean;
  };
  settledAt: number;
  message: string;
}
