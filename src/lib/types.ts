export type UserRole = 'FRONTLINE' | 'QC_REVIEWER' | 'ADMIN';
export type RecordStatus = 'RECEIVED' | 'PROCESSING' | 'REVIEW' | 'ARCHIVED';
export type SampleType = 'NORMAL' | 'INELIGIBLE' | 'TIME_CONFLICT' | 'UNCONFIRMED';
export type NodeType = 'CREATED' | 'ASSIGNED' | 'PROCESSING' | 'REVIEW_SUBMITTED' | 'REVIEW_CONFIRMED' | 'REVIEW_RETURNED' | 'ARCHIVED' | 'REPROCESSING';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  department: string;
  status: string;
}

export interface DiffField {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface ProcessingNode {
  id: string;
  nodeType: NodeType;
  operator: User;
  action: string;
  comment?: string;
  snapshot?: any;
  changedFields?: DiffField[];
  createdAt: string;
}

export interface BusinessRecord {
  id: string;
  content: string;
  recordType: string;
  creator: User;
  createdAt: string;
}

export interface OnSiteExplanation {
  id: string;
  content: string;
  creator: User;
  createdAt: string;
}

export interface EvidenceAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  description?: string;
  uploader: User;
  createdAt: string;
}

export interface ViolationInfo {
  id: string;
  violationType: string;
  violationDate: string;
  location: string;
  fine: number;
  penaltyPoints: number;
  description: string;
  isConfirmed: boolean;
}

export interface VehicleUsageRecord {
  id: string;
  title: string;
  applicant: User;
  vehicle: Vehicle;
  currentAssignee?: User;
  status: RecordStatus;
  sampleType: SampleType;
  appliedMileage: number;
  actualMileage: number;
  usageStartTime: string;
  usageEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  purpose: string;
  department: string;
  blockingReason?: string;
  remediationPath?: string;
  diffFields?: DiffField[];
  conclusion?: string;
  basis?: string;
  source: string;
  processingNodes: ProcessingNode[];
  businessRecords: BusinessRecord[];
  onSiteExplanations: OnSiteExplanation[];
  evidenceAttachments: EvidenceAttachment[];
  violationInfos: ViolationInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface StatsData {
  byStatus: { status: RecordStatus; count: number; recordIds: string[] }[];
  bySampleType: { sampleType: SampleType; count: number; recordIds: string[] }[];
  violationStats: { confirmed: number; unconfirmed: number; confirmedIds: string[]; unconfirmedIds: string[] };
}
