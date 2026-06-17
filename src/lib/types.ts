export type DefectType = "crack" | "deposit" | "misalign" | "leak" | "corrosion" | "disjoint" | "branch" | "deform";

export type SeverityLevel = 1 | 2 | 3 | 4;

export type ProjectStatus = "ongoing" | "completed" | "pending_review";

export type ReviewStatus = "pending" | "reviewing" | "approved" | "rejected";

export interface Project {
  id: string;
  name: string;
  pipelineName: string;
  pipelineDiameter: number;
  inspectionDate: string;
  inspectionLength: number;
  robotModel: string;
  status: ProjectStatus;
  annotator: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionFrame {
  id: string;
  projectId: string;
  frameIndex: number;
  mileage: number;
  timestamp: string;
  imageUrl: string;
  description: string;
}

export interface Defect {
  id: string;
  frameId: string;
  projectId: string;
  type: DefectType;
  severity: SeverityLevel;
  position: string;
  mileage: number;
  description: string;
  length: number;
  width: number;
  annotatedBy: string;
  annotatedAt: string;
  reviewStatus: ReviewStatus;
  reviewedBy: string;
  reviewedAt: string;
  reviewComment: string;
  versionId: string;
}

export interface ReviewBatch {
  id: string;
  projectId: string;
  batchName: string;
  reviewer: string;
  status: ReviewStatus;
  createdAt: string;
  completedAt: string;
  defectIds: string[];
  comment: string;
}

export interface Version {
  id: string;
  projectId: string;
  versionNumber: string;
  description: string;
  createdBy: string;
  createdAt: string;
  defectCount: number;
  snapshotKey: string;
}

export interface Anomaly {
  id: string;
  projectId: string;
  type: "overlap_mileage" | "missing_frame" | "severity_mismatch" | "duplicate_defect" | "unreviewed_overdue";
  description: string;
  severity: "warning" | "error";
  resolved: boolean;
  createdAt: string;
  resolvedAt: string;
  relatedDefectId: string;
}

export interface ExportRecord {
  id: string;
  projectId: string;
  exportType: "summary" | "full" | "mileage" | "review";
  format: "json" | "csv";
  createdAt: string;
  createdBy: string;
  recordCount: number;
  data: string;
}

export const DEFECT_TYPE_LABELS: Record<DefectType, string> = {
  crack: "裂缝",
  deposit: "沉积",
  misalign: "错口",
  leak: "渗漏",
  corrosion: "腐蚀",
  disjoint: "脱节",
  branch: "支管暗接",
  deform: "变形",
};

export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  1: "Ⅰ级(轻微)",
  2: "Ⅱ级(中等)",
  3: "Ⅲ级(严重)",
  4: "Ⅳ级(重大)",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ongoing: "进行中",
  completed: "已完成",
  pending_review: "待复核",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "待复核",
  reviewing: "复核中",
  approved: "已通过",
  rejected: "已退回",
};

export const ANOMALY_TYPE_LABELS: Record<Anomaly["type"], string> = {
  overlap_mileage: "里程重叠",
  missing_frame: "帧缺失",
  severity_mismatch: "等级不匹配",
  duplicate_defect: "缺陷重复",
  unreviewed_overdue: "超期未复核",
};
