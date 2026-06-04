export enum UserRole {
  OPERATOR = 'OPERATOR',
  QUALITY_INSPECTOR = 'QUALITY_INSPECTOR'
}

export enum ProcessStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  HANDED_OVER = 'HANDED_OVER',
  REWORKING = 'REWORKING',
  QUALITY_CHECK = 'QUALITY_CHECK',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED'
}

export enum QualityDecision {
  PASS = 'PASS',
  REJECT = 'REJECT',
  ARCHIVE = 'ARCHIVE'
}

export enum ReworkConclusion {
  REPAIRED = 'REPAIRED',
  SCRAPPED = 'SCRAPPED',
  CONCESSION = 'CONCESSION'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  badgeNo: string;
  createdAt: string;
}

export interface ProcessStep {
  id: string;
  templateId: string;
  stepNumber: number;
  name: string;
  department: string;
  description?: string;
}

export interface ProcessTemplate {
  id: string;
  name: string;
  productName: string;
  version: string;
  isActive: boolean;
  steps: ProcessStep[];
}

export interface HandoverRecord {
  id: string;
  workOrderId: string;
  processId: string;
  operatorId: string;
  operator: User;
  handoverNote: string;
  quantity: number;
  handedOverAt: string;
  qualityInspection?: QualityInspection;
}

export interface QualityInspection {
  id: string;
  handoverId: string;
  inspectorId: string;
  inspector: User;
  processId: string;
  decision: QualityDecision;
  evidence?: string;
  rejectReason?: string;
  inspectedAt: string;
}

export interface ReworkRecord {
  id: string;
  processId: string;
  operatorId: string;
  operator: User;
  reworkReason: string;
  reworkMaterials: string;
  reworkConclusion?: ReworkConclusion;
  reworkNote?: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

export interface WorkOrderProcess {
  id: string;
  workOrderId: string;
  stepId: string;
  stepNumber: number;
  status: ProcessStatus;
  startedAt?: string;
  completedAt?: string;
  step: ProcessStep;
  handoverRecords: HandoverRecord[];
  reworkRecords: ReworkRecord[];
  qualityInspections: QualityInspection[];
}

export interface WorkOrder {
  id: string;
  orderNo: string;
  productName: string;
  quantity: number;
  templateId: string;
  status: ProcessStatus;
  createdAt: string;
  updatedAt: string;
  template: ProcessTemplate;
  processes: WorkOrderProcess[];
}

export interface OverviewStats {
  workOrders: {
    total: number;
    archived: number;
    inProgress: number;
    reworking: number;
  };
  reworks: {
    total: number;
    completed: number;
    pending: number;
  };
}

export interface ReworkByReason {
  reason: string;
  count: number;
  avgHours: number;
  totalHours: number;
  details: Array<{
    id: string;
    stepName: string;
    conclusion?: ReworkConclusion;
    hours: number;
  }>;
}

export interface ReworkByDepartment {
  department: string;
  count: number;
  avgHours: number;
  totalHours: number;
  involvedOperators: string[];
}

export interface ReworkByConclusion {
  conclusion: ReworkConclusion;
  count: number;
  details: Array<{
    id: string;
    orderNo: string;
    stepName: string;
    reason: string;
  }>;
}

export interface RepeatRework {
  processId: string;
  orderNo: string;
  stepName: string;
  department: string;
  reworkCount: number;
  reworks: Array<{
    id: string;
    reason: string;
    conclusion?: ReworkConclusion;
    operatorName: string;
  }>;
}

export interface ReworkTimeDistribution {
  stepName: string;
  department: string;
  count: number;
  totalHours: number;
  avgHours: number;
}

export interface ArchiveValidation {
  valid: boolean;
  error?: string;
  missingSteps?: Array<{
    stepNumber: number;
    name: string;
    department: string;
    resolvedByRework?: boolean;
    reworkConclusion?: ReworkConclusion;
  }>;
  resolvedByRework?: Array<{
    stepNumber: number;
    name: string;
    department: string;
    resolvedByRework: boolean;
    reworkConclusion: ReworkConclusion;
  }>;
}
