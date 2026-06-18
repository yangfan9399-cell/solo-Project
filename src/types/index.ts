export interface Project {
  id: string;
  name: string;
  dialect: string;
  region: string;
  investigator: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'archived';
  description: string;
}

export interface Sample {
  id: string;
  projectId: string;
  batchId: string;
  word: string;
  ipa: string;
  toneValue: string;
  toneCategory: string;
  recordingDuration: number;
  waveformData: number[];
  segmentationPoints: number[];
  pitchData: number[];
  notes: string;
  status: 'draft' | 'annotated' | 'verified' | 'anomaly';
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  sampleIds: string[];
  notes: string;
}

export interface VersionSnapshot {
  id: string;
  projectId: string;
  batchId: string;
  version: number;
  snapshot: Sample[];
  createdAt: string;
  description: string;
}

export interface Anomaly {
  id: string;
  sampleId: string;
  projectId: string;
  type: 'tone_mismatch' | 'pitch_outlier' | 'segmentation_error' | 'missing_data';
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  resolved: boolean;
}

export interface ExportRecord {
  id: string;
  projectId: string;
  format: 'json' | 'csv';
  createdAt: string;
  sampleCount: number;
  content: string;
}

export interface RegionStat {
  region: string;
  dialect: string;
  projectCount: number;
  sampleCount: number;
  toneCategories: Record<string, { value: string; count: number }>;
}
