'use client'

import { useState } from 'react'
import { X, Clock, MapPin, User, MessageSquare, CheckCircle, Play, XCircle } from 'lucide-react'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { startRepairOrder, completeRepairOrder, cancelRepairOrder, assignRepairOrder } from '@/app/actions/repairActions'
import Loading from './Loading'
import { RepairStatus } from '@prisma/client'

interface Props {
  repair: any
  workers: any[]
  onClose: () => void
  onUpdate: (repair: any) => void
}

export default function RepairDetailModal({ repair, workers, onClose, onUpdate }: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [actualCost, setActualCost] = useState('')
  const [remark, setRemark] = useState('')
  const [selectedWorker, setSelectedWorker] = useState('')
  const [showCompleteForm, setShowCompleteForm] = useState(false)

  const handleStart = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await startRepairOrder(repair.id, user.id)
      if (result.success) {
        onUpdate(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await completeRepairOrder(
        repair.id,
        user.id,
        actualCost ? parseFloat(actualCost) : undefined,
        remark
      )
      if (result.success) {
        onUpdate(result.data)
        setShowCompleteForm(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!user || !confirm('确定要取消此报修单吗？')) return
    setLoading(true)
    try {
      const result = await cancelRepairOrder(repair.id, user.id, remark)
      if (result.success) {
        onUpdate(result.data)
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!user || !selectedWorker) return
    setLoading(true)
    try {
      const result = await assignRepairOrder(repair.id, selectedWorker, user.id)
      if (result.success) {
        onUpdate(result.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const canAssign = user?.role === 'DORM_MANAGER' && repair.status === RepairStatus.PENDING
  const canStart = user?.role === 'MAINTENANCE_WORKER' && repair.status === RepairStatus.ASSIGNED
  const canComplete = user?.role === 'MAINTENANCE_WORKER' && repair.status === RepairStatus.IN_PROGRESS
  const canCancel = user?.role === 'DORM_MANAGER' && ['PENDING', 'ASSIGNED'].includes(repair.status)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold">报修详情</h2>
            <p className="text-sm text-gray-500 mt-1">报修单号：{repair.id.slice(0, 8)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">{repair.title}</h3>
              <p className="text-gray-500 mt-1">{repair.category?.name}</p>
            </div>
            <span className={`badge ${getStatusColor(repair.status)}`}>
              {getStatusText(repair.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">位置</p>
                <p className="font-medium">
                  {repair.room?.building?.name} {repair.room?.roomNumber}室
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">报修人</p>
                <p className="font-medium">{repair.creator?.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">维修师傅</p>
                <p className="font-medium">{repair.assignedWorker?.name || '未分配'}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">提交时间</p>
                <p className="font-medium">{formatDate(repair.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h4 className="font-medium text-gray-900 mb-2">问题描述</h4>
            <p className="text-gray-600">{repair.description}</p>
          </div>

          {canAssign && (
            <div className="card p-4">
              <h4 className="font-medium text-gray-900 mb-3">派单</h4>
              <div className="flex gap-3">
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="input flex-1"
                >
                  <option value="">选择维修师傅</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssign}
                  className="btn btn-primary"
                  disabled={!selectedWorker || loading}
                >
                  {loading ? <Loading size="sm" /> : '确认派单'}
                </button>
              </div>
            </div>
          )}

          {repair.statusLogs && repair.statusLogs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                状态流转
              </h4>
              <div className="space-y-3">
                {repair.statusLogs.map((log: any, index: number) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="relative">
                      <div className="w-3 h-3 bg-primary-500 rounded-full"></div>
                      {index < repair.statusLogs.length - 1 && (
                        <div className="absolute top-3 left-1.5 w-px h-full bg-gray-200"></div>
                      )}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${getStatusColor(log.status)}`}>
                          {getStatusText(log.status)}
                        </span>
                        <span className="text-sm text-gray-500">{log.operator?.name}</span>
                      </div>
                      {log.remark && <p className="text-sm text-gray-600 mt-1">{log.remark}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            {canStart && (
              <button onClick={handleStart} className="btn btn-primary" disabled={loading}>
                <Play className="w-4 h-4 mr-2" />
                {loading ? <Loading size="sm" /> : '开始维修'}
              </button>
            )}
            {canComplete && !showCompleteForm && (
              <button onClick={() => setShowCompleteForm(true)} className="btn btn-success">
                <CheckCircle className="w-4 h-4 mr-2" />
                完成维修
              </button>
            )}
            {canCancel && (
              <button onClick={handleCancel} className="btn btn-danger" disabled={loading}>
                <XCircle className="w-4 h-4 mr-2" />
                取消报修
              </button>
            )}
          </div>

          {showCompleteForm && (
            <div className="card p-4 space-y-4">
              <h4 className="font-medium text-gray-900">完成维修</h4>
              <div>
                <label className="label">实际费用（元）</label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="input"
                  placeholder="请输入实际费用"
                />
              </div>
              <div>
                <label className="label">备注</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="维修情况说明..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleComplete} className="btn btn-success flex-1" disabled={loading}>
                  {loading ? <Loading size="sm" /> : '确认完成'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
