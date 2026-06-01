import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorState({ message = '加载失败，请稍后重试', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
      <p className="text-base font-medium text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-dark rounded-lg hover:bg-indigo-dark-light transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </div>
  )
}
