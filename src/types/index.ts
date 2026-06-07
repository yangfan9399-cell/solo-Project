export type ClassName = 'CLASS_A' | 'CLASS_B' | 'CLASS_C';

export type AuthorizationType = 'PRIMARY' | 'TEMPORARY' | 'EMERGENCY';

export type PickupStatus = 
  | 'PENDING' 
  | 'VERIFIED' 
  | 'BLOCKED' 
  | 'EXCEPTION_APPROVED' 
  | 'EXCEPTION_REJECTED' 
  | 'COMPLETED';

export type ExceptionReason = 
  | 'ID_MISMATCH' 
  | 'PARENT_DISPUTE' 
  | 'NO_AUTHORIZATION' 
  | 'EXPIRED_AUTHORIZATION' 
  | 'OTHER';

export type Role = 'TEACHER' | 'GUARD' | 'PRINCIPAL';

export interface Child {
  id: string;
  name: string;
  gender: string;
  birthDate: string;
  className: ClassName;
  avatarUrl?: string;
  primaryGuardianName: string;
  primaryGuardianPhone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Authorization {
  id: string;
  childId: string;
  name: string;
  idCardNumber: string;
  phone: string;
  relation: string;
  type: AuthorizationType;
  avatarUrl?: string;
  validFrom: string;
  validTo?: string;
  isActive: boolean;
  registeredBy: string;
  registeredAt: string;
  remark?: string;
}

export interface PickupRecord {
  id: string;
  childId: string;
  authorizationId?: string;
  pickupDate: string;
  pickupTime?: string;
  status: PickupStatus;
  guardVerifiedBy?: string;
  verifiedAt?: string;
  exceptionReason?: ExceptionReason;
  exceptionRemark?: string;
  principalReviewBy?: string;
  principalReviewAt?: string;
  principalDecision?: PickupStatus;
  principalRemark?: string;
  createdAt: string;
  updatedAt: string;
  child?: Child;
  authorization?: Authorization;
  historyNodes?: PickupHistoryNode[];
}

export interface PickupHistoryNode {
  id: string;
  pickupRecordId: string;
  nodeType: string;
  operator: string;
  operatorRole: Role;
  description: string;
  timestamp: string;
}

export interface AuthorizationHistory {
  id: string;
  authorizationId: string;
  action: string;
  operator: string;
  operatorRole: Role;
  description: string;
  timestamp: string;
}

export const ClassNameMap: Record<ClassName, string> = {
  CLASS_A: '小班',
  CLASS_B: '中班',
  CLASS_C: '大班',
};

export const AuthorizationTypeMap: Record<AuthorizationType, string> = {
  PRIMARY: '主授权',
  TEMPORARY: '临时授权',
  EMERGENCY: '紧急授权',
};

export const PickupStatusMap: Record<PickupStatus, string> = {
  PENDING: '待核验',
  VERIFIED: '核验通过',
  BLOCKED: '已阻断',
  EXCEPTION_APPROVED: '异常放行',
  EXCEPTION_REJECTED: '异常驳回',
  COMPLETED: '已完成',
};

export const ExceptionReasonMap: Record<ExceptionReason, string> = {
  ID_MISMATCH: '证件不符',
  PARENT_DISPUTE: '家长争议',
  NO_AUTHORIZATION: '无授权记录',
  EXPIRED_AUTHORIZATION: '授权过期',
  OTHER: '其他原因',
};

export const RoleMap: Record<Role, string> = {
  TEACHER: '班主任',
  GUARD: '门岗',
  PRINCIPAL: '园长',
};
