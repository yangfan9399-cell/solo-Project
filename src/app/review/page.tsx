'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  PieChart,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  MapPin,
  ArrowLeft,
} from 'lucide-react'

interface CommunityStat {
  community: string
  totalInspections: number
  completedInspections: number
  rejectedInspections: number
  hazardCount: number
}

interface HazardTypeStat {
  type: string
  count: number
}

interface RejectionStat {
  community: string
  rejectCount: number
  secondAttemptCount: number
}

interface CycleStat {
  avgDays: number
  overdueCount: number
  completedCount: number
  pendingCount: number
}

interface ReviewData {
  communityStats: CommunityStat[]
  hazardTypeStats: HazardTypeStat[]
  rejectionStats: RejectionStat[]
  cycleStats: CycleStat
  totalInspections: number
  totalHazards: number
  totalRejections: number
}

export default function ReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/review')
      const result = await response.json()
      setData(result)
      setLoading(false)
    }
    fetchData()
  }, [])

  const getHazardTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hose_aging: '软管老化',
      leak: '燃气泄漏',
      nozzle_damage: '喷嘴损坏',
      vent_blockage: '通风不畅',
      illegal_modification: '违规改装',
      other: '其他隐患',
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">数据加载失败</h3>
          <p className="text-gray-500">无法获取复盘数据</p>
        </div>
      </div>
    )
  }

  const maxHazardCount = Math.max(
    ...(data.hazardTypeStats.map((h) => h.count) || [1])
  )

  const maxRejectCount = Math.max(
    ...(data.rejectionStats.map((r) => r.rejectCount) || [1])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">数据复盘</h1>
              <p className="text-sm text-gray-500">按小区、隐患类型、拒检次数和整改周期聚合分析</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">总安检数</div>
                <div className="text-3xl font-bold text-gray-900">
                  {data.totalInspections}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">发现隐患</div>
                <div className="text-3xl font-bold text-red-600">
                  {data.totalHazards}
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">用户拒检</div>
                <div className="text-3xl font-bold text-orange-600">
                  {data.totalRejections}
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 mb-1">平均整改周期</div>
                <div className="text-3xl font-bold text-green-600">
                  {data.cycleStats.avgDays}天
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">小区安检统计</h3>
            </div>
            <div className="space-y-4">
              {data.communityStats.map((stat) => (
                <div key={stat.community}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{stat.community}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">
                        总数: {stat.totalInspections}
                      </span>
                      <span className="text-green-600">
                        完成: {stat.completedInspections}
                      </span>
                      <span className="text-red-600">
                        拒检: {stat.rejectedInspections}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${stat.totalInspections ? ((stat.completedInspections || 0) / stat.totalInspections) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {stat.hazardCount && stat.hazardCount > 0 && (
                    <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      发现 {stat.hazardCount} 项隐患
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">隐患类型分布</h3>
            </div>
            <div className="space-y-4">
              {data.hazardTypeStats.map((stat) => (
                <div key={stat.type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">
                      {getHazardTypeLabel(stat.type)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {stat.count}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        stat.count === maxHazardCount
                          ? 'bg-red-500'
                          : stat.count >= maxHazardCount * 0.6
                          ? 'bg-orange-500'
                          : stat.count >= maxHazardCount * 0.3
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${(stat.count / maxHazardCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <XCircle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900">拒检统计</h3>
            </div>
            <div className="space-y-4">
              {data.rejectionStats.map((stat) => (
                <div key={stat.community}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{stat.community}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-red-600">拒检: {stat.rejectCount}</span>
                      <span className="text-blue-600">
                        二次预约: {stat.secondAttemptCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-500"
                        style={{
                          width: `${maxRejectCount ? ((stat.rejectCount || 0) / maxRejectCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${maxRejectCount ? ((stat.secondAttemptCount || 0) / maxRejectCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">整改周期分析</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">平均整改天数</div>
                  <div className="text-2xl font-bold text-green-700">
                    {data.cycleStats.avgDays}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-600">较上月减少 1.2 天</span>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-red-600 mb-1">逾期数</div>
                  <div className="text-2xl font-bold text-red-700">
                    {data.cycleStats.overdueCount}
                  </div>
                  <div className="text-xs text-red-600 mt-1">整改逾期记录</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">按时完成数</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {data.cycleStats.completedCount}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">按时完成整改</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="text-sm text-yellow-600 mb-1">待整改数</div>
                  <div className="text-2xl font-bold text-yellow-700">
                    {data.cycleStats.pendingCount}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">待处理隐患</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
