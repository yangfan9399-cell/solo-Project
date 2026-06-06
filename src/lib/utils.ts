import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined, fmt: string = "yyyy-MM-dd HH:mm") {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt, { locale: zhCN });
}

export function formatDateTime(date: string | Date | undefined) {
  return formatDate(date, "yyyy-MM-dd HH:mm:ss");
}

export function formatDateOnly(date: string | Date | undefined) {
  return formatDate(date, "yyyy-MM-dd");
}

export const defectStatusLabels: Record<string, string> = {
  registered: "已登记",
  assigned: "已分派",
  processing: "处理中",
  pending_review: "待验收",
  awaiting_parts: "待备件",
  accepted: "已验收",
  rejected: "已退回",
  false_positive: "误报",
};

export const defectStatusColors: Record<string, string> = {
  registered: "bg-blue-100 text-blue-800",
  assigned: "bg-yellow-100 text-yellow-800",
  processing: "bg-purple-100 text-purple-800",
  pending_review: "bg-orange-100 text-orange-800",
  awaiting_parts: "bg-gray-100 text-gray-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  false_positive: "bg-slate-100 text-slate-800",
};

export const defectLevelLabels: Record<string, string> = {
  critical: "紧急",
  major: "重要",
  minor: "一般",
  general: "轻微",
};

export const defectLevelColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800",
  major: "bg-orange-100 text-orange-800",
  minor: "bg-yellow-100 text-yellow-800",
  general: "bg-gray-100 text-gray-800",
};

export const deviceTypeLabels: Record<string, string> = {
  pv_module: "光伏组件",
  inverter: "逆变器",
  combiner_box: "汇流箱",
  tracker: "跟踪支架",
  transformer: "变压器",
  cable: "电缆/连接器",
};

export const userRoleLabels: Record<string, string> = {
  inspector: "巡检员",
  operation_manager: "运维主管",
  maintenance_worker: "检修人员",
  reviewer: "复核人",
};

export const sparePartStatusLabels: Record<string, string> = {
  in_stock: "有库存",
  out_of_stock: "缺货",
  on_order: "已订货",
};

export const sparePartStatusColors: Record<string, string> = {
  in_stock: "bg-green-100 text-green-800",
  out_of_stock: "bg-red-100 text-red-800",
  on_order: "bg-yellow-100 text-yellow-800",
};

export const historyActionLabels: Record<string, string> = {
  register: "登记缺陷",
  assign: "分派任务",
  start_processing: "开始处理",
  submit_result: "提交处理结果",
  request_parts: "申请备件",
  parts_arrived: "备件到货",
  accept: "验收通过",
  reject: "退回重处理",
  mark_false_positive: "标记误报",
};

export function generateDefectNo(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `DEF-${year}${month}${day}-${random}`;
}

export function calculateDuration(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start).getTime();
  const endDate = new Date(end).getTime();
  return Math.floor((endDate - startDate) / (1000 * 60));
}

export function formatDuration(minutes?: number): string {
  if (!minutes) return "-";
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return `${hours}小时${mins > 0 ? mins + "分钟" : ""}`;
  const days = Math.floor(hours / 24);
  const hrs = hours % 24;
  return `${days}天${hrs > 0 ? hrs + "小时" : ""}`;
}
