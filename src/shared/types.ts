export enum PackageDimension {
  clarity = 'clarity',
  rust_level = 'rust_level',
  inscription = 'inscription',
  orientation = 'orientation'
}

export enum ReleaseStatus {
  draft = 'draft',
  pending = 'pending',
  blocked = 'blocked',
  published = 'published',
  rolled_back = 'rolled_back'
}

export interface ReleasePackage {
  id: string;
  name: string;
  dimension: PackageDimension;
  description: string;
  status: ReleaseStatus;
  currentVersion: string;
  nextVersion: string;
  sampleCount: number;
  affectedSampleCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  rolledBackAt?: string;
  author: string;
}

export interface VersionRecord {
  id: string;
  packageId: string;
  version: string;
  description: string;
  status: ReleaseStatus;
  createdAt: string;
  createdBy: string;
  changeLog: string[];
}

export interface AffectedSample {
  id: string;
  packageId: string;
  sampleName: string;
  sampleCode: string;
  status: 'locked' | 'conflict' | 'recalc_needed' | 'normal';
  reason: string;
  affectedAt: string;
  resolver?: string;
  resolvedAt?: string;
}

export interface BlockerItem {
  id: string;
  packageId: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'resolved';
  reporter: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface RollbackStep {
  id: string;
  order: number;
  title: string;
  description: string;
  estimatedDuration: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface RollbackDraft {
  id: string;
  packageId: string;
  targetVersion: string;
  rollbackVersion: string;
  reason: string;
  steps: RollbackStep[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface AuditLog {
  id: string;
  packageId: string;
  action: string;
  description: string;
  operator: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface RecalcBatch {
  id: string;
  packageId: string;
  name: string;
  description: string;
  sampleCount: number;
  estimatedTimeMinutes: number;
  exportFormat: 'pdf' | 'excel' | 'json' | 'csv';
  batchType: 'report' | 'heatmap' | 'dataset' | 'annotation';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

export interface ImpactDetailResponse {
  samples: AffectedSample[];
  stats: {
    total: number;
    locked: number;
    conflict: number;
    recalc_needed: number;
    normal: number;
  };
  recalcBatches: RecalcBatch[];
  lockedSampleIds: string[];
  conflictSampleIds: string[];
}
