'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { reviewDisposal, getShipments, getShipmentDetail } from '@/lib/services'
import { StatusBadge } from '@/components/StatusBadge'
import { useRole } from '@/context/RoleContext'
import { Role, DisposalAction, ShipmentStatus, DeviationType } from '@/lib/types'
import {
  ShieldCheck,
  AlertTriangle,
  Package,
  ChevronRight,
  Check,
  XCircle,
  Archive,
  Upload,
  FileText,
} from 'lucide-react'
import type { ShipmentListItem, ShipmentDetail } from '@/lib/services'

export default function ReviewPage() {
  const router = useRouter()
  const { currentRole, currentUserId } = useRole()
  const [shipments, setShipments] = useState<ShipmentListItem[]>([])
  const [selectedShipment, setSelectedShipment] = useState<ShipmentDetail | null>(null)
  const [action, setAction] = useState<DisposalAction>(DisposalAction.PENDING)
  const [comment, setComment] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getShipments()
        setShipments(data)
      } catch (err) {
        setError('加载数据失败')
      }
    }
    loadData()
  }, [])

  const pendingShipments = shipments.filter(
    (s) => s.status === ShipmentStatus.DEVIATION_JUDGED
  )

  const hasProbeOffline = selectedShipment?.temperatureReadings.some(
    (r) => r.isOffline
  )

  const offlineReadingsCount = selectedShipment?.temperatureReadings.filter(
    (r) => r.isOffline
  ).length || 0

  const handleSelectShipment = async (shipment: ShipmentListItem) => {
    setLoadingDetail(true)
    setError(null)
    try {
      const detail = await getShipmentDetail(shipment.id)
      setSelectedShipment(detail)
      setAction(DisposalAction.PENDING)
      setComment('')
      setEvidenceUrl('')
    } catch (err) {
      setError('加载批次详情失败')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipment) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (currentRole !== Role.REVIEWER) {
        throw new Error('只有复核人可以进行处置复核')
      }

      if (action === DisposalAction.PENDING) {
        throw new Error('请选择处置方式')
      }

      if (hasProbeOffline && action === DisposalAction.RELEASE && !evidenceUrl.trim()) {
        throw new Error('探头离线时禁止直接放行，必须上传人工复核证据')
      }

      await reviewDisposal({
        shipmentId: selectedShipment.id,
        action,
        comment,
        evidenceUrl: evidenceUrl || undefined,
        reviewerId: currentUserId,
      })

      setSuccess(true)

      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处置失败')
    } finally {
      setLoading(false)
    }
  }

  const disposalActions = [
    { value: DisposalAction.RELEASE, label: '放行', icon: Check, color: 'green' },
    { value: DisposalAction.ISOLATE, label: '隔离', icon: Archive, color: 'orange' },
    { value: DisposalAction.RETURN, label: '退回', icon: XCircle, color: 'red' },
  ]

  if (currentRole !== Role.REVIEWER) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">复核处置</h1>
          <p className="mt-1 text-sm text-gray-600">
            复核人对已判定偏差的批次进行放行、隔离或退回决策
          </p>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            当前角色：{currentRole}。复核处置功能仅对复核人开放。请切换到复核人角色。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">复核处置</h1>
        <p className="mt-1 text-sm text-gray-600">
          复核人对已判定偏差的批次进行放行、隔离或退回决策
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">处置成功！正在跳转到列表页...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            待复核批次
          </h2>
          {pendingShipments.length === 0 ? (
            <p className="text-sm text-gray-500">暂无待复核批次</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {pendingShipments.map((shipment) => (
                <button
                  key={shipment.id}
                  onClick={() => handleSelectShipment(shipment)}
                  className={`w-full text-left p-4 border rounded-lg transition-colors ${
                    selectedShipment?.id === shipment.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{shipment.batchNumber}</p>
                      <p className="text-sm text-gray-500">{shipment.medicineName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge type="deviation-type" value={shipment.deviationType} />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>等级: <StatusBadge type="deviation-level" value={shipment.deviationLevel} /></span>
                    <span>承运商: {shipment.carrierName}</span>
                  </div>
                  <Link
                    href={`/shipments/${shipment.id}`}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    查看详情 →
                  </Link>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-green-600" />
            复核处置
          </h2>

          {loadingDetail ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">加载中...</p>
            </div>
          ) : !selectedShipment ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">请先选择一个待复核批次</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-3 bg-gray-50 rounded-md space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {selectedShipment.batchNumber}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedShipment.medicine.name} - {selectedShipment.medicine.specification}
                </p>
                <div className="flex items-center space-x-2">
                  <StatusBadge type="deviation-type" value={selectedShipment.deviations[0]?.type || 'NONE'} />
                  <StatusBadge type="deviation-level" value={selectedShipment.deviations[0]?.level || 'NONE'} />
                </div>
              </div>

              {selectedShipment.deviations[0] && (
                <div className="p-3 bg-yellow-50 rounded-md">
                  <p className="text-xs font-medium text-yellow-800">偏差描述</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {selectedShipment.deviations[0].description}
                  </p>
                  <p className="text-xs font-medium text-yellow-800 mt-2">处置建议</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    {selectedShipment.deviations[0].judgment}
                  </p>
                </div>
              )}

              {hasProbeOffline && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-medium text-red-700 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    探头离线警告
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    该批次温度记录中存在 <span className="font-medium">{offlineReadingsCount}</span> 条探头离线记录，
                    禁止直接放行，必须提供人工复核证据
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  处置方式 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {disposalActions.map((item) => {
                    const Icon = item.icon
                    const isDisabled = hasProbeOffline && item.value === DisposalAction.RELEASE && !evidenceUrl.trim()
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setAction(item.value)}
                        className={`p-3 text-sm rounded-md border transition-colors flex flex-col items-center ${
                          action === item.value
                            ? item.color === 'green'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : item.color === 'orange'
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Icon className="w-5 h-5 mb-1" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(hasProbeOffline || action === DisposalAction.ISOLATE || action === DisposalAction.RETURN) && (
                <div>
                  <label htmlFor="evidenceUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    复核证据链接
                    {hasProbeOffline && action === DisposalAction.RELEASE && (
                      <span className="text-red-500"> *</span>
                    )}
                  </label>
                  <input
                    type="text"
                    id="evidenceUrl"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="请输入证据文件链接或说明"
                    disabled={loading}
                  />
                  {hasProbeOffline && action === DisposalAction.RELEASE && (
                    <p className="mt-1 text-xs text-red-500">
                      探头离线时放行必须提供人工复核证据
                    </p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  复核意见 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请输入复核意见"
                  disabled={loading}
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={!selectedShipment || action === DisposalAction.PENDING || loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {loading ? '提交中...' : '提交处置'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
