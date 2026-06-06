'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { judgeDeviation, getShipments } from '@/lib/services'
import { StatusBadge } from '@/components/StatusBadge'
import { useRole } from '@/context/RoleContext'
import { Role, DeviationType, DeviationLevel, ShipmentStatus } from '@/lib/types'
import { ClipboardCheck, AlertTriangle, Package, ChevronRight, Check, Thermometer } from 'lucide-react'
import type { ShipmentListItem } from '@/lib/services'

export default function DeviationPage() {
  const router = useRouter()
  const { currentRole, currentUserId } = useRole()
  const [shipments, setShipments] = useState<ShipmentListItem[]>([])
  const [selectedShipment, setSelectedShipment] = useState<ShipmentListItem | null>(null)
  const [deviationType, setDeviationType] = useState<DeviationType>(DeviationType.NONE)
  const [deviationLevel, setDeviationLevel] = useState<DeviationLevel>(DeviationLevel.NONE)
  const [description, setDescription] = useState('')
  const [judgment, setJudgment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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
    (s) => s.status === ShipmentStatus.TEMPERATURE_COLLECTED
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedShipment) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (currentRole !== Role.QUALITY_MANAGER) {
        throw new Error('只有质量负责人可以进行偏差判定')
      }

      await judgeDeviation({
        shipmentId: selectedShipment.id,
        type: deviationType,
        level: deviationLevel,
        description,
        judgment,
        qualityManagerId: currentUserId,
      })

      setSuccess(true)

      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '判定失败')
    } finally {
      setLoading(false)
    }
  }

  const deviationTypes = [
    { value: DeviationType.NONE, label: '无偏差' },
    { value: DeviationType.TEMPERATURE_EXCEEDED, label: '温度超标' },
    { value: DeviationType.PROBE_OFFLINE, label: '探头离线' },
    { value: DeviationType.BATCH_MIXED, label: '批号混装' },
  ]

  const deviationLevels = [
    { value: DeviationLevel.NONE, label: '无' },
    { value: DeviationLevel.MINOR, label: '轻微' },
    { value: DeviationLevel.MAJOR, label: '严重' },
    { value: DeviationLevel.CRITICAL, label: '危急' },
  ]

  if (currentRole !== Role.QUALITY_MANAGER) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">偏差判定</h1>
          <p className="mt-1 text-sm text-gray-600">
            质量负责人对入库批次进行偏差等级判定
          </p>
        </div>
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            当前角色：{currentRole}。偏差判定功能仅对质量负责人开放。请切换到质量负责人角色。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">偏差判定</h1>
        <p className="mt-1 text-sm text-gray-600">
          质量负责人对入库批次进行偏差类型和等级判定
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">判定成功！正在跳转到列表页...</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-blue-600" />
            待判定批次
          </h2>
          {pendingShipments.length === 0 ? (
            <div className="text-center py-12">
              <Thermometer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">暂无待判定批次</p>
              <p className="text-xs text-gray-500 mt-1">
                请等待仓库经办人完成温度数据采集后再进行判定
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingShipments.map((shipment) => (
                <button
                  key={shipment.id}
                  onClick={() => setSelectedShipment(shipment)}
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
                      <StatusBadge type="shipment" value={shipment.status} />
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    承运商: {shipment.carrierName} | 数量: {shipment.quantity}
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
            <ClipboardCheck className="w-5 h-5 mr-2 text-green-600" />
            偏差判定
          </h2>

          {!selectedShipment ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">请先选择一个待判定批次</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-900">
                  {selectedShipment.batchNumber}
                </p>
                <p className="text-xs text-gray-500">{selectedShipment.medicineName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏差类型 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {deviationTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setDeviationType(type.value)
                        if (type.value === DeviationType.NONE) {
                          setDeviationLevel(DeviationLevel.NONE)
                        } else if (deviationLevel === DeviationLevel.NONE) {
                          setDeviationLevel(DeviationLevel.MINOR)
                        }
                      }}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        deviationType === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  偏差等级 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {deviationLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setDeviationLevel(level.value)}
                      disabled={deviationType === DeviationType.NONE && level.value !== DeviationLevel.NONE}
                      className={`p-2 text-sm rounded-md border transition-colors ${
                        deviationLevel === level.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      } ${
                        deviationType === DeviationType.NONE && level.value !== DeviationLevel.NONE
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  偏差描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请描述偏差情况"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="judgment" className="block text-sm font-medium text-gray-700 mb-2">
                  处置建议 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="judgment"
                  value={judgment}
                  onChange={(e) => setJudgment(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="请给出处置建议"
                  disabled={loading}
                />
              </div>

              {deviationType === DeviationType.PROBE_OFFLINE && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 font-medium">
                    ⚠️ 探头离线提示
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    探头离线时禁止直接放行，必须要求人工复核证据
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={!selectedShipment || loading}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {loading ? '判定中...' : '提交判定'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
