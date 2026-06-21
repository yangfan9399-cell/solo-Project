export type TicketStatus = 'pending_review' | 'rejected' | 'approved' | 'high_risk_incomplete' | 'locked';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  name: string;
  role: 'initiator' | 'reviewer' | 'both';
}

export interface WorkStep {
  id: string;
  description: string;
  confirmedByInitiator: boolean;
  confirmedByReviewer: boolean;
}

export interface IsolationMeasure {
  id: string;
  description: string;
  implemented: boolean;
  confirmedByInitiator: boolean;
  confirmedByReviewer: boolean;
}

export interface ToolItem {
  id: string;
  name: string;
  quantity: number;
  confirmedByInitiator: boolean;
  confirmedByReviewer: boolean;
}

export interface RejectionRecord {
  id: string;
  timestamp: string;
  rejectedBy: string;
  rejectedByName: string;
  reason: string;
  modifiedContent?: string;
}

export interface SignOffRecord {
  userId: string;
  userName: string;
  timestamp: string;
  role: 'initiator' | 'reviewer';
}

export interface WorkTicket {
  id: string;
  ticketNo: string;
  towerPosition: string;
  towerConfirmedByInitiator: boolean;
  towerConfirmedByReviewer: boolean;
  workSteps: WorkStep[];
  isolationMeasures: IsolationMeasure[];
  tools: ToolItem[];
  riskLevel: RiskLevel;
  riskConfirmedByInitiator: boolean;
  riskConfirmedByReviewer: boolean;
  initiatorId: string;
  initiatorName: string;
  reviewerId: string;
  reviewerName: string;
  status: TicketStatus;
  rejectionHistory: RejectionRecord[];
  signOffs: SignOffRecord[];
  isLocked: boolean;
  printVersion: number;
  createdAt: string;
  updatedAt: string;
  workDescription: string;
}

export interface CreateTicketDto {
  towerPosition: string;
  workDescription: string;
  workSteps: string[];
  isolationMeasures: { description: string; implemented: boolean }[];
  tools: { name: string; quantity: number }[];
  riskLevel: RiskLevel;
  initiatorId: string;
  reviewerId: string;
}

export interface UpdateTicketDto extends Partial<CreateTicketDto> {}

export interface ApproveTicketDto {
  reviewerId: string;
  towerConfirmed: boolean;
  workStepConfirmations: Record<string, boolean>;
  isolationMeasureConfirmations: Record<string, boolean>;
  toolConfirmations: Record<string, boolean>;
  riskConfirmed: boolean;
}

export interface RejectTicketDto {
  reviewerId: string;
  reason: string;
}
