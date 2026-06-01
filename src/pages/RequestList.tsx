import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, RotateCcw, Calendar } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import StatusBadge, { statusConfig } from '@/components/StatusBadge'
import type { InterlibraryRequest, PartnerLibrary, RequestStatus } from '@/types'

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

const PAGE_SIZE = 15

const allStatuses: RequestStatus[] = [
  'pending', 'approved', 'rejected', 'shipping_out', 'in_transit', 'arrived',
  'reading', 'renewal_pending', 'renewal_approved', 'renewal_rejected',
  'returning', 'completed', 'overdue', 'exception',
]

export default function RequestList() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState('')
  const [libraryFilter, setLibraryFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)

  const { data: libraries } = useApi<PartnerLibrary[]>('/api/libraries')

  const queryParams = new URLSearchParams()
  if (statusFilter) queryParams.set('status', statusFilter)
  if (libraryFilter) queryParams.set('libraryId', libraryFilter)
  if (searchText) queryParams.set('readerName', searchText)
  if (startDate) queryParams.set('startDate', startDate)
  if (endDate) queryParams.set('endDate', `${endDate} 23:59:59`)
  const queryStr = queryParams.toString()
  const url = `/api/requests${queryStr ? `?${queryStr}` : ''}`

  const { data: requests, loading, error, refetch } = useApi<InterlibraryRequest[]>(url)

  const hasActiveFilters = useMemo(() => {
    return !!(statusFilter || libraryFilter || searchText || startDate || endDate)
  }, [statusFilter, libraryFilter, searchText, startDate, endDate])

  const totalPages = useMemo(() => {
    if (!requests) return 1
    return Math.max(1, Math.ceil(requests.length / PAGE_SIZE))
  }, [requests])

  const pagedRequests = useMemo(() => {
    if (!requests) return []
    return requests.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  }, [requests, page])

  const handleReset = () => {
    setStatusFilter('')
    setLibraryFilter('')
    setSearchText('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  if (loading) return <LoadingSpinner text="加载中..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">互借申请</h1>
        <Link
          to="/requests/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建申请
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl p-4 shadow-sm">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部状态</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{statusConfig[s].label}</option>
          ))}
        </select>

        <select
          value={libraryFilter}
          onChange={(e) => { setLibraryFilter(e.target.value); setPage(1) }}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部合作馆</option>
          {libraries?.map((lib) => (
            <option key={lib.id} value={String(lib.id)}>{lib.name}</option>
          ))}
        </select>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索读者姓名"
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1) }}
            className="h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1) }}
              className="h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
            />
          </div>
          <span className="text-sm text-slate-400">至</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1) }}
              className="h-9 pl-9 pr-3 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
            />
          </div>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          重置
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!requests || requests.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              title="未找到匹配的申请"
              description="当前筛选条件下没有符合的互借申请，请尝试调整筛选条件或点击重置"
            />
          ) : (
            <EmptyState title="暂无申请" description="还没有任何互借申请记录，点击右上角新建申请" />
          )
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500">
                  <th className="text-left px-4 py-3 font-medium">申请编号</th>
                  <th className="text-left px-4 py-3 font-medium">书名</th>
                  <th className="text-left px-4 py-3 font-medium">ISBN</th>
                  <th className="text-left px-4 py-3 font-medium">读者</th>
                  <th className="text-left px-4 py-3 font-medium">合作馆</th>
                  <th className="text-left px-4 py-3 font-medium">状态</th>
                  <th className="text-left px-4 py-3 font-medium">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {pagedRequests.map((req, idx) => (
                  <tr
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className={`cursor-pointer transition-colors hover:bg-indigo-50 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-indigo-600">{req.request_no}</td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate">{req.title}</td>
                    <td className="px-4 py-3 text-slate-500">{req.isbn}</td>
                    <td className="px-4 py-3 text-slate-700">{req.reader_name}</td>
                    <td className="px-4 py-3 text-slate-700">{req.library_name || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(req.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <span className="text-sm text-slate-500">
                  共 {requests.length} 条，第 {page}/{totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
