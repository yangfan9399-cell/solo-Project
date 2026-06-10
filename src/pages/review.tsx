import { BarChart3, MapPin, Home, AlertTriangle, Clock, TrendingUp, ArrowLeft } from 'lucide-react'
import prisma from '@/lib/prisma'
import { formatCurrency } from '@/utils/format'

export default function ReviewPage({
  districtStats,
  buildingTypeStats,
  disputeStats,
  cycleStats,
  overallStats,
}: {
  districtStats: { district: string; count: number; totalCompensation: number; avgDuration: number }[]
  buildingTypeStats: { buildingType: string; count: number; totalCompensation: number }[]
  disputeStats: { reason: string; count: number }[]
  cycleStats: { cycle: string; count: number; avgDays: number }[]
  overallStats: {
    totalCount: number
    completedCount: number
    disputedCount: number
    pendingCount: number
    totalCompensation: number
    paidCompensation: number
    avgDuration: number
  }
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors">
              <ArrowLeft size={20} />
              <span>返回列表</span>
            </a>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">数据复盘</h1>
              <p className="text-gray-500 text-sm">按片区、房屋类型、争议原因和发放周期聚合分析</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary-600">{overallStats.totalCount}</div>
                <div className="text-gray-500 mt-1">协议总数</div>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="text-primary-600" size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-success">{overallStats.completedCount}</div>
                <div className="text-gray-500 mt-1">已发放</div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-warning">{overallStats.disputedCount}</div>
                <div className="text-gray-500 mt-1">争议处理中</div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary-600">{formatCurrency(overallStats.paidCompensation)}</div>
                <div className="text-gray-500 mt-1">已发放金额</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">按片区统计</h2>
            </div>
            <div className="space-y-3">
              {districtStats.map((stat) => (
                <div key={stat.district} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <MapPin size={16} className="text-primary-600" />
                    </div>
                    <span className="font-medium">{stat.district}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{stat.count} 户</div>
                    <div className="text-sm text-gray-500">{formatCurrency(stat.totalCompensation)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Home className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">按房屋类型统计</h2>
            </div>
            <div className="space-y-3">
              {buildingTypeStats.map((stat) => (
                <div key={stat.buildingType} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Home size={16} className="text-green-600" />
                    </div>
                    <span className="font-medium">{stat.buildingType}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{stat.count} 户</div>
                    <div className="text-sm text-gray-500">{formatCurrency(stat.totalCompensation)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-warning" size={20} />
              <h2 className="font-semibold text-gray-900">争议原因分析</h2>
            </div>
            <div className="space-y-3">
              {disputeStats.map((stat) => (
                <div key={stat.reason}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700">{stat.reason}</span>
                    <span className="font-medium text-gray-900">{stat.count} 起</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full"
                      style={{ width: `${(stat.count / (disputeStats[0]?.count || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-primary-600" size={20} />
              <h2 className="font-semibold text-gray-900">发放周期分析</h2>
            </div>
            <div className="space-y-3">
              {cycleStats.map((stat) => (
                <div key={stat.cycle} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <span className="font-medium">{stat.cycle}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{stat.count} 户</div>
                    <div className="text-sm text-gray-500">平均 {stat.avgDays} 天</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">统计摘要</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{overallStats.totalCount}</div>
              <div className="text-gray-500 mt-1">协议总数</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-success">{overallStats.completedCount}</div>
              <div className="text-gray-500 mt-1">已完成发放</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-warning">{overallStats.pendingCount}</div>
              <div className="text-gray-500 mt-1">处理中</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-primary-600">{overallStats.avgDuration} 天</div>
              <div className="text-gray-500 mt-1">平均周期</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-500 text-sm">累计补偿金额</div>
                <div className="text-2xl font-bold text-blue-600">{formatCurrency(overallStats.totalCompensation)}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-500 text-sm">已发放金额</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(overallStats.paidCompensation)}</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export async function getServerSideProps() {
  const agreements = await prisma.agreement.findMany({
    include: {
      house: true,
      evaluation: true,
      compensation: true,
    },
  })

  const districtStats = agreements.reduce((acc: { district: string; count: number; totalCompensation: number; avgDuration: number }[], agreement) => {
    const district = agreement.house?.district || '未知'
    const existing = acc.find((a) => a.district === district)
    const duration = agreement.compensation?.paymentDate
      ? Math.round((new Date(agreement.compensation.paymentDate).getTime() - new Date(agreement.signingDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    if (existing) {
      existing.count += 1
      existing.totalCompensation += agreement.totalCompensation || 0
      existing.avgDuration = Math.round((existing.avgDuration * (existing.count - 1) + duration) / existing.count)
    } else {
      acc.push({
        district,
        count: 1,
        totalCompensation: agreement.totalCompensation || 0,
        avgDuration: duration,
      })
    }
    return acc
  }, [])

  const buildingTypeStats = agreements.reduce((acc: { buildingType: string; count: number; totalCompensation: number }[], agreement) => {
    const buildingType = agreement.house?.buildingType || '未知'
    const existing = acc.find((a) => a.buildingType === buildingType)

    if (existing) {
      existing.count += 1
      existing.totalCompensation += agreement.totalCompensation || 0
    } else {
      acc.push({
        buildingType,
        count: 1,
        totalCompensation: agreement.totalCompensation || 0,
      })
    }
    return acc
  }, [])

  const disputeStats = agreements
    .filter((a) => a.frozen && a.freezeReason)
    .reduce((acc: { reason: string; count: number }[], agreement) => {
      const reason = agreement.freezeReason || '其他'
      const existing = acc.find((a) => a.reason === reason)

      if (existing) {
        existing.count += 1
      } else {
        acc.push({ reason, count: 1 })
      }
      return acc
    }, [])
    .sort((a, b) => b.count - a.count)

  const cycleStats = agreements
    .filter((a) => a.compensation?.paymentDate)
    .reduce((acc: { cycle: string; count: number; totalDays: number }[], agreement) => {
      const duration = Math.round((new Date(agreement.compensation!.paymentDate!).getTime() - new Date(agreement.signingDate).getTime()) / (1000 * 60 * 60 * 24))
      
      let cycle = ''
      if (duration <= 7) cycle = '7天内'
      else if (duration <= 14) cycle = '8-14天'
      else if (duration <= 30) cycle = '15-30天'
      else cycle = '30天以上'

      const existing = acc.find((a) => a.cycle === cycle)

      if (existing) {
        existing.count += 1
        existing.totalDays += duration
      } else {
        acc.push({ cycle, count: 1, totalDays: duration })
      }
      return acc
    }, [])
    .map((a) => ({
      cycle: a.cycle,
      count: a.count,
      avgDays: Math.round(a.totalDays / a.count),
    }))

  const completedCount = agreements.filter((a) => a.status === 'COMPENSATED').length
  const disputedCount = agreements.filter((a) => a.status === 'DISPUTED').length
  const pendingCount = agreements.filter((a) => !['COMPENSATED'].includes(a.status)).length
  const totalCompensation = agreements.reduce((sum, a) => sum + (a.totalCompensation || 0), 0)
  const paidCompensation = agreements.filter((a) => a.paymentStatus === 'PAID').reduce((sum, a) => sum + (a.totalCompensation || 0), 0)
  
  const avgDuration = agreements
    .filter((a) => a.compensation?.paymentDate)
    .reduce((sum, a) => {
      const duration = Math.round((new Date(a.compensation!.paymentDate!).getTime() - new Date(a.signingDate).getTime()) / (1000 * 60 * 60 * 24))
      return sum + duration
    }, 0) / Math.max(1, agreements.filter((a) => a.compensation?.paymentDate).length)

  return {
    props: {
      districtStats: JSON.parse(JSON.stringify(districtStats)),
      buildingTypeStats: JSON.parse(JSON.stringify(buildingTypeStats)),
      disputeStats: JSON.parse(JSON.stringify(disputeStats)),
      cycleStats: JSON.parse(JSON.stringify(cycleStats)),
      overallStats: {
        totalCount: agreements.length,
        completedCount,
        disputedCount,
        pendingCount,
        totalCompensation,
        paidCompensation,
        avgDuration: Math.round(avgDuration),
      },
    },
  }
}
