import { useState } from 'react'
import { useApi, useApiPost } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import type { OverdueRecord } from '@/types'
import { AlertTriangle } from 'lucide-react'

const formatDate = (d: string) => {
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

const getOverdueColor = (days: number) => {
  if (days <= 7) return 'text-yellow-600 bg-yellow-50'
  if (days <= 30) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

export default function Overdue() {
  const { data: records, loading, error, refetch } = useApi<OverdueRecord[]>('/api/overdue')
  const { post, loading: reminding } = useApiPost('')
  const [remindingId, setRemindingId] = useState<number | null>(null)

  if (loading) return <LoadingSpinner text="加载逾期数据..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const list = records || []
  if (list.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="暂无逾期记录"
        description="所有借阅均在正常期限内"
      />
    )
  }

  const totalFines = list.reduce((sum, r) => sum + r.fine_amount, 0)
  const avgDays = Math.round(list.reduce((sum, r) => sum + r.overdue_days, 0) / list.length)

  const handleRemind = async (id: number) => {
    setRemindingId(id)
    await post(`/api/overdue/${id}/remind`)
    setRemindingId(null)
    refetch()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-4">逾期追踪</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-500">逾期总数</p>
          <p className="text-2xl font-bold text-slate-800">{list.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-500">平均逾期天数</p>
          <p className="text-2xl font-bold text-amber-600">{avgDays}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-slate-500">总罚款金额</p>
          <p className="text-2xl font-bold text-red-600">¥{totalFines.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">申请编号</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">书名</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">读者</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">借出馆</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">到期日</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">逾期天数</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">催还次数</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">最后催还</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">罚款</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.request_no}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.title}</td>
                <td className="px-4 py-3 text-slate-600">{r.reader_name}</td>
                <td className="px-4 py-3 text-slate-600">{r.library_name}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(r.due_date)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getOverdueColor(r.overdue_days)}`}
                  >
                    {r.overdue_days}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.reminder_count}</td>
                <td className="px-4 py-3 text-slate-600 text-xs">
                  {r.last_reminder_date ? formatDate(r.last_reminder_date) : '-'}
                </td>
                <td className="px-4 py-3 text-red-600 font-medium">¥{r.fine_amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleRemind(r.id)}
                    disabled={reminding && remindingId === r.id}
                    className="px-3 py-1 text-xs font-medium text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {reminding && remindingId === r.id ? '催还中...' : '催还'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
