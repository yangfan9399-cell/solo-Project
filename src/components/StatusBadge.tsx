import type { RequestStatus } from '@/types'
import { cn } from '@/lib/utils'

const statusConfig: Record<RequestStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待审批', color: 'text-gray-600', bg: 'bg-gray-100' },
  approved: { label: '已批准', color: 'text-cyan-600', bg: 'bg-cyan-50' },
  rejected: { label: '已拒绝', color: 'text-rose-600', bg: 'bg-rose-50' },
  shipping_out: { label: '待寄出', color: 'text-amber-600', bg: 'bg-amber-50' },
  in_transit: { label: '运输中', color: 'text-amber-700', bg: 'bg-amber-100' },
  arrived: { label: '已到馆', color: 'text-green-600', bg: 'bg-green-50' },
  reading: { label: '借阅中', color: 'text-teal-600', bg: 'bg-teal-50' },
  renewal_pending: { label: '续借审批', color: 'text-purple-600', bg: 'bg-purple-50' },
  renewal_approved: { label: '续借批准', color: 'text-violet-600', bg: 'bg-violet-50' },
  renewal_rejected: { label: '续借拒绝', color: 'text-fuchsia-600', bg: 'bg-fuchsia-50' },
  returning: { label: '归还中', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  completed: { label: '已完成', color: 'text-slate-600', bg: 'bg-slate-100' },
  overdue: { label: '已逾期', color: 'text-red-600', bg: 'bg-red-50' },
  exception: { label: '异常', color: 'text-orange-600', bg: 'bg-orange-50' },
}

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', config.bg, config.color, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}

export { statusConfig }
