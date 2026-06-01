import type { RequestStatus, StatusTransition } from '@/types'
import StatusBadge, { statusConfig } from './StatusBadge'
import { cn } from '@/lib/utils'

interface StatusTimelineProps {
  transitions: StatusTransition[]
  currentStatus: RequestStatus
}

export default function StatusTimeline({ transitions, currentStatus }: StatusTimelineProps) {
  return (
    <div className="flex items-start w-full overflow-x-auto py-4">
      {transitions.map((t, index) => {
        const isCurrent = t.to_status === currentStatus
        const isLast = index === transitions.length - 1

        return (
          <div key={t.id} className="flex items-start min-w-[120px]">
            <div className="flex flex-col items-center flex-1">
              <div className="relative flex items-center justify-center">
                {isCurrent && (
                  <span className="absolute w-8 h-8 rounded-full bg-indigo-dark/20 animate-pulse-ring" />
                )}
                <span
                  className={cn(
                    'relative w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10',
                    isCurrent
                      ? 'bg-white border-indigo-dark text-indigo-dark'
                      : 'bg-indigo-dark border-indigo-dark text-white',
                  )}
                >
                  ✓
                </span>
              </div>
              <StatusBadge status={t.to_status} className="mt-2" />
              <div className="mt-1 text-center">
                <p className={cn('text-xs', isCurrent ? 'text-indigo-dark font-medium' : 'text-slate-500')}>
                  {t.operator_name}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(t.created_at).toLocaleDateString('zh-CN')}
                </p>
                {t.remark && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[100px]">{t.remark}</p>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="flex-shrink-0 h-0.5 w-8 mt-3 -ml-4 -mr-4 bg-indigo-dark" />
            )}
          </div>
        )
      })}
    </div>
  )
}
