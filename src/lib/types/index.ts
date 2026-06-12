import type {
  EquipmentRecord,
  RecordNode,
  DiffTracker,
  Attachment,
  KeyObject,
  User,
  RecordStatus,
  RecordType,
  FieldChangeType
} from '@prisma/client';

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
  type: 'FIELD_NOTES' | 'ON_SITE_NOTES' | 'ATTACHMENT' | 'CONCLUSION' | 'STATUS_CHANGE';
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

export { RecordStatus, RecordType, FieldChangeType, UserRole } from '@prisma/client';
