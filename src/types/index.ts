export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  description: string;
  startDate: string;
  endDate: string | null;
  director: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'completed' | 'paused';
}

export interface StratigraphicUnit {
  id: string;
  projectId: string;
  unitNumber: string;
  type: 'layer' | 'feature' | 'disturbance';
  designation: string;
  description: string;
  depthTop: number;
  depthBottom: number;
  thickness: number;
  color: string;
  texture: string;
  includes: string;
  notes: string;
  excavatedBy: string;
  excavationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StratigraphicRelation {
  id: string;
  projectId: string;
  fromUnitId: string;
  toUnitId: string;
  relationType: 'above' | 'below' | 'equal' | 'cut' | 'fills' | 'contemporary';
  confirmed: boolean;
  notes: string;
  createdAt: string;
}

export interface Artifact {
  id: string;
  projectId: string;
  unitId: string;
  catalogNumber: string;
  name: string;
  type: string;
  material: string;
  description: string;
  quantity: number;
  depthFound: number;
  coordinates: string;
  photos: string[];
  notes: string;
  catalogedBy: string;
  catalogDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  projectId: string;
  unitId: string | null;
  artifactId: string | null;
  fileName: string;
  filePath: string;
  thumbnailPath: string;
  description: string;
  photoType: 'overview' | 'detail' | 'section' | 'plan' | 'artifact';
  takenBy: string;
  takenDate: string;
  coordinates: string;
  scale: string;
  northDirection: string;
  createdAt: string;
}

export interface VersionHistory {
  id: string;
  projectId: string;
  entityType: 'project' | 'unit' | 'relation' | 'artifact' | 'photo';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, { old: unknown; new: unknown }>;
  userId: string;
  userName: string;
  timestamp: string;
  batchId: string | null;
  description: string;
}

export interface HarrisMatrixNode {
  id: string;
  unitNumber: string;
  type: string;
  designation: string;
  depthTop: number;
  depthBottom: number;
  x: number;
  y: number;
  layer: number;
}

export interface HarrisMatrixEdge {
  id: string;
  from: string;
  to: string;
  type: string;
  confirmed: boolean;
}

export interface Anomaly {
  id: string;
  projectId: string;
  type: 'stratigraphic_cycle' | 'depth_conflict' | 'orphan_unit' | 'missing_relation' | 'thickness_mismatch' | 'unconfirmed_relation';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  relatedUnitIds: string[];
  resolved: boolean;
  createdAt: string;
}

export interface ExportSummary {
  project: Project;
  unitCount: number;
  artifactCount: number;
  photoCount: string;
  relationCount: number;
  periodCoverage: string;
  excavationProgress: string;
  keyFindings: string[];
  anomalies: Anomaly[];
  exportDate: string;
}

export type PaginationParams = {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
