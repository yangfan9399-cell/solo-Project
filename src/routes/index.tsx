import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: RecallsPage,
})

const statusMap: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PUBLISHED: { label: '已发布', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { label: '进行中', color: 'bg-yellow-100 text-yellow-800' },
  RECOVERING: { label: '回收中', color: 'bg-purple-100 text-purple-800' },
  CLOSED: { label: '已关闭', color: 'bg-green-100 text-green-800' },
  INVESTIGATING: { label: '追责调查中', color: 'bg-red-100 text-red-800' },
}

function RecallsPage() {
  const navigate = useNavigate()
  const [recalls, setRecalls] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recalls?status=${statusFilter}`)
      const data = await res.json()
      setRecalls(data.recalls)
      setStats(data.stats)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const statLabels: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    IN_PROGRESS: '进行中',
    RECOVERING: '回收中',
    CLOSED: '已关闭',
    INVESTIGATING: '追责中',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">召回通知列表</h2>
        <button
          onClick={() => navigate({ to: '/recalls/new' })}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + 发布召回
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard
          label="全部"
          count={recalls.length || 0}
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')}
        />
        {stats.map((s: any) => (
          <StatCard
            key={s.status}
            label={statLabels[s.status] || s.status}
            count={s._count}
            active={statusFilter === s.status}
            onClick={() => setStatusFilter(s.status)}
          />
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  召回标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  药品/批号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  召回级别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  涉及门店
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发布时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recalls.map((recall) => (
                <tr
                  key={recall.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate({ to: '/recalls/$id', params: { id: recall.id } })}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{recall.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{recall.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {recall.batches.map((b: any) => (
                      <div key={b.id} className="text-sm">
                        <div className="text-gray-900">{b.drugBatch.drug.name}</div>
                        <div className="text-gray-500">{b.drugBatch.batchNumber}</div>
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {recall.level}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {recall._count.stores} 家
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[recall.status]?.color}`}>
                      {statusMap[recall.status]?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(recall.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recalls.length === 0 && (
            <div className="text-center py-12 text-gray-500">暂无召回记录</div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border transition-all text-left ${
        active
          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </button>
  )
}
