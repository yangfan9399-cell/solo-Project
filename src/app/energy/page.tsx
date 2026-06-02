'use client'

import { useEffect, useState } from 'react'
import { getEnergyAbnormals, getBuildings, confirmEnergyAbnormal, resolveEnergyAbnormal, dismissEnergyAbnormal } from '../actions/energyActions'
import Loading, { LoadingPage } from '@/components/Loading'
import EmptyState from '@/components/EmptyState'
import { ErrorState } from '@/components/EmptyState'
import { formatDate, formatCurrency, getStatusColor, getStatusText } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Search, Filter, Zap, Droplets, Building2, CheckCircle, XCircle, DollarSign, Eye } from 'lucide-react'
import { EnergyAbnormalStatus } from '@prisma/client'

export default function EnergyPage() {
  const { user } = useAuth()
  const [abnormals, setAbnormals] = useState<any[]>([])
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<EnergyAbnormalStatus | 'ALL'>('ALL')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [buildingFilter, setBuildingFilter] = useState<string>('ALL')
  const [selectedAbnormal, setSelectedAbnormal] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [deductionAmount, setDeductionAmount] = useState('')
  const [remark, setRemark] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [abnormalsResult, buildingsResult] = await Promise.all([
          getEnergyAbnormals(),
          getBuildings(),
        ])

        if (abnormalsResult.success) setAbnormals(abnormalsResult.data as any[])
        if (buildingsResult.success) setBuildings(buildingsResult.data as any[])
      } catch (err) {
        setError('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredAbnormals = abnormals.filter((abnormal) => {
    const matchesSearch =
      abnormal.type.includes(searchTerm) ||
      abnormal.building?.name?.includes(searchTerm) ||
      abnormal.room?.roomNumber?.includes(searchTerm)
    const matchesStatus = statusFilter === 'ALL' || abnormal.status === statusFilter
    const matchesType = typeFilter === 'ALL' || abnormal.type === typeFilter
    const matchesBuilding = buildingFilter === 'ALL' || abnormal.buildingId === buildingFilter
    return matchesSearch && matchesStatus && matchesType && matchesBuilding
  })

  const handleConfirm = async (abnormalId: string) => {
    if (!user) return
    setProcessing(true)
    try {
      const result = await confirmEnergyAbnormal(abnormalId, user.id, remark)
      if (result.success) {
        setAbnormals(abnormals.map((a) => (a.id === abnormalId ? result.data : a)))
        setRemark('')
        setShowDetailModal(false)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleResolve = async () => {
    if (!user || !selectedAbnormal) return
    setProcessing(true)
    try {
      const result = await resolveEnergyAbnormal(
        selectedAbnormal.id,
        user.id,
        parseFloat(deductionAmount) || 0,
        remark
      )
      if (result.success) {
        setAbnormals(abnormals.map((a) => (a.id === selectedAbnormal.id ? result.data : a)))
        setShowResolveModal(false)
        setShowDetailModal(false)
        setDeductionAmount('')
        setRemark('')
      }
    } finally {
      setProcessing(false)
    }
  }

  const handleDismiss = async (abnormalId: string) => {
    if (!user || !confirm('确定要驳回此异常记录吗？')) return
    setProcessing(true)
    try {
      const result = await dismissEnergyAbnormal(abnormalId, user.id, remark)
      if (result.success) {
        setAbnormals(abnormals.map((a) => (a.id === abnormalId ? result.data : a)))
        setRemark('')
        setShowDetailModal(false)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <LoadingPage />
  if (error) return <ErrorState title={error} />

  const stats = {
    total: abnormals.length,
    detected: abnormals.filter((a) => a.status === EnergyAbnormalStatus.DETECTED).length,
    confirmed: abnormals.filter((a) => a.status === EnergyAbnormalStatus.CONFIRMED).length,
    resolved: abnormals.filter((a) => a.status === EnergyAbnormalStatus.RESOLVED).length,
  }

  const canAudit = user?.role === 'ENERGY_ADMIN' || user?.role === 'DORM_MANAGER'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">能耗管理</h1>
          <p className="text-gray-500 mt-1">共 {filteredAbnormals.length} 条异常记录</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">异常总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待确认</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.detected}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已确认</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.confirmed}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已处理</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索异常类型、楼栋、房间..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="ALL">全部楼栋</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-auto"
            >
              <option value="ALL">全部类型</option>
              <option value="用电异常">用电异常</option>
              <option value="用水异常">用水异常</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as EnergyAbnormalStatus | 'ALL')}
              className="input w-auto"
            >
              <option value="ALL">全部状态</option>
              <option value="DETECTED">已检测</option>
              <option value="CONFIRMED">已确认</option>
              <option value="RESOLVED">已解决</option>
              <option value="DISMISSED">已驳回</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAbnormals.length === 0 ? (
        <EmptyState
          title="暂无异常记录"
          description={
            searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || buildingFilter !== 'ALL'
              ? '没有找到符合条件的异常记录'
              : '当前没有能耗异常记录'
          }
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>异常类型</th>
                <th>位置</th>
                <th>异常值</th>
                <th>阈值</th>
                <th>扣费金额</th>
                <th>状态</th>
                <th>检测时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAbnormals.map((abnormal) => (
                <tr key={abnormal.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      {abnormal.type === '用电异常' ? (
                        <Zap className="w-4 h-4 text-yellow-500" />
                      ) : (
                        <Droplets className="w-4 h-4 text-blue-500" />
                      )}
                      <span className="font-medium">{abnormal.type}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      {abnormal.building?.name}
                      {abnormal.room ? ` ${abnormal.room.roomNumber}室` : ''}
                    </div>
                  </td>
                  <td>
                    <span className="text-red-600 font-medium">+{abnormal.abnormalValue?.toFixed(2)}</span>
                  </td>
                  <td>{abnormal.threshold?.toFixed(2)}</td>
                  <td>
                    <span className={abnormal.deductionAmount ? 'text-red-600' : 'text-gray-400'}>
                      {formatCurrency(abnormal.deductionAmount?.toNumber() || null)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(abnormal.status)}`}>
                      {getStatusText(abnormal.status)}
                    </span>
                  </td>
                  <td>{formatDate(abnormal.detectedDate)}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedAbnormal(abnormal)
                        setShowDetailModal(true)
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && selectedAbnormal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">异常详情</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedAbnormal.type === '用电异常' ? (
                    <Zap className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Droplets className="w-5 h-5 text-blue-500" />
                  )}
                  <span className="font-medium text-lg">{selectedAbnormal.type}</span>
                </div>
                <span className={`badge ${getStatusColor(selectedAbnormal.status)}`}>
                  {getStatusText(selectedAbnormal.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card p-3">
                  <p className="text-sm text-gray-500">位置</p>
                  <p className="font-medium">
                    {selectedAbnormal.building?.name}
                    {selectedAbnormal.room ? ` ${selectedAbnormal.room.roomNumber}室` : ''}
                  </p>
                </div>
                <div className="card p-3">
                  <p className="text-sm text-gray-500">检测时间</p>
                  <p className="font-medium">{formatDate(selectedAbnormal.detectedDate)}</p>
                </div>
                <div className="card p-3">
                  <p className="text-sm text-gray-500">异常值</p>
                  <p className="font-medium text-red-600">+{selectedAbnormal.abnormalValue?.toFixed(2)}</p>
                </div>
                <div className="card p-3">
                  <p className="text-sm text-gray-500">阈值</p>
                  <p className="font-medium">{selectedAbnormal.threshold?.toFixed(2)}</p>
                </div>
              </div>

              {selectedAbnormal.remark && (
                <div className="card p-3">
                  <p className="text-sm text-gray-500">备注</p>
                  <p className="font-medium">{selectedAbnormal.remark}</p>
                </div>
              )}

              {selectedAbnormal.audits && selectedAbnormal.audits.length > 0 && (
                <div>
                  <p className="font-medium mb-2">审核记录</p>
                  <div className="space-y-2">
                    {selectedAbnormal.audits.map((audit: any) => (
                      <div key={audit.id} className="card p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{audit.auditor?.name}</span>
                          <span className="text-sm text-gray-500">{formatDate(audit.auditDate)}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{audit.auditResult}</p>
                        {audit.deductionApplied && (
                          <p className="text-sm text-red-600 mt-1">
                            扣费：{formatCurrency(audit.deductionAmount?.toNumber() || 0)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canAudit && selectedAbnormal.status === EnergyAbnormalStatus.DETECTED && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDismiss(selectedAbnormal.id)}
                    className="btn btn-secondary flex-1"
                    disabled={processing}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    {processing ? <Loading size="sm" /> : '驳回'}
                  </button>
                  <button
                    onClick={() => handleConfirm(selectedAbnormal.id)}
                    className="btn btn-primary flex-1"
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processing ? <Loading size="sm" /> : '确认异常'}
                  </button>
                </div>
              )}

              {canAudit && selectedAbnormal.status === EnergyAbnormalStatus.CONFIRMED && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="btn btn-success w-full"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    处理并扣费
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showResolveModal && selectedAbnormal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowResolveModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">处理异常并扣费</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">扣费金额（元）</label>
                <input
                  type="number"
                  value={deductionAmount}
                  onChange={(e) => setDeductionAmount(e.target.value)}
                  className="input"
                  placeholder="请输入扣费金额"
                  required
                />
              </div>
              <div>
                <label className="label">处理备注</label>
                <textarea
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="input min-h-[80px]"
                  placeholder="请输入处理说明..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowResolveModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleResolve}
                  className="btn btn-success flex-1"
                  disabled={!deductionAmount || processing}
                >
                  {processing ? <Loading size="sm" /> : '确认扣费'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
