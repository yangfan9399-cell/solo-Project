'use client'

import { useEffect, useState } from 'react'
import { getFacilities, getRooms, getFacilityCategories, createFacility } from '../actions/facilityActions'
import Loading, { LoadingPage } from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import { ErrorState } from '@/components/EmptyState'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Plus, Search, Filter, Building2, Wrench } from 'lucide-react'
import { FacilityStatus } from '@prisma/client'

export default function FacilitiesPage() {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FacilityStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [roomFilter, setRoomFilter] = useState<string>('ALL')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    roomId: '',
    brand: '',
    model: '',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [facilitiesResult, roomsResult, categoriesResult] = await Promise.all([
          getFacilities(),
          getRooms(),
          getFacilityCategories(),
        ])

        if (facilitiesResult.success) setFacilities(facilitiesResult.data as any[])
        if (roomsResult.success) setRooms(roomsResult.data as any[])
        if (categoriesResult.success) setCategories(categoriesResult.data as any[])
      } catch (err) {
        setError('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredFacilities = facilities.filter((facility) => {
    const matchesSearch =
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || facility.status === statusFilter
    const matchesCategory = categoryFilter === 'ALL' || facility.categoryId === categoryFilter
    const matchesRoom = roomFilter === 'ALL' || facility.roomId === roomFilter
    return matchesSearch && matchesStatus && matchesCategory && matchesRoom
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSubmitting(true)
    try {
      const result = await createFacility(formData)
      if (result.success) {
        setFacilities([result.data as any, ...facilities])
        setShowCreateModal(false)
        setFormData({ name: '', categoryId: '', roomId: '', brand: '', model: '', description: '' })
      }
    } catch (err) {
      alert('创建失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingPage />
  if (error) return <ErrorState title={error} />

  const stats = {
    total: facilities.length,
    normal: facilities.filter((f) => f.status === FacilityStatus.NORMAL).length,
    needRepair: facilities.filter((f) => f.status === FacilityStatus.NEEDS_REPAIR).length,
    broken: facilities.filter((f) => f.status === FacilityStatus.BROKEN).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">设施台账</h1>
          <p className="text-gray-500 mt-1">共 {filteredFacilities.length} 个设施</p>
        </div>
        {user?.role === 'DORM_MANAGER' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增设施
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">设施总数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">正常运行</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.normal}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">待维修</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.needRepair}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">已损坏</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{stats.broken}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索设施名称、品牌..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="ALL">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="ALL">全部房间</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.building?.name} {room.roomNumber}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FacilityStatus | 'ALL')}
              className="input w-auto"
            >
              <option value="ALL">全部状态</option>
              <option value="NORMAL">正常</option>
              <option value="NEEDS_REPAIR">待维修</option>
              <option value="BROKEN">已损坏</option>
              <option value="MAINTENANCE">维护中</option>
            </select>
          </div>
        </div>
      </div>

      {filteredFacilities.length === 0 ? (
        <EmptyState
          title="暂无设施记录"
          description={
            searchTerm || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || roomFilter !== 'ALL'
              ? '没有找到符合条件的设施'
              : '还没有登记任何设施'
          }
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>设施名称</th>
                <th>分类</th>
                <th>位置</th>
                <th>品牌/型号</th>
                <th>状态</th>
                <th>登记时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFacilities.map((facility) => (
                <tr key={facility.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-gray-500" />
                      </div>
                      <span className="font-medium">{facility.name}</span>
                    </div>
                  </td>
                  <td>{facility.category?.name}</td>
                  <td>
                    {facility.room ? (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {facility.room.building?.name} {facility.room.roomNumber}室
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    <div>
                      <p className="font-medium">{facility.brand || '-'}</p>
                      <p className="text-sm text-gray-500">{facility.model || '-'}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(facility.status)}`}>
                      {getStatusText(facility.status)}
                    </span>
                  </td>
                  <td>{formatDate(facility.createdAt)}</td>
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
              <h2 className="text-xl font-semibold">新增设施</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">设施名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="例如：日光灯"
                  required
                />
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
                <label className="label">所属房间</label>
                <select
                  value={formData.roomId}
                  onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                  className="input"
                >
                  <option value="">请选择房间（可选）</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.building?.name} {room.roomNumber}室
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">品牌</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input"
                    placeholder="品牌名称"
                  />
                </div>
                <div>
                  <label className="label">型号</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="input"
                    placeholder="型号"
                  />
                </div>
              </div>
              <div>
                <label className="label">备注</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="设施备注信息..."
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
                  {submitting ? <Loading size="sm" /> : '创建设施'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
