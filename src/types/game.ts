export interface ToneProfile {
  brightness: number;
  warmth: number;
  resonance: number;
  sustain: number;
  projection: number;
  clarity: number;
}

export interface SoundSample {
  frequency: number;
  amplitude: number;
}

export interface BoardAdjustments {
  woodThickness: number;
  beamPosition: number;
  lacquerLayer: number;
  soundHoleSize: number;
  braceAngle: number;
}

export interface Level {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'expert';
  targetTone: ToneProfile;
  targetSoundSpectrum: SoundSample[];
  idealAdjustments: BoardAdjustments;
  woodTypes: string[];
  timeLimit?: number;
  unlockRequirement?: number;
}

export interface GameSession {
  id: string;
  levelId: string;
  playerId: string;
  startTime: number;
  endTime?: number;
  adjustments: BoardAdjustments;
  currentTone: ToneProfile;
  operationHistory: OperationRecord[];
  historyIndex: number;
  score?: number;
  status: 'playing' | 'won' | 'lost';
  feedback?: CustomerFeedback;
}

export interface OperationRecord {
  id: string;
  timestamp: number;
  type: 'adjust' | 'reset' | 'evaluate';
  field?: keyof BoardAdjustments;
  oldValue?: number;
  newValue?: number;
  description: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  avatar: string;
  totalScore: number;
  completedLevels: string[];
  bestScores: Record<string, number>;
  instruments: FinishedInstrument[];
  createdAt: number;
}

export interface FinishedInstrument {
  id: string;
  name: string;
  sessionId: string;
  levelId: string;
  adjustments: BoardAdjustments;
  finalTone: ToneProfile;
  score: number;
  customerFeedback: CustomerFeedback;
  createdAt: number;
}

export interface CustomerFeedback {
  satisfaction: number;
  comment: string;
  praiseAspects: string[];
  criticismAspects: string[];
}

export interface ScoreResult {
  totalScore: number;
  toneMatchScore: number;
  spectrumMatchScore: number;
  adjustmentPrecisionScore: number;
  efficiencyScore: number;
  details: {
    tone: { dimension: string; score: number; target: number; actual: number }[];
  };
}
