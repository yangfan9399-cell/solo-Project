import { useNavigate } from 'react-router-dom'
import { ClipboardList, Activity, AlertCircle, CheckCircle } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import { statusConfig } from '@/components/StatusBadge'
import type { DashboardStats, Activity as ActivityType, TodoItem } from '@/types'

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return '刚刚'
  if (diffMin < 60) return `${diffMin}分钟前`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}小时前`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 30) return `${diffDay}天前`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth}个月前`
  return `${Math.floor(diffMonth / 12)}年前`
}

const statCards = [
  { key: 'pending_count' as const, label: '待审批', icon: ClipboardList, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
  { key: 'in_progress_count' as const, label: '进行中', icon: Activity, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { key: 'overdue_count' as const, label: '逾期', icon: AlertCircle, iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  { key: 'completed_this_month' as const, label: '本月完成', icon: CheckCircle, iconBg: 'bg-green-100', iconColor: 'text-green-600' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: stats, loading: statsLoading, error: statsError, refetch: statsRefetch } = useApi<DashboardStats>('/api/dashboard/stats')
  const { data: activities, loading: activitiesLoading, error: activitiesError, refetch: activitiesRefetch } = useApi<ActivityType[]>('/api/dashboard/activities')
  const { data: todos, loading: todosLoading, error: todosError, refetch: todosRefetch } = useApi<TodoItem[]>('/api/dashboard/todos')

  const isLoading = statsLoading || activitiesLoading || todosLoading
  const hasError = statsError || activitiesError || todosError

  if (isLoading) return <LoadingSpinner text="加载中..." />
  if (hasError) return <ErrorState message={statsError || activitiesError || todosError || '加载失败'} onRetry={() => { statsRefetch(); activitiesRefetch(); todosRefetch() }} />

  const priorityColors: Record<string, string> = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-gray-300' }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.key} className="bg-white rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{stats?.[card.key] ?? 0}</div>
                <div className="text-sm text-slate-500">{card.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">近期动态</h2>
          {!activities || activities.length === 0 ? (
            <EmptyState title="暂无动态" description="暂无近期操作记录" />
          ) : (
            <div className="space-y-0">
              {activities.slice(0, 15).map((item, idx) => (
                <div key={item.id} className="flex items-start gap-3 pb-4 relative">
                  {idx < Math.min(activities.length, 15) - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-200" />
                  )}
                  <div className="w-3.5 h-3.5 rounded-full bg-indigo-400 border-2 border-white mt-1 shrink-0 z-10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-slate-700">{item.operator_name}</span>
                      <span className="text-slate-400">将状态变更为</span>
                      <span className="text-indigo-600 font-medium">{statusConfig[item.to_status]?.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <span>{formatRelativeTime(item.created_at)}</span>
                      <span>·</span>
                      <span className="font-mono text-indigo-500">{item.request_no}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-1 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">待办事项</h2>
          {!todos || todos.length === 0 ? (
            <EmptyState title="暂无待办" description="所有事项已处理完毕" />
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <div
                  key={`${todo.type}-${todo.id}`}
                  onClick={() => navigate(`/requests/${todo.request_id}`)}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className={`w-1 h-full min-h-[40px] rounded-full shrink-0 ${priorityColors[todo.priority] || 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{todo.title}</div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">{todo.description}</div>
                    <div className="text-xs font-mono text-indigo-500 mt-1">{todo.request_no}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
