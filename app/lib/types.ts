export interface User {
  id: number;
  name: string;
  role: string;
  avatar?: string;
  createdAt: string;
}

export interface ConstructionTeam {
  id: number;
  name: string;
  company: string;
  leaderName: string;
  leaderPhone: string;
  licenseNumber?: string;
  createdAt: string;
}

export interface Worker {
  id: number;
  teamId: number;
  name: string;
  idCard: string;
  phone?: string;
  hasSafetyCert: boolean;
  certNumber?: string;
  certExpireDate?: string;
  photo?: string;
  createdAt: string;
}

export interface ConstructionArea {
  id: number;
  name: string;
  code: string;
  building?: string;
  floor?: string;
  description?: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface Permit {
  id: number;
  permitNumber: string;
  teamId: number;
  areaId: number;
  constructionType: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  workContent: string;
  status: string;
  securityOfficerId?: number;
  engineeringManagerId?: number;
  safetyReviewerId?: number;
  hasDocuments: boolean;
  documentMissingReason?: string;
  hasAreaConflict: boolean;
  areaConflictDetail?: string;
  safetyBriefingStatus: string;
  safetyBriefingEvidence?: Array<{ type: string; url: string; description: string }>;
  safetyRejectReason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  anomalyType?: string;
  anomalyReason?: string;
  stayDurationHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PermitHistory {
  id: number;
  permitId: number;
  action: string;
  statusFrom?: string;
  statusTo?: string;
  operatorId?: number;
  operatorName: string;
  operatorRole: string;
  remark?: string;
  createdAt: string;
}

export interface PermitWorker {
  id: number;
  permitId: number;
  workerId: number;
  createdAt: string;
}
