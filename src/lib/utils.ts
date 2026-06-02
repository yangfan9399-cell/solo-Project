import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '-'
  return `¥${amount.toFixed(2)}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    ASSIGNED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
    DETECTED: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    RESOLVED: 'bg-green-100 text-green-800',
    DISMISSED: 'bg-gray-100 text-gray-800',
    NORMAL: 'bg-green-100 text-green-800',
    NEEDS_REPAIR: 'bg-yellow-100 text-yellow-800',
    BROKEN: 'bg-red-100 text-red-800',
    MAINTENANCE: 'bg-blue-100 text-blue-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: '待派单',
    ASSIGNED: '已派单',
    IN_PROGRESS: '处理中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
    DETECTED: '已检测',
    CONFIRMED: '已确认',
    RESOLVED: '已解决',
    DISMISSED: '已驳回',
    NORMAL: '正常',
    NEEDS_REPAIR: '待维修',
    BROKEN: '已损坏',
    MAINTENANCE: '维护中',
    DORM_MANAGER: '宿管员',
    MAINTENANCE_WORKER: '维修师傅',
    ENERGY_ADMIN: '能源管理员',
    STUDENT: '学生',
  }
  return texts[status] || status
}

export function getSatisfactionText(level: string): string {
  const texts: Record<string, string> = {
    VERY_DISSATISFIED: '非常不满意',
    DISSATISFIED: '不满意',
    NEUTRAL: '一般',
    SATISFIED: '满意',
    VERY_SATISFIED: '非常满意',
  }
  return texts[level] || level
}

export function getSatisfactionEmoji(level: string): string {
  const emojis: Record<string, string> = {
    VERY_DISSATISFIED: '😞',
    DISSATISFIED: '😕',
    NEUTRAL: '😐',
    SATISFIED: '😊',
    VERY_SATISFIED: '😄',
  }
  return emojis[level] || '😐'
}
