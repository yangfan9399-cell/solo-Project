export interface RecordSummary {
  id: number;
  recordNo: string;
  containerNo: string;
  sealNo: string;
  vesselName: string;
  voyageNo: string;
  exceptionType: string;
  status: string;
  currentHandler?: string;
  summary: string;
  amount?: string;
  source: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: string;
}

export interface NodeDetail {
  id: number;
  recordId: number;
  nodeType: string;
  nodeName: string;
  status: string;
  operatorName?: string;
  comment?: string;
  fieldChanges?: Record<string, any>;
  snapshotBefore?: Record<string, any>;
  snapshotAfter?: Record<string, any>;
  basis?: string;
  sequence: number;
  isReProcess: boolean;
  parentNodeId?: number;
  createdAt: string;
}

export interface AttachmentInfo {
  id: number;
  recordId: number;
  fileName: string;
  fileType: string;
  fileSize?: number;
  fileUrl: string;
  version: string;
  uploaderName?: string;
  description?: string;
  isEvidence: boolean;
  createdAt: string;
}

export interface EvidenceItemInfo {
  id: number;
  recordId: number;
  type: string;
  title: string;
  content?: string;
  status: string;
  verified: boolean;
  createdAt: string;
}

export interface RecordDetail extends RecordSummary {
  blNo?: string;
  customer?: string;
  applicantId?: number;
  applicantName?: string;
  reviewerId?: number;
  reviewerName?: string;
  currentHandlerId?: number;
  currentHandlerName?: string;
  sealTime?: string;
  arrivalTime?: string;
  conclusion?: string;
  basis?: string;
  blockReason?: string;
  remedyPath?: string;
  diffFields?: Record<string, any>;
  archivedAt?: string;
  nodes: NodeDetail[];
  attachments: AttachmentInfo[];
  evidenceItems: EvidenceItemInfo[];
}

export interface DashboardStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  archived: number;
  exceptionCount: number;
  normalCount: number;
  avgProcessTime: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentRecords: RecordSummary[];
}
