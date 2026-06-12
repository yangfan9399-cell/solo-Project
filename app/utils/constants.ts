import {
  STATUS,
  NODE_TYPES,
  EXCEPTION_TYPES,
  ROLES,
} from "~/db/schema";

export const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  [STATUS.PENDING_ACCEPT]: { label: "待受理", color: "text-slate-700", bgColor: "bg-slate-100" },
  [STATUS.PROCESSING]: { label: "处理中", color: "text-blue-700", bgColor: "bg-blue-100" },
  [STATUS.PENDING_REVIEW]: { label: "待复核", color: "text-amber-700", bgColor: "bg-amber-100" },
  [STATUS.REVIEWED]: { label: "已复核", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  [STATUS.ARCHIVED]: { label: "已归档", color: "text-slate-600", bgColor: "bg-slate-200" },
  [STATUS.RETURNED]: { label: "已退回", color: "text-red-700", bgColor: "bg-red-100" },
};

export const EXCEPTION_TYPE_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  [EXCEPTION_TYPES.NORMAL]: { label: "正常核销", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  [EXCEPTION_TYPES.MISSING_RECORD]: { label: "记录漏填", color: "text-amber-700", bgColor: "bg-amber-100" },
  [EXCEPTION_TYPES.ATTACHMENT_VERSION_MISMATCH]: { label: "附件版本不一致", color: "text-red-700", bgColor: "bg-red-100" },
  [EXCEPTION_TYPES.RE_PROCESS]: { label: "重新处理", color: "text-purple-700", bgColor: "bg-purple-100" },
};

export const NODE_TYPE_MAP: Record<string, { label: string; color: string; icon: string }> = {
  [NODE_TYPES.ACCEPT]: { label: "受理登记", color: "bg-slate-500", icon: "📋" },
  [NODE_TYPES.PROCESS]: { label: "现场核验", color: "bg-blue-500", icon: "🔍" },
  [NODE_TYPES.SUPPLEMENT]: { label: "补充材料", color: "bg-cyan-500", icon: "📎" },
  [NODE_TYPES.REVIEW]: { label: "复核审批", color: "bg-amber-500", icon: "✅" },
  [NODE_TYPES.ARCHIVE]: { label: "归档结案", color: "bg-emerald-500", icon: "📁" },
  [NODE_TYPES.RETURN]: { label: "退回补证", color: "bg-red-500", icon: "↩️" },
  [NODE_TYPES.RE_PROCESS]: { label: "重新处理", color: "bg-purple-500", icon: "🔄" },
};

export const ROLE_MAP: Record<string, { label: string; color: string }> = {
  [ROLES.APPLICANT]: { label: "申请人", color: "text-blue-600" },
  [ROLES.HANDLER]: { label: "处理人", color: "text-emerald-600" },
  [ROLES.REVIEWER]: { label: "复核人", color: "text-amber-600" },
  [ROLES.ARCHIVIST]: { label: "归档员", color: "text-purple-600" },
};

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
