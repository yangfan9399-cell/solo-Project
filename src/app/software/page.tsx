'use client'
import { useState, useEffect } from 'react'
import { Card, Badge, Progress } from '@nextui-org/react'
import Sidebar from '@/components/Sidebar'

export default function SoftwarePage() {
  const [softwareList, setSoftwareList] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/software').then((res) => res.json()).then(setSoftwareList)
  }, [])

  const getUsageStatus = (used: number, total: number) => {
    const percent = (used / total) * 100
    if (percent >= 90) return { color: 'danger', label: '即将用尽' }
    if (percent >= 70) return { color: 'warning', label: '使用率较高' }
    return { color: 'success', label: '正常' }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active="software" />
      <div className="ml-56 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">软件管理</h1>
          <p className="text-gray-500 mt-1">已注册的软件及其许可证信息</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {softwareList.map((software) => {
            const status = getUsageStatus(software.usedSeats, software.totalSeats)
            const usagePercent = (software.usedSeats / software.totalSeats) * 100

            return (
              <Card key={software.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{software.name}</h3>
                    <p className="text-sm text-gray-500">{software.vendor}</p>
                  </div>
                  <Badge color={status.color as any} variant="solid">
                    {status.label}
                  </Badge>
                </div>

                {software.description && (
                  <p className="text-sm text-gray-600 mb-4">{software.description}</p>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">许可证使用</span>
                      <span className="font-medium">
                        {software.usedSeats}/{software.totalSeats}
                      </span>
                    </div>
                    <Progress
                      value={usagePercent}
                      color={status.color as any}
                      showValueLabel={false}
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-sm text-gray-500 mb-2">许可证列表</div>
                    <div className="space-y-1">
                      {software.licenses?.map((license: any) => (
                        <div
                          key={license.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <span className="font-mono">{license.licenseKey}</span>
                          <span className="text-gray-500">
                            {new Date(license.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}