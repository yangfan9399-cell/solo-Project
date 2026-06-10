import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { getInventoryRecords, getDiscrepancyTypes, type InventoryRecord } from '../data/mockData'
import DataTable from '../components/DataTable'

export default function InventoryList() {
  const [records, setRecords] = useState<InventoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [discrepancyFilter, setDiscrepancyFilter] = useState('')
  const [discrepancies, setDiscrepancies] = useState<{ id: number; name: string; code: string }[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const [inventoryData, discData] = await Promise.all([
          getInventoryRecords(),
          getDiscrepancyTypes(),
        ])
        setRecords(inventoryData)
        setDiscrepancies(discData)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.assetNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assetName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDiscrepancy = !discrepancyFilter || record.discrepancyTypeCode === discrepancyFilter
    return matchesSearch && matchesDiscrepancy
  })

  const columns = [
    { key: 'inventoryDate', label: '盘点日期' },
    { key: 'assetNo', label: '资产编号' },
    { key: 'assetName', label: '资产名称' },
    { key: 'discrepancyTypeName', label: '差异类型' },
    { key: 'actualStatus', label: '实际状态' },
    { key: 'recorderName', label: '盘点人' },
    { key: 'createdAt', label: '登记时间' },
  ] as { key: string; label: string }[]

  const rowClassName = (row: Record<string, unknown>) => {
    const code = row.discrepancyTypeCode as string | null
    if (code === 'LOST') return 'bg-red-50'
    if (code === 'TRANSFER') return 'bg-blue-50'
    return ''
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索资产编号或名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-[200px]">
            <select
              value={discrepancyFilter}
              onChange={(e) => setDiscrepancyFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部差异类型</option>
              {discrepancies.map((item) => (
                <option key={item.id} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            新增盘点
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-500 text-sm">总盘点数</div>
          <div className="text-2xl font-bold text-gray-800">{records.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-green-600 text-sm">账实一致</div>
          <div className="text-2xl font-bold text-green-800">
            {records.filter((r) => r.discrepancyTypeCode === 'MATCH').length}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-red-600 text-sm">资产丢失</div>
          <div className="text-2xl font-bold text-red-800">
            {records.filter((r) => r.discrepancyTypeCode === 'LOST').length}
          </div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-blue-600 text-sm">跨部门调拨</div>
          <div className="text-2xl font-bold text-blue-800">
            {records.filter((r) => r.discrepancyTypeCode === 'TRANSFER').length}
          </div>
        </div>
      </div>

      <DataTable
        data={filteredRecords as Record<string, unknown>[]}
        columns={columns}
        onRowClick={(row) => navigate(`/inventory/${row.id}`)}
        rowClassName={rowClassName}
      />
    </div>
  )
}