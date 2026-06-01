import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle, XCircle, Truck, ArrowRight, BookCheck, RotateCcw,
  Package, CalendarClock, X, Loader2
} from 'lucide-react'
import { useApi, useApiPost, useApiPut } from '@/hooks/useApi'
import StatusBadge, { statusConfig } from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import type { InterlibraryRequest, StatusTransition, RequestStatus } from '@/types'

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

interface ShippingForm {
  carrier: string
  tracking_number: string
  estimated_arrival: string
}

interface RenewalForm {
  requested_due_date: string
  reason: string
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const { data, loading, error, refetch } = useApi<InterlibraryRequest>(`/api/requests/${id}`)
  const { data: transitions } = useApi<StatusTransition[]>(`/api/requests/${id}/transitions`)
  const { put: putStatus } = useApiPut<void>('')
  const { post: postRenewal } = useApiPost<void, RenewalForm>('')
  const { put: putShip } = useApiPut<void, ShippingForm>('')
  const { put: putArrive } = useApiPut<void>('')
  const { put: putReturn } = useApiPut<void>('')

  const [shippingModal, setShippingModal] = useState(false)
  const [renewalModal, setRenewalModal] = useState(false)
  const [shipForm, setShipForm] = useState<ShippingForm>({ carrier: '', tracking_number: '', estimated_arrival: '' })
  const [renewalForm, setRenewalForm] = useState<RenewalForm>({ requested_due_date: '', reason: '' })
  const [actionLoading, setActionLoading] = useState(false)

  const handleStatusUpdate = async (url: string, body?: unknown) => {
    setActionLoading(true)
    await putStatus(url, body)
    await refetch()
    setActionLoading(false)
  }

