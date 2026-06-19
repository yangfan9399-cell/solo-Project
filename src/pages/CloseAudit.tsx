import { useStore } from '@/store/useStore'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Lock, Search, FileCheck, ChevronRight, ClipboardX, AlertCircle, CheckCircle2 } from 'lucide-react'

const closedTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  fixed: { label: '已修复', icon: CheckCircle2, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/15' },
  false_alarm: { label: '误报', icon: AlertCircle, color: 'text-amber-400 border-amber-500/30 bg-amber-500/15' },
  duplicate: { label: '重复上报', icon: ClipboardX, color: 'text-purple-400 border-purple-500/30 bg-purple-500/15' },
  other: { label: '其他', icon: FileCheck, color: 'text-slate-400 border-slate-500/30 bg-slate-500/15' },
}

export default function CloseAudit() {
  const navigate = useNavigate()
  const { anomalies, fetchAnomalies, loading } = useStore()

  const [searchText, setSearchText] = useState('')
  const [activeType, setActiveType] = useState<string>('')

  useEffect(() => {
    fetchAnomalies()
  }, [])

  const closed = anomalies.filter((a) => {
    if (a.status !== 'closed') return false
    if (activeType && a.closed_type !== activeType) return false
    if (searchText) {
      const s = searchText.toLowerCase()
      return (
        a.sensor_code.toLowerCase().includes(s) ||
        a.tower_position.toLowerCase().includes(s) ||
        (a.closed_reason?.toLowerCase().includes(s) ?? false) ||
        a.handler.toLowerCase().includes(s)
      )
    }
    return true
  })

  const stats = {
    total: anomalies.filter(a => a.status === 'closed').length,
    fixed: anomalies.filter(a => a.closed_type === 'fixed').length,
    false_alarm: anomalies.filter(a => a.closed_type === 'false_alarm').length,
    duplicate: anomalies.filter(a => a.closed_type === 'duplicate').length,
    other: anomalies.filter(a => a.closed_type === 'other').length,
  }

  const filterOptions = [
    { key: '', label: '全部' },
    { key: 'fixed', label: '已修复' },
    { key: 'false_alarm', label: '误报' },
    { key: 'duplicate', label: '重复上报' },
    { key: 'other', label: '其他' },
  ]

  return (
    <div className="min-h-screen bg-[#0A1628] text-slate-200 p-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-8 h-8 text-[#10B981]" />
            <h1 className="text-2xl font-bold tracking-wide">关闭原因 / 审计</h1>
          </div>
          <p className="text-slate-400 text-sm ml-11">
            查看已关闭的传感器校准异常记录，追溯关闭原因与操作审计
          </p>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="text-xs text-slate-400 mb-1">关闭总计</div>
            <div className="text-3xl font-bold text-slate-200">{stats.total}</div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-emerald-500/20 p-5">
            <div className="text-xs text-slate-400 mb-1">已修复</div>
            <div className="text-3xl font-bold text-emerald-400">{stats.fixed}</div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-amber-500/20 p-5">
            <div className="text-xs text-slate-400 mb-1">误报</div>
            <div className="text-3xl font-bold text-amber-400">{stats.false_alarm}</div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-purple-500/20 p-5">
            <div className="text-xs text-slate-400 mb-1">重复上报</div>
            <div className="text-3xl font-bold text-purple-400">{stats.duplicate}</div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-slate-500/20 p-5">
            <div className="text-xs text-slate-400 mb-1">其他</div>
            <div className="text-3xl font-bold text-slate-400">{stats.other}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setActiveType(opt.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeType === opt.key
                    ? 'bg-[#10B981] text-white'
                    : 'bg-[#1B2A4A] text-slate-400 hover:bg-[#2A3F5F] hover:text-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md ml-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索传感器/塔位/原因/处理人..."
              className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]/50"
            />
          </div>
        </div>

        <div className="space-y-4">
          {closed.map((a) => {
            const typeConfig = closedTypeConfig[a.closed_type ?? 'other']
            const TypeIcon = typeConfig.icon
            return (
              <div
                key={a.id}
                className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-6 hover:border-[#38BDF8]/30 transition-colors cursor-pointer group animate-fade-in"
                onClick={() => navigate(`/anomaly/${a.id}`)}
              >
                <div className="flex items-start gap-5">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl border flex items-center justify-center ${typeConfig.color}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="font-mono text-[#38BDF8] font-semibold text-sm">{a.sensor_code}</span>
                      <span className="text-slate-400 text-sm">{a.tower_position}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeConfig.color}`}>
                        <Lock className="w-3 h-3" />
                        {typeConfig.label}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        关闭时间: {new Date(a.updated_at).toLocaleString('zh-CN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-6 mb-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">校准前读数</div>
                        <div className="font-semibold font-mono">{a.pre_calibration}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">校准后读数</div>
                        <div className="font-semibold font-mono">{a.post_calibration}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">偏差 / 阈值</div>
                        <div className="font-semibold">
                          <span className={a.deviation > a.threshold ? 'text-red-400' : 'text-emerald-400'}>{a.deviation}</span>
                          <span className="text-slate-500"> / {a.threshold}</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">处理人</div>
                        <div className="font-semibold">{a.handler}</div>
                      </div>
                    </div>

                    <div className="bg-[#0F1D32]/70 rounded-lg p-4 border border-[#2A3F5F]/50">
                      <div className="flex items-start gap-3">
                        <FileCheck className="w-4 h-4 text-[#10B981] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-500 mb-1">关闭原因</div>
                          <div className="text-slate-200 text-sm leading-relaxed">{a.closed_reason}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      {a.review_opinion && (
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="text-slate-400">复核意见:</span>
                          <span className="text-slate-300">{a.review_opinion}</span>
                        </div>
                      )}
                      <span className="ml-auto text-[#38BDF8] text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        查看完整详情
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {closed.length === 0 && !loading && (
            <div className="text-center py-20 text-slate-500">
              <ShieldCheck className="w-14 h-14 mx-auto mb-4 opacity-30" />
              <p className="text-lg">暂无关闭记录</p>
              <p className="text-sm mt-1">所有关闭的异常将显示在这里</p>
            </div>
          )}
        </div>

        {loading && <div className="text-center py-4 text-slate-500 text-sm">加载中...</div>}
      </div>
    </div>
  )
}
