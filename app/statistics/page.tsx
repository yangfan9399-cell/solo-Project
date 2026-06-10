'use client'
import { useState, useEffect } from 'react'
import { BarChart3, PieChart, Clock, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

interface Statistics {
  byArea: Record<string, number>
  byLeakLevel: Record<string, number>
  byRepairTeam: Record<string, number>
  byRepairResult: Record<string, number>
  byStatus: Record<string, number>
  avgRepairTime: number
  totalOrders: number
  completedOrders: number
}

const leakLevelLabels: Record<string, string> = {
  LOW: '低',
  MEDIUM: '中',
  HIGH: '高',
  CRITICAL: '紧急',
}

const leakLevelColors: Record<string, string> = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
}

const repairResultLabels: Record<string, string> = {
  FIXED: '正常修复',
  SUSPECTED_DUPLICATE: '疑似重复',
  VALVE_LOCATION_FAILED: '阀门定位失败',
  NOT_REPAIRED: '未修复',
  '未处理': '未处理',
}

const statusLabels: Record<string, string> = {
  PENDING: '待派单',
  DISPATCHED: '已派发',
  REPAIRED: '已回填',
  REVIEWING: '复核中',
  COMPLETED: '已完成',
  REJECTED: '已退回',
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/statistics')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>暂无统计数据</p>
      </div>
    )
  }

  const maxAreaValue = Math.max(...Object.values(stats.byArea), 1)
  const maxLeakValue = Math.max(...Object.values(stats.byLeakLevel), 1)
  const maxTeamValue = Math.max(...Object.values(stats.byRepairTeam), 1)
  const maxResultValue = Math.max(...Object.values(stats.byRepairResult), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">复盘统计</h2>
          <p className="text-sm text-gray-500 mt-1">工单数据分析与聚合统计</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总工单数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedOrders}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">完成率</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均修复时长</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.avgRepairTime} 小时</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <TrendingUp className="w-5 h-5 inline mr-2" />
            按片区分布
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byArea).map(([area, count]) => (
              <div key={area}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{area}</span>
                  <span className="text-sm text-gray-500">{count} 单</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxAreaValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            按漏损等级分布
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byLeakLevel).map(([level, count]) => (
              <div key={level}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{leakLevelLabels[level]}</span>
                  <span className="text-sm text-gray-500">{count} 单</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${leakLevelColors[level]}`}
                    style={{ width: `${(count / maxLeakValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <BarChart3 className="w-5 h-5 inline mr-2" />
            按抢修队分布
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byRepairTeam).map(([team, count]) => (
              <div key={team}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{team}</span>
                  <span className="text-sm text-gray-500">{count} 单</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxTeamValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <CheckCircle className="w-5 h-5 inline mr-2" />
            按处理结果分布
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.byRepairResult).map(([result, count]) => (
              <div key={result}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{repairResultLabels[result] || result}</span>
                  <span className="text-sm text-gray-500">{count} 单</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result === 'FIXED' ? 'bg-green-500' :
                      result === 'SUSPECTED_DUPLICATE' ? 'bg-yellow-500' :
                      result === 'VALVE_LOCATION_FAILED' ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(count / maxResultValue) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">按状态分布</h3>
        <div className="grid grid-cols-6 gap-4">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className={`text-3xl font-bold ${
                status === 'COMPLETED' ? 'text-green-600' :
                status === 'PENDING' ? 'text-yellow-600' :
                status === 'REJECTED' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {count}
              </p>
              <p className="text-sm text-gray-600 mt-2">{statusLabels[status] || status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}