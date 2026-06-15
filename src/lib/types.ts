export type BatchStatus = 'draft' | 'processing' | 'completed' | 'failed' | 'archived' | 'rolled_back';

export type FailTag =
  | 'insufficient_blue'
  | 'over_exposure'
  | 'under_exposure'
  | 'uneven_coating'
  | 'paper_stain'
  | 'washing_insufficient'
  | 'yellowing'
  | 'poor_contrast'
  | 'other';

export interface BatchPhoto {
  id: string;
  batchId: string;
  stage: 'before_exposure' | 'after_exposure' | 'after_wash' | 'dried';
  caption: string;
  dataUrl: string;
  createdAt: number;
}

export interface MainRecord {
  id: string;
  batchNo: string;
  version: number;
  parentId: string | null;

  solutionARatio: number;
  solutionBRatio: number;
  solutionC_Ratio: number | null;
  totalVolumeMl: number;

  paperType: string;
  paperWeightGsm: number;
  notes: string | null;

  createdBy: string;
  createdAt: number;
  updatedAt: number;
  status: BatchStatus;
  isArchived: boolean;
  archiveReason: string | null;
  archivedAt: number | null;

  rollbackFromId: string | null;
  rollbackReason: string | null;
}

export interface ExposureDetail {
  id: string;
  mainRecordId: string;
  sheetNo: number;

  uvIntensityMwCm2: number;
  exposureMinutes: number;
  exposureSeconds: number;
  uvIndex: number | null;
  lightSource: string;
  distanceCm: number;

  createdAt: number;
}

export interface WashHistory {
  id: string;
  mainRecordId: string;
  orderIndex: number;
  stage: 'first_wash' | 'acid_bath' | 'second_wash' | 'final_rinse';

  durationMinutes: number;
  durationSeconds: number;
  waterTempC: number | null;
  phValue: number | null;
  agitationHz: number | null;

  operatorNote: string | null;
  createdAt: number;
}

export interface ResultRecord {
  id: string;
  mainRecordId: string;

  roomTempC: number;
  humidityPct: number;
  solutionTempC: number;
  dryingTempC: number | null;
  dryingMethod: string;

  visualGrade: number;
  densityGrade: number;
  contrastGrade: number;
  overallScore: number;

  failTags: FailTag[];
  isSuccess: boolean;
  evaluator: string;
  evaluationNote: string;
  evaluatedAt: number;

  recalculationCount: number;
  lastRecalculatedAt: number | null;
  recalculationNote: string | null;
}

export interface BatchRecord {
  main: MainRecord;
  exposureDetails: ExposureDetail[];
  washHistories: WashHistory[];
  result: ResultRecord | null;
  photos: BatchPhoto[];
}

export interface AnomalyReport {
  field: string;
  label: string;
  currentValue: number;
  baselineValue: number;
  deviationPct: number;
  thresholdPct: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface VersionDiff {
  field: string;
  label: string;
  oldValue: string | number | null;
  newValue: string | number | null;
  changed: boolean;
}
