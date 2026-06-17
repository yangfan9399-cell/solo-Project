export type ProjectStatus = 'draft' | 'review' | 'approved' | 'rejected';
export type LoadAlertLevel = 'normal' | 'warning' | 'danger';
export type LiftPointType = 'fixed' | 'mobile' | 'rotation' | 'swing';
export type MotionType = 'linear' | 'arc' | 'swing' | 'complex';

export interface LiftPoint {
  id: string;
  name: string;
  type: LiftPointType;
  x: number;
  y: number;
  z: number;
  maxLoad: number;
  equipment: string;
  anchorMethod: string;
  materialSpec: string;
}

export interface Performer {
  id: string;
  name: string;
  role: string;
  weight: number;
  costumeWeight: number;
  propWeight: number;
  totalWeight: number;
  safetyHarness: string;
  remarks?: string;
}

export interface Waypoint {
  id: string;
  sequence: number;
  x: number;
  y: number;
  z: number;
  timestamp: number;
  velocity: number;
  acceleration: number;
}

export interface MotionPath {
  id: string;
  name: string;
  type: MotionType;
  waypoints: Waypoint[];
  duration: number;
  maxSpeed: number;
  maxAcceleration: number;
}

export interface ApprovalSignature {
  id: string;
  signerName: string;
  signerRole: string;
  signatureData: string;
  signedAt: string;
  comments?: string;
}

export interface LoadCalculationResult {
  pointId: string;
  pointName: string;
  staticLoad: number;
  dynamicLoad: number;
  impactLoad: number;
  maxLoad: number;
  safetyFactor: number;
  designSafetyFactor: number;
  utilization: number;
  alertLevel: LoadAlertLevel;
  timestamp: number;
  position: { x: number; y: number; z: number };
  tensionAngle: number;
  performerId?: string;
}

export interface ProjectVersion {
  version: string;
  batch: string;
  createdAt: string;
  createdBy: string;
  changeLog: string;
  snapshot: ProjectSnapshot;
  calculationResults: LoadCalculationResult[];
}

export interface ProjectSnapshot {
  liftPoints: LiftPoint[];
  performers: Performer[];
  motionPaths: MotionPath[];
  defaultSafetyFactor: number;
  dynamicCoefficient: number;
  impactCoefficient: number;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  venue: string;
  performance: string;
  description: string;
  status: ProjectStatus;
  liftPoints: LiftPoint[];
  performers: Performer[];
  motionPaths: MotionPath[];
  defaultSafetyFactor: number;
  dynamicCoefficient: number;
  impactCoefficient: number;
  calculationResults: LoadCalculationResult[];
  approvalSignatures: ApprovalSignature[];
  versionHistory: ProjectVersion[];
  currentVersion: string;
  currentBatch: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  hasAbnormalData: boolean;
  abnormalNotes?: string;
}

export interface ProjectFilter {
  keyword?: string;
  status?: ProjectStatus | 'all';
  hasAbnormal?: boolean | 'all';
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportSummary {
  project: {
    code: string;
    name: string;
    venue: string;
    performance: string;
    status: ProjectStatus;
    version: string;
    batch: string;
  };
  overview: {
    totalLiftPoints: number;
    totalPerformers: number;
    totalMotionPaths: number;
    normalPoints: number;
    warningPoints: number;
    dangerPoints: number;
    maxUtilization: number;
    minSafetyFactor: number;
  };
  liftPoints: Array<{
    name: string;
    type: string;
    maxLoad: number;
    equipment: string;
  }>;
  calculations: LoadCalculationResult[];
  approvals: ApprovalSignature[];
  exportedAt: string;
  exportedBy: string;
}