  const handleApprove = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'approved', remark: '审批通过' })
  const handleReject = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'rejected', remark: '拒绝借出' })
  const handleMarkTransit = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'in_transit', remark: '标记运输中' })
  const handleReading = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'reading', remark: '读者取书' })
  const handleApproveRenewal = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'renewal_approved', remark: '续借批准' })
  const handleRejectRenewal = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'renewal_rejected', remark: '续借拒绝' })
  const handleComplete = () => handleStatusUpdate(`/api/requests/${id}/status`, { toStatus: 'completed', remark: '流程完成' })

  const handleShip = async () => {
    setActionLoading(true)
    await putShip(`/api/requests/${id}/ship`, shipForm)
    setShippingModal(false)
    await refetch()
    setActionLoading(false)
  }

  const handleArrive = async () => {
    setActionLoading(true)
    await putArrive(`/api/requests/${id}/arrive`)
    await refetch()
    setActionLoading(false)
  }

  const handleReturnBook = async () => {
    setActionLoading(true)
    await putReturn(`/api/requests/${id}/return`)
    await refetch()
    setActionLoading(false)
  }

  const handleSubmitRenewal = async () => {
    setActionLoading(true)
    await postRenewal(`/api/requests/${id}/renewal`, renewalForm)
    setRenewalModal(false)
    await refetch()
    setActionLoading(false)
  }

  const renderActions = (status: RequestStatus) => {
    const btn = (label: string, color: string, icon: React.ReactNode, onClick: () => void) => (
      <button
        key={label}
        onClick={onClick}
        disabled={actionLoading}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${color}`}
      >
        {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
        {label}
      </button>
    )

    switch (status) {
      case 'pending':
        return [
          btn('批准', 'bg-green-600 text-white hover:bg-green-700', <CheckCircle className="w-3.5 h-3.5" />, handleApprove),
          btn('拒绝', 'bg-red-600 text-white hover:bg-red-700', <XCircle className="w-3.5 h-3.5" />, handleReject),
        ]
      case 'approved':
        return [btn('登记物流', 'bg-amber-600 text-white hover:bg-amber-700', <Truck className="w-3.5 h-3.5" />, () => setShippingModal(true))]
      case 'shipping_out':
        return [btn('标记运输中', 'bg-amber-600 text-white hover:bg-amber-700', <ArrowRight className="w-3.5 h-3.5" />, handleMarkTransit)]
      case 'in_transit':
        return [btn('确认到馆', 'bg-teal-600 text-white hover:bg-teal-700', <Package className="w-3.5 h-3.5" />, handleArrive)]
      case 'arrived':
        return [btn('读者取书', 'bg-green-600 text-white hover:bg-green-700', <BookCheck className="w-3.5 h-3.5" />, handleReading)]
      case 'reading':
        return [
          btn('申请续借', 'bg-purple-600 text-white hover:bg-purple-700', <CalendarClock className="w-3.5 h-3.5" />, () => setRenewalModal(true)),
          btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook),
        ]
      case 'renewal_pending':
        return [
          btn('批准续借', 'bg-green-600 text-white hover:bg-green-700', <CheckCircle className="w-3.5 h-3.5" />, handleApproveRenewal),
          btn('拒绝续借', 'bg-red-600 text-white hover:bg-red-700', <XCircle className="w-3.5 h-3.5" />, handleRejectRenewal),
        ]
      case 'renewal_approved':
      case 'renewal_rejected':
        return [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook)]
      case 'returning':
        return [btn('确认完成', 'bg-green-600 text-white hover:bg-green-700', <CheckCircle className="w-3.5 h-3.5" />, handleComplete)]
      case 'overdue':
      case 'exception':
        return [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook)]
      default:
        return null
    }
  }

  if (loading) return <LoadingSpinner text="加载申请详情..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return <ErrorState message="未找到该申请" />

  const actions = renderActions(data.status)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-800">{data.request_no}</h1>
          <StatusBadge status={data.status} />
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-700 mb-4">基本信息</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">ISBN</span><span className="text-sm text-slate-800">{data.isbn}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">读者姓名</span><span className="text-sm text-slate-800">{data.reader_name}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">书名</span><span className="text-sm text-slate-800">{data.title}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">电话</span><span className="text-sm text-slate-800">{data.reader_phone || '-'}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">作者</span><span className="text-sm text-slate-800">{data.author}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">邮箱</span><span className="text-sm text-slate-800">{data.reader_email || '-'}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">出版社</span><span className="text-sm text-slate-800">{data.publisher}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">申请类型</span><span className="text-sm text-slate-800">{data.request_type === 'borrow' ? '借阅' : '复印'}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">用途</span><span className="text-sm text-slate-800">{data.purpose || '-'}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">到期日</span><span className="text-sm text-slate-800">{data.due_date ? formatDateTime(data.due_date) : '-'}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-medium text-slate-700 mb-4">合作馆信息</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">馆名</span><span className="text-sm text-slate-800">{data.library_name || '-'}</span></div>
          <div className="flex items-center"><span className="text-sm text-slate-500 w-20">代码</span><span className="text-sm text-slate-800">{data.library_code || '-'}</span></div>
        </div>
      </div>

      {transitions && transitions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-700 mb-4">状态流转</h2>
          <div className="flex items-start w-full overflow-x-auto py-4">
            {transitions.map((t, i) => {
              const isCurrent = t.to_status === data.status
              const isCompleted = i < transitions.length - 1
              const config = statusConfig[t.to_status]
              return (
                <div key={t.id} className="flex items-start min-w-[140px]">
                  <div className="flex flex-col items-center flex-1">
                    <div className="relative flex items-center justify-center">
                      {isCurrent && <span className="absolute w-8 h-8 rounded-full bg-indigo-600/20 animate-pulse" />}
                      <span className={`relative w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : isCurrent ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-white border-slate-300 text-slate-300'}`}>
                        {isCompleted ? '✓' : i + 1}
                      </span>
                    </div>
                    {config && (
                      <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        {config.label}
                      </span>
                    )}
                    <p className={`mt-1 text-xs ${isCurrent ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>{t.operator_name}</p>
                    <p className="text-xs text-slate-400">{formatDateTime(t.created_at)}</p>
                    {t.remark && <p className="text-xs text-slate-400 mt-0.5">{t.remark}</p>}
                  </div>
                  {i < transitions.length - 1 && (
                    <div className={`flex-shrink-0 h-0.5 w-8 mt-3 -ml-4 -mr-4 ${isCompleted ? 'bg-indigo-600' : 'border-t-2 border-dashed border-slate-300 bg-transparent'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {data.shipping_records && data.shipping_records.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-700 mb-4">物流信息</h2>
          {data.shipping_records.map((s) => (
            <div key={s.id} className="grid grid-cols-3 gap-x-8 gap-y-3">
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">承运商</span><span className="text-sm text-slate-800">{s.carrier}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">物流单号</span><span className="text-sm text-slate-800">{s.tracking_number}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">寄出日期</span><span className="text-sm text-slate-800">{formatDateTime(s.shipped_date)}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">预计到达</span><span className="text-sm text-slate-800">{formatDateTime(s.estimated_arrival)}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">实际到达</span><span className="text-sm text-slate-800">{formatDateTime(s.actual_arrival)}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">归还单号</span><span className="text-sm text-slate-800">{s.return_tracking_number || '-'}</span></div>
            </div>
          ))}
        </div>
      )}

      {data.renewal_requests && data.renewal_requests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-medium text-slate-700 mb-4">续借记录</h2>
          {data.renewal_requests.map((r) => (
            <div key={r.id} className="grid grid-cols-2 gap-x-8 gap-y-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0 mb-3 last:mb-0">
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">原到期日</span><span className="text-sm text-slate-800">{formatDateTime(r.original_due_date)}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">申请到期日</span><span className="text-sm text-slate-800">{formatDateTime(r.requested_due_date)}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">原因</span><span className="text-sm text-slate-800">{r.reason}</span></div>
              <div className="flex items-center"><span className="text-sm text-slate-500 w-24">审批状态</span><span className="text-sm text-slate-800">{r.status}</span></div>
            </div>
          ))}
        </div>
      )}

      {shippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700">登记物流</h3>
              <button onClick={() => setShippingModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">承运商</label>
              <input type="text" value={shipForm.carrier} onChange={(e) => setShipForm((p) => ({ ...p, carrier: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">物流单号</label>
              <input type="text" value={shipForm.tracking_number} onChange={(e) => setShipForm((p) => ({ ...p, tracking_number: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">预计到达日期</label>
              <input type="date" value={shipForm.estimated_arrival} onChange={(e) => setShipForm((p) => ({ ...p, estimated_arrival: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShippingModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleShip} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50">确认</button>
            </div>
          </div>
        </div>
      )}

      {renewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700">申请续借</h3>
              <button onClick={() => setRenewalModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">申请到期日</label>
              <input type="date" value={renewalForm.requested_due_date} onChange={(e) => setRenewalForm((p) => ({ ...p, requested_due_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">续借原因</label>
              <textarea rows={3} value={renewalForm.reason} onChange={(e) => setRenewalForm((p) => ({ ...p, reason: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setRenewalModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleSubmitRenewal} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50">提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
