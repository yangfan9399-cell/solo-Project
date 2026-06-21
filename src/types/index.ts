export type Status = 'pass' | 'warn' | 'block';

export interface ThresholdDimension {
  passMax: number;
  warnMax: number;
}

export interface ThresholdGroup {
  altitude: ThresholdDimension;
  substrate: ThresholdDimension;
  sporeDensity: ThresholdDimension;
  humidityExposure: ThresholdDimension;
}

export interface Rule {
  id: string;
  name: string;
  version: string;
  thresholds: ThresholdGroup;
  status: 'published' | 'draft';
  createdAt: string;
  publishedAt?: string;
}

export interface Specimen {
  id: string;
  code: string;
  collectionPoint: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  altitude: number;
  substrate: number;
  sporeDensity: number;
  humidityExposure: number;
  currentStatus: Status;
  linkedSpecimenId?: string;
}

export interface ImpactResult {
  specimenId: string;
  code: string;
  collectionPoint: string;
  season: string;
  originalStatus: Status;
  newStatus: Status;
  changedDimensions: string[];
  isCrossSeason: boolean;
}

export interface ImpactSummary {
  toWarn: number;
  toBlock: number;
  warnToBlock: number;
  total: number;
}

export interface ThresholdDiffChange {
  passMax: string;
  warnMax: string;
}

export interface ThresholdDiff {
  from: string;
  to: string;
  changes: {
    altitude: ThresholdDiffChange;
    substrate: ThresholdDiffChange;
    sporeDensity: ThresholdDiffChange;
    humidityExposure: ThresholdDiffChange;
  };
}

export interface Approval {
  id: string;
  ruleId: string;
  ruleName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewComment?: string;
  impactSummary: ImpactSummary;
  thresholdDiff: ThresholdDiff;
}

export interface ReleaseHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  version: string;
  publishedAt: string;
  changeSummary: string;
  approvalId: string;
}

export interface RollbackDraft {
  id: string;
  targetRuleId: string;
  targetVersion: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  impactSummary: ImpactSummary;
  createdAt: string;
}
