export enum UserRole {
  FIELD_HANDLER = 'FIELD_HANDLER',
  QUALITY_REVIEWER = 'QUALITY_REVIEWER',
  ADMIN = 'ADMIN',
}

export enum RecordStatus {
  ACCEPTED = 'ACCEPTED',
  PROCESSING = 'PROCESSING',
  REVIEWING = 'REVIEWING',
  ARCHIVED = 'ARCHIVED',
  REJECTED = 'REJECTED',
  RETURNED_FOR_SUPPLEMENT = 'RETURNED_FOR_SUPPLEMENT',
}

export enum RecordType {
  NORMAL_DELIVERY = 'NORMAL_DELIVERY',
  QUALIFICATION_MISMATCH = 'QUALIFICATION_MISMATCH',
  TIME_WINDOW_CONFLICT = 'TIME_WINDOW_CONFLICT',
  NOTIFICATION_UNCONFIRMED = 'NOTIFICATION_UNCONFIRMED',
}

export enum FieldChangeType {
  CRITICAL_TIME = 'CRITICAL_TIME',
  RESPONSIBLE_PARTY = 'RESPONSIBLE_PARTY',
  AMOUNT = 'AMOUNT',
  EVIDENCE_CONCLUSION = 'EVIDENCE_CONCLUSION',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  name: string;
  employeeId: string;
  role: UserRole;
  department: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentRecord {
  id: string;
  recordNo: string;
  title: string;
  type: RecordType;
  status: RecordStatus;
  source: string;
  venue: string;
  eventName: string;
  equipmentList: any;
  scheduledTime: Date;
  actualTime: Date | null;
  amount: any;
  isArchived: boolean;
  currentAssigneeId: string | null;
  conclusion: string | null;
  blockReason: string | null;
  remediationPath: string | null;
  basisAdopted: string | null;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
}

export interface RecordNode {
  id: string;
  recordId: string;
  nodeType: string;
  status: RecordStatus;
  description: string;
  fieldNotes: string | null;
  onSiteNotes: string | null;
  conclusion: string | null;
  handlerId: string;
  createdAt: Date;
  isArchived: boolean;
  parentNodeId: string | null;
}

export interface DiffTracker {
  id: string;
  recordId: string;
  nodeId: string | null;
  fieldName: string;
  changeType: FieldChangeType;
  oldValue: any;
  newValue: any;
  diffDescription: string;
  changedById: string;
  createdAt: Date;
  affectsSummary: boolean;
}

export interface Attachment {
  id: string;
  recordId: string;
  nodeId: string | null;
  fileName: string;
  fileType: string;
  fileUrl: string;
  description: string | null;
  uploadedById: string;
  createdAt: Date;
}

export interface KeyObject {
  id: string;
  recordId: string;
  objectType: string;
  objectName: string;
  objectValue: string;
  isCritical: boolean;
  createdAt: Date;
}

export interface RecordWithRelations extends EquipmentRecord {
  creator: User | null;
  currentAssignee: User | null;
  nodes: (RecordNode & {
    handler: User;
    attachments: Attachment[];
  })[];
  diffTrackers: (DiffTracker & {
    changedBy: User;
  })[];
  attachments: Attachment[];
  keyObjects: KeyObject[];
}

export interface NodeWithRelations extends RecordNode {
  handler: User;
  attachments: Attachment[];
  diffTrackers: DiffTracker[];
  parentNode: NodeWithRelations | null;
  childNodes: NodeWithRelations[];
}

export interface DiffWithRelations extends DiffTracker {
  changedBy: User;
}

export interface StatisticsData {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byVenue: Record<string, number>;
  totalAmount: number;
  exceptionCount: number;
  archivedCount: number;
  processingCount: number;
  reviewingCount: number;
  averageProcessingTime: number;
}

export interface ProcessingAction {
  type: 'FIELD_NOTES' | 'ON_SITE_NOTES' | 'ATTACHMENT' | 'CONCLUSION' | 'STATUS_CHANGE' | 'SUBMIT_REVIEW';
  fieldNotes?: string;
  onSiteNotes?: string;
  conclusion?: string;
  status?: RecordStatus;
  attachments?: Array<{
    fileName: string;
    fileType: string;
    fileUrl: string;
    description?: string;
  }>;
  fieldChanges?: Array<{
    fieldName: string;
    changeType: FieldChangeType;
    oldValue: any;
    newValue: any;
    diffDescription: string;
  }>;
  blockReason?: string;
  remediationPath?: string;
  basisAdopted?: string;
  amount?: number;
  scheduledTime?: Date;
  actualTime?: Date;
  responsibleParty?: string;
}

export interface ReviewAction {
  type: 'CONFIRM' | 'RETURN' | 'ARCHIVE';
  conclusion: string;
  fieldNotes?: string;
  fieldChanges?: Array<{
    fieldName: string;
    changeType: FieldChangeType;
    oldValue: any;
    newValue: any;
    diffDescription: string;
  }>;
}
