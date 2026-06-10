import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { zhCN } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy年MM月dd日", { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy年MM月dd日 HH:mm", { locale: zhCN });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: zhCN });
}

export function getDaysOverdue(dueDate: Date | string): number {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const today = new Date();
  return differenceInDays(today, d);
}

export function calculateRiskLevel(dueDate: Date | string, status: string): "正常" | "关注" | "警告" | "危险" {
  if (status === "已归档" || status === "已解决") return "正常";

  const daysOverdue = getDaysOverdue(dueDate);

  if (daysOverdue <= 0) return "正常";
  if (daysOverdue <= 3) return "关注";
  if (daysOverdue <= 7) return "警告";
  return "危险";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "待执行":
      return "bg-slate-100 text-slate-700";
    case "执行中":
      return "bg-blue-100 text-blue-700";
    case "待复查":
      return "bg-amber-100 text-amber-700";
    case "已归档":
      return "bg-emerald-100 text-emerald-700";
    case "已退回":
    case "退回修改":
      return "bg-red-100 text-red-700";
    case "待处理":
      return "bg-slate-100 text-slate-700";
    case "处理中":
      return "bg-blue-100 text-blue-700";
    case "已解决":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "正常":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "关注":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "警告":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "危险":
      return "bg-red-100 text-red-700 border-red-200 animate-pulse-alert";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getEmergencyColor(level: string): string {
  switch (level) {
    case "一般":
      return "bg-slate-100 text-slate-700";
    case "紧急":
      return "bg-amber-100 text-amber-700";
    case "非常紧急":
      return "bg-red-100 text-red-700 animate-pulse-alert";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function getFaultTypeLabel(type: string): string {
  switch (type) {
    case "电梯困人":
      return "电梯困人";
    case "门故障":
      return "门故障";
    case "通讯故障":
      return "通讯故障";
    case "其他":
      return "其他故障";
    default:
      return type;
  }
}
