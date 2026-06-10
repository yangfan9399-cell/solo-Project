'use client'
import { useState, useEffect } from 'react'
import { Card, Badge, Button, Checkbox } from '@nextui-org/react'
import Sidebar from '@/components/Sidebar'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/alerts').then((res) => res.json()).then(setAlerts)
  }, [])

  const getSeverityColor = (severity: string) => {
    const colorMap: Record<string, 'danger' | 'warning' | 'primary' | 'default'> = {
      CRITICAL: 'danger',
      WARNING: 'warning',
      INFO: 'primary',
    }
    return colorMap[severity] || 'default'
  }

  const getSeverityLabel = (severity: string) => {
    const labelMap: Record<string, string> = {
      CRITICAL: '严重',
      WARNING: '警告',
      INFO: '提示',
    }
    return labelMap[severity] || severity
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

  const handleResolve = async (id: string) => {
    const response = await fetch('/api/alerts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    })
    if (response.ok) {
      setAlerts(alerts.filter((a) => a.id !== id))
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true
    return alert.severity === filter
  })

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL').length
  const warningCount = alerts.filter((a) => a.severity === 'WARNING').length
  const infoCount = alerts.filter((a) => a.severity === 'INFO').length

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active="alerts" />
      <div className="ml-56 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">预警管理</h1>
          <p className="text-gray-500 mt-1">许可证异常预警监控与处理</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">严重预警</div>
                <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
              </div>
              <Badge color="danger" variant="solid">!</Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">警告</div>
                <div className="text-2xl font-bold text-yellow-500">{warningCount}</div>
              </div>
              <Badge color="warning" variant="solid">!</Badge>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">提示</div>
                <div className="text-2xl font-bold text-blue-500">{infoCount}</div>
              </div>
              <Badge color="primary" variant="solid">i</Badge>
            </div>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: 'all', label: '全部' },
            { value: 'CRITICAL', label: '严重' },
            { value: 'WARNING', label: '警告' },
            { value: 'INFO', label: '提示' },
          ].map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? 'solid' : 'ghost'}
              color={
                option.value === 'CRITICAL'
                  ? 'danger'
                  : option.value === 'WARNING'
                  ? 'warning'
                  : option.value === 'INFO'
                  ? 'primary'
                  : 'default'
              }
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        <Card className="p-6">
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <Checkbox />
                <Badge color={getSeverityColor(alert.severity)} variant="solid">
                  {getSeverityLabel(alert.severity)}
                </Badge>
                <Badge color="default" variant="flat">{getAlertTypeLabel(alert.type)}</Badge>
                <span className="flex-1">{alert.message}</span>
                <span className="text-sm text-gray-400">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleResolve(alert.id)}>
                  标记已处理
                </Button>
              </div>
            ))}
            {filteredAlerts.length === 0 && (
              <div className="text-center text-gray-400 py-12">暂无预警</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}