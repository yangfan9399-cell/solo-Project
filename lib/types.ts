export type TidePhase = "low" | "rising" | "high" | "falling";

export type SpeciesType = "crab" | "anemone" | "fish";

export interface Species {
  id: string;
  type: SpeciesType;
  name: string;
  emoji: string;
  description: string;
  preferredTide: TidePhase[];
  minTideLevel: number;
  maxTideLevel: number;
  rarity: "common" | "uncommon" | "rare";
}

export interface PoolLocation {
  id: string;
  name: string;
  emoji: string;
  description: string;
  speciesIds: string[];
  ecoSensitivity: number;
}

export interface GameSession {
  id: string;
  createdAt: number;
  status: "active" | "completed" | "abandoned";
  currentTideLevel: number;
  currentTidePhase: TidePhase;
  timeStep: number;
  totalSteps: number;
  researchPoints: number;
  ecoScore: number;
  tramplingCount: number;
  route: string[];
  visitedPools: string[];
  recoveryBonusResearch: number;
  recoveryBonusEco: number;
}

export interface ObservationRecord {
  id: string;
  sessionId: string;
  poolId: string;
  speciesId: string;
  tideLevel: number;
  tidePhase: TidePhase;
  timeStep: number;
  trampled: boolean;
  noted: boolean;
  note?: string;
  timestamp: number;
}

export interface HistoricalCondition {
  id: string;
  speciesType: SpeciesType;
  speciesId: string;
  tideLevel: number;
  tidePhase: TidePhase;
  poolId: string;
  observedCount: number;
  lastSeen: number;
}

export interface SessionResult {
  id: string;
  sessionId: string;
  totalObservations: number;
  uniqueSpecies: number;
  missedSpecies: number;
  tramplingPenalty: number;
  missedTidePenalty: number;
  researchPoints: number;
  ecoScore: number;
  finalScore: number;
  recoveryTasksAssigned: string[];
  completedAt: number;
  preRecoveryResearch: number;
  preRecoveryEco: number;
  preRecoveryFinal: number;
}

export interface RecoveryTask {
  id: string;
  sessionId: string;
  type: "trampling" | "missed_tide" | "low_eco";
  description: string;
  pointsReward: number;
  completed: boolean;
}

export interface NotebookEntry {
  id: string;
  sessionId: string;
  speciesId: string;
  content: string;
  createdAt: number;
}
