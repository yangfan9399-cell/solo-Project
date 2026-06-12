export const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "待受理", color: "text-gray-700", bgColor: "bg-gray-100" },
  processing: { label: "处理中", color: "text-blue-700", bgColor: "bg-blue-100" },
  review: { label: "待复核", color: "text-amber-700", bgColor: "bg-amber-100" },
  rejected: { label: "退回补证", color: "text-red-700", bgColor: "bg-red-100" },
  archived: { label: "已归档", color: "text-green-700", bgColor: "bg-green-100" },
};

export const NODE_TYPE_MAP: Record<string, { label: string; icon: string }> = {
  accept: { label: "受理", icon: "📥" },
  assign: { label: "分派", icon: "👤" },
  process: { label: "处理", icon: "🔧" },
  review: { label: "复核", icon: "✅" },
  archive: { label: "归档", icon: "📦" },
  reject: { label: "退回", icon: "↩️" },
  reprocess: { label: "重新处理", icon: "🔄" },
  supplement: { label: "补充材料", icon: "📝" },
};

export const EXCEPTION_TYPE_MAP: Record<string, { label: string; color: string }> = {
  missing_fields: { label: "记录漏填", color: "text-orange-600" },
  attachment_version_mismatch: { label: "附件版本不一致", color: "text-purple-600" },
  reprocess: { label: "重新处理", color: "text-cyan-600" },
};

export const FIELD_LABEL_MAP: Record<string, string> = {
  caseNo: "案件编号",
  source: "来源",
  title: "标题",
  description: "描述",
  location: "地点",
  currentStatus: "当前状态",
  currentHandlerId: "当前处理人",
  noiseLevelBefore: "处理前噪声值",
  noiseLevelAfter: "处理后噪声值",
  fineAmount: "罚款金额",
  responsibleParty: "责任单位",
  responsiblePerson: "责任人",
  contactPhone: "联系电话",
  violationType: "违法类型",
  legalBasis: "法律依据",
  conclusion: "处理结论",
  isArchived: "是否归档",
  hasException: "是否异常",
  exceptionType: "异常类型",
  attachments: "附件",
  receivedAt: "受理时间",
  assignedAt: "分派时间",
  processedAt: "处理时间",
  reviewedAt: "复核时间",
  archivedAt: "归档时间",
};

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `¥${num.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`;
}

export function formatNoise(level: string | number | null | undefined): string {
  if (level === null || level === undefined) return "-";
  return `${level} dB`;
}
