'use client'
import { useState, useEffect } from 'react'
import { Send, Clock, AlertTriangle, User, Phone, ArrowRight } from 'lucide-react'

type LeakLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface PipeSection {
  id: string
  name: string
  area: string
  diameter: string
  material: string
}

interface RepairTeam {
  id: string
  name: string
  leaderName: string
  leaderPhone: string
}

interface WorkOrder {
  id: string
  serialNumber: string
  status: string
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
  repairResult?: string
  repairPhotos: string[]
  reviewResult?: string
  reviewComment?: string
  mergedFrom: string[]
  history?: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
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

export default function DispatchPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [teams, setTeams] = useState<RepairTeam[]>([])
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [operator, setOperator] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter((o: WorkOrder) => o.status === 'PENDING')))
    
    fetch('/api/repair-teams')
      .then(res => res.json())
      .then(data => setTeams(data))
  }, [])

  const handleDispatch = async () => {
    if (!selectedOrder || !selectedTeam || !operator) return
    
    setSubmitting(true)
    
    await fetch(`/api/work-orders/${selectedOrder.id}/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repairTeamId: selectedTeam,
        operator,
        comment,
      }),
    })
    
    setSubmitting(false)
    setSelectedOrder(null)
    setSelectedTeam('')
    setComment('')
    
    fetch('/api/work-orders')
      .then(res => res.json())
      .then(data => setOrders(data.filter((o: WorkOrder) => o.status === 'PENDING')))
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Send className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">派单管理</h2>
              <p className="text-sm text-gray-500 mt-1">待派发工单：{orders.length} 条</p>
            </div>
          </div>

          <div className="space-y-3">
            {orders.map(order => (
              <div
                key={order.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-blue-600">{order.serialNumber}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${leakLevelColors[order.leakLevel]}`}>
                        {order.leakLevel === 'CRITICAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {leakLevelLabels[order.leakLevel]}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{order.reporterName} {order.reporterPhone}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span>{order.pipeSection.name} - {order.pipeSection.area}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {formatDate(order.createdAt)}
                    </div>
                    <ArrowRight className={`w-5 h-5 mt-2 ${selectedOrder?.id === order.id ? 'text-blue-500' : 'text-gray-300'}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无待派单工单</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">派发工单</h3>
        
        {selectedOrder ? (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-mono text-blue-600">{selectedOrder.serialNumber}</div>
              <div className="text-sm text-gray-600 mt-1">
                {selectedOrder.reporterName} | {selectedOrder.pipeSection.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择抢修队</label>
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">请选择抢修队</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} - {team.leaderName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                调度员
              </label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入调度员姓名"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">备注（选填）</label>
              <textarea
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="填写派单备注..."
              />
            </div>

            <button
              onClick={handleDispatch}
              disabled={!selectedTeam || !operator || submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '派发中...' : '确认派发'}
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>请选择待派发的工单</p>
          </div>
        )}

        {teams.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">抢修队信息</h4>
            <div className="space-y-2">
              {teams.map(team => (
                <div key={team.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{team.name}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <User className="w-3 h-3" />
                    {team.leaderName}
                    <Phone className="w-3 h-3 ml-2" />
                    {team.leaderPhone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}