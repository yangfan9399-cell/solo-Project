import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-warning/10 text-warning' },
  supplier_notified: { label: '已通知供应商', className: 'bg-info/10 text-info' },
  supplier_response: { label: '供应商已回复', className: 'bg-secondary/10 text-secondary' },
  under_review: { label: '财务复核中', className: 'bg-accent/10 text-accent' },
  approved: { label: '索赔通过', className: 'bg-success/10 text-success' },
  rejected: { label: '索赔驳回', className: 'bg-danger/10 text-danger' },
  payment_processing: { label: '扣款处理中', className: 'bg-primary/10 text-primary' },
  completed: { label: '已完成', className: 'bg-success/10 text-success' }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-secondary' }
  
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.className)}>
      {config.label}
    </span>
  )
}
