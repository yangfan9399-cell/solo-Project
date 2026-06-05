import { type ClassValue, clsx } from "clsx";
import { differenceInYears, isBefore, format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "yyyy年MM月dd日", { locale: zhCN });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "yyyy-MM-dd HH:mm:ss", { locale: zhCN });
}

export function calculateAge(birthDate: string | Date) {
  return differenceInYears(new Date(), new Date(birthDate));
}

export function isDocumentExpired(expiryDate: string | Date) {
  return isBefore(new Date(expiryDate), new Date());
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    disqualified: "bg-red-100 text-red-800",
    needs_info: "bg-orange-100 text-orange-800",
    checked_in: "bg-green-100 text-green-800",
    late: "bg-yellow-100 text-yellow-800",
    no_show: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
    wrong_group: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "待处理",
    qualified: "资格通过",
    disqualified: "资格取消",
    needs_info: "需补资料",
    checked_in: "已检录",
    late: "迟到",
    no_show: "未到场",
    rejected: "已拒绝",
    wrong_group: "组别错误",
  };
  return labels[status] || status;
}

export function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    registered: "报名成功",
    clerk_updated: "经办人更新",
    group_changed: "组别调整",
    referee_approved: "裁判审核通过",
    referee_rejected: "裁判审核不通过",
    checked_in: "检录完成",
    checkin_rejected: "检录拒绝",
    wrong_group_detected: "组别错误检测",
    document_expired: "证件过期",
    score_submitted: "成绩录入",
    withdrawn: "撤回报名",
  };
  return labels[action] || action;
}
