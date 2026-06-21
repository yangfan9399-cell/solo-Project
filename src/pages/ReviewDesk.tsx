import { useEffect, useState } from 'react';
import { useTicketStore } from '@/store/ticketStore';
import type { WorkTicket } from '../../shared/types';
import { riskLabels, riskColors, statusLabels, statusColors, formatDateTime } from '@/utils/format';
import { ClipboardCheck, AlertTriangle, CheckCircle2, XCircle, Eye, Clock, ChevronDown, ChevronUp, AlertCircle, Lock, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReviewDesk() {
  const { tickets, fetchTickets, currentUser, approveTicket, rejectTicket, fetchUsers } = useTicketStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [confirmations, setConfirmations] = useState<Record<string, {
    tower: boolean;
    workSteps: Record<string, boolean>;
    isolation: Record<string, boolean>;
    tools: Record<string, boolean>;
    risk: boolean;
  }>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, [fetchTickets, fetchUsers]);

  const pending = tickets.filter(
    (t) => t.status === 'pending_review' || t.status === 'high_risk_incomplete'
  );

  const isReviewerOf = (t: WorkTicket) => currentUser?.id === t.reviewerId;

  const ensureConfirmations = (t: WorkTicket) => {
    if (!confirmations[t.id]) {
      setConfirmations((prev) => ({
        ...prev,
        [t.id]: {
          tower: t.towerConfirmedByReviewer,
          workSteps: t.workSteps.reduce((acc, s) => ({ ...acc, [s.id]: s.confirmedByReviewer }), {}),
          isolation: t.isolationMeasures.reduce((acc, m) => ({ ...acc, [m.id]: m.confirmedByReviewer }), {}),
          tools: t.tools.reduce((acc, tl) => ({ ...acc, [tl.id]: tl.confirmedByReviewer }), {}),
          risk: t.riskConfirmedByReviewer,
        },
      }));
    }
    return confirmations[t.id] || {
      tower: false,
      workSteps: {},
      isolation: {},
      tools: {},
      risk: false,
    };
  };

  const handleToggle = (tid: string) => {
    if (expandedId === tid) {
      setExpandedId(null);
    } else {
      setExpandedId(tid);
      const t = tickets.find((x) => x.id === tid);
      if (t) ensureConfirmations(t);
    }
  };

  const allConfirmed = (t: WorkTicket) => {
    const c = ensureConfirmations(t);
    return (
      c.tower &&
      c.risk &&
      t.workSteps.every((s) => c.workSteps[s.id]) &&
      t.isolationMeasures.every((m) => c.isolation[m.id]) &&
      t.tools.every((tl) => c.tools[tl.id])
    );
  };

  const isolationWarning = (t: WorkTicket) => {
    if (t.riskLevel === 'high') {
      const ok = t.isolationMeasures.length >= 2 && t.isolationMeasures.every((m) => m.implemented);
      if (!ok) return true;
    }
    return false;
  };

  const handleApprove = async (t: WorkTicket) => {
    if (!currentUser) return;
    setLoading(t.id);
    setError(null);
    const c = ensureConfirmations(t);
    const result = await approveTicket(t.id, {
      reviewerId: currentUser.id,
      towerConfirmed: c.tower,
      workStepConfirmations: c.workSteps,
      isolationMeasureConfirmations: c.isolation,
      toolConfirmations: c.tools,
      riskConfirmed: c.risk,
    });
    setLoading(null);
    if (!result.success) {
      setError(result.error || '操作失败');
    } else {
      fetchTickets();
    }
  };

  const handleReject = async (t: WorkTicket) => {
    if (!currentUser) return;
    const reason = rejectReasons[t.id];
    if (!reason || !reason.trim()) {
      setError('请填写驳回原因');
      return;
    }
    setLoading(t.id);
    setError(null);
    const result = await rejectTicket(t.id, { reviewerId: currentUser.id, reason: reason.trim() });
    setLoading(null);
    if (!result.success) {
      setError(result.error || '操作失败');
    } else {
      setRejectReasons((p) => ({ ...p, [t.id]: '' }));
      fetchTickets();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-industrial-900">复核工作台</h2>
          <p className="text-sm text-industrial-500 mt-1">
            以 {currentUser?.name || ''} 身份，逐项确认待复核的作业票
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="badge bg-safety-yellow/15 text-safety-yellow border border-safety-yellow/30 text-sm px-3 py-1.5">
            <Clock className="w-4 h-4 mr-1.5 inline" />
            待办 {pending.length} 项
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded bg-red-50 border border-red-200 text-safety-red text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-safety-red/70 hover:text-safety-red">×</button>
        </div>
      )}

      {pending.length === 0 ? (
        <div className="card p-16 text-center">
          <CheckCircle2 className="w-16 h-16 text-industrial-300 mx-auto mb-4" />
          <p className="text-industrial-500 font-medium">暂无待复核的作业票</p>
          <Link to="/" className="btn-secondary mt-4 inline-flex items-center gap-2">
            <Eye className="w-4 h-4" /> 查看所有作业票
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((t) => {
            const c = ensureConfirmations(t);
            const expanded = expandedId === t.id;
            const canReview = isReviewerOf(t);
            const isoWarn = isolationWarning(t);
            return (
              <div key={t.id} className="card overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-industrial-50/50 transition-colors"
                  onClick={() => handleToggle(t.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`badge ${statusColors[t.status]}`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {statusLabels[t.status]}
                        </span>
                        <span className="font-mono text-sm font-bold text-industrial-800">{t.ticketNo}</span>
                        {isoWarn && (
                          <span className="badge bg-safety-orange/15 text-safety-orange border border-safety-orange/30">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            高风险需补齐隔离措施
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-industrial-900">{t.towerPosition}</div>
                      <p className="text-sm text-industrial-600 mt-1">{t.workDescription}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-industrial-500">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" /> 发起人：{t.initiatorName}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5" /> 复核人：{t.reviewerName}
                          {canReview ? <span className="text-safety-green">（当前用户）</span> : null}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ${riskColors[t.riskLevel]}`} />
                          {riskLabels[t.riskLevel]}
                        </span>
                        <span>更新于 {formatDateTime(t.updatedAt)}</span>
                      </div>
                    </div>
                    {expanded ? (
                      <ChevronUp className="w-5 h-5 text-industrial-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-industrial-400 shrink-0" />
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="border-t border-industrial-100 px-5 pb-5" onClick={(e) => e.stopPropagation()}>
                    <div className="mt-5 space-y-5">
                      {isoWarn && (
                        <div className="p-4 rounded bg-orange-50 border border-orange-200 text-safety-orange text-sm flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">高风险校验不通过</span>
                            <div className="text-xs mt-1 text-safety-orange/80">
                              高风险作业必须至少 2 项已落实的隔离措施，当前存在未落实项。请发起人补齐后再复核。
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-bold text-industrial-700 mb-3 flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${c.tower ? 'text-safety-green' : 'text-industrial-300'}`} />
                          1. 塔位信息确认
                        </h4>
                        <label className={`flex items-center gap-3 p-3 rounded bg-industrial-50 border border-industrial-200 ${!canReview && 'opacity-60 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!canReview}
                            checked={c.tower}
                            onChange={(e) => setConfirmations((p) => ({
                              ...p,
                              [t.id]: { ...ensureConfirmations(t), tower: e.target.checked },
                            }))}
                            className="w-5 h-5 rounded border-2 border-industrial-300 text-safety-green focus:ring-safety-green"
                          />
                          <span className="font-semibold text-industrial-800">塔位：{t.towerPosition}</span>
                        </label>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-industrial-700 mb-3">2. 作业步骤逐项确认</h4>
                        <div className="space-y-2">
                          {t.workSteps.map((s, idx) => (
                            <label key={s.id} className={`flex items-center gap-3 p-3 rounded bg-industrial-50 border border-industrial-200 ${!canReview && 'opacity-60 cursor-not-allowed'}`}>
                              <input
                                type="checkbox"
                                disabled={!canReview}
                                checked={!!c.workSteps[s.id]}
                                onChange={(e) => setConfirmations((p) => ({
                                  ...p,
                                  [t.id]: {
                                    ...ensureConfirmations(t),
                                    workSteps: { ...ensureConfirmations(t).workSteps, [s.id]: e.target.checked },
                                  },
                                }))}
                                className="w-5 h-5 rounded border-2 border-industrial-300 text-safety-green focus:ring-safety-green"
                              />
                              <span className="text-industrial-800"><span className="font-bold text-industrial-600">{idx + 1}.</span> {s.description}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-industrial-700 mb-3">3. 隔离措施逐项确认</h4>
                        <div className="space-y-2">
                          {t.isolationMeasures.map((m) => (
                            <label key={m.id} className={`flex items-center gap-3 p-3 rounded bg-industrial-50 border border-industrial-200 ${!canReview && 'opacity-60 cursor-not-allowed'}`}>
                              <input
                                type="checkbox"
                                disabled={!canReview}
                                checked={!!c.isolation[m.id]}
                                onChange={(e) => setConfirmations((p) => ({
                                  ...p,
                                  [t.id]: {
                                    ...ensureConfirmations(t),
                                    isolation: { ...ensureConfirmations(t).isolation, [m.id]: e.target.checked },
                                  },
                                }))}
                                className="w-5 h-5 rounded border-2 border-industrial-300 text-safety-green focus:ring-safety-green"
                              />
                              <span className="text-industrial-800 flex-1">{m.description}</span>
                              <span className={`badge ${m.implemented ? 'bg-safety-green/15 text-safety-green border border-safety-green/30' : 'bg-safety-red/15 text-safety-red border border-safety-red/30'}`}>
                                {m.implemented ? '已落实' : '未落实'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-industrial-700 mb-3">4. 工具清单逐项确认</h4>
                        <div className="space-y-2">
                          {t.tools.map((tl) => (
                            <label key={tl.id} className={`flex items-center gap-3 p-3 rounded bg-industrial-50 border border-industrial-200 ${!canReview && 'opacity-60 cursor-not-allowed'}`}>
                              <input
                                type="checkbox"
                                disabled={!canReview}
                                checked={!!c.tools[tl.id]}
                                onChange={(e) => setConfirmations((p) => ({
                                  ...p,
                                  [t.id]: {
                                    ...ensureConfirmations(t),
                                    tools: { ...ensureConfirmations(t).tools, [tl.id]: e.target.checked },
                                  },
                                }))}
                                className="w-5 h-5 rounded border-2 border-industrial-300 text-safety-green focus:ring-safety-green"
                              />
                              <span className="text-industrial-800 flex-1">{tl.name}</span>
                              <span className="text-industrial-500 text-sm">× {tl.quantity}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-industrial-700 mb-3 flex items-center gap-2">
                          <CheckCircle2 className={`w-4 h-4 ${c.risk ? 'text-safety-green' : 'text-industrial-300'}`} />
                          5. 风险等级确认
                        </h4>
                        <label className={`flex items-center gap-3 p-3 rounded bg-industrial-50 border border-industrial-200 ${!canReview && 'opacity-60 cursor-not-allowed'}`}>
                          <input
                            type="checkbox"
                            disabled={!canReview}
                            checked={c.risk}
                            onChange={(e) => setConfirmations((p) => ({
                              ...p,
                              [t.id]: { ...ensureConfirmations(t), risk: e.target.checked },
                            }))}
                            className="w-5 h-5 rounded border-2 border-industrial-300 text-safety-green focus:ring-safety-green"
                          />
                          <span className="font-semibold text-industrial-800">风险等级评估为：</span>
                          <span className={`inline-flex items-center gap-1.5 badge ${
                            t.riskLevel === 'high' ? 'bg-safety-red/15 text-safety-red border border-safety-red/30' :
                            t.riskLevel === 'medium' ? 'bg-safety-yellow/15 text-safety-yellow border border-safety-yellow/30' :
                            'bg-safety-green/15 text-safety-green border border-safety-green/30'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${riskColors[t.riskLevel]}`} />
                            {riskLabels[t.riskLevel]}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-industrial-100">
                      {!canReview ? (
                        <div className="p-4 rounded bg-industrial-50 text-industrial-500 text-sm text-center">
                          <Lock className="w-4 h-4 inline mr-2" />
                          您不是该作业票的指定复核人（{t.reviewerName}），无法执行签核操作
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="label-field">驳回原因（如驳回需填写）</label>
                            <textarea
                              placeholder="如不予通过，请详细说明驳回原因..."
                              value={rejectReasons[t.id] || ''}
                              onChange={(e) => setRejectReasons((p) => ({ ...p, [t.id]: e.target.value }))}
                              rows={2}
                              className="input-field resize-none"
                            />
                          </div>
                          <div className="flex justify-end gap-3 flex-wrap">
                            <button
                              onClick={() => handleReject(t)}
                              disabled={loading === t.id}
                              className="btn-danger inline-flex items-center gap-2 disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                              驳回修改
                            </button>
                            <button
                              onClick={() => handleApprove(t)}
                              disabled={!allConfirmed(t) || isoWarn || loading === t.id}
                              className="btn-success inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loading === t.id ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              通过签核
                            </button>
                          </div>
                          {!allConfirmed(t) && (
                            <div className="w-full text-right text-xs text-industrial-400 pt-2">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              请逐项确认所有内容后才能通过
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
