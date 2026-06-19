import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import { ArrowLeft, Edit3, Save, X, Clock, Activity, FileText, CheckCircle2, AlertTriangle } from 'lucide-react'

const statusNodeColor: Record<string, string> = {
  normal: 'bg-emerald-500',
  retest_needed: 'bg-amber-500',
  threshold_exceeded: 'bg-red-500',
  review_missing: 'bg-purple-500',
  closed: 'bg-gray-500',
}

const closedTypeLabels: Record<string, string> = {
  fixed: '已修复',
  false_alarm: '误报',
  duplicate: '重复',
  other: '其他',
}

export default function CalibrationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    currentAnomaly,
    transitions,
    retestRecords,
    audits,
    loading,
    fetchAnomaly,
    fetchTransitions,
    fetchRetestRecords,
    fetchAudits,
    updateAnomaly,
    createRetest,
    closeAnomaly,
    reviewAnomaly,
  } = useStore()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const [showRetestModal, setShowRetestModal] = useState(false)
  const [retestForm, setRetestForm] = useState({ pre_calibration: '', post_calibration: '', retester: '' })
  const [closeForm, setCloseForm] = useState({ closedType: 'fixed', closedReason: '', operator: '' })
  const [reviewForm, setReviewForm] = useState({ reviewOpinion: '', operator: '' })

  useEffect(() => {
    if (id) {
      fetchAnomaly(id)
      fetchTransitions(id)
      fetchRetestRecords(id)
      fetchAudits(id)
    }
  }, [id])

  useEffect(() => {
    if (currentAnomaly && !editing) {
      setEditForm({
        sensor_code: currentAnomaly.sensor_code,
        tower_position: currentAnomaly.tower_position,
        pre_calibration: currentAnomaly.pre_calibration,
        post_calibration: currentAnomaly.post_calibration,
        deviation: currentAnomaly.deviation,
        threshold: currentAnomaly.threshold,
        handler: currentAnomaly.handler,
        review_opinion: currentAnomaly.review_opinion ?? '',
      })
    }
  }, [currentAnomaly, editing])

  if (!currentAnomaly) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A1628] text-gray-400">
        {loading ? '加载中...' : '未找到数据'}
      </div>
    )
  }

  const isReverseDrift = currentAnomaly.post_calibration < currentAnomaly.pre_calibration
  const isDeviationExceeded = currentAnomaly.deviation > currentAnomaly.threshold

  const handleSave = async () => {
    if (!id) return
    await updateAnomaly(id, editForm)
    setEditing(false)
  }

  const handleRetestSubmit = async () => {
    if (!id) return
    await createRetest({
      anomalyId: id,
      pre_calibration: Number(retestForm.pre_calibration),
      post_calibration: Number(retestForm.post_calibration),
      retester: retestForm.retester,
    })
    setShowRetestModal(false)
    setRetestForm({ pre_calibration: '', post_calibration: '', retester: '' })
  }

  const handleClose = async () => {
    if (!id) return
    await closeAnomaly(id, closeForm)
    setCloseForm({ closedType: 'fixed', closedReason: '', operator: '' })
  }

  const handleReview = async (approved: boolean) => {
    if (!id) return
    await reviewAnomaly(id, { reviewOpinion: reviewForm.reviewOpinion, approved, operator: reviewForm.operator })
    setReviewForm({ reviewOpinion: '', operator: '' })
  }

  return (
    <div className="min-h-screen bg-[#0A1628] p-6">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 rounded-lg bg-[#1B2A4A] px-4 py-2 text-gray-300 transition hover:bg-[#2A3F5F]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
        <h1 className="text-xl font-bold text-white">异常详情</h1>
        <StatusBadge status={currentAnomaly.status} />
      </div>

      <div className="flex gap-6">
        <div className="w-2/3">
          <div className="rounded-xl border border-[#2A3F5F] bg-[#1B2A4A] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#38BDF8]" />
                <h2 className="text-lg font-semibold text-white">校准数据</h2>
              </div>
              {editing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white transition hover:bg-emerald-700"
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 rounded-lg bg-gray-600 px-3 py-1.5 text-sm text-white transition hover:bg-gray-700"
                  >
                    <X className="h-4 w-4" />
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1 rounded-lg bg-[#0F1D32] px-3 py-1.5 text-sm text-[#38BDF8] transition hover:bg-[#2A3F5F]"
                >
                  <Edit3 className="h-4 w-4" />
                  编辑
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {editing ? (
                <>
                  <div>
                    <label className="text-sm text-gray-400">传感器编码</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.sensor_code ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, sensor_code: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">塔位</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.tower_position ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, tower_position: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">校准前值</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.pre_calibration ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, pre_calibration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">校准后值</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.post_calibration ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, post_calibration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">偏差</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.deviation ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, deviation: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">阈值</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.threshold ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, threshold: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">处理人</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.handler ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, handler: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">审核意见</label>
                    <input
                      className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                      value={editForm.review_opinion ?? ''}
                      onChange={(e) => setEditForm({ ...editForm, review_opinion: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm text-gray-400">传感器编码</span>
                    <p className="mt-1 text-white">{currentAnomaly.sensor_code}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">塔位</span>
                    <p className="mt-1 text-white">{currentAnomaly.tower_position}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">校准前值</span>
                    <p className="mt-1 text-white">{currentAnomaly.pre_calibration}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">校准后值</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-white">{currentAnomaly.post_calibration}</span>
                      {isReverseDrift && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                          <AlertTriangle className="h-3 w-3" />
                          反向漂移
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">偏差</span>
                    <p className={`mt-1 font-semibold ${isDeviationExceeded ? 'text-red-400' : 'text-emerald-400'}`}>
                      {currentAnomaly.deviation}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">阈值</span>
                    <p className="mt-1 text-white">{currentAnomaly.threshold}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">处理人</span>
                    <p className="mt-1 text-white">{currentAnomaly.handler}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">审核意见</span>
                    <p className="mt-1 text-white">{currentAnomaly.review_opinion ?? '—'}</p>
                  </div>
                  {currentAnomaly.status === 'closed' && (
                    <>
                      <div>
                        <span className="text-sm text-gray-400">关闭类型</span>
                        <p className="mt-1 text-white">{closedTypeLabels[currentAnomaly.closed_type ?? ''] ?? currentAnomaly.closed_type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-400">关闭原因</span>
                        <p className="mt-1 text-white">{currentAnomaly.closed_reason ?? '—'}</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-1/3">
          <div className="rounded-xl border border-[#2A3F5F] bg-[#1B2A4A] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#38BDF8]" />
              <h2 className="text-lg font-semibold text-white">状态流转</h2>
            </div>
            {transitions.length === 0 ? (
              <p className="text-sm text-gray-500">暂无流转记录</p>
            ) : (
              <div className="relative">
                {transitions.map((t) => (
                  <div key={t.id} className="relative pb-6 last:pb-0">
                    <div className="absolute left-[7px] top-2 h-full w-0.5 bg-[#2A3F5F] last:hidden" />
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 h-4 w-4 shrink-0 rounded-full ${statusNodeColor[t.to_status] ?? 'bg-gray-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleString()}</p>
                        <p className="text-sm text-white">
                          {t.from_status} → {t.to_status}
                        </p>
                        <p className="text-xs text-gray-400">操作人: {t.operator}</p>
                        {t.comment && <p className="mt-0.5 text-xs text-gray-400">备注: {t.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-6">
        <div className="w-1/2">
          <div className="rounded-xl border border-[#2A3F5F] bg-[#1B2A4A] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#38BDF8]" />
                <h2 className="text-lg font-semibold text-white">复测记录</h2>
              </div>
              {currentAnomaly.status !== 'closed' && (
                <button
                  onClick={() => setShowRetestModal(true)}
                  className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white transition hover:bg-amber-700"
                >
                  提交复测
                </button>
              )}
            </div>
            {retestRecords.length === 0 ? (
              <p className="text-sm text-gray-500">暂无复测记录</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2A3F5F] text-gray-400">
                    <th className="pb-2 text-left font-medium">校准前</th>
                    <th className="pb-2 text-left font-medium">校准后</th>
                    <th className="pb-2 text-left font-medium">偏差</th>
                    <th className="pb-2 text-left font-medium">复测人</th>
                    <th className="pb-2 text-left font-medium">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {retestRecords.map((r) => (
                    <tr key={r.id} className="border-b border-[#2A3F5F]/50">
                      <td className="py-2 text-white">{r.pre_calibration}</td>
                      <td className="py-2 text-white">{r.post_calibration}</td>
                      <td className={`py-2 font-medium ${r.deviation > currentAnomaly.threshold ? 'text-red-400' : 'text-emerald-400'}`}>
                        {r.deviation}
                      </td>
                      <td className="py-2 text-white">{r.retester}</td>
                      <td className="py-2 text-gray-400">{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="w-1/2">
          <div className="rounded-xl border border-[#2A3F5F] bg-[#1B2A4A] p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#38BDF8]" />
              <h2 className="text-lg font-semibold text-white">
                {currentAnomaly.status === 'review_missing' || currentAnomaly.status === 'threshold_exceeded'
                  ? '审核'
                  : currentAnomaly.status === 'closed'
                    ? '审计日志'
                    : '关闭异常'}
              </h2>
            </div>

            {(currentAnomaly.status === 'review_missing' || currentAnomaly.status === 'threshold_exceeded') && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">审核意见</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                    rows={3}
                    value={reviewForm.reviewOpinion}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewOpinion: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">操作人</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                    value={reviewForm.operator}
                    onChange={(e) => setReviewForm({ ...reviewForm, operator: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleReview(true)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    通过
                  </button>
                  <button
                    onClick={() => handleReview(false)}
                    className="flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                    驳回
                  </button>
                </div>
              </div>
            )}

            {currentAnomaly.status !== 'closed' && currentAnomaly.status !== 'review_missing' && currentAnomaly.status !== 'threshold_exceeded' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">关闭类型</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                    value={closeForm.closedType}
                    onChange={(e) => setCloseForm({ ...closeForm, closedType: e.target.value })}
                  >
                    <option value="fixed">已修复</option>
                    <option value="false_alarm">误报</option>
                    <option value="duplicate">重复</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400">关闭原因</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                    rows={3}
                    value={closeForm.closedReason}
                    onChange={(e) => setCloseForm({ ...closeForm, closedReason: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400">操作人</label>
                  <input
                    className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                    value={closeForm.operator}
                    onChange={(e) => setCloseForm({ ...closeForm, operator: e.target.value })}
                  />
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-700"
                >
                  关闭异常
                </button>
              </div>
            )}

            {currentAnomaly.status === 'closed' && (
              <div>
                {audits.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无审计记录</p>
                ) : (
                  <div className="space-y-3">
                    {audits.map((a) => (
                      <div key={a.id} className="rounded-lg border border-[#2A3F5F] bg-[#0F1D32] p-3">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{a.operator}</span>
                          <span>{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-white">
                          类型: {closedTypeLabels[a.closed_type] ?? a.closed_type}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-300">{a.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showRetestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-[#2A3F5F] bg-[#1B2A4A] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">提交复测</h3>
              <button onClick={() => setShowRetestModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">校准前值</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-[#2A3F5F] bg-[#0F1D32] px-3 py-2 text-white outline-none focus:border-[#38BDF8]"
                  value={retestForm.pre_calibration}
                  onChange={(e) => setRetestForm({ ...retestForm, pre_calibration: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">校准后值</label>
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
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRetestModal(false)}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-sm text-white transition hover:bg-gray-700"
                >
                  取消
                </button>
                <button
                  onClick={handleRetestSubmit}
                  className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition hover:bg-amber-700"
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
