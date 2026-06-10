'use client'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ArrowRight, User } from 'lucide-react'
import type { WorkOrder, ReviewResult, LeakLevel } from '@/lib/db'

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

const repairResultLabels: Record<string, string> = {
  FIXED: '正常修复',
  SUSPECTED_DUPLICATE: '疑似重复报修',
  VALVE_LOCATION_FAILED: '阀门定位失败',
  NOT_REPAIRED: '未修复',
}

export default function ReviewPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult>('APPROVED')
  const [operator, setOperator] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter((o: WorkOrder) => o.status === 'REPAIRED')))
  }, [])

  const handleReview = async () => {
    if (!selectedOrder || !operator) return
    
    setSubmitting(true)
    
    await fetch(`/api/work-orders/${selectedOrder.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reviewResult,
        operator,
        comment,
      }),
    })
    
    setSubmitting(false)
    setSelectedOrder(null)
    setReviewResult('APPROVED')
    setComment('')
    
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter((o: WorkOrder) => o.status === 'REPAIRED')))
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">复核确认</h2>
              <p className="text-sm text-gray-500 mt-1">待复核工单：{orders.length} 条</p>
            </div>
          </div>

          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-green-500 bg-green-50'
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
                      <span className="text-xs text-gray-500">
                        处理结果：{repairResultLabels[order.repairResult || '']}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>{order.pipeSection.name} - {order.pipeSection.area}</div>
                      <div className="text-gray-500 mt-1">
                        抢修队：{order.repairTeam?.name || '未指派'}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className={`w-5 h-5 ${selectedOrder?.id === order.id ? 'text-green-500' : 'text-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无待复核工单</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">复核确认</h3>
        
        {selectedOrder ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-mono text-blue-600">{selectedOrder.serialNumber}</div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedOrder.pipeSection.name} | {repairResultLabels[selectedOrder.repairResult || '']}
              </div>
            </div>

            {selectedOrder.repairResult === 'FIXED' && selectedOrder.repairPhotos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">抢修照片</label>
                <div className="flex gap-2">
                  {selectedOrder.repairPhotos.map((photo, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                      照片 {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">复核结果</label>
              <div className="space-y-2">
                <label
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    reviewResult === 'APPROVED'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewResult"
                    value="APPROVED"
                    checked={reviewResult === 'APPROVED'}
                    onChange={() => setReviewResult('APPROVED')}
                    className="w-4 h-4 text-green-600"
                  />
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">确认恢复</div>
                    <div className="text-xs text-gray-500">确认修复完成，恢复供水</div>
                  </div>
                </label>
                <label
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    reviewResult === 'REJECTED'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="reviewResult"
                    value="REJECTED"
                    checked={reviewResult === 'REJECTED'}
                    onChange={() => setReviewResult('REJECTED')}
                    className="w-4 h-4 text-red-600"
                  />
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">退回返工</div>
                    <div className="text-xs text-gray-500">修复不合格，需重新处理</div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                复核员
              </label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入复核员姓名"
              />
            </div>

            {reviewResult === 'REJECTED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">退回原因</label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="填写退回原因..."
                />
              </div>
            )}

            <button
              onClick={handleReview}
              disabled={!operator || submitting}
              className={`w-full py-3 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                reviewResult === 'APPROVED'
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {submitting ? '提交中...' : (reviewResult === 'APPROVED' ? '确认通过' : '退回返工')}
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>请选择待复核的工单</p>
          </div>
        )}
      </div>
    </div>
  )
}