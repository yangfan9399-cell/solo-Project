import { createRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recalls/new',
  component: NewRecallPage,
})

function NewRecallPage() {
  const navigate = useNavigate()
  const [drugs, setDrugs] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    level: '三级召回',
    selectedDrugId: '',
    selectedBatchIds: [] as string[],
    selectedStoreIds: [] as string[],
    expectedQuantity: 100,
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('currentUser')
    if (saved) setCurrentUser(JSON.parse(saved))
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [drugsRes, storesRes] = await Promise.all([
        fetch('/api/drugs?includeBatches=true'),
        fetch('/api/stores'),
      ])
      const drugsData = await drugsRes.json()
      const storesData = await storesRes.json()
      setDrugs(drugsData)
      setStores(storesData)
    } catch (e) {
      console.error(e)
    }
  }

  const selectedDrug = drugs.find(d => d.id === formData.selectedDrugId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) {
      alert('请先选择当前用户（质量经办人）')
      return
    }
    if (formData.selectedBatchIds.length === 0) {
      alert('请选择至少一个批次')
      return
    }
    if (formData.selectedStoreIds.length === 0) {
      alert('请选择至少一家门店')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/recalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          reason: formData.reason,
          level: formData.level,
          publisherId: 'mock-publisher-id',
          batchIds: formData.selectedBatchIds,
          storeIds: formData.selectedStoreIds,
          expectedQuantity: formData.expectedQuantity,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        navigate({ to: '/recalls/$id', params: { id: data.id } })
      } else {
        alert('发布失败')
      }
    } catch (e) {
      console.error(e)
      alert('发布失败')
    } finally {
      setLoading(false)
    }
  }

  const toggleBatch = (batchId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedBatchIds: prev.selectedBatchIds.includes(batchId)
        ? prev.selectedBatchIds.filter(id => id !== batchId)
        : [...prev.selectedBatchIds, batchId],
    }))
  }

  const toggleStore = (storeId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedStoreIds: prev.selectedStoreIds.includes(storeId)
        ? prev.selectedStoreIds.filter(id => id !== storeId)
        : [...prev.selectedStoreIds, storeId],
    }))
  }

  const selectAllStores = () => {
    setFormData(prev => ({
      ...prev,
      selectedStoreIds: stores.map(s => s.id),
    }))
  }

  const clearAllStores = () => {
    setFormData(prev => ({ ...prev, selectedStoreIds: [] }))
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>←</span>
          <span>返回列表</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">发布召回通知</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              召回标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="例如：阿莫西林胶囊 AMX-2024-001 批次召回"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                召回级别 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="一级召回">一级召回</option>
                <option value="二级召回">二级召回</option>
                <option value="三级召回">三级召回</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预期总量（盒）
              </label>
              <input
                type="number"
                value={formData.expectedQuantity}
                onChange={(e) => setFormData({ ...formData, expectedQuantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              召回原因 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="简要说明召回原因"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={3}
              placeholder="详细描述召回背景、范围和要求"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择药品及批次 <span className="text-red-500">*</span>
            </label>
            <div className="mb-3">
              <select
                value={formData.selectedDrugId}
                onChange={(e) => setFormData({ ...formData, selectedDrugId: e.target.value, selectedBatchIds: [] })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">请选择药品</option>
                {drugs.map(drug => (
                  <option key={drug.id} value={drug.id}>{drug.name} ({drug.genericName})</option>
                ))}
              </select>
            </div>
            {selectedDrug && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
                <div className="text-sm font-medium text-gray-700">选择批次：</div>
                {selectedDrug.batches.map((batch: any) => (
                  <label key={batch.id} className="flex items-center space-x-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.selectedBatchIds.includes(batch.id)}
                      onChange={() => toggleBatch(batch.id)}
                      className="rounded"
                    />
                    <span>{batch.batchNumber}</span>
                    <span className="text-gray-400 text-xs">
                      生产: {new Date(batch.productionDate).toLocaleDateString('zh-CN')}
                      有效期至: {new Date(batch.expiryDate).toLocaleDateString('zh-CN')}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                涉及门店 <span className="text-red-500">*</span>
              </label>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={selectAllStores}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  全选
                </button>
                <button
                  type="button"
                  onClick={clearAllStores}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清空
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
              {stores.map(store => (
                <label key={store.id} className="flex items-center space-x-2 text-sm cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={formData.selectedStoreIds.includes(store.id)}
                    onChange={() => toggleStore(store.id)}
                    className="rounded"
                  />
                  <span className="font-medium">{store.name}</span>
                  <span className="text-gray-400 text-xs">{store.code} · {getRegionLabel(store.region)}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              已选择 {formData.selectedStoreIds.length} 家门店
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loading ? '发布中...' : '发布召回'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function getRegionLabel(region: string) {
  const map: Record<string, string> = {
    EAST: '华东',
    SOUTH: '华南',
    WEST: '西部',
    NORTH: '华北',
    CENTRAL: '中部',
  }
  return map[region] || region
}
