export type TapeDefect = 'mold' | 'breakage' | 'speed_drift' | 'noise';

export type CleaningMethod = 'alcohol_swab' | 'compressed_air' | 'baking_method' | 'rewind_cycle';

export type RepairActionType =
  | 'register_tape'
  | 'select_cleaning'
  | 'splice_break'
  | 'adjust_speed'
  | 'apply_noise_reduction'
  | 'rollback'
  | 'recalculate'
  | 'complete_repair';

export interface TapeDetail {
  id: string;
  sessionId: string;
  tapeIndex: number;
  label: string;
  defects: TapeDefect[];
  originalWaveform: number[];
  currentWaveform: number[];
  breakpoints: { position: number; correctSplice: number }[];
  speedDrift: number;
  noiseLevel: number;
  appliedSpeed: number;
  noiseReductionLevel: number;
  splices: { position: number; isCorrect: boolean }[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface RepairHistory {
  id: string;
  sessionId: string;
  tapeDetailId: string | null;
  actionType: RepairActionType;
  actionData: Record<string, unknown>;
  previousState: Record<string, unknown> | null;
  timestamp: number;
  sequenceNumber: number;
}

export interface ResultRecord {
  id: string;
  sessionId: string;
  tapeDetailId: string;
  cleaningMethod: CleaningMethod;
  cleaningCost: number;
  finalWaveform: number[];
  intelligibility: number;
  fidelity: number;
  materialCost: number;
  repairTimeMs: number;
  hasExcessiveNoiseReduction: boolean;
  hasBadSplice: boolean;
  voiceDetailLoss: number;
  jumpArtifacts: number;
  correlationCoefficient: number;
  jumpPenaltySum: number;
  detailPenaltyValue: number;
  createdAt: number;
}

export interface GameSession {
  id: string;
  label: string;
  batchDescription: string;
  tapeCount: number;
  status: 'active' | 'completed';
  startedAt: number;
  completedAt: number | null;
  totalIntelligibility: number;
  totalFidelity: number;
  totalMaterialCost: number;
  totalRepairTimeMs: number;
  finalScore: number;
  grade: string;
}

export interface WaveformAnalysis {
  original: number[];
  afterCleaning: number[];
  afterRepair: number[];
  voiceDetailBefore: number;
  voiceDetailAfter: number;
  jumpPoints: { position: number; magnitude: number }[];
}

export type SeedType = 'normal_splice' | 'abnormal_settings' | 'rollback_required';
