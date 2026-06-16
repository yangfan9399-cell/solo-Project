export interface Player {
  id: string;
  name: string;
  createdAt: number;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  bestLevel: number;
}

export interface Valve {
  id: string;
  x: number;
  y: number;
  pressure: number;
  targetPressure: number;
  minPressure: number;
  maxPressure: number;
  isOpen: boolean;
}

export interface Junction {
  id: string;
  x: number;
  y: number;
  type: 'split' | 'merge' | 'turn';
  direction: 'up' | 'down' | 'left' | 'right';
  active: boolean;
}

export interface Pipe {
  id: string;
  from: string;
  to: string;
  capacity: number;
  currentFlow: number;
  maxPressure: number;
}

export interface Capsule {
  id: string;
  packageId: string;
  currentNodeId: string;
  targetNodeId: string;
  progress: number;
  speed: number;
  priority: 'normal' | 'express' | 'critical';
  deliveryTime: number;
  maxDeliveryTime: number;
  status: 'waiting' | 'moving' | 'delivered' | 'delayed' | 'lost';
  cargo: string;
}

export interface Station {
  id: string;
  x: number;
  y: number;
  name: string;
  type: 'origin' | 'destination' | 'hub';
  queue: Capsule[];
  delivered: Capsule[];
}

export interface Level {
  id: number;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  targetDeliveries: number;
  minScore: number;
  valves: Valve[];
  junctions: Junction[];
  pipes: Pipe[];
  stations: Station[];
  spawnSchedule: SpawnEvent[];
  anomalies: AnomalyConfig[];
}

export interface SpawnEvent {
  time: number;
  originId: string;
  destinationId: string;
  priority: 'normal' | 'express' | 'critical';
  cargo: string;
  maxDeliveryTime: number;
}

export interface AnomalyConfig {
  id: string;
  type: 'pressure_surge' | 'pipe_leak' | 'junction_failure' | 'power_outage';
  triggerTime: number;
  targetId: string;
  duration: number;
  severity: number;
  description: string;
}

export interface GameState {
  id: string;
  levelId: number;
  playerId: string;
  startTime: number;
  currentTime: number;
  isPaused: boolean;
  isGameOver: boolean;
  victory: boolean;
  score: number;
  deliveriesCompleted: number;
  deliveriesFailed: number;
  valves: Valve[];
  junctions: Junction[];
  pipes: Pipe[];
  capsules: Capsule[];
  stations: Station[];
  activeAnomalies: ActiveAnomaly[];
  operationHistory: OperationRecord[];
}

export interface ActiveAnomaly {
  config: AnomalyConfig;
  startTime: number;
  remainingTime: number;
  resolved: boolean;
}

export interface OperationRecord {
  id: string;
  timestamp: number;
  type: 'valve_adjust' | 'junction_switch' | 'anomaly_resolve' | 'pause' | 'resume';
  targetId: string;
  oldValue: unknown;
  newValue: unknown;
  gameStateSnapshot: GameState;
}

export interface GameResult {
  gameId: string;
  playerId: string;
  levelId: number;
  completedAt: number;
  victory: boolean;
  finalScore: number;
  recalculatedScore: number;
  deliveriesCompleted: number;
  deliveriesFailed: number;
  timeUsed: number;
  anomaliesResolved: number;
  operationsPerformed: number;
  rating: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
}

export type GameMode = 'campaign' | 'challenge' | 'replay';
