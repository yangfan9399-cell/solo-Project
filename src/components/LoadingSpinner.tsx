import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  text?: string
  className?: string
}

export default function LoadingSpinner({ text, className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <Loader2 className="w-8 h-8 text-indigo-dark animate-spin" />
      {text && <p className="mt-3 text-sm text-slate-500">{text}</p>}
    </div>
  )
}
