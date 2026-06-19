import { useStore } from '@/store/useStore'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StatusBadge from '@/components/StatusBadge'
import { ClipboardCheck, CheckCircle2, XCircle, MessageSquare, Eye } from 'lucide-react'

export default function ReviewPanel() {
  const navigate = useNavigate()
  const { anomalies, fetchAnomalies, reviewAnomaly, loading } = useStore()

  const [reviewOpinions, setReviewOpinions] = useState<Record<string, string>>({})
  const [operators, setOperators] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchAnomalies()
  }, [])

  const reviewNeeded = anomalies.filter(
    (a) => a.status === 'review_missing' || a.status === 'threshold_exceeded'
  )

  const reviewMissingCount = reviewNeeded.filter((a) => a.status === 'review_missing').length
  const thresholdExceededCount = reviewNeeded.filter((a) => a.status === 'threshold_exceeded').length

  const handleReview = async (id: string, approved: boolean) => {
    const reviewOpinion = reviewOpinions[id] || ''
    const operator = operators[id] || ''
    await reviewAnomaly(id, { reviewOpinion, approved, operator })
  }

  return (
    <div className="min-h-screen bg-[#0A1628] text-slate-200 p-6">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <ClipboardCheck className="w-8 h-8 text-[#F59E0B]" />
          <h1 className="text-2xl font-bold tracking-wide">复核面板</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6 ml-11">审核待处理的传感器校准异常</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="text-xs text-slate-400 mb-1">待复核</div>
            <div className="text-3xl font-bold text-purple-400">{reviewMissingCount}</div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="text-xs text-slate-400 mb-1">超阈值</div>
            <div className="text-3xl font-bold text-red-400">{thresholdExceededCount}</div>
          </div>
          <div className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-5">
            <div className="text-xs text-slate-400 mb-1">总计</div>
            <div className="text-3xl font-bold text-[#38BDF8]">{reviewNeeded.length}</div>
          </div>
        </div>

        {reviewNeeded.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <ClipboardCheck className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg">暂无待复核异常</p>
          </div>
        )}

        <div className="space-y-6">
          {reviewNeeded.map((a) => (
            <div
              key={a.id}
              className="bg-[#1B2A4A] rounded-xl border border-[#2A3F5F] p-6"
            >
              <div className="flex items-center gap-4 mb-5">
                <span className="font-mono text-[#38BDF8] font-semibold">{a.sensor_code}</span>
                <span className="text-slate-400">{a.tower_position}</span>
                <StatusBadge status={a.status} />
                <span className="ml-auto text-xs text-slate-500">
                  {new Date(a.created_at).toLocaleString('zh-CN')}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-5 bg-[#0F1D32] rounded-lg p-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">校准前</div>
                  <div className="font-semibold">{a.pre_calibration}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">校准后</div>
                  <div className="font-semibold">{a.post_calibration}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">偏差</div>
                  <div className={`font-semibold ${a.deviation <= a.threshold ? 'text-emerald-400' : 'text-red-400'}`}>
                    {a.deviation}
                    {a.post_calibration < a.pre_calibration && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-xs font-medium text-amber-400">
                        反向漂移
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">阈值</div>
                  <div className="font-semibold">{a.threshold}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">处理人</div>
                  <div className="font-semibold">{a.handler}</div>
                </div>
              </div>

              <div className="border-t border-[#2A3F5F] pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-sm font-medium text-slate-300">复核操作</span>
                </div>

                <textarea
                  value={reviewOpinions[a.id] || ''}
                  onChange={(e) =>
                    setReviewOpinions((prev) => ({ ...prev, [a.id]: e.target.value }))
                  }
                  placeholder="请输入复核意见..."
                  rows={3}
                  className="w-full bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]/50 resize-none mb-3"
                />

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={operators[a.id] || ''}
                    onChange={(e) =>
                      setOperators((prev) => ({ ...prev, [a.id]: e.target.value }))
                    }
                    placeholder="复核人姓名"
                    className="bg-[#0F1D32] border border-[#2A3F5F] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#38BDF8]/50 w-48"
                  />

                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => handleReview(a.id, true)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      通过
                    </button>
                    <button
                      onClick={() => handleReview(a.id, false)}
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      驳回
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => navigate(`/anomaly/${a.id}`)}
                    className="flex items-center gap-1.5 text-[#38BDF8] hover:underline text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-4 text-slate-500 text-sm">加载中...</div>
        )}
      </div>
    </div>
  )
}
