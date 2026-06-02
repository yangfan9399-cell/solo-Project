'use client'

import { useEffect, useState } from 'react'
import { getBuildings } from '../actions/facilityActions'
import { getRepairOrders } from '../actions/repairActions'
import { getEnergyAbnormals, getEnergyRecords } from '../actions/energyActions'
import Loading, { LoadingPage } from '@/components/Loading'
import { ErrorState } from '@/components/EmptyState'
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils'
import { Building2, Wrench, Zap, AlertTriangle, TrendingUp, Users } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { RepairStatus, EnergyAbnormalStatus } from '@prisma/client'

export default function DashboardPage() {
  const [buildings, setBuildings] = useState<any[]>([])
  const [repairs, setRepairs] = useState<any[]>([])
  const [abnormals, setAbnormals] = useState<any[]>([])
  const [energyRecords, setEnergyRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [buildingsResult, repairsResult, abnormalsResult, energyResult] = await Promise.all([
          getBuildings(),
          getRepairOrders(),
          getEnergyAbnormals(),
          getEnergyRecords(),
        ])

        if (buildingsResult.success) setBuildings(buildingsResult.data as any[])
        if (repairsResult.success) setRepairs(repairsResult.data as any[])
        if (abnormalsResult.success) setAbnormals(abnormalsResult.data as any[])
        if (energyResult.success) setEnergyRecords(energyResult.data as any[])
      } catch (err) {
        setError('数据加载失败')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) return <LoadingPage />
  if (error) return <ErrorState title={error} />

  const buildingRiskData = buildings.map((building) => {
    const buildingRepairs = repairs.filter((r) => r.room?.buildingId === building.id)
    const pendingRepairs = buildingRepairs.filter(
      (r) => r.status === RepairStatus.PENDING || r.status === RepairStatus.ASSIGNED
    ).length
    const buildingAbnormals = abnormals.filter(
      (a) =>
        a.buildingId === building.id &&
        (a.status === EnergyAbnormalStatus.DETECTED || a.status === EnergyAbnormalStatus.CONFIRMED)
    ).length

    const riskLevel = pendingRepairs + buildingAbnormals > 5 ? '高' : pendingRepairs + buildingAbnormals > 2 ? '中' : '低'
    const riskColor = riskLevel === '高' ? 'text-red-600' : riskLevel === '中' ? 'text-yellow-600' : 'text-green-600'

    return {
      ...building,
      totalRepairs: buildingRepairs.length,
      pendingRepairs,
      pendingAbnormals: buildingAbnormals,
      riskLevel,
      riskColor,
    }
  })

  const repairStatusData = [
    { name: '待派单', value: repairs.filter((r) => r.status === RepairStatus.PENDING).length, color: '#f59e0b' },
    { name: '已派单', value: repairs.filter((r) => r.status === RepairStatus.ASSIGNED).length, color: '#3b82f6' },
    { name: '处理中', value: repairs.filter((r) => r.status === RepairStatus.IN_PROGRESS).length, color: '#f97316' },
    { name: '已完成', value: repairs.filter((r) => r.status === RepairStatus.COMPLETED).length, color: '#22c55e' },
  ].filter((d) => d.value > 0)

  const monthlyEnergyData = energyRecords.reduce((acc: any[], record) => {
    const month = new Date(record.recordDate).toLocaleDateString('zh-CN', { month: 'short' })
    const existing = acc.find((d) => d.month === month)
    if (existing) {
      existing.electricity += record.electricityUsage?.toNumber() || 0
      existing.water += record.waterUsage?.toNumber() || 0
    } else {
      acc.push({
        month,
        electricity: record.electricityUsage?.toNumber() || 0,
        water: record.waterUsage?.toNumber() || 0,
      })
    }
    return acc
  }, [])

  const highRiskBuildings = buildingRiskData
    .filter((b) => b.riskLevel === '高' || b.riskLevel === '中')
    .sort((a, b) => b.pendingRepairs + b.pendingAbnormals - (a.pendingRepairs + a.pendingAbnormals))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">楼栋风险看板</h1>
        <p className="text-gray-500 mt-1">实时监控各楼栋维修和能耗异常情况</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">楼栋总数</p>
              <p className="text-2xl font-bold text-gray-900">{buildings.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理报修</p>
              <p className="text-2xl font-bold text-yellow-600">
                {repairs.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待处理异常</p>
              <p className="text-2xl font-bold text-red-600">
                {abnormals.filter((a) => a.status !== 'RESOLVED' && a.status !== 'DISMISSED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">风险楼栋</p>
              <p className="text-2xl font-bold text-orange-600">{highRiskBuildings.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">报修状态分布</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={repairStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {repairStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">月度能耗趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEnergyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="electricity" stroke="#3b82f6" name="用电 (度)" strokeWidth={2} />
                <Line type="monotone" dataKey="water" stroke="#06b6d4" name="用水 (吨)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">各楼栋风险情况</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildingRiskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="pendingRepairs" name="待处理报修" fill="#f59e0b" />
              <Bar dataKey="pendingAbnormals" name="待处理异常" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">楼栋风险详情</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>楼栋</th>
                <th>报修总数</th>
                <th>待处理报修</th>
                <th>待处理异常</th>
                <th>风险等级</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {buildingRiskData.map((building) => (
                <tr key={building.id}>
                  <td className="font-medium">{building.name}</td>
                  <td>{building.totalRepairs}</td>
                  <td>
                    <span className={building.pendingRepairs > 0 ? 'text-yellow-600 font-medium' : ''}>
                      {building.pendingRepairs}
                    </span>
                  </td>
                  <td>
                    <span className={building.pendingAbnormals > 0 ? 'text-red-600 font-medium' : ''}>
                      {building.pendingAbnormals}
                    </span>
                  </td>
                  <td>
                    <span className={`font-medium ${building.riskColor}`}>
                      {building.riskLevel}风险
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {highRiskBuildings.length > 0 && (
        <div className="card border-orange-300 bg-orange-50">
          <div className="p-4 border-b border-orange-200">
            <h2 className="font-semibold text-orange-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              需要关注的楼栋
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {highRiskBuildings.map((building) => (
                <div key={building.id} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{building.name}</span>
                    <span className={`text-sm font-medium ${building.riskColor}`}>
                      {building.riskLevel}风险
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>待处理报修：{building.pendingRepairs} 项</p>
                    <p>待处理异常：{building.pendingAbnormals} 项</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
