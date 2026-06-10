import { useState, useEffect } from 'react'
import { PieChart, BarChart3, Calendar, Building, Tag, Clock } from 'lucide-react'
import { getInventoryRecords, getDepartments, getAssetCategories, getDiscrepancyTypes } from '../server/api/assets'

interface InventoryRecord {
  id: number
  assetId: number
  inventoryDate: string
  discrepancyTypeId: number | null
  discrepancyTypeName: string | null
  discrepancyTypeCode: string | null
  departmentName?: string
  categoryName?: string
}

export default function ReviewPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const [discrepancies, setDiscrepancies] = useState<{ id: number; name: string; code: string }[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const [inventoryData, deptData, catData, discData] = await Promise.all([
          getInventoryRecords(),
          getDepartments(),
          getAssetCategories(),
          getDiscrepancyTypes(),
        ])
        setRecords(inventoryData)
        setDepartments(deptData)
        setCategories(catData)
        setDiscrepancies(discData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const departmentStats = departments.map((dept) => ({
    name: dept.name,
    total: records.filter((r) => r.departmentName === dept.name).length,
    match: records.filter(
      (r) => r.departmentName === dept.name && r.discrepancyTypeCode === 'MATCH'
    ).length,
    lost: records.filter(
      (r) => r.departmentName === dept.name && r.discrepancyTypeCode === 'LOST'
    ).length,
    transfer: records.filter(
      (r) => r.departmentName === dept.name && r.discrepancyTypeCode === 'TRANSFER'
    ).length,
  }))

  const categoryStats = categories.map((cat) => ({
    name: cat.name,
    total: records.filter((r) => r.categoryName === cat.name).length,
    match: records.filter(
      (r) => r.categoryName === cat.name && r.discrepancyTypeCode === 'MATCH'
    ).length,
    discrepancy: records.filter(
      (r) => r.categoryName === cat.name && r.discrepancyTypeCode !== 'MATCH'
    ).length,
  }))

  const discrepancyStats = discrepancies.map((disc) => ({
    name: disc.name,
    count: records.filter((r) => r.discrepancyTypeCode === disc.code).length,
    percentage: ((records.filter((r) => r.discrepancyTypeCode === disc.code).length / records.length) * 100).toFixed(1),
  }))

  const getDaysBetween = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const cycleStats = [
    { label: '0-7天', count: records.filter((r) => getDaysBetween(r.inventoryDate) <= 7).length },
    { label: '8-30天', count: records.filter((r) => getDaysBetween(r.inventoryDate) > 7 && getDaysBetween(r.inventoryDate) <= 30).length },
    { label: '31-90天', count: records.filter((r) => getDaysBetween(r.inventoryDate) > 30 && getDaysBetween(r.inventoryDate) <= 90).length },
    { label: '90天以上', count: records.filter((r) => getDaysBetween(r.inventoryDate) > 90).length },
  ]

  const maxDepartmentTotal = Math.max(...departmentStats.map((d) => d.total), 1)
  const maxCategoryTotal = Math.max(...categoryStats.map((c) => c.total), 1)
  const maxDiscrepancyCount = Math.max(...discrepancyStats.map((d) => d.count), 1)
  const maxCycleCount = Math.max(...cycleStats.map((c) => c.count), 1)

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Calendar className="w-4 h-4" />
            总盘点数
          </div>
          <div className="text-2xl font-bold text-gray-800">{records.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <PieChart className="w-4 h-4" />
            账实一致率
          </div>
          <div className="text-2xl font-bold text-green-800">
            {((records.filter((r) => r.discrepancyTypeCode === 'MATCH').length / records.length) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-yellow-600 text-sm">
            <Tag className="w-4 h-4" />
            差异率
          </div>
          <div className="text-2xl font-bold text-yellow-800">
            {((records.filter((r) => r.discrepancyTypeCode !== 'MATCH').length / records.length) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <Clock className="w-4 h-4" />
            平均处理周期
          </div>
          <div className="text-2xl font-bold text-blue-800">
            {records.length > 0 ? Math.round(records.reduce((acc, r) => acc + getDaysBetween(r.inventoryDate), 0) / records.length) : 0}天
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            按部门分布
          </h3>
          <div className="space-y-4">
            {departmentStats.map((dept) => (
              <div key={dept.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{dept.name}</span>
                  <span className="text-gray-800">{dept.total} 项</span>
                </div>
                <div className="flex gap-2">
                  <div
                    className="bg-green-500"
                    style={{ width: `${(dept.match / maxDepartmentTotal) * 100}%`, height: '24px', borderRadius: '4px' }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${(dept.lost / maxDepartmentTotal) * 100}%`, height: '24px', borderRadius: '4px' }}
                  />
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(dept.transfer / maxDepartmentTotal) * 100}%`, height: '24px', borderRadius: '4px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            按资产类别分布
          </h3>
          <div className="space-y-4">
            {categoryStats.map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="text-gray-800">{cat.match}/{cat.total}</span>
                </div>
                <div className="flex">
                  <div
                    className="bg-green-500"
                    style={{ width: `${(cat.match / maxCategoryTotal) * 100}%`, height: '24px', borderRadius: '4px' }}
                  />
                  <div
                    className="bg-yellow-500"
                    style={{ width: `${(cat.discrepancy / maxCategoryTotal) * 100}%`, height: '24px', borderRadius: '4px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            差异类型统计
          </h3>
          <div className="space-y-3">
            {discrepancyStats.map((stat) => (
              <div key={stat.name} className="flex items-center gap-4">
                <div className="w-32 text-sm text-gray-600">{stat.name}</div>
                <div className="flex-1">
                  <div
                    className={`${
                      stat.name === '账实一致'
                        ? 'bg-green-500'
                        : stat.name === '资产丢失'
                        ? 'bg-red-500'
                        : stat.name === '跨部门调拨'
                        ? 'bg-blue-500'
                        : stat.name === '标签损坏'
                        ? 'bg-yellow-500'
                        : 'bg-gray-500'
                    }`}
                    style={{ width: `${(stat.count / maxDiscrepancyCount) * 100}%`, height: '20px', borderRadius: '4px' }}
                  />
                </div>
                <div className="w-20 text-sm text-gray-800 text-right">
                  {stat.count} ({stat.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            处理周期分布
          </h3>
          <div className="space-y-3">
            {cycleStats.map((cycle) => (
              <div key={cycle.label} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">{cycle.label}</div>
                <div className="flex-1">
                  <div
                    className="bg-blue-500"
                    style={{ width: `${(cycle.count / maxCycleCount) * 100}%`, height: '24px', borderRadius: '4px' }}
                  />
                </div>
                <div className="w-12 text-sm text-gray-800 text-right">{cycle.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}