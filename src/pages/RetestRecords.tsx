import { useStore } from '@/store/useStore'
import { useEffect, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Search, ChevronRight, AlertOctagon, Clock } from 'lucide-react'

export default function RetestRecords() {
  const navigate = useNavigate()
  const { anomalies, fetchAnomalies, retestRecords, fetchRetestRecords, createRetest, loading } = useStore()

  const [searchText, setSearchText] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showRetestModal, setShowRetestModal] = useState<string | null>(null)
  const [retestForm, setRetestForm] = useState({ pre_calibration: '', post_calibration: '', retester: '' })

  useEffect(() => {
    fetchAnomalies()
  }, [])

  useEffect(() => {
    if (expandedId) {
      fetchRetestRecords(expandedId)
    }
  }, [expandedId])

  const needRetest = anomalies.filter(a => {
    if (!searchText) return a.status === 'retest_needed' || a.status !== 'closed'
    const s = searchText.toLowerCase()
    const match = a.sensor_code.toLowerCase().includes(s) || a.tower_position.toLowerCase().includes(s)
    return match
  })

  const handleSubmitRetest = async () => {
    if (!showRetestModal) return
    await createRetest({
      anomalyId: showRetestModal,
      pre_calibration: Number(retestForm.pre_calibration),
      post_calibration: Number(retestForm.post_calibration),
      retester: retestForm.retester,
    })
    setShowRetestModal(null)
    setRetestForm({ pre_calibration: '', post_calibration: '', retester: '' })
    fetchAnomalies()
  }

  const totalRetests = anomalies.reduce((acc, a) => {
    const r = useStore.getState().retestRecords
    return acc + r.filter(rr => rr.anomaly_id === a.id).length
  }, 0)

  return (
    <div className="min-h-screen bg-[#0A1628] text-slate-200 p-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-8 h-8 text-[#F59E0B]" />
            <h1 className="text-2xl font-bold tracking-wide">复测记录</h1>
          </div>
          <p className="text-slate-400 text-sm ml-11">
            管理需要复测的传感器校准异常，提交复测数据并跟踪复测历史
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">需复测</span>
            </div>
            <div className="text-3xl font-bold text-amber-400">
              {anomalies.filter(a => a.status === 'retest_needed').length}
            </div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-xs text-slate-400">累计复测</span>
            </div>
            <div className="text-3xl font-bold text-[#38BDF8]">
              {useStore.getState().retestRecords.length}
            </div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-slate-400">待处理异常</span>
            </div>
            <div className="text-3xl font-bold text-purple-400">
              {anomalies.filter(a => a.status !== 'closed').length}
            </div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">异常总数</span>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              {anomalies.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="按传感器编号或塔位搜索..."
              className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          {needRetest.map((a) => {
            const rrs = useStore.getState().retestRecords.filter(r => r.anomaly_id === a.id)
            return (
              <div key={a.id} className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] overflow-hidden">
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#2A3F5F]/40 transition-colors"
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      expandedId === a.id ? 'rotate-90 text-[#38BDF8]' : ''
                    }`}
                  />
                  <span className="font-mono text-[#38BDF8] font-semibold w-36">{a.sensor_code}</span>
                  <span className="text-slate-300 w-24">{a.tower_position}</span>
                  <div className="flex-1 grid grid-cols-4 gap-6 text-sm">
                    <div>
                      <span className="text-slate-500 text-xs block">校准前</span>
                      <span className="font-semibold">{a.pre_calibration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">校准后</span>
                      <span className="font-semibold">{a.post_calibration}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">偏差/阈值</span>
                      <span className={`font-semibold ${a.deviation > a.threshold ? 'text-red-400' : 'text-emerald-400'}`}>
                        {a.deviation} / {a.threshold}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block">复测次数</span>
                      <span className="font-semibold text-[#F59E0B]">{rrs.length}</span>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>

                {expandedId === a.id && (
                  <div className="border-t border-[#2A3F5F]/50 bg-[#0F1D32]/50 px-6 py-5 animate-fade-in">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-[#F59E0B]" />
                        复测历史
                      </h3>
                      {a.status !== 'closed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowRetestModal(a.id) }}
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          提交复测
                        </button>
                      )}
                    </div>

                    {rrs.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">暂无复测记录</div>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-[#2A3F5F]/50">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#0A1628]/80">
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">复测序号</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">校准前</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">校准后</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">偏差</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">是否超阈</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">复测人</th>
                              <th className="px-4 py-2.5 text-left font-medium text-slate-400">时间</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rrs.map((r, idx) => (
                              <tr key={r.id} className="border-t border-[#2A3F5F]/30 hover:bg-[#1B2A4A]/30">
                                <td className="px-4 py-2.5 text-slate-300">第 {idx + 1} 次</td>
                                <td className="px-4 py-2.5 font-mono">{r.pre_calibration}</td>
                                <td className="px-4 py-2.5 font-mono">{r.post_calibration}</td>
                                <td className={`px-4 py-2.5 font-semibold ${r.deviation > a.threshold ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {r.deviation}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={cn(
                                    'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                                    r.deviation > a.threshold
                                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  )}>
                                    {r.deviation > a.threshold ? '超阈值' : '正常'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-300">{r.retester}</td>
                                <td className="px-4 py-2.5 text-slate-500 text-xs">
                                  {new Date(r.created_at).toLocaleString('zh-CN')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() => navigate(`/anomaly/${a.id}`)}
                        className="text-[#38BDF8] hover:underline text-sm"
                      >
                        查看完整详情 →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {needRetest.length === 0 && !loading && (
            <div className="text-center py-16 text-slate-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
              暂无相关复测记录
            </div>
          )}
        </div>

        {loading && <div className="text-center py-4 text-slate-500 text-sm">加载中...</div>}
      </div>

      {showRetestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={(e) => { if (e.target === e.currentTarget) setShowRetestModal(null) }}>
          <div className="w-full max-w-md rounded-xl border border-[#2A3F5F] bg-[#1B2A4A] p-6 animate-slide-in">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">提交复测</h3>
              <button onClick={() => setShowRetestModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">校准前读数</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                  value={retestForm.pre_calibration}
                  onChange={(e) => setRetestForm({ ...retestForm, pre_calibration: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">校准后读数</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                  value={retestForm.post_calibration}
                  onChange={(e) => setRetestForm({ ...retestForm, post_calibration: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">复测人</label>
                <input
                  className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                  value={retestForm.retester}
                  onChange={(e) => setRetestForm({ ...retestForm, retester: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowRetestModal(null)}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white transition hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRetest}
                  disabled={!retestForm.pre_calibration || !retestForm.post_calibration || !retestForm.retester}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed"
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

import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
