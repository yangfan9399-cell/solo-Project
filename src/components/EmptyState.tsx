import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  className?: string
}

export default function EmptyState({
  icon: Icon = Inbox,
  title = '暂无数据',
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <Icon className="w-12 h-12 text-slate-300 mb-4" />
      <p className="text-base font-medium text-slate-500">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
    </div>
  )
}
