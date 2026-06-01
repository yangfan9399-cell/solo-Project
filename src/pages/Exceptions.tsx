import { useState } from 'react'
import { useApi, useApiPut } from '@/hooks/useApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import ErrorState from '@/components/ErrorState'
import type { ExceptionRecord } from '@/types'
import { AlertTriangle } from 'lucide-react'

const typeMap: Record<string, string> = {
  damage: '图书损坏',
  lost: '图书丢失',
  delay: '物流延误',
  other: '其他',
}

const exStatusConfig: Record<string, { label: string; className: string }> = {
  open: { label: '待处理', className: 'bg-red-100 text-red-700' },
  processing: { label: '处理中', className: 'bg-amber-100 text-amber-700' },
  resolved: { label: '已解决', className: 'bg-green-100 text-green-700' },
}

const formatDate = (d: string) => {
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

export default function Exceptions() {
  const { data: exceptions, loading, error, refetch } = useApi<ExceptionRecord[]>('/api/exceptions')
  const { put, loading: updating } = useApiPut('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'process' | 'resolve'>('process')
  const [selected, setSelected] = useState<ExceptionRecord | null>(null)
  const [modalStatus, setModalStatus] = useState('processing')
  const [resolution, setResolution] = useState('')

  if (loading) return <LoadingSpinner text="加载异常数据..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const allList = exceptions || []
  const list = allList.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false
    if (typeFilter && r.type !== typeFilter) return false
    return true
  })

  if (allList.length === 0) {
    return <EmptyState icon={AlertTriangle} title="暂无异常记录" description="所有流程运行正常" />
  }

  const openProcessModal = (record: ExceptionRecord) => {
    setSelected(record)
    setModalType('process')
    setModalStatus('processing')
    setResolution('')
    setShowModal(true)
  }

  const openResolveModal = (record: ExceptionRecord) => {
    setSelected(record)
    setModalType('resolve')
    setResolution('')
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!selected) return
    if (modalType === 'process') {
      await put(`/api/exceptions/${selected.id}`, { status: modalStatus, resolution })
    } else {
      await put(`/api/exceptions/${selected.id}`, { status: 'resolved', resolution })
    }
    setShowModal(false)
    refetch()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-800 mb-4">异常反馈</h1>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部状态</option>
          <option value="open">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">全部类型</option>
          <option value="damage">图书损坏</option>
          <option value="lost">图书丢失</option>
          <option value="delay">物流延误</option>
          <option value="other">其他</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">申请编号</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">书名</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">读者</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">异常类型</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">描述</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">处理人</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">处理状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">创建时间</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => {
              const statusConf = exStatusConfig[r.status] || exStatusConfig.open
              return (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.request_no}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{r.title}</td>
                  <td className="px-4 py-3 text-slate-600">{r.reader_name}</td>
                  <td className="px-4 py-3 text-slate-600">{typeMap[r.type] || r.type}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.description}</td>
                  <td className="px-4 py-3 text-slate-600">{r.handler_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConf.className}`}>
                      {statusConf.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    {r.status === 'open' && (
                      <button
                        onClick={() => openProcessModal(r)}
                        className="px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-300 rounded hover:bg-indigo-50 transition-colors"
                      >
                        处理
                      </button>
                    )}
                    {r.status === 'processing' && (
                      <button
                        onClick={() => openResolveModal(r)}
                        className="px-3 py-1 text-xs font-medium text-green-600 border border-green-300 rounded hover:bg-green-50 transition-colors"
                      >
                        完成
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <EmptyState title="无匹配记录" description="尝试调整筛选条件" />
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              {modalType === 'process' ? '处理异常' : '完成处理'}
            </h2>
            <div className="space-y-3">
              {modalType === 'process' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">处理状态</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="processing">处理中</option>
                    <option value="resolved">已解决</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {modalType === 'process' ? '处理方案' : '解决方案'}
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {updating ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
