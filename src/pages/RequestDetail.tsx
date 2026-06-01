import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  CheckCircle, XCircle, Truck, ArrowRight, BookCheck, RotateCcw,
  Package, CalendarClock, X, Loader2, UserCircle, Clock,
  AlertTriangle, Wrench
} from 'lucide-react'
import { useApi, useApiPost, useApiPut } from '@/hooks/useApi'
import StatusBadge, { statusConfig } from '@/components/StatusBadge'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorState from '@/components/ErrorState'
import { useAppStore, roleLabels, type UserRole } from '@/stores/appStore'
import type { InterlibraryRequest, StatusTransition, RequestStatus, ExceptionRecord } from '@/types'

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

const exTypeMap: Record<string, string> = {
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

interface ShippingForm {
  carrier: string
  tracking_number: string
  estimated_arrival: string
}

interface RenewalForm {
  requested_due_date: string
  reason: string
}

interface ExceptionForm {
  type: string
  description: string
}

interface HandleExceptionForm {
  status: string
  resolution: string
}

interface ActionDef {
  label: string
  color: string
  icon: React.ReactNode
  onClick: () => void
}

const nextStepHints: Record<RequestStatus, Record<UserRole, string | null>> = {
  pending: {
    librarian: '等待流通部主管审批',
    partner: '等待流通部主管审批',
    supervisor: null,
  },
  approved: {
    librarian: '等待合作馆联系人登记物流',
    partner: null,
    supervisor: '等待合作馆联系人登记物流',
  },
  shipping_out: {
    librarian: '等待合作馆确认发出',
    partner: null,
    supervisor: '等待合作馆确认发出',
  },
  in_transit: {
    librarian: null,
    partner: '等待读者服务馆员确认到馆',
    supervisor: '等待读者服务馆员确认到馆',
  },
  arrived: {
    librarian: null,
    partner: '等待读者取书',
    supervisor: '等待读者取书',
  },
  reading: {
    librarian: null,
    partner: '读者借阅中，等待归还或续借',
    supervisor: '读者借阅中',
  },
  renewal_pending: {
    librarian: '等待流通部主管审批续借',
    partner: '等待流通部主管审批续借',
    supervisor: null,
  },
  renewal_approved: {
    librarian: null,
    partner: '续借已批准，等待归还',
    supervisor: '续借已批准，等待归还',
  },
  renewal_rejected: {
    librarian: null,
    partner: '续借已拒绝，等待归还',
    supervisor: '续借已拒绝，等待归还',
  },
  returning: {
    librarian: null,
    partner: '等待读者服务馆员验收完成',
    supervisor: '等待读者服务馆员验收完成',
  },
  completed: {
    librarian: null,
    partner: null,
    supervisor: null,
  },
  overdue: {
    librarian: null,
    partner: '图书已逾期，需尽快处理',
    supervisor: null,
  },
  exception: {
    librarian: null,
    partner: '存在异常，需尽快处理',
    supervisor: null,
  },
  rejected: {
    librarian: null,
    partner: null,
    supervisor: null,
  },
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
  const { put: putComplete } = useApiPut<void>('')
  const { post: postException } = useApiPost<void, ExceptionForm & { request_id: number }>('')
  const { put: putHandleException } = useApiPut<void, HandleExceptionForm>('')

  const { currentRole, setCurrentRole } = useAppStore()

  const [shippingModal, setShippingModal] = useState(false)
  const [renewalModal, setRenewalModal] = useState(false)
  const [exceptionModal, setExceptionModal] = useState(false)
  const [handleExceptionModal, setHandleExceptionModal] = useState(false)
  const [handleExceptionModalType, setHandleExceptionModalType] = useState<'process' | 'resolve'>('process')
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null)
  const [shipForm, setShipForm] = useState<ShippingForm>({ carrier: '', tracking_number: '', estimated_arrival: '' })
  const [renewalForm, setRenewalForm] = useState<RenewalForm>({ requested_due_date: '', reason: '' })
  const [exceptionForm, setExceptionForm] = useState<ExceptionForm>({ type: 'damage', description: '' })
  const [handleExceptionForm, setHandleExceptionForm] = useState<HandleExceptionForm>({ status: 'processing', resolution: '' })
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
  const handleApproveRenewal = () => {
    const pendingRenewal = data?.renewal_requests?.find(r => r.status === 'pending')
    if (pendingRenewal) {
      handleStatusUpdate(`/api/requests/${id}/renewal/${pendingRenewal.id}`, { approved: true, remark: '续借批准' })
    }
  }
  const handleRejectRenewal = () => {
    const pendingRenewal = data?.renewal_requests?.find(r => r.status === 'pending')
    if (pendingRenewal) {
      handleStatusUpdate(`/api/requests/${id}/renewal/${pendingRenewal.id}`, { approved: false, remark: '续借拒绝' })
    }
  }
  const handleComplete = async () => {
    setActionLoading(true)
    await putComplete(`/api/requests/${id}/complete`, { remark: '流程完成' })
    await refetch()
    setActionLoading(false)
  }

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

  const handleSubmitException = async () => {
    if (!id) return
    setActionLoading(true)
    await postException('/api/exceptions', { ...exceptionForm, request_id: Number(id) })
    setExceptionModal(false)
    setExceptionForm({ type: 'damage', description: '' })
    await refetch()
    setActionLoading(false)
  }

  const openProcessExceptionModal = (record: ExceptionRecord) => {
    setSelectedException(record)
    setHandleExceptionModalType('process')
    setHandleExceptionForm({ status: 'processing', resolution: '' })
    setHandleExceptionModal(true)
  }

  const openResolveExceptionModal = (record: ExceptionRecord) => {
    setSelectedException(record)
    setHandleExceptionModalType('resolve')
    setHandleExceptionForm({ status: 'resolved', resolution: '' })
    setHandleExceptionModal(true)
  }

  const handleSubmitHandleException = async () => {
    if (!selectedException) return
    setActionLoading(true)
    await putHandleException(`/api/exceptions/${selectedException.id}`, handleExceptionForm)
    setHandleExceptionModal(false)
    await refetch()
    setActionLoading(false)
  }

  const getRoleActions = (status: RequestStatus, role: UserRole): ActionDef[] => {
    const btn = (label: string, color: string, icon: React.ReactNode, onClick: () => void): ActionDef => ({
      label, color, icon, onClick,
    })

    const exceptionBtn = btn('登记异常', 'bg-red-600 text-white hover:bg-red-700', <AlertTriangle className="w-3.5 h-3.5" />, () => setExceptionModal(true))

    const roleActions: Record<UserRole, Partial<Record<RequestStatus, ActionDef[]>>> = {
      librarian: {
        in_transit: [btn('确认到馆', 'bg-teal-600 text-white hover:bg-teal-700', <Package className="w-3.5 h-3.5" />, handleArrive), exceptionBtn],
        arrived: [btn('读者取书', 'bg-green-600 text-white hover:bg-green-700', <BookCheck className="w-3.5 h-3.5" />, handleReading), exceptionBtn],
        reading: [
          btn('申请续借', 'bg-purple-600 text-white hover:bg-purple-700', <CalendarClock className="w-3.5 h-3.5" />, () => setRenewalModal(true)),
          btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook),
          exceptionBtn,
        ],
        renewal_approved: [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook), exceptionBtn],
        renewal_rejected: [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook), exceptionBtn],
        returning: [btn('确认完成', 'bg-green-600 text-white hover:bg-green-700', <CheckCircle className="w-3.5 h-3.5" />, handleComplete), exceptionBtn],
        overdue: [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook)],
        exception: [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook)],
      },
      partner: {
        approved: [btn('登记物流', 'bg-amber-600 text-white hover:bg-amber-700', <Truck className="w-3.5 h-3.5" />, () => setShippingModal(true))],
        shipping_out: [btn('标记运输中', 'bg-amber-600 text-white hover:bg-amber-700', <ArrowRight className="w-3.5 h-3.5" />, handleMarkTransit)],
      },
      supervisor: {
        pending: [
          btn('批准', 'bg-green-600 text-white hover:bg-green-700', <CheckCircle className="w-3.5 h-3.5" />, handleApprove),
          btn('拒绝', 'bg-red-600 text-white hover:bg-red-700', <XCircle className="w-3.5 h-3.5" />, handleReject),
          exceptionBtn,
        ],
        renewal_pending: [
          btn('批准续借', 'bg-green-600 text-white hover:bg-green-700', <CheckCircle className="w-3.5 h-3.5" />, handleApproveRenewal),
          btn('拒绝续借', 'bg-red-600 text-white hover:bg-red-700', <XCircle className="w-3.5 h-3.5" />, handleRejectRenewal),
          exceptionBtn,
        ],
        overdue: [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook), exceptionBtn],
        exception: [btn('归还', 'bg-indigo-600 text-white hover:bg-indigo-700', <RotateCcw className="w-3.5 h-3.5" />, handleReturnBook)],
      },
    }

    return roleActions[role][status] || []
  }

  if (loading) return <LoadingSpinner text="加载申请详情..." />
  if (error) return <ErrorState message={error} onRetry={refetch} />
  if (!data) return <ErrorState message="未找到该申请" />

  const actions = getRoleActions(data.status, currentRole)
  const hint = nextStepHints[data.status]?.[currentRole]
  const isTerminal = data.status === 'completed' || data.status === 'rejected'
  const hasExceptions = data.exception_records && data.exception_records.length > 0

  const roles: UserRole[] = ['librarian', 'partner', 'supervisor']

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-slate-800">{data.request_no}</h1>
          <StatusBadge status={data.status} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <UserCircle className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 mr-2">当前视角：</span>
            <div className="flex items-center gap-1">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setCurrentRole(role)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentRole === role
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {roleLabels[role]}
                </button>
              ))}
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={actionLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : action.icon}
                {action.label}
              </button>
            ))}
            </div>
          )}
        </div>
        {actions.length === 0 && hint && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-amber-700">{hint}</span>
          </div>
        )}
        {actions.length === 0 && !hint && isTerminal && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">
              {data.status === 'completed' ? '该申请已完成，流程已结束' : '该申请已被拒绝，流程已结束'}
            </span>
          </div>
        )}
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

      {hasExceptions && (
        <div className="bg-red-50 rounded-xl border border-red-200 p-6">
          <h2 className="text-lg font-medium text-red-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            异常记录
          </h2>
          {data.exception_records?.map((ex) => {
            const statusConf = exStatusConfig[ex.status] || exStatusConfig.open
            const canProcess = currentRole !== 'partner' && ex.status !== 'resolved'
            return (
              <div key={ex.id} className="bg-white rounded-lg border border-red-100 p-4 mb-3 last:mb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusConf.className}`}>
                        {statusConf.label}
                      </span>
                      <span className="text-sm font-medium text-slate-800">
                        {exTypeMap[ex.type] || ex.type}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400">{formatDateTime(ex.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{ex.description}</p>
                    {ex.resolution && (
                      <p className="text-xs text-slate-500">处理方案：{ex.resolution}</p>
                    )}
                    {ex.handler_name && (
                      <p className="text-xs text-slate-400 mt-1">处理人：{ex.handler_name}</p>
                    )}
                  </div>
                  {canProcess && (
                    <div className="flex items-center gap-2">
                      {ex.status === 'open' && (
                        <button
                          onClick={() => openProcessExceptionModal(ex)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-300 rounded hover:bg-indigo-50 transition-colors">
                          <Wrench className="w-3 h-3" />
                          处理
                        </button>
                      )}
                      {ex.status === 'processing' && (
                        <button
                          onClick={() => openResolveExceptionModal(ex)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 border border-green-300 rounded hover:bg-green-50 transition-colors">
                          <CheckCircle className="w-3 h-3" />
                          完成
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
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

      {exceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                登记异常
              </h3>
              <button onClick={() => setExceptionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">异常类型</label>
              <select
                value={exceptionForm.type}
                onChange={(e) => setExceptionForm((p) => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="damage">图书损坏</option>
                <option value="lost">图书丢失</option>
                <option value="delay">物流延误</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">异常描述</label>
              <textarea
                rows={3}
                value={exceptionForm.description}
                onChange={(e) => setExceptionForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="请详细描述异常情况..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setExceptionModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleSubmitException} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">确认登记</button>
            </div>
          </div>
        </div>
      )}

      {handleExceptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-700">
                {handleExceptionModalType === 'process' ? '处理异常' : '完成处理'}
              </h3>
              <button onClick={() => setHandleExceptionModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            {handleExceptionModalType === 'process' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">处理状态</label>
                <select
                  value={handleExceptionForm.status}
                  onChange={(e) => setHandleExceptionForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="processing">处理中</option>
                  <option value="resolved">已解决</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                {handleExceptionModalType === 'process' ? '处理方案' : '解决方案'}
              </label>
              <textarea
                rows={3}
                value={handleExceptionForm.resolution}
                onChange={(e) => setHandleExceptionForm((p) => ({ ...p, resolution: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="请描述处理方案..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setHandleExceptionModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50">取消</button>
              <button onClick={handleSubmitHandleException} disabled={actionLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
