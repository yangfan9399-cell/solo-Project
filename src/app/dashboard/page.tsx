'use client'
import { useState, useEffect } from 'react'
import { Card, Badge, Button } from '@nextui-org/react'
import Sidebar from '@/components/Sidebar'

export default function DashboardPage() {
  const [statistics, setStatistics] = useState<any>({})
  const [alerts, setAlerts] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/statistics').then((res) => res.json()).then(setStatistics)
    fetch('/api/alerts').then((res) => res.json()).then(setAlerts)
  }, [])

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, string> = {
      CRITICAL: 'danger',
      WARNING: 'warning',
      INFO: 'info',
    }
    return colorMap[severity] || 'default'
  }

  const getAlertTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      LICENSE_SHORTAGE: '许可证不足',
      UNRETURNED_LICENSE: '未回收许可证',
      SCOPE_VIOLATION: '超范围使用',
      EXPIRING_SOON: '即将到期',
    }
    return typeMap[type] || type
  }

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL')

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active="dashboard" />
      <div className="ml-56 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">仪表盘</h1>
          <p className="text-gray-500 mt-1">许可证管理概览</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="text-sm text-gray-500">总软件数</div>
            <div className="text-3xl font-bold mt-2">
              {statistics.softwareStats?.length || 0}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-500">总许可证数</div>
            <div className="text-3xl font-bold mt-2">
              {statistics.softwareStats?.reduce((sum: number, s: any) => sum + s.totalSeats, 0) || 0}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-500">已使用席位</div>
            <div className="text-3xl font-bold mt-2">
              {statistics.softwareStats?.reduce((sum: number, s: any) => sum + s.usedSeats, 0) || 0}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-500">预警数量</div>
            <div className="text-3xl font-bold mt-2 flex items-center gap-2">
              {alerts.length || 0}
              {criticalAlerts.length > 0 && (
                <Badge color="danger" variant="solid">!</Badge>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card className="p-6">
              <h3 className="font-bold mb-4">许可证使用情况</h3>
              <div className="space-y-4">
                {statistics.softwareStats?.map((software: any) => {
                  const usagePercent = (software.usedSeats / software.totalSeats) * 100
                  const isOverLimit = usagePercent >= 90
                  return (
                    <div key={software.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{software.name}</span>
                        <span className={isOverLimit ? 'text-red-500' : ''}>
                          {software.usedSeats}/{software.totalSeats}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverLimit ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6">
              <h3 className="font-bold mb-4">待处理预警</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge color={getSeverityColor(alert.severity) as any} variant="solid">!</Badge>
                      <span className="text-xs font-medium">
                        {getAlertTypeLabel(alert.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center text-gray-400 py-8">暂无预警</div>
                )}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4">
                查看全部预警
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}