export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(date: Date | string | null): string {
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

export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    blocked: "bg-red-100 text-red-800",
    archived: "bg-gray-100 text-gray-800",
  };
  return classes[status] || "bg-gray-100 text-gray-800";
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    pending: "待处理",
    approved: "已通过",
    rejected: "已拒绝",
    blocked: "已阻断",
    archived: "已归档",
  };
  return texts[status] || status;
}

export function getConflictTypeText(type: string): string {
  const texts: Record<string, string> = {
    batch_mismatch: "批号不一致",
    quantity_exceeded: "销毁数量超限",
    store_conflict: "责任门店冲突",
    none: "无冲突",
  };
  return texts[type] || type;
}

export function getDisposalTypeText(type: string): string {
  const texts: Record<string, string> = {
    transfer: "调拨",
    destruction: "销毁",
    none: "未确定",
  };
  return texts[type] || type;
}

export function getCategoryText(category: string): string {
  const texts: Record<string, string> = {
    antibiotics: "抗生素",
    cardiovascular: "心血管",
    gastrointestinal: "消化系统",
    nervous_system: "神经系统",
    respiratory: "呼吸系统",
    vitamins: "维生素",
    other: "其他",
  };
  return texts[category] || category;
}

export function getRoleText(role: string): string {
  const texts: Record<string, string> = {
    store_clerk: "门店经办人",
    regional_pharmacist: "区域药师",
    finance: "财务",
    admin: "管理员",
  };
  return texts[role] || role;
}

export function generateReportNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(5, "0");
  return `EXP-${year}-${random}`;
}

export function isBatchNearExpiry(expiryDate: Date | string, daysThreshold: number = 90): boolean {
  const days = getDaysUntilExpiry(expiryDate);
  return days <= daysThreshold && days > 0;
}

export function isBatchExpired(expiryDate: Date | string): boolean {
  return getDaysUntilExpiry(expiryDate) <= 0;
}

export function formatCurrency(amount: number | string | null): string {
  if (amount === null || amount === undefined) return "-";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `¥${num.toFixed(2)}`;
}
