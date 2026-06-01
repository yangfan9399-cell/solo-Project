import { useNavigate } from 'react-router-dom'
import { useApi } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import type { InterlibraryRequest } from '@/types'

const columns = [
  { key: 'pending', label: '待审批', statuses: ['pending'], color: 'bg-gray-400' },
  { key: 'approved_shipping', label: '已批准/待寄出', statuses: ['approved', 'shipping_out'], color: 'bg-cyan-400' },
  { key: 'in_transit', label: '运输中', statuses: ['in_transit'], color: 'bg-amber-400' },
  { key: 'arrived_reading', label: '到馆/借阅', statuses: ['arrived', 'reading'], color: 'bg-green-400' },
  { key: 'renewal', label: '续借中', statuses: ['renewal_pending', 'renewal_approved'], color: 'bg-purple-400' },
  { key: 'overdue_exception', label: '逾期/异常', statuses: ['overdue', 'exception'], color: 'bg-red-400' },
  { key: 'return_completed', label: '归还/完成', statuses: ['returning', 'completed'], color: 'bg-slate-400' },
]

const formatDate = (d: string) => {
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

export default function Kanban() {
  const navigate = useNavigate()
  const { data: requests, loading, error, refetch } = useApi<InterlibraryRequest[]>('/api/requests')

  if (loading) return <LoadingSpinner text="加载看板数据..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const filtered = (requests || []).filter(
    (r) => r.status !== 'rejected' && r.status !== 'renewal_rejected'
  )

  const grouped = columns.map((col) => ({
    ...col,
    items: filtered.filter((r) => col.statuses.includes(r.status)),
  }))

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold text-slate-800 mb-4">馆际流转看板</h1>
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {grouped.map((col) => (
          <div key={col.key} className="flex-shrink-0 flex flex-col" style={{ width: 280 }}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="font-medium text-slate-700 text-sm">{col.label}</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto">
              {col.items.map((req) => (
                <div
                  key={req.id}
                  onClick={() => navigate(`/requests/${req.id}`)}
                  className="bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className={`h-[3px] ${col.color}`} />
                  <div className="p-3 space-y-1.5">
                    <p className="text-xs text-slate-400 font-mono">{req.request_no}</p>
                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">{req.title}</p>
                    <p className="text-xs text-slate-500">
                      {req.reader_name} · {req.library_name || '-'}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(req.created_at)}</p>
                  </div>
                </div>
              ))}
              {col.items.length === 0 && (
                <div className="text-center py-6 text-xs text-slate-400">暂无</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
