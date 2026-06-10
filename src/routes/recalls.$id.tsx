import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/recalls/$id')({
  component: RecallDetailPage,
})

const storeStatusMap: Record<string, { label: string; color: string; icon: string }> = {
  UNREAD: { label: '未读', color: 'bg-gray-100 text-gray-600', icon: '📭' },
  READ: { label: '已读', color: 'bg-blue-100 text-blue-700', icon: '📬' },
  OFF_SHELF: { label: '已下架', color: 'bg-green-100 text-green-700', icon: '✅' },
  RECOVERED: { label: '已回收', color: 'bg-purple-100 text-purple-700', icon: '📦' },
  BATCH_MISMATCH: { label: '批号不匹配', color: 'bg-red-100 text-red-700', icon: '⚠️' },
}

const recallStatusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PUBLISHED: { label: '已发布', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '进行中', color: 'bg-yellow-100 text-yellow-800' },
  RECOVERING: { label: '回收中', color: 'bg-purple-100 text-purple-800' },
  CLOSED: { label: '已关闭', color: 'bg-green-100 text-green-800' },
  INVESTIGATING: { label: '追责调查中', color: 'bg-red-100 text-red-800' },
}

function RecallDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const [recall, setRecall] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [selectedStore, setSelectedStore] = useState<any>(null)
  const [closeNote, setCloseNote] = useState('')
  const [recoveryData, setRecoveryData] = useState({
    batchId: '',
    expectedQty: 0,
    actualQty: 0,
    note: '',
  })
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('stores')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('currentUser')
      if (saved) setCurrentUser(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recalls/${id}`)
      const data = await res.json()
      setRecall(data.recall)
      setStats(data.stats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStoreAction = async (storeId: string, action: string, extraData?: any) => {
    if (!currentUser) {
      alert('请先选择当前用户')
      return
    }
    try {
      const res = await fetch(`/api/recalls/${id}/store-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          action,
          confirmedById: currentUser.id,
          ...extraData,
        }),
      })
      if (res.ok) {
        fetchDetail()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCloseRecall = async (status: string) => {
    if (!currentUser) {
      alert('请先选择当前用户')
      return
    }
    try {
      const res = await fetch(`/api/recalls/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          closerId: currentUser.id,
          closeNote,
          action: status === 'CLOSED' ? '关闭召回' : '启动追责',
          actorId: currentUser.id,
          detail: closeNote,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '操作失败')
        return
      }
      setShowCloseModal(false)
      setCloseNote('')
      setError('')
      fetchDetail()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRecoverySubmit = async () => {
    if (!currentUser || !selectedStore) {
      alert('请先选择用户和门店')
      return
    }
    try {
      const res = await fetch(`/api/recalls/${id}/recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStore.storeId,
          ...recoveryData,
          notedById: currentUser.id,
        }),
      })
      if (res.ok) {
        setShowRecoveryModal(false)
        setSelectedStore(null)
        setRecoveryData({ batchId: '', expectedQty: 0, actualQty: 0, note: '' })
        fetchDetail()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">加载中...</div>
  }

  if (!recall) {
    return <div className="text-center py-12 text-gray-500">召回记录不存在</div>
  }

  const canClose = stats?.unreadCount === 0 && recall.status !== 'CLOSED' && recall.status !== 'INVESTIGATING'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: '/' })}
          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
        >
          <span>←</span>
          <span>返回列表</span>
        </button>
        <div className="flex space-x-2">
          {currentUser?.role === 'REVIEWER' && (
            <button
              onClick={() => setShowCloseModal(true)}
              disabled={!canClose}
              className={`px-4 py-2 rounded-lg font-medium ${
                canClose
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!canClose && stats?.unreadCount > 0 ? '门店未读，禁止关闭' : ''}
            >
              关闭/追责
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{recall.title}</h1>
            <p className="text-gray-600 mt-2">{recall.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${recallStatusMap[recall.status]?.color}`}>
            {recallStatusMap[recall.status]?.label}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <InfoItem label="召回原因" value={recall.reason} />
          <InfoItem label="召回级别" value={recall.level} />
          <InfoItem label="发布人" value={recall.publisher?.name} />
          <InfoItem label="发布时间" value={new Date(recall.createdAt).toLocaleString('zh-CN')} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="涉及门店" value={stats?.totalStores || 0} />
        <StatCard label="未读" value={stats?.unreadCount || 0} color="text-gray-600" />
        <StatCard label="已读" value={stats?.readCount || 0} color="text-blue-600" />
        <StatCard label="已下架" value={stats?.offShelfCount || 0} color="text-green-600" />
        <StatCard label="已回收" value={stats?.recoveredCount || 0} color="text-purple-600" />
        <StatCard label="批号不匹配" value={stats?.mismatchCount || 0} color="text-red-600" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'stores', label: '门店状态' },
              { id: 'batches', label: '召回批号' },
              { id: 'recoveries', label: '回收记录' },
              { id: 'history', label: '历史节点' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'stores' && (
            <div className="space-y-4">
              {recall.stores.map((storeRecall: any) => (
                <StoreRecallCard
                  key={storeRecall.id}
                  storeRecall={storeRecall}
                  currentUser={currentUser}
                  onRead={() => handleStoreAction(storeRecall.storeId, 'read')}
                  onOffShelf={() => handleStoreAction(storeRecall.storeId, 'offShelf', { offShelfPhoto: 'placeholder.jpg' })}
                  onMismatch={(note) => handleStoreAction(storeRecall.storeId, 'mismatch', { mismatchNote: note })}
                  onRecovery={() => {
                    setSelectedStore(storeRecall)
                    const batch = recall.batches[0]
                    if (batch) {
                      setRecoveryData({
                        batchId: batch.drugBatchId,
                        expectedQty: Math.floor(batch.expectedQuantity / recall.stores.length),
                        actualQty: 0,
                        note: '',
                      })
                    }
                    setShowRecoveryModal(true)
                  }}
                />
              ))}
            </div>
          )}

          {activeTab === 'batches' && (
            <div className="space-y-3">
              {recall.batches.map((batch: any) => (
                <div key={batch.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-900">{batch.drugBatch.drug.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        通用名: {batch.drugBatch.drug.genericName}
                      </div>
                      <div className="text-sm text-gray-500">
                        生产厂家: {batch.drugBatch.drug.manufacturer}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        批号: {batch.drugBatch.batchNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        生产日期: {new Date(batch.drugBatch.productionDate).toLocaleDateString('zh-CN')}
                      </div>
                      <div className="text-sm text-gray-500">
                        有效期至: {new Date(batch.drugBatch.expiryDate).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-600">预期召回总量: </span>
                    <span className="font-medium">{batch.expectedQuantity} 盒</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'recoveries' && (
            <div>
              {recall.recoveries.length > 0 ? (
                <div className="space-y-3">
                  {recall.recoveries.map((recovery: any) => (
                    <div key={recovery.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{recovery.store?.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            批次: {recovery.batch?.batchNumber}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            <span className="text-gray-500">预期: </span>
                            <span className="font-medium">{recovery.expectedQty} 盒</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">实际: </span>
                            <span className="font-medium">{recovery.actualQty} 盒</span>
                          </div>
                          <div className={`text-sm font-medium mt-1 ${recovery.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                            差异: {recovery.difference > 0 ? '+' : ''}{recovery.difference} 盒
                          </div>
                        </div>
                      </div>
                      {recovery.note && (
                        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
                          备注: {recovery.note}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-gray-400">
                        登记人: {recovery.notedBy?.name} | {new Date(recovery.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无回收记录</div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {recall.history.map((item: any) => (
                  <div key={item.id} className="relative pl-10">
                    <div className="absolute left-2 top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow"></div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-gray-900">{item.action}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      {item.detail && (
                        <p className="text-sm text-gray-600 mt-1">{item.detail}</p>
                      )}
                      <div className="text-xs text-gray-400 mt-2">
                        操作人: {item.actor?.name}
                        <span className="mx-1">·</span>
                        角色: {getRoleLabel(item.actor?.role)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCloseModal && (
        <Modal onClose={() => { setShowCloseModal(false); setError(''); setCloseNote('') }} title="关闭召回 / 启动追责">
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {!canClose && stats?.unreadCount > 0 && (
              <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                ⚠️ 当前有 {stats.unreadCount} 家门店未读通知，禁止关闭召回
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
              <textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="请输入关闭或追责说明..."
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => handleCloseRecall('CLOSED')}
                disabled={!canClose}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  canClose
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                正常关闭
              </button>
              <button
                onClick={() => handleCloseRecall('INVESTIGATING')}
                disabled={!canClose}
                className={`flex-1 py-2 rounded-lg font-medium ${
                  canClose
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                启动追责
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showRecoveryModal && selectedStore && (
        <Modal onClose={() => { setShowRecoveryModal(false); setSelectedStore(null) }} title="登记回收">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium">{selectedStore.store?.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">批次</label>
              <select
                value={recoveryData.batchId}
                onChange={(e) => setRecoveryData({ ...recoveryData, batchId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {recall.batches.map((b: any) => (
                  <option key={b.drugBatchId} value={b.drugBatchId}>
                    {b.drugBatch.drug.name} - {b.drugBatch.batchNumber}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预期数量</label>
                <input
                  type="number"
                  value={recoveryData.expectedQty}
                  onChange={(e) => setRecoveryData({ ...recoveryData, expectedQty: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">实际数量</label>
                <input
                  type="number"
                  value={recoveryData.actualQty}
                  onChange={(e) => setRecoveryData({ ...recoveryData, actualQty: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">差异数量: </span>
              <span className={`font-medium ${recoveryData.actualQty - recoveryData.expectedQty !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                {recoveryData.actualQty - recoveryData.expectedQty > 0 ? '+' : ''}
                {recoveryData.actualQty - recoveryData.expectedQty} 盒
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
              <textarea
                value={recoveryData.note}
                onChange={(e) => setRecoveryData({ ...recoveryData, note: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={2}
                placeholder="差异原因等说明..."
              />
            </div>
            <button
              onClick={handleRecoverySubmit}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
            >
              确认登记
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900 mt-1">{value}</div>
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

function StoreRecallCard({ storeRecall, currentUser, onRead, onOffShelf, onMismatch, onRecovery }: {
  storeRecall: any
  currentUser: any
  onRead: () => void
  onOffShelf: () => void
  onMismatch: (note: string) => void
  onRecovery: () => void
}) {
  const [showMismatchInput, setShowMismatchInput] = useState(false)
  const [mismatchNote, setMismatchNote] = useState('')
  const status = storeStatusMap[storeRecall.status]

  const canRead = storeRecall.status === 'UNREAD' && currentUser?.role === 'STORE_PHARMACIST'
  const canOffShelf = (storeRecall.status === 'READ' || storeRecall.status === 'UNREAD') && currentUser?.role === 'STORE_PHARMACIST'
  const canRecovery = (storeRecall.status === 'OFF_SHELF' || storeRecall.status === 'READ') && currentUser?.role === 'LOGISTICS_STAFF'
  const canMismatch = storeRecall.status === 'READ' && currentUser?.role === 'STORE_PHARMACIST'

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-medium text-gray-900">{storeRecall.store?.name}</div>
          <div className="text-sm text-gray-500 mt-1">
            编号: {storeRecall.store?.code} · 区域: {getRegionLabel(storeRecall.store?.region)}
          </div>
        </div>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color} flex items-center space-x-1`}>
          <span>{status.icon}</span>
          <span>{status.label}</span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        {storeRecall.readAt && (
          <div>已读时间: {new Date(storeRecall.readAt).toLocaleString('zh-CN')}</div>
        )}
        {storeRecall.offShelfAt && (
          <div>下架时间: {new Date(storeRecall.offShelfAt).toLocaleString('zh-CN')}</div>
        )}
      </div>

      {storeRecall.offShelfPhoto && (
        <div className="mt-3">
          <div className="text-xs text-gray-500 mb-1">下架照片</div>
          <div className="w-24 h-24 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-gray-400 text-sm">
            📷 照片占位
          </div>
        </div>
      )}

      {storeRecall.mismatchNote && (
        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
          不匹配说明: {storeRecall.mismatchNote}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {canRead && (
          <button
            onClick={onRead}
            className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            标记已读
          </button>
        )}
        {canOffShelf && (
          <button
            onClick={onOffShelf}
            className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            确认下架
          </button>
        )}
        {canMismatch && (
          <button
            onClick={() => setShowMismatchInput(!showMismatchInput)}
            className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            批号不匹配
          </button>
        )}
        {canRecovery && (
          <button
            onClick={onRecovery}
            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            登记回收
          </button>
        )}
      </div>

      {showMismatchInput && (
        <div className="mt-3 space-y-2">
          <textarea
            value={mismatchNote}
            onChange={(e) => setMismatchNote(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
            rows={2}
            placeholder="请说明批号不匹配的原因..."
          />
          <button
            onClick={() => { onMismatch(mismatchNote); setShowMismatchInput(false); setMismatchNote('') }}
            className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            提交
          </button>
        </div>
      )}
    </div>
  )
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

function getRoleLabel(role: string) {
  const map: Record<string, string> = {
    QUALITY_MANAGER: '质量经办人',
    STORE_PHARMACIST: '门店药师',
    LOGISTICS_STAFF: '物流人员',
    REVIEWER: '复核人',
  }
  return map[role] || role
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
