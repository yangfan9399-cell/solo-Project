import { TopicStatus, ReviewResult, ScheduleConflictType, UserRole } from "@prisma/client";

export const statusLabels: Record<TopicStatus, string> = {
  DRAFT: "草稿",
  PENDING_REVIEW: "待审核",
  APPROVED: "审核通过",
  COPYRIGHT_MISSING: "版权材料缺失",
  TITLE_REVISION: "标题待修改",
  SCHEDULED: "已排期",
  SCHEDULE_CONFLICT: "排期冲突",
  PUBLISHED: "已发布",
  ARCHIVED: "已归档",
  REJECTED: "已拒绝",
};

export const statusClass: Record<TopicStatus, string> = {
  DRAFT: "status-draft",
  PENDING_REVIEW: "status-pending_review",
  APPROVED: "status-approved",
  COPYRIGHT_MISSING: "status-copyright_missing",
  TITLE_REVISION: "status-title_revision",
  SCHEDULED: "status-scheduled",
  SCHEDULE_CONFLICT: "status-conflict",
  PUBLISHED: "status-published",
  ARCHIVED: "status-archived",
  REJECTED: "status-rejected",
};

export const reviewResultLabels: Record<ReviewResult, string> = {
  APPROVED: "审核通过",
  COPYRIGHT_MISSING: "版权材料缺失",
  TITLE_REVISION: "标题需修改",
  REJECTED: "拒绝",
};

export const conflictTypeLabels: Record<ScheduleConflictType, string> = {
  SAME_CATEGORY: "同栏目冲突",
  SAME_SERIES: "同系列冲突",
  HOT_TOPIC: "热点冲突",
  TIME_SLOT: "时段冲突",
};

export const userRoleLabels: Record<UserRole, string> = {
  EDITOR: "编辑",
  CHIEF_EDITOR: "主编",
  SCHEDULER: "排期人员",
  REVIEWER: "复核人",
};

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusBadgeClass(status: TopicStatus): string {
  return `status-badge ${statusClass[status]}`;
}
