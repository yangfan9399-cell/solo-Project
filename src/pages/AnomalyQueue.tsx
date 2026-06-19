import { useStore } from '@/store/useStore'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef, useCallback } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { Search, Filter, Plus, ChevronUp, ChevronDown, AlertTriangle, Wind } from 'lucide-react'

const STATUS_OPTIONS = [
  { key: '', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'retest_needed', label: '需复测' },
  { key: 'threshold_exceeded', label: '超阈值' },
  { key: 'review_missing', label: '缺复核' },
  { key: 'closed', label: '已关闭' },
]

type SortField = 'deviation' | 'updated_at'
type SortOrder = 'asc' | 'desc'

interface NewAnomalyForm {
  sensor_code: string
  tower_position: string
  pre_calibration: string
  post_calibration: string
  threshold: string
  handler: string
  review_opinion: string
}

const emptyForm: NewAnomalyForm = {
  sensor_code: '',
  tower_position: '',
  pre_calibration: '',
  post_calibration: '',
  threshold: '',
  handler: '',
  review_opinion: '',
}

export default function AnomalyQueue() {
  const navigate = useNavigate()
  const { anomalies, fetchAnomalies, createAnomaly, seedData, loading } = useStore()

  const [activeStatus, setActiveStatus] = useState('')
  const [searchText, setSearchText] = useState('')
  const [sortField, setSortField] = useState<SortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewAnomalyForm>(emptyForm)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      debounceTimer.current = setTimeout(() => {
        fetchAnomalies({ status: activeStatus || undefined, search: value || undefined, sort: sortField, order: sortOrder })
      }, 300)
    },
    [activeStatus, sortField, sortOrder, fetchAnomalies],
  )

  useEffect(() => {
    seedData().then(() => {
      fetchAnomalies({ sort: sortField, order: sortOrder })
    })
  }, [])

  const handleStatusFilter = (status: string) => {
    setActiveStatus(status)
    fetchAnomalies({ status: status || undefined, search: searchText || undefined, sort: sortField, order: sortOrder })
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    debouncedSearch(value)
  }

  const handleSort = (field: SortField) => {
    const newOrder: SortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortField(field)
    setSortOrder(newOrder)
    fetchAnomalies({ status: activeStatus || undefined, search: searchText || undefined, sort: field, order: newOrder })
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-[#38BDF8]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#38BDF8]" />
    )
  }

  const deviation = form.pre_calibration && form.post_calibration
    ? Math.abs(Number(form.post_calibration) - Number(form.pre_calibration)).toFixed(2)
    : null

  const handleSubmit = async () => {
    await createAnomaly({
      sensor_code: form.sensor_code,
      tower_position: form.tower_position,
      pre_calibration: Number(form.pre_calibration),
      post_calibration: Number(form.post_calibration),
      threshold: Number(form.threshold),
      handler: form.handler,
      review_opinion: form.review_opinion || null,
    })
    setShowModal(false)
    setForm(emptyForm)
    fetchAnomalies({ status: activeStatus || undefined, search: searchText || undefined, sort: sortField, order: sortOrder })
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-slate-200 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Wind className="w-8 h-8 text-[#38BDF8]" />
          <h1 className="text-2xl font-bold tracking-wide">桅骨风车传感器校准异常处理台</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => handleStatusFilter(opt.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeStatus === opt.key
                    ? 'bg-[#38BDF8] text-white'
                    : 'bg-[#1B2A4A] text-slate-400 hover:bg-[#1B2A4A]/80 hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索传感器编号或塔位..."
              className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]/50"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#38BDF8] hover:bg-[#38BDF8]/80 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建异常
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#2A3F5F]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0F1D32]/50">
                <th className="text-left px-4 py-3 font-medium text-slate-400">传感器编号</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">塔位</th>
                <th className="text-right px-4 py-3 font-medium text-slate-400">校准前</th>
                <th className="text-right px-4 py-3 font-medium text-slate-400">校准后</th>
                <th
                  className="text-right px-4 py-3 font-medium text-slate-400 cursor-pointer select-none"
                  onClick={() => handleSort('deviation')}
                >
                  <span className="inline-flex items-center gap-1">
                    偏差 <SortIcon field="deviation" />
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-400">阈值</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">处理人</th>
                <th className="text-center px-4 py-3 font-medium text-slate-400">状态</th>
                <th
                  className="text-left px-4 py-3 font-medium text-slate-400 cursor-pointer select-none"
                  onClick={() => handleSort('updated_at')}
                >
                  <span className="inline-flex items-center gap-1">
                    更新时间 <SortIcon field="updated_at" />
                  </span>
                </th>
                <th className="text-center px-4 py-3 font-medium text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, idx) => (
                <tr
                  key={a.id}
                  className={`border-t border-[#2A3F5F]/50 hover:bg-[#1B2A4A]/50 ${
                    idx % 2 === 1 ? 'bg-[#0F1D32]/30' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-[#38BDF8]">{a.sensor_code}</td>
                  <td className="px-4 py-3">{a.tower_position}</td>
                  <td className="px-4 py-3 text-right">{a.pre_calibration}</td>
                  <td className="px-4 py-3 text-right">{a.post_calibration}</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      a.deviation > a.threshold ? 'text-red-400' : 'text-emerald-400'
                    }`}
                  >
                    {a.deviation}
                  </td>
                  <td className="px-4 py-3 text-right">{a.threshold}</td>
                  <td className="px-4 py-3">{a.handler}</td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(a.updated_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/anomaly/${a.id}`)}
                      className="text-[#38BDF8] hover:underline"
                    >
                      详情
                    </button>
                  </td>
                </tr>
              ))}
              {anomalies.length === 0 && !loading && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    暂无异常数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="text-center py-4 text-slate-500 text-sm">加载中...</div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setForm(emptyForm) } }}
        >
          <div className="w-full max-w-lg bg-[#1B2A4A] border border-[#2A3F5F] rounded-xl p-6 relative">
            <button
              onClick={() => { setShowModal(false); setForm(emptyForm) }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#38BDF8]" />
              新建异常记录
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">传感器编号</label>
                  <input
                    type="text"
                    value={form.sensor_code}
                    onChange={(e) => setForm({ ...form, sensor_code: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">安装塔位</label>
                  <input
                    type="text"
                    value={form.tower_position}
                    onChange={(e) => setForm({ ...form, tower_position: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">校准前读数</label>
                  <input
                    type="number"
                    value={form.pre_calibration}
                    onChange={(e) => setForm({ ...form, pre_calibration: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">校准后读数</label>
                  <input
                    type="number"
                    value={form.post_calibration}
                    onChange={(e) => setForm({ ...form, post_calibration: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">偏差阈值</label>
                  <input
                    type="number"
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">处理人</label>
                  <input
                    type="text"
                    value={form.handler}
                    onChange={(e) => setForm({ ...form, handler: e.target.value })}
                    className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50"
                  />
                </div>
              </div>

              {deviation !== null && (
                <div className="flex items-center gap-2 bg-[#0A1628] rounded-lg px-4 py-2">
                  <span className="text-xs text-slate-400">实时偏差:</span>
                  <span
                    className={`text-lg font-bold ${
                      form.threshold && Number(deviation) > Number(form.threshold)
                        ? 'text-red-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {deviation}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">复核意见（可选）</label>
                <textarea
                  value={form.review_opinion}
                  onChange={(e) => setForm({ ...form, review_opinion: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#38BDF8]/50 resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.sensor_code || !form.tower_position || !form.pre_calibration || !form.post_calibration || !form.threshold || !form.handler}
                className="w-full bg-[#38BDF8] hover:bg-[#38BDF8]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
