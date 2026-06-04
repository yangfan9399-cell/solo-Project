export type ApplicationStatus = 
  | 'PENDING_HANDLER'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED';

export type DocumentType =
  | 'ID_CARD'
  | 'HOUSEHOLD_REGISTER'
  | 'INCOME_PROOF'
  | 'MEDICAL_CERTIFICATE'
  | 'DIFFICULTY_PROOF'
  | 'OTHER';

export type DocumentStatus =
  | 'MISSING'
  | 'PROVIDED'
  | 'VERIFIED';

export type SubsidyLevel =
  | 'LEVEL_1'
  | 'LEVEL_2'
  | 'LEVEL_3'
  | 'LEVEL_4'
  | 'LEVEL_5';

export type ActionType =
  | 'SUBMIT_APPLICATION'
  | 'UPLOAD_DOCUMENT'
  | 'ADJUST_SUBSIDY_LEVEL'
  | 'ADD_NOTE'
  | 'APPROVE'
  | 'REJECT'
  | 'ARCHIVE'
  | 'REOPEN';

export type UserRole =
  | 'HANDLER'
  | 'REVIEWER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  occupation: string;
  monthlyIncome: number;
  healthStatus: string;
}

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  status: DocumentStatus;
  uploadDate?: string;
}

export interface SubsidyStandard {
  id: string;
  level: SubsidyLevel;
  name: string;
  minIncome: number;
  maxIncome: number;
  amount: number;
  description: string;
}

export interface ApprovalLog {
  id: string;
  userId: string;
  userName: string;
  actionType: ActionType;
  description: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface ArchiveRecord {
  id: string;
  conclusion: string;
  finalAmount: number;
  archivedBy: string;
  archivedAt: string;
}

export interface ReopenRecord {
  id: string;
  reopenReason: string;
  reopenedBy: string;
  originalConclusion: string;
  originalAmount: number;
  reopenedAt: string;
}

export interface Application {
  id: string;
  applicantName: string;
  applicantIdCard: string;
  phone: string;
  address: string;
  source: string;
  status: ApplicationStatus;
  subsidyLevel: SubsidyLevel;
  originalLevel?: SubsidyLevel;
  exceedsStandard: boolean;
  approvalPath?: string;
  currentHandlerId?: string;
  currentReviewerId?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  archiveReason?: string;
  archivedAt?: string;
  familyMembers: FamilyMember[];
  documents: Document[];
  approvalLogs: ApprovalLog[];
  archiveRecords: ArchiveRecord[];
  reopenRecords: ReopenRecord[];
  currentHandler?: User;
  currentReviewer?: User;
}

export interface SubsidyCalculation {
  totalIncome: number;
  familySize: number;
  averageIncome: number;
  calculatedLevel: SubsidyLevel;
  requestedLevel: SubsidyLevel;
  exceedsStandard: boolean;
  difference: number;
  approvalPath: string[];
}
