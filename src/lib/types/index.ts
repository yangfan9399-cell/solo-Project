import type { PrescriptionStatus, PrescriptionSource, Role, ReviewResult } from '@prisma/client';

export interface PrescriptionListItem {
  id: string;
  prescriptionNo: string;
  source: PrescriptionSource;
  sourceHospital?: string | null;
  patientName: string;
  status: PrescriptionStatus;
  currentHandler?: string | null;
  createdAt: Date;
  medicineCount: number;
}

export interface PrescriptionDetail {
  id: string;
  prescriptionNo: string;
  source: PrescriptionSource;
  sourceHospital?: string | null;
  doctorName?: string | null;
  department?: string | null;
  diagnosis?: string | null;
  patient: {
    id: string;
    name: string;
    idCard: string;
    phone?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
  };
  status: PrescriptionStatus;
  currentHandler?: string | null;
  expireAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  medicines: Medicine[];
  reviews: Review[];
  pickups: Pickup[];
  histories: History[];
  archives: Archive[];
}

export interface Medicine {
  id: string;
  name: string;
  specification: string;
  dosage: string;
  frequency: string;
  quantity: number;
  unit: string;
  price?: number | null;
  notes?: string | null;
}

export interface Review {
  id: string;
  pharmacistName: string;
  result: ReviewResult;
  dosageSuggestion?: string | null;
  comments?: string | null;
  reviewedAt: Date;
}

export interface Pickup {
  id: string;
  clerkName: string;
  pickupTime?: Date | null;
  verifierName?: string | null;
  verifierIdCard?: string | null;
  relation?: string | null;
  supplementaryInfo?: string | null;
  status: string;
  createdAt: Date;
}

export interface History {
  id: string;
  action: string;
  operatorId?: string | null;
  operatorName?: string | null;
  details?: string | null;
  timestamp: Date;
}

export interface Archive {
  id: string;
  reviewerName?: string | null;
  reason: string;
  resolution?: string | null;
  disputed: boolean;
  disputeComments?: string | null;
  archivedAt: Date;
  resolvedAt?: Date | null;
}

export interface UserInfo {
  id: string;
  name: string;
  role: Role;
}

export const statusLabels: Record<PrescriptionStatus, string> = {
  RECEIVED: '已接收',
  REVIEWING: '审核中',
  APPROVED: '审核通过',
  REJECTED: '已拒绝',
  DOSAGE_ISSUE: '剂量异常',
  PATIENT_MISMATCH: '患者信息不符',
  READY_FOR_PICKUP: '待取药',
  PICKED_UP: '已取药',
  TIMEOUT: '超时未取',
  ARCHIVED: '已归档',
  DISPUTED: '争议中'
};

export const sourceLabels: Record<PrescriptionSource, string> = {
  HOSPITAL: '医院',
  CLINIC: '诊所',
  ONLINE: '线上',
  EXTERNAL: '外部机构'
};

export const roleLabels: Record<Role, string> = {
  PHARMACIST: '药师',
  CLERK: '店员',
  REVIEWER: '复核人'
};

export const reviewResultLabels: Record<ReviewResult, string> = {
  APPROVED: '审核通过',
  DOSAGE_ISSUE: '剂量异常',
  PATIENT_MISMATCH: '患者信息不符',
  NEEDS_ADJUSTMENT: '需调整',
  RETURN_TO_DOCTOR: '退回医生'
};

export const statusColors: Record<PrescriptionStatus, string> = {
  RECEIVED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DOSAGE_ISSUE: 'bg-orange-100 text-orange-800',
  PATIENT_MISMATCH: 'bg-red-100 text-red-800',
  READY_FOR_PICKUP: 'bg-cyan-100 text-cyan-800',
  PICKED_UP: 'bg-emerald-100 text-emerald-800',
  TIMEOUT: 'bg-gray-100 text-gray-800',
  ARCHIVED: 'bg-slate-100 text-slate-800',
  DISPUTED: 'bg-rose-100 text-rose-800'
};
