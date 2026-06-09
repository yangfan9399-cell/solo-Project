import { createRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/analytics',
  component: AnalyticsPage,
})

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">召回复盘统计</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="总召回数" value={analytics?.summary.total || 0} />
        <StatCard label="已关闭" value={analytics?.summary.closed || 0} color="text-green-600" />
        <StatCard label="进行中" value={analytics?.summary.inProgress || 0} color="text-yellow-600" />
        <StatCard label="追责中" value={analytics?.summary.investigating || 0} color="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">按区域统计</h3>
          <div className="space-y-3">
            {analytics?.byRegion.map((item: any) => (
              <div key={item.region} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{getRegionLabel(item.region)}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min((item.count / (analytics.summary.total || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count} 次</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">按药品类别统计</h3>
          <div className="space-y-3">
            {analytics?.byCategory.map((item: any) => (
              <div key={item.category} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{getCategoryLabel(item.category)}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${Math.min((item.count / (analytics.summary.total || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count} 次</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">触达时长分布</h3>
          <div className="space-y-3">
            {analytics?.reachDuration.map((item: any) => (
              <div key={item.bucket} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.bucket}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${Math.min((item.count / (analytics.summary.total || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count} 次</span>
                </div>
              </div>
            ))}
          </div>
          {analytics?.avgReachDuration && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">平均触达时长: </span>
              <span className="font-medium text-blue-600">{analytics.avgReachDuration.toFixed(1)} 小时</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">回收数量差异分布</h3>
          <div className="space-y-3">
            {analytics?.quantityDifference.map((item: any) => (
              <div key={item.bucket} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.bucket}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.bucket.includes('正常') ? 'bg-green-500' : item.bucket.includes('严重') ? 'bg-red-500' : 'bg-yellow-500'}`}
                      style={{ width: `${Math.min((item.count / (analytics.summary.total || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{item.count} 次</span>
                </div>
              </div>
            ))}
          </div>
          {analytics?.totalDifference !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">总差异数量: </span>
              <span className={`font-medium ${analytics.totalDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analytics.totalDifference > 0 ? '+' : ''}{analytics.totalDifference} 盒
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">召回级别分布</h3>
        <div className="grid grid-cols-3 gap-4">
          {analytics?.byLevel.map((item: any) => (
            <div key={item.level} className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-500 mt-1">{item.level}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function getRegionLabel(region: string) {
  const map: Record<string, string> = {
    EAST: '华东区',
    SOUTH: '华南区',
    WEST: '西部区',
    NORTH: '华北区',
    CENTRAL: '中部区',
  }
  return map[region] || region
}

function getCategoryLabel(category: string) {
  const map: Record<string, string> = {
    ANTIBIOTIC: '抗生素',
    CARDIOVASCULAR: '心血管',
    GASTROINTESTINAL: '消化系统',
    RESPIRATORY: '呼吸系统',
    NERVOUS_SYSTEM: '神经系统',
    ENDOCRINE: '内分泌',
    OTHER: '其他',
  }
  return map[category] || category
}
