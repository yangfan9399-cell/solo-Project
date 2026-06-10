import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X } from 'lucide-react'
import { getInventoryRecords, getDiscrepancyTypes, getAssets, createInventoryRecord, type InventoryRecord } from '../data/mockData'
import DataTable from '../components/DataTable'

export default function InventoryList() {
  const [records, setRecords] = useState<InventoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [discrepancyFilter, setDiscrepancyFilter] = useState('')
  const [discrepancies, setDiscrepancies] = useState<{ id: number; name: string; code: string }[]>([])
  const [assets, setAssets] = useState<{ id: number; assetNo: string; name: string }[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    assetId: '',
    inventoryDate: '',
    discrepancyTypeId: '',
    actualStatus: '',
    actualLocation: '',
    actualUser: '',
    remarks: '',
    recorderName: '',
  })
  const navigate = useNavigate()

  useEffect(() => {
    async function fetchData() {
      try {
        const [inventoryData, discData, assetData] = await Promise.all([
          getInventoryRecords(),
          getDiscrepancyTypes(),
          getAssets(),
        ])
        setRecords(inventoryData)
        setDiscrepancies(discData)
        setAssets(assetData.map(a => ({ id: a.id, assetNo: a.assetNo, name: a.name })))
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

  const rowClassName = (row: unknown) => {
    const code = (row as Record<string, unknown>).discrepancyTypeCode as string | null
    if (code === 'LOST') return 'bg-red-50'
    if (code === 'TRANSFER') return 'bg-blue-50'
    return ''
  }

  const handleSubmit = async () => {
    if (!formData.assetId || !formData.inventoryDate) {
      alert('请填写必填字段')
      return
    }

    try {
      await createInventoryRecord({
        assetId: parseInt(formData.assetId),
        inventoryDate: formData.inventoryDate,
        discrepancyTypeId: formData.discrepancyTypeId ? parseInt(formData.discrepancyTypeId) : null,
        actualStatus: formData.actualStatus || null,
        actualLocation: formData.actualLocation || null,
        actualUser: formData.actualUser || null,
        remarks: formData.remarks || null,
        recorderName: formData.recorderName || '管理员',
      })

      const updatedRecords = await getInventoryRecords()
      setRecords(updatedRecords)
      setShowModal(false)
      setFormData({
        assetId: '',
        inventoryDate: '',
        discrepancyTypeId: '',
        actualStatus: '',
        actualLocation: '',
        actualUser: '',
        remarks: '',
        recorderName: '',
      })
    } catch (error) {
      console.error('创建盘点记录失败:', error)
      alert('创建盘点记录失败')
    }
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
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
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
        data={filteredRecords}
        columns={columns}
        onRowClick={(row) => navigate(`/inventory/${(row as Record<string, unknown>).id}`)}
        rowClassName={rowClassName}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">新增盘点记录</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">资产 *</label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择资产</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.assetNo} - {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">盘点日期 *</label>
                <input
                  type="date"
                  value={formData.inventoryDate}
                  onChange={(e) => setFormData({ ...formData, inventoryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">差异类型</label>
                <select
                  value={formData.discrepancyTypeId}
                  onChange={(e) => setFormData({ ...formData, discrepancyTypeId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择差异类型</option>
                  {discrepancies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">实际状态</label>
                <input
                  type="text"
                  placeholder="如：in_use, lost"
                  value={formData.actualStatus}
                  onChange={(e) => setFormData({ ...formData, actualStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">实际位置</label>
                <input
                  type="text"
                  placeholder="实际存放位置"
                  value={formData.actualLocation}
                  onChange={(e) => setFormData({ ...formData, actualLocation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">实际使用人</label>
                <input
                  type="text"
                  placeholder="实际使用人姓名"
                  value={formData.actualUser}
                  onChange={(e) => setFormData({ ...formData, actualUser: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">盘点人</label>
                <input
                  type="text"
                  placeholder="盘点人姓名"
                  value={formData.recorderName}
                  onChange={(e) => setFormData({ ...formData, recorderName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  rows={3}
                  placeholder="备注信息"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}