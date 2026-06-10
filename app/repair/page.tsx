'use client'
import { useState, useEffect } from 'react'
import { ClipboardList, Camera, CheckCircle, AlertCircle, XCircle, ArrowRight } from 'lucide-react'
import type { WorkOrder, RepairResult, LeakLevel } from '@/lib/db'

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

const repairResultOptions: { value: RepairResult; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { value: 'FIXED', label: '正常修复', description: '漏点已修复，恢复供水', icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-600' },
  { value: 'SUSPECTED_DUPLICATE', label: '疑似重复', description: '可能是重复报修', icon: <AlertCircle className="w-5 h-5" />, color: 'text-yellow-600' },
  { value: 'VALVE_LOCATION_FAILED', label: '阀门定位失败', description: '无法找到阀门位置', icon: <XCircle className="w-5 h-5" />, color: 'text-orange-600' },
  { value: 'NOT_REPAIRED', label: '未修复', description: '因特殊原因未修复', icon: <XCircle className="w-5 h-5" />, color: 'text-red-600' },
]

export default function RepairPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [repairResult, setRepairResult] = useState<RepairResult>('FIXED')
  const [operator, setOperator] = useState('')
  const [comment, setComment] = useState('')
  const [photoCount, setPhotoCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter((o: WorkOrder) => o.status === 'DISPATCHED')))
  }, [])

  const handleRepair = async () => {
    if (!selectedOrder || !operator) return
    
    setSubmitting(true)
    
    await fetch(`/api/work-orders/${selectedOrder.id}/repair`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repairResult,
        operator,
        comment,
        repairPhotos: Array.from({ length: photoCount }, (_, i) => `photo_${i + 1}.jpg`),
      }),
    })
    
    setSubmitting(false)
    setSelectedOrder(null)
    setRepairResult('FIXED')
    setComment('')
    setPhotoCount(0)
    
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter((o: WorkOrder) => o.status === 'DISPATCHED')))
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <ClipboardList className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">回填处理</h2>
              <p className="text-sm text-gray-500 mt-1">待回填工单：{orders.length} 条</p>
            </div>
          </div>

          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-600">{order.serialNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${leakLevelColors[order.leakLevel]}`}>
                        {leakLevelLabels[order.leakLevel]}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>{order.pipeSection.name} - {order.pipeSection.area}</div>
                      <div className="text-gray-500 mt-1">
                        抢修队：{order.repairTeam?.name || '未指派'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${selectedOrder?.id === order.id ? 'text-purple-500' : 'text-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无待回填工单</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">回填处理</h3>
        
        {selectedOrder ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-mono text-blue-600">{selectedOrder.serialNumber}</div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedOrder.pipeSection.name} | {selectedOrder.repairTeam?.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">处理结果</label>
              <div className="space-y-2">
                {repairResultOptions.map(result => (
                  <label
                    key={result.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      repairResult === result.value
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="repairResult"
                      value={result.value}
                      checked={repairResult === result.value}
                      onChange={e => setRepairResult(e.target.value as RepairResult)}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className={result.color}>
                      {result.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{result.label}</div>
                      <div className="text-xs text-gray-500">{result.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">抢修人员</label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入抢修人员姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">处理说明</label>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="填写处理详情..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Camera className="w-4 h-4 inline mr-1" />
                抢修照片（{photoCount} 张）
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoCount(Math.min(photoCount + 1, 5))}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  + 添加
                </button>
                {photoCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPhotoCount(Math.max(photoCount - 1, 0))}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    - 删除
                  </button>
                )}
              </div>
              {photoCount > 0 && (
                <div className="mt-2 flex gap-2">
                  {Array.from({ length: photoCount }).map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      照片 {i + 1}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleRepair}
              disabled={!operator || submitting}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '提交中...' : '确认回填'}
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>请选择待回填的工单</p>
          </div>
        )}
      </div>
    </div>
  )
}