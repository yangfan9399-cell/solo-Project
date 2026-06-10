'use client'
import { useState, useEffect } from 'react'
import { Search, Filter, Clock, AlertTriangle, CheckCircle, XCircle, ArrowRight, Merge } from 'lucide-react'
import type { WorkOrder, WorkOrderStatus, LeakLevel } from '@/lib/db'

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

export default function Home() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL')
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [targetOrderId, setTargetOrderId] = useState('')
  const [mergeOperator, setMergeOperator] = useState('')

  useEffect(() => {
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data))
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.pipeSection.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleMerge = async () => {
    if (!selectedOrder || !targetOrderId || !mergeOperator) return
    
    const response = await fetch(`/api/work-orders/${selectedOrder.id}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetOrderId, operator: mergeOperator }),
    })
    
    if (response.ok) {
      setOrders(await response.json())
      setShowMergeModal(false)
      setSelectedOrder(null)
      setTargetOrderId('')
      setMergeOperator('')
    }
  }

  const openMergeModal = (order: WorkOrder) => {
    setSelectedOrder(order)
    setShowMergeModal(true)
  }

  const availableTargetOrders = orders.filter(o => 
    o.id !== selectedOrder?.id && o.status !== 'REJECTED'
  )

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">工单列表</h2>
          <p className="text-sm text-gray-500 mt-1">共 {orders.length} 条工单记录</p>
        </div>
        <a href="/report" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <AlertTriangle className="w-4 h-4" />
          登记报修
        </a>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索工单号、报修人、管段..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as WorkOrderStatus | 'ALL')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">全部状态</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">工单号</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">报修人</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">管段</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">漏损等级</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">状态</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">合并来源</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">创建时间</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <span className="font-mono text-sm text-blue-600">{order.serialNumber}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{order.reporterName}</div>
                  <div className="text-sm text-gray-500">{order.reporterPhone}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{order.pipeSection.name}</div>
                  <div className="text-sm text-gray-500">{order.pipeSection.area}</div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${leakLevelColors[order.leakLevel]}`}>
                    {order.leakLevel === 'CRITICAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {leakLevelLabels[order.leakLevel]}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status === 'COMPLETED' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {order.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="py-4 px-4">
                  {order.mergedFrom.length > 0 ? (
                    <div className="text-sm text-gray-500">
                      合并自: {order.mergedFrom.join(', ')}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(order.createdAt)}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <a href={`/detail?id=${order.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm">
                      查看详情 <ArrowRight className="w-3 h-3" />
                    </a>
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => openMergeModal(order)}
                        className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm"
                      >
                        <Merge className="w-3 h-3 mr-1" />
                        合并
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无符合条件的工单</p>
        </div>
      )}

      {showMergeModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">合并工单</h3>
            <p className="text-sm text-gray-600 mb-4">
              将工单 <span className="font-mono text-blue-600">{selectedOrder.serialNumber}</span> 合并到目标工单
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">选择目标工单</label>
              <select
                value={targetOrderId}
                onChange={e => setTargetOrderId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择目标工单</option>
                {availableTargetOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.serialNumber} - {order.reporterName} - {statusLabels[order.status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">操作人</label>
              <input
                type="text"
                placeholder="请输入操作人姓名"
                value={mergeOperator}
                onChange={e => setMergeOperator(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMergeModal(false)
                  setSelectedOrder(null)
                  setTargetOrderId('')
                  setMergeOperator('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleMerge}
                disabled={!targetOrderId || !mergeOperator}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认合并
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}