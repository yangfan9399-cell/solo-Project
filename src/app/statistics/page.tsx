'use client'
import { useState, useEffect } from 'react'
import { Card, Badge } from '@nextui-org/react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import Sidebar from '@/components/Sidebar'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<any>({})

  useEffect(() => {
    fetch('/api/statistics').then((res) => res.json()).then(setStatistics)
  }, [])

  const getAlertTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      LICENSE_SHORTAGE: '许可证不足',
      UNRETURNED_LICENSE: '未回收许可证',
      SCOPE_VIOLATION: '超范围使用',
      EXPIRING_SOON: '即将到期',
    }
    return typeMap[type] || type
  }

  const alertTypeColors: Record<string, string> = {
    LICENSE_SHORTAGE: '#EF4444',
    UNRETURNED_LICENSE: '#F59E0B',
    SCOPE_VIOLATION: '#8B5CF6',
    EXPIRING_SOON: '#3B82F6',
  }

  const departmentColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(239, 68, 68, 0.8)',
  ]

  const alertTypeChartData = {
    labels: statistics.byAlertType?.map((a: any) => getAlertTypeLabel(a.type)),
    datasets: [
      {
        data: statistics.byAlertType?.map((a: any) => a._count.id),
        backgroundColor: statistics.byAlertType?.map((a: any) => alertTypeColors[a.type] || '#9CA3AF'),
        borderWidth: 1,
      },
    ],
  }

  const departmentChartData = {
    labels: statistics.departmentStats?.map((d: any) => d.name),
    datasets: [
      {
        label: '员工数',
        data: statistics.departmentStats?.map((d: any) => d.employees.length),
        backgroundColor: departmentColors,
        borderColor: departmentColors.map((c) => c.replace('0.8', '1')),
        borderWidth: 1,
      },
      {
        label: '已分配许可证',
        data: statistics.departmentStats?.map((d: any) => d.applications.length),
        backgroundColor: 'rgba(156, 163, 175, 0.6)',
        borderColor: '#9CA3AF',
        borderWidth: 1,
      },
    ],
  }

  const softwareChartData = {
    labels: statistics.softwareStats?.map((s: any) => s.name),
    datasets: [
      {
        label: '已使用',
        data: statistics.softwareStats?.map((s: any) => s.usedSeats),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: '剩余',
        data: statistics.softwareStats?.map((s: any) => s.totalSeats - s.usedSeats),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar active="statistics" />
      <div className="ml-56 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">统计分析</h1>
          <p className="text-gray-500 mt-1">许可证使用数据统计与分析</p>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">超用原因分布</h3>
            <div className="h-64">
              <Pie data={alertTypeChartData} options={chartOptions} />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">部门许可证使用对比</h3>
            <div className="h-64">
              <Bar data={departmentChartData} options={chartOptions} />
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="font-bold mb-4">软件许可证利用率</h3>
          <div className="h-80">
            <Bar data={softwareChartData} options={chartOptions} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <h3 className="font-bold mb-4">部门统计</h3>
            <div className="space-y-3">
              {statistics.departmentStats?.map((dept: any) => (
                <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{dept.name}</div>
                    <div className="text-sm text-gray-500">
                      {dept.employees.length} 名员工
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{dept.applications.length}</div>
                    <div className="text-sm text-gray-500">许可证</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-bold mb-4">软件利用率排行</h3>
            <div className="space-y-3">
              {statistics.softwareStats
                ?.sort((a: any, b: any) => (b.usedSeats / b.totalSeats) - (a.usedSeats / a.totalSeats))
                .map((software: any, index: number) => {
                  const percent = Math.round((software.usedSeats / software.totalSeats) * 100)
                  return (
                    <div key={software.id} className="flex items-center gap-3">
                      <span className="w-6 text-center text-gray-400">#{index + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{software.name}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}