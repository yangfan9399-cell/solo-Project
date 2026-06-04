import type {
  Inspection,
  InspectionStatus,
  EvidenceType,
  ReviewActionType,
  HistoryActionType,
  NotificationType,
  Role,
  InspectionSource,
  IssueType,
  Severity,
} from "@prisma/client";

export type {
  InspectionStatus,
  EvidenceType,
  ReviewActionType,
  HistoryActionType,
  NotificationType,
  Role,
  InspectionSource,
  IssueType,
  Severity,
};

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  role: Role;
}

export interface EvidenceWithUploader {
  id: string;
  type: EvidenceType;
  url: string;
  thumbnailUrl: string | null;
  description: string | null;
  uploadedBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

export interface HistoryNodeWithOperator {
  id: string;
  actionType: HistoryActionType;
  fromStatus: InspectionStatus | null;
  toStatus: InspectionStatus;
  description: string;
  operator: {
    id: string;
    name: string;
    role: Role;
  };
  timestamp: Date;
  metadata: any | null;
}

export interface RectificationWithDetails {
  id: string;
  description: string;
  submittedBy: {
    id: string;
    name: string;
  };
  submittedAt: Date;
  isPhotoMissing: boolean;
  missingTypes: string[];
  buildingMatch: boolean;
  isOverdue: boolean;
  isQualified: boolean | null;
  evidences: EvidenceWithUploader[];
  reviewAction?: {
    actionType: ReviewActionType;
    comment: string | null;
    reviewedBy: {
      name: string;
    };
    reviewedAt: Date;
  } | null;
}

export interface InspectionDetail extends Inspection {
  building: {
    id: string;
    name: string;
    code: string;
    address: string | null;
    responsible: string | null;
    phone: string | null;
  };
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  evidences: EvidenceWithUploader[];
  rectifications: RectificationWithDetails[];
  historyNodes: HistoryNodeWithOperator[];
  lastChange: HistoryNodeWithOperator | null;
}

export const STATUS_LABELS: Record<InspectionStatus, string> = {
  PENDING_RECTIFICATION: "待整改",
  RECTIFICATION_SUBMITTED: "整改已提交",
  PENDING_REVIEW: "待复核",
  VERIFIED: "已核实",
  RETURNED: "已退回",
  ARCHIVED: "已归档",
  CLOSED: "已销项",
};

export const STATUS_COLORS: Record<InspectionStatus, string> = {
  PENDING_RECTIFICATION: "bg-yellow-100 text-yellow-800",
  RECTIFICATION_SUBMITTED: "bg-blue-100 text-blue-800",
  PENDING_REVIEW: "bg-orange-100 text-orange-800",
  VERIFIED: "bg-green-100 text-green-800",
  RETURNED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-800",
  CLOSED: "bg-emerald-100 text-emerald-800",
};

export const SOURCE_LABELS: Record<InspectionSource, string> = {
  PATROL: "日常巡查",
  COMPLAINT: "居民投诉",
  MONITORING: "监控发现",
  ASSIGNMENT: "上级指派",
  OTHER: "其他来源",
};

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  WASTE_SORTING: "垃圾分类",
  OVERFLOW: "垃圾满溢",
  CONTAMINATION: "垃圾污染",
  MISSING_BIN: "垃圾桶缺失",
  ODOR: "异味问题",
  CLEANLINESS: "清洁问题",
  OTHER: "其他问题",
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  LOW: "低",
  MEDIUM: "中",
  HIGH: "高",
  CRITICAL: "严重",
};

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  BEFORE_PHOTO: "整改前照片",
  AFTER_PHOTO: "整改后照片",
  LOCATION_PHOTO: "位置照片",
  PROCESS_PHOTO: "过程照片",
  DOCUMENT: "文档证据",
};

export const HISTORY_ACTION_LABELS: Record<HistoryActionType, string> = {
  CREATE: "创建记录",
  ASSIGN: "分配任务",
  SUBMIT_RECTIFICATION: "提交整改",
  REVIEW_APPROVE: "复核通过",
  REVIEW_REJECT: "复核驳回",
  ARCHIVE: "归档",
  RETURN: "退回",
  CLOSE: "关闭销项",
  UPDATE: "更新",
  OVERDUE: "超期提醒",
  PHOTO_MISSING: "照片缺失",
  BUILDING_MISMATCH: "楼栋不匹配",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  NEW_INSPECTION: "新巡查任务",
  RECTIFICATION_DUE: "整改即将到期",
  RECTIFICATION_OVERDUE: "整改超期",
  REVIEW_REQUIRED: "待复核",
  REVIEW_APPROVED: "复核通过",
  REVIEW_REJECTED: "复核驳回",
  ARCHIVED: "已归档",
  CLOSED: "已销项",
  PHOTO_MISSING: "照片缺失",
  BUILDING_MISMATCH: "楼栋不匹配",
};

export const REQUIRED_EVIDENCE_TYPES: EvidenceType[] = [
  "BEFORE_PHOTO",
  "AFTER_PHOTO",
  "LOCATION_PHOTO",
  "PROCESS_PHOTO",
];
