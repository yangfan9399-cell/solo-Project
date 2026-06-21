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

export interface CrossSeasonPairSpecimen {
  code: string;
  collection_point: string;
  season: string;
  oldStatus: string;
  newStatus: string;
  changedDimensions: string[];
}

export interface CrossSeasonPair {
  pairId: string;
  specimens: CrossSeasonPairSpecimen[];
}

export interface PairInfo {
  pair_id: string;
  linked_code: string;
  linked_season: string;
  linked_status: string;
  linked_collection_point: string;
}

export interface ImpactResult {
  specimen: {
    id: string;
    code: string;
    collection_point: string;
    season: string;
    altitude: number;
    substrate: number;
    spore_density: number;
    humidity_exposure: number;
    current_status: string;
    linked_specimen_id: string | null;
  };
  oldStatus: Status;
  newStatus: Status;
  changedDimensions: string[];
  isCrossSeason: boolean;
  pair_info?: PairInfo | null;
}

export interface ImpactSummary {
  toWarn: number;
  toBlock: number;
  warnToBlock: number;
  total: number;
  crossSeasonAffected: number;
  crossSeasonPairs: CrossSeasonPair[];
  byDimension: Record<string, number>;
}

export interface ThresholdDiffChange {
  passMax: string;
  warnMax: string;
}

export interface ThresholdDiff {
  from: string;
  to: string;
  changedDimensions?: string[];
  changes: {
    altitude?: ThresholdDiffChange;
    substrate?: ThresholdDiffChange;
    sporeDensity?: ThresholdDiffChange;
    humidityExposure?: ThresholdDiffChange;
    [key: string]: ThresholdDiffChange | undefined;
  };
}

export interface Approval {
  id: string;
  ruleId: string;
  ruleName: string;
  ruleVersion?: string | null;
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
