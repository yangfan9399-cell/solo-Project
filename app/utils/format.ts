import { format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd", { locale: zhCN });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd HH:mm", { locale: zhCN });
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm", { locale: zhCN });
}

export function formatDateTimeRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): string {
  if (!start || !end) return "-";
  return `${formatDateTime(start)} - ${formatTime(end)}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  return `¥${amount.toFixed(2)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return `${value.toFixed(1)}%`;
}

export function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: "badge-draft",
    SUBMITTED: "badge-submitted",
    APPROVED: "badge-approved",
    TEACHER_CONFIRMED: "badge-confirmed",
    TEACHER_REJECTED: "badge-conflict",
    IN_PROGRESS: "badge-in-progress",
    COMPLETED: "badge-completed",
    CANCELLED: "badge-conflict",
    SETTLED: "badge-settled",
  };
  return statusMap[status] || "badge-draft";
}

export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    DRAFT: "草稿",
    SUBMITTED: "待审核",
    APPROVED: "审核通过",
    TEACHER_CONFIRMED: "教师已确认",
    TEACHER_REJECTED: "教师已拒绝",
    IN_PROGRESS: "上课中",
    COMPLETED: "已完成",
    CANCELLED: "已取消",
    SETTLED: "已结算",
  };
  return statusMap[status] || status;
}

export function getConflictTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    NONE: "无冲突",
    TEACHER_CONFLICT: "教师冲突",
    CLASSROOM_CONFLICT: "教室冲突",
  };
  return typeMap[type] || type;
}

export function getAttendanceStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PRESENT: "出勤",
    ABSENT: "缺勤",
    LEAVE: "请假",
  };
  return statusMap[status] || status;
}

export function getSettlementStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "待复核",
    REVIEWING: "复核中",
    APPROVED: "复核通过",
    PAID: "已支付",
  };
  return statusMap[status] || status;
}

export function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    ADMIN: "系统管理员",
    TEACHER: "教师",
    FINANCE: "财务",
    CAMPUS_DIRECTOR: "校区主管",
  };
  return roleMap[role] || role;
}
