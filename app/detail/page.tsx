'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, User, Phone, MapPin, AlertTriangle, Camera, Merge, Check, XCircle } from 'lucide-react'

type WorkOrderStatus = 'PENDING' | 'DISPATCHED' | 'REPAIRED' | 'REVIEWING' | 'COMPLETED' | 'REJECTED'
type LeakLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type RepairResult = 'FIXED' | 'SUSPECTED_DUPLICATE' | 'VALVE_LOCATION_FAILED' | 'NOT_REPAIRED'
type ReviewResult = 'APPROVED' | 'REJECTED'
type HistoryAction = 'REPORTED' | 'DISPATCHED' | 'REPAIRED' | 'REVIEWED' | 'REJECTED' | 'MERGED'

interface PipeSection {
  id: string
  name: string
  area: string
  diameter: string
  material: string
  installationYear?: number
}

interface RepairTeam {
  id: string
  name: string
  leaderName: string
  leaderPhone: string
}

interface WorkOrderHistory {
  id: string
  workOrderId: string
  action: HistoryAction
  operator: string
  comment?: string
  createdAt: Date
}

interface WorkOrder {
  id: string
  serialNumber: string
  status: WorkOrderStatus
  reporterName: string
  reporterPhone: string
  pipeSectionId: string
  pipeSection: PipeSection
  leakLevel: LeakLevel
  waterStopArea?: string
  description: string
  createdAt: Date
  updatedAt: Date
  dispatchTo?: string
  repairTeam?: RepairTeam
  repairResult?: RepairResult
  repairPhotos: string[]
  reviewResult?: ReviewResult
  reviewComment?: string
  mergedFrom: string[]
  history: WorkOrderHistory[]
}

const statusLabels: Record<WorkOrderStatus, string> = {
  PENDING: '待派单',
  DISPATCHED: '已派发',
  REPAIRED: '已回填',
  REVIEWING: '复核中',
  COMPLETED: '已完成',
  REJECTED: '已退回',
}

const statusColors: Record<WorkOrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  DISPATCHED: 'bg-blue-100 text-blue-800',
  REPAIRED: 'bg-purple-100 text-purple-800',
  REVIEWING: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}

const leakLevelLabels: Record<LeakLevel, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

const leakLevelColors: Record<LeakLevel, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const repairResultLabels: Record<RepairResult, string> = {
  FIXED: '正常修复',
  SUSPECTED_DUPLICATE: '疑似重复报修',
  VALVE_LOCATION_FAILED: '阀门定位失败',
  NOT_REPAIRED: '未修复',
}

const reviewResultLabels: Record<ReviewResult, string> = {
  APPROVED: '复核通过',
  REJECTED: '复核不通过',
}

const historyActionLabels: Record<HistoryAction, string> = {
  REPORTED: '报修登记',
  DISPATCHED: '派单',
  REPAIRED: '回填处理',
  REVIEWED: '复核通过',
  REJECTED: '退回',
  MERGED: '合并工单',
}

export default function DetailPage() {
  const [order, setOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    
    if (id) {
      fetch(`/api/work-orders/${id}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            返回
          </Link>
        </div>
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>未找到工单信息</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            返回工单列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-5 h-5" />
          返回
        </Link>
        <div>
          <h2 className="text-xl font-bold text-gray-900">工单详情</h2>
          <p className="text-sm text-gray-500 mt-1">{order.serialNumber}</p>
        </div>
        <span className={`ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">报修人信息</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">{order.reporterName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <span className="text-gray-600">{order.reporterPhone}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">管段信息</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900">{order.pipeSection.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                片区：{order.pipeSection.area} | 管径：{order.pipeSection.diameter} | 材质：{order.pipeSection.material} | 安装年份：{order.pipeSection.installationYear}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">报修详情</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${leakLevelColors[order.leakLevel]}`}>
                {order.leakLevel === 'CRITICAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                漏损等级：{leakLevelLabels[order.leakLevel]}
              </span>
            </div>
            {order.waterStopArea && (
              <div className="text-sm text-gray-600 mb-3">
                停水范围：{order.waterStopArea}
              </div>
            )}
            <div className="text-gray-800">
              {order.description}
            </div>
          </div>

          {order.repairResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">处理结果</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{repairResultLabels[order.repairResult]}</span>
                </div>
                {order.repairPhotos.length > 0 && (
                  <div className="flex gap-2">
                    {order.repairPhotos.map((photo, i) => (
                      <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        抢修照片 {i + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {order.reviewResult && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">复核结果</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {order.reviewResult === 'APPROVED' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900">{reviewResultLabels[order.reviewResult]}</span>
                </div>
                {order.reviewComment && (
                  <div className="text-sm text-gray-600">
                    备注：{order.reviewComment}
                  </div>
                )}
              </div>
            </div>
          )}

          {order.mergedFrom.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                <Merge className="w-4 h-4 inline mr-1" />
                合并工单
              </h3>
              <div className="flex flex-wrap gap-2">
                {order.mergedFrom.map((serial, i) => (
                  <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                    {serial}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              <Clock className="w-4 h-4 inline mr-1" />
              历史节点
            </h3>
            <div className="space-y-4">
              {[...order.history].reverse().map((record, index) => (
                <div key={record.id} className="relative">
                  {index < order.history.length - 1 && (
                    <div className="absolute left-3 top-8 w-0.5 h-full bg-gray-200"></div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${
                      record.action === 'REVIEWED' ? 'bg-green-500' :
                      record.action === 'REJECTED' ? 'bg-red-500' :
                      record.action === 'MERGED' ? 'bg-yellow-500' :
                      record.action === 'REPAIRED' ? 'bg-purple-500' :
                      record.action === 'DISPATCHED' ? 'bg-blue-500' : 'bg-gray-500'
                    }`}>
                      {record.action === 'REVIEWED' && <Check className="w-3 h-3" />}
                      {record.action === 'REJECTED' && <XCircle className="w-3 h-3" />}
                      {record.action === 'MERGED' && <Merge className="w-3 h-3" />}
                      {record.action === 'REPAIRED' && <Camera className="w-3 h-3" />}
                      {record.action === 'DISPATCHED' && <MapPin className="w-3 h-3" />}
                      {record.action === 'REPORTED' && <AlertTriangle className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium text-gray-900">{historyActionLabels[record.action]}</div>
                      <div className="text-xs text-gray-500">{formatDate(record.createdAt)}</div>
                      <div className="text-sm text-gray-600 mt-1">操作人：{record.operator}</div>
                      {record.comment && (
                        <div className="text-sm text-gray-500 mt-1">{record.comment}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">抢修队信息</h3>
            {order.repairTeam ? (
              <div className="space-y-2">
                <div className="font-medium text-gray-900">{order.repairTeam.name}</div>
                <div className="text-sm text-gray-600">
                  <User className="w-3 h-3 inline mr-1" />
                  {order.repairTeam.leaderName}
                </div>
                <div className="text-sm text-gray-600">
                  <Phone className="w-3 h-3 inline mr-1" />
                  {order.repairTeam.leaderPhone}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">暂未指派抢修队</div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">工单时间</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>创建时间：{formatDate(order.createdAt)}</div>
              <div>更新时间：{formatDate(order.updatedAt)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}