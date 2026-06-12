import { RecordStatus, RecordType, FieldChangeType, UserRole } from '$lib/types';

export function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatShortDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

export function formatCurrency(amount: number | string | null): string {
  if (amount === null || amount === undefined) return '-';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return '-';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    [RecordStatus.ACCEPTED]: '已受理',
    [RecordStatus.PROCESSING]: '处理中',
    [RecordStatus.REVIEWING]: '复核中',
    [RecordStatus.ARCHIVED]: '已归档',
    [RecordStatus.REJECTED]: '已驳回',
    [RecordStatus.RETURNED_FOR_SUPPLEMENT]: '退回补证'
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    [RecordStatus.ACCEPTED]: 'bg-blue-100 text-blue-800',
    [RecordStatus.PROCESSING]: 'bg-yellow-100 text-yellow-800',
    [RecordStatus.REVIEWING]: 'bg-purple-100 text-purple-800',
    [RecordStatus.ARCHIVED]: 'bg-green-100 text-green-800',
    [RecordStatus.REJECTED]: 'bg-red-100 text-red-800',
    [RecordStatus.RETURNED_FOR_SUPPLEMENT]: 'bg-orange-100 text-orange-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [RecordType.NORMAL_DELIVERY]: '正常交付',
    [RecordType.QUALIFICATION_MISMATCH]: '资格不符',
    [RecordType.TIME_WINDOW_CONFLICT]: '时间窗口冲突',
    [RecordType.NOTIFICATION_UNCONFIRMED]: '通知未确认'
  };
  return labels[type] || type;
}

export function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    [RecordType.NORMAL_DELIVERY]: 'bg-green-100 text-green-800',
    [RecordType.QUALIFICATION_MISMATCH]: 'bg-red-100 text-red-800',
    [RecordType.TIME_WINDOW_CONFLICT]: 'bg-orange-100 text-orange-800',
    [RecordType.NOTIFICATION_UNCONFIRMED]: 'bg-yellow-100 text-yellow-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getFieldChangeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    [FieldChangeType.CRITICAL_TIME]: '关键时间',
    [FieldChangeType.RESPONSIBLE_PARTY]: '责任对象',
    [FieldChangeType.AMOUNT]: '金额数量',
    [FieldChangeType.EVIDENCE_CONCLUSION]: '证据结论',
    [FieldChangeType.OTHER]: '其他'
  };
  return labels[type] || type;
}

export function getFieldChangeTypeColor(type: string): string {
  const colors: Record<string, string> = {
    [FieldChangeType.CRITICAL_TIME]: 'bg-red-100 text-red-800',
    [FieldChangeType.RESPONSIBLE_PARTY]: 'bg-purple-100 text-purple-800',
    [FieldChangeType.AMOUNT]: 'bg-orange-100 text-orange-800',
    [FieldChangeType.EVIDENCE_CONCLUSION]: 'bg-blue-100 text-blue-800',
    [FieldChangeType.OTHER]: 'bg-gray-100 text-gray-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    [UserRole.FIELD_HANDLER]: '一线处理人',
    [UserRole.QUALITY_REVIEWER]: '质控复核人',
    [UserRole.ADMIN]: '系统管理员'
  };
  return labels[role] || role;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    [UserRole.FIELD_HANDLER]: 'bg-blue-100 text-blue-800',
    [UserRole.QUALITY_REVIEWER]: 'bg-purple-100 text-purple-800',
    [UserRole.ADMIN]: 'bg-gray-100 text-gray-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}

export function isExceptionType(type: string): boolean {
  return type !== RecordType.NORMAL_DELIVERY;
}

export function formatJsonValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
