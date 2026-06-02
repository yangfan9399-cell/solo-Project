'use client'

import { useEffect, useState } from 'react'
import { getRepairOrders, createRepairOrder } from '../actions/repairActions'
import { getRooms, getFacilityCategories, getMaintenanceWorkers } from '../actions/facilityActions'
import Loading, { LoadingPage } from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import { ErrorState } from '@/components/EmptyState'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Plus, Search, Filter, Eye, Wrench, User } from 'lucide-react'
import Link from 'next/link'
import { RepairStatus } from '@prisma/client'
import RepairDetailModal from '@/components/RepairDetailModal'
import AssignWorkerModal from '@/components/AssignWorkerModal'

export default function RepairsPage() {
  const { user } = useAuth()
  const [repairs, setRepairs] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RepairStatus | 'ALL'>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<any>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    roomId: '',
    categoryId: '',
    priority: 1,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [repairsResult, roomsResult, categoriesResult, workersResult] = await Promise.all([
          getRepairOrders(),
          getRooms(),
          getFacilityCategories(),
          getMaintenanceWorkers(),
        ])

        if (repairsResult.success) setRepairs(repairsResult.data as any[])
        if (roomsResult.success) setRooms(roomsResult.data as any[])
        if (categoriesResult.success) setCategories(categoriesResult.data as any[])
        if (workersResult.success) setWorkers(workersResult.data as any[])
      } catch (err) {
        setError('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredRepairs = repairs.filter((repair) => {
    const matchesSearch =
      repair.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repair.room?.roomNumber.includes(searchTerm) ||
      repair.creator?.name?.includes(searchTerm)
    const matchesStatus = statusFilter === 'ALL' || repair.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const result = await createRepairOrder({
        ...formData,
        creatorId: user.id,
      })
      if (result.success) {
        setRepairs([result.data as any, ...repairs])
        setShowCreateModal(false)
        setFormData({ title: '', description: '', roomId: '', categoryId: '', priority: 1 })
      }
    } catch (err) {
      alert('提交失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingPage />
  if (error) return <ErrorState title={error} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报修管理</h1>
          <p className="text-gray-500 mt-1">共 {filteredRepairs.length} 条报修记录</p>
        </div>
        {user?.role === 'STUDENT' || user?.role === 'DORM_MANAGER' ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            提交报修
          </button>
        ) : null}
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索报修内容、房间号..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RepairStatus | 'ALL')}
              className="input w-auto"
            >
              <option value="ALL">全部状态</option>
              <option value="PENDING">待派单</option>
              <option value="ASSIGNED">已派单</option>
              <option value="IN_PROGRESS">处理中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRepairs.length === 0 ? (
        <EmptyState
          title="暂无报修记录"
          description={searchTerm || statusFilter !== 'ALL' ? '没有找到符合条件的报修单' : '还没有任何报修记录'}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>报修内容</th>
                <th>房间位置</th>
                <th>报修人</th>
                <th>维修师傅</th>
                <th>状态</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRepairs.map((repair) => (
                <tr key={repair.id}>
                  <td>
                    <div className="max-w-xs">
                      <p className="font-medium text-gray-900 truncate">{repair.title}</p>
                      <p className="text-sm text-gray-500 truncate">{repair.category?.name}</p>
                    </div>
                  </td>
                  <td>
                    {repair.room?.building?.name} {repair.room?.roomNumber}室
                  </td>
                  <td>{repair.creator?.name}</td>
                  <td>
                    {repair.assignedWorker ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-500" />
                        </div>
                        <span>{repair.assignedWorker.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(repair.status)}`}>
                      {getStatusText(repair.status)}
                    </span>
                  </td>
                  <td>{formatDate(repair.createdAt)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedRepair(repair)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                      {user?.role === 'DORM_MANAGER' && repair.status === 'PENDING' && (
                        <button
                          onClick={() => setSelectedRepair(repair) || setShowAssignModal(true)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="派单"
                        >
                          <Wrench className="w-4 h-4 text-blue-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">提交报修</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">报修标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="例如：水龙头漏水"
                  required
                />
              </div>
              <div>
                <label className="label">选择房间</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">请选择房间</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.building?.name} {room.roomNumber}室
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">设施分类</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">请选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">优先级</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  className="input"
                >
                  <option value={1}>低</option>
                  <option value={2}>中</option>
                  <option value={3}>高</option>
                </select>
              </div>
              <div>
                <label className="label">详细描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="请详细描述问题情况..."
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                  {submitting ? <Loading size="sm" /> : '提交报修'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRepair && (
        <RepairDetailModal
          repair={selectedRepair}
          workers={workers}
          onClose={() => setSelectedRepair(null)}
          onUpdate={(updated) => {
            setRepairs(repairs.map((r) => (r.id === updated.id ? updated : r)))
          }}
        />
      )}

      {showAssignModal && selectedRepair && (
        <AssignWorkerModal
          repairId={selectedRepair.id}
          workers={workers}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedRepair(null)
          }}
          onAssigned={(updated) => {
            setRepairs(repairs.map((r) => (r.id === updated.id ? updated : r)))
            setShowAssignModal(false)
            setSelectedRepair(null)
          }}
        />
      )}
    </div>
  )
}
