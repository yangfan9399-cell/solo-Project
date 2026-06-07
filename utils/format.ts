export const orderStatusMap: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待派单', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  assigned: { label: '已派单', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  in_progress: { label: '服务中', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  completed: { label: '待验收', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  inspection_passed: { label: '验收通过', color: 'text-green-700', bgColor: 'bg-green-100' },
  inspection_failed: { label: '验收不通过', color: 'text-red-700', bgColor: 'bg-red-100' },
  rework: { label: '返工中', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  rework_completed: { label: '返工完成', color: 'text-teal-700', bgColor: 'bg-teal-100' },
  rework_timeout: { label: '返工超时', color: 'text-red-700', bgColor: 'bg-red-200' },
  compensation_pending: { label: '赔付待裁决', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  compensation_approved: { label: '赔付已批准', color: 'text-rose-700', bgColor: 'bg-rose-100' },
  compensation_rejected: { label: '赔付已拒绝', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  closed: { label: '已关闭', color: 'text-gray-600', bgColor: 'bg-gray-200' },
};

export const serviceTypeMap: Record<string, string> = {
  daily_cleaning: '日常保洁',
  deep_cleaning: '深度保洁',
  move_in_out: '入住/搬出保洁',
  office_cleaning: '办公室保洁',
  kitchen_cleaning: '厨房专项',
  bathroom_cleaning: '卫生间专项',
};

export const reworkReasonMap: Record<string, string> = {
  photo_missing: '照片缺失',
  poor_quality: '保洁质量差',
  item_damaged: '物品损坏',
  missed_area: '遗漏区域',
  other: '其他原因',
};

export const compensationRuleTypeMap: Record<string, string> = {
  item_damage: '物品损坏赔付',
  rework_timeout: '返工超时赔付',
  customer_complaint: '客户投诉赔付',
  photo_missing: '照片缺失处罚',
};

export function formatDate(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatDateOnly(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) {
    return `${hours}小时${mins}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时`;
  }
  return `${mins}分钟`;
}

export function getStatusInfo(status: string) {
  return orderStatusMap[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' };
}

export function getServiceTypeLabel(type: string) {
  return serviceTypeMap[type] || type;
}

export function getReworkReasonLabel(reason: string) {
  return reworkReasonMap[reason] || reason;
}

export function getCompensationRuleTypeLabel(type: string) {
  return compensationRuleTypeMap[type] || type;
}
