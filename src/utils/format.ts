import type { TicketStatus, RiskLevel } from '../../shared/types';

export const statusLabels: Record<TicketStatus, string> = {
  pending_review: '待复核',
  rejected: '已驳回',
  approved: '已通过',
  high_risk_incomplete: '高风险缺项',
  locked: '已锁定',
};

export const statusColors: Record<TicketStatus, string> = {
  pending_review: 'bg-safety-yellow/15 text-safety-yellow border border-safety-yellow/30',
  rejected: 'bg-safety-red/15 text-safety-red border border-safety-red/30',
  approved: 'bg-safety-green/15 text-safety-green border border-safety-green/30',
  high_risk_incomplete: 'bg-safety-orange/15 text-safety-orange border border-safety-orange/30',
  locked: 'bg-industrial-700/15 text-industrial-700 border border-industrial-700/30',
};

export const riskLabels: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

export const riskColors: Record<RiskLevel, string> = {
  low: 'bg-green-500',
  medium: 'bg-safety-yellow',
  high: 'bg-safety-red',
};

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function getRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}
