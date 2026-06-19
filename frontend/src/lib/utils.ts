import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const statusLabels: Record<string, string> = {
  '待接收': '待接收',
  '复判中': '复判中',
  '已锁定': '已锁定',
  '已退回': '已退回',
}

export const statusColors: Record<string, string> = {
  '待接收': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '复判中': 'bg-blue-100 text-blue-800 border-blue-200',
  '已锁定': 'bg-green-100 text-green-800 border-green-200',
  '已退回': 'bg-red-100 text-red-800 border-red-200',
}

export const substrateLabels: Record<string, string> = {
  '树皮': '树皮',
  '岩石': '岩石',
  '土壤': '土壤',
  '苔藓层': '苔藓层',
}

export const substrateIcons: Record<string, string> = {
  '树皮': '🌳',
  '岩石': '🪨',
  '土壤': '🟫',
  '苔藓层': '🌿',
}

export const sporeDensityLabels: Record<string, string> = {
  '高': '高',
  '中': '中',
  '低': '低',
  '无': '无',
}

export const sporeDensityValues: Record<string, number> = {
  '高': 100,
  '中': 66,
  '低': 33,
  '无': 0,
}

export const humidityLabels: Record<string, string> = {
  '干燥': '干燥',
  '适中': '适中',
  '湿润': '湿润',
  '水淹': '水淹',
}

export const humidityIcons: Record<string, string> = {
  '干燥': '☀️',
  '适中': '⛅',
  '湿润': '💧',
  '水淹': '🌊',
}

export const seasonLabels: Record<string, string> = {
  '春季': '春季',
  '夏季': '夏季',
  '秋季': '秋季',
  '冬季': '冬季',
}

export const collectionSourceLabels: Record<string, string> = {
  '野外采集': '野外采集',
  '送检': '送检',
  '复测': '复测',
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case '待接收':
      return 'secondary'
    case '复判中':
      return 'default'
    case '已锁定':
      return 'outline'
    case '已退回':
      return 'destructive'
    default:
      return 'secondary'
  }
}
