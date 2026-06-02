import { Inbox, FileQuestion, SearchX } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: 'empty' | 'search' | 'error'
  action?: React.ReactNode
}

export default function EmptyState({
  title,
  description,
  icon = 'empty',
  action,
}: EmptyStateProps) {
  const IconComponent = {
    empty: Inbox,
    search: SearchX,
    error: FileQuestion,
  }[icon]

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <IconComponent className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  )
}

export function ErrorState({
  title = '加载失败',
  description = '抱歉，数据加载失败，请稍后重试。',
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-10 h-10 text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          重新加载
        </button>
      )}
    </div>
  )
}
