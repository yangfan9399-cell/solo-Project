import { cn } from '@/lib/utils'
import type { AnomalyStatus } from '@/types'

const statusConfig: Record<AnomalyStatus, { label: string; className: string }> = {
  normal: { label: '正常', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  retest_needed: { label: '需复测', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  threshold_exceeded: { label: '超阈值', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  review_missing: { label: '缺复核', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  closed: { label: '已关闭', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}

interface StatusBadgeProps {
  status: AnomalyStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
