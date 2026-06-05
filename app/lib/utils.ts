import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PERMIT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_DOCUMENT: "PENDING_DOCUMENT",
  PENDING_AREA_CONFIRM: "PENDING_AREA_CONFIRM",
  AREA_CONFLICT: "AREA_CONFLICT",
  PENDING_SAFETY_BRIEFING: "PENDING_SAFETY_BRIEFING",
  SAFETY_BRIEFING_REJECTED: "SAFETY_BRIEFING_REJECTED",
  APPROVED: "APPROVED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type PermitStatus = typeof PERMIT_STATUS[keyof typeof PERMIT_STATUS];

export const PERMIT_STATUS_LABELS: Record<PermitStatus, string> = {
  DRAFT: "草稿",
  PENDING_DOCUMENT: "待补证件",
  PENDING_AREA_CONFIRM: "待区域确认",
  AREA_CONFLICT: "区域冲突",
  PENDING_SAFETY_BRIEFING: "待安全交底",
  SAFETY_BRIEFING_REJECTED: "交底退回",
  APPROVED: "已批准",
  IN_PROGRESS: "施工中",
  COMPLETED: "已离场",
};

export const PERMIT_STATUS_COLORS: Record<PermitStatus, string> = {
  DRAFT: "badge-slate",
  PENDING_DOCUMENT: "badge-warning",
  PENDING_AREA_CONFIRM: "badge-primary",
  AREA_CONFLICT: "badge-danger",
  PENDING_SAFETY_BRIEFING: "badge-warning",
  SAFETY_BRIEFING_REJECTED: "badge-danger",
  APPROVED: "badge-success",
  IN_PROGRESS: "badge-primary",
  COMPLETED: "badge-slate",
};

export const CONSTRUCTION_TYPES = [
  { value: "ELECTRICAL", label: "电气工程" },
  { value: "PLUMBING", label: "给排水工程" },
  { value: "HVAC", label: "暖通工程" },
  { value: "STRUCTURAL", label: "结构工程" },
  { value: "DEMOLITION", label: "拆除工程" },
  { value: "DECORATION", label: "装饰装修" },
  { value: "FIRE_SAFETY", label: "消防工程" },
  { value: "OTHER", label: "其他" },
];

export const USER_ROLES = {
  SECURITY_OFFICER: "SECURITY_OFFICER",
  ENGINEERING_MANAGER: "ENGINEERING_MANAGER",
  SAFETY_REVIEWER: "SAFETY_REVIEWER",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  SECURITY_OFFICER: "安保经办人",
  ENGINEERING_MANAGER: "工程负责人",
  SAFETY_REVIEWER: "安全复核人",
};

export const ANOMALY_TYPES = [
  { value: "DOCUMENT_MISSING", label: "证件缺失" },
  { value: "AREA_CONFLICT", label: "区域冲突" },
  { value: "SAFETY_BRIEFING_FAILED", label: "安全交底未通过" },
  { value: "OVERSTAY", label: "超时滞留" },
  { value: "NONE", label: "无异常" },
];

export function generatePermitNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `SG-${year}${month}${day}-${random}`;
}
