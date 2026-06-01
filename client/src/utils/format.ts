import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(dateStr: string, fmt: string = 'yyyy-MM-dd HH:mm') {
  return format(new Date(dateStr), fmt, { locale: zhCN });
}

export function formatRelativeTime(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN });
}

export const statusColors: Record<string, string> = {
  normal: 'bg-green-100 text-green-800',
  abnormal: 'bg-red-100 text-red-800',
  processing: 'bg-yellow-100 text-yellow-800',
  rechecking: 'bg-blue-100 text-blue-800',
  resolved: 'bg-gray-100 text-gray-800',
  pending: 'bg-orange-100 text-orange-800',
  assessing: 'bg-purple-100 text-purple-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  delayed: 'bg-red-100 text-red-800',
  scheduled: 'bg-blue-100 text-blue-800',
  active: 'bg-red-100 text-red-800',
  ended: 'bg-gray-100 text-gray-800',
  available: 'bg-green-100 text-green-800',
  busy: 'bg-yellow-100 text-yellow-800',
  offline: 'bg-gray-100 text-gray-800',
  pass: 'bg-green-100 text-green-800',
  fail: 'bg-red-100 text-red-800',
};

export const statusLabels: Record<string, string> = {
  normal: '正常',
  abnormal: '异常',
  processing: '处理中',
  rechecking: '复测中',
  resolved: '已解决',
  pending: '待处理',
  assessing: '评估中',
  assigned: '已派单',
  in_progress: '处理中',
  completed: '已完成',
  cancelled: '已取消',
  delayed: '已延期',
  scheduled: '计划中',
  active: '进行中',
  ended: '已结束',
  available: '空闲',
  busy: '忙碌',
  offline: '离线',
  pass: '合格',
  fail: '不合格',
};

export const urgencyColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const urgencyLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export const reportTypeLabels: Record<string, string> = {
  water_quality: '水质问题',
  pipe_leak: '水管漏水',
  pressure_low: '水压不足',
  no_water: '无水',
  meter_issue: '水表问题',
  other: '其他',
};
