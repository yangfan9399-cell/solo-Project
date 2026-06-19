import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Merge,
  UserX,
  CheckCircle2,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Sparkles,
  AlertOctagon,
  Image,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  READING_FIELDS,
  STATUS_LABELS,
  STATUS_COLORS,
  type BatchDetail,
  type Conflict,
  type FieldDecision,
  type Reading,
} from '../types';
import { useAppStore } from '../store/appStore';
import { cn } from '../lib/utils';

type Decision = FieldDecision['decision'];

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  READING_FIELDS.map((f) => [f.key, f.label]),
);

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const DECISION_OPTIONS: { value: Decision; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'adopt_a', label: '采信A', icon: <User className="w-3 h-3" />, color: 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700' },
  { value: 'adopt_b', label: '采信B', icon: <User className="w-3 h-3" />, color: 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700' },
  { value: 'merge', label: '合并', icon: <Merge className="w-3 h-3" />, color: 'bg-[#8B6914] text-[#F5F0E8] border-[#755A10] hover:bg-[#755A10]' },
  { value: 'keep_divergent', label: '保留分歧', icon: <XCircle className="w-3 h-3" />, color: 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700' },
];

export default function ConsultationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fieldDecisions, setFieldDecisions] = useState<Record<string, FieldDecision>>({});
  const [consultNotes, setConsultNotes] = useState('');
  const [overallDecision, setOverallDecision] = useState<'merge' | 'keep_divergent' | 'return_for_evidence'>('merge');
  const [returnTargets, setReturnTargets] = useState<('A' | 'B')[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);

  const readingA = detail?.readings[0];
  const readingB = detail?.readings[1];
  const conflictsByField = useMemo(() => {
    const m: Record<string, Conflict> = {};
    for (const c of detail?.conflicts || []) {
      m[c.field_name] = c;
    }
    return m;
  }, [detail?.conflicts]);

  const supplementConflicts = useMemo(() => {
    return detail?.supplement_conflict.supplementReadings.filter((s) => s.conflictsWithOld) || [];
  }, [detail]);

  const loadDetail = () => {
    if (!id) return;
    setLoading(true);
    api
      .getBatchDetail(id)
      .then((d) => {
        setDetail(d);
        const init: Record<string, FieldDecision> = {};
        for (const c of d.conflicts) {
          if (!c.resolution) {
            init[c.field_name] = { decision: 'adopt_a' };
          }
        }
        try {
          const lastConsult = d.consultations[0];
          if (lastConsult) {
            const parsed = JSON.parse(lastConsult.decisions_json) as Record<string, FieldDecision>;
            for (const k of Object.keys(parsed)) {
              init[k] = parsed[k];
            }
          }
        } catch {
          // noop
        }
        setFieldDecisions(init);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  const setFieldDecision = (field: string, decision: Decision) => {
    setFieldDecisions((prev) => {
      const curr = prev[field] || {};
      return { ...prev, [field]: { ...curr, decision } };
    });
  };

  const setFieldCustomValue = (field: string, value: string) => {
    setFieldDecisions((prev) => {
      const curr = prev[field] || { decision: 'merge' as Decision };
      return { ...prev, [field]: { ...curr, decision: 'merge', custom_value: value } };
    });
  };

  const handleSubmit = async () => {
    if (!id || !currentUser) return;
    if (overallDecision === 'return_for_evidence' && (returnTargets.length === 0 || !returnReason.trim())) {
      alert('退回补证需指定退回对象并填写退回理由');
      return;
    }
    setSubmitting(true);
    try {
      await api.submitConsultation({
        batch_id: id,
        consultant: currentUser.name,
        decision: overallDecision,
        notes: consultNotes,
        field_decisions: fieldDecisions,
        return_targets: overallDecision === 'return_for_evidence' ? returnTargets : undefined,
        return_reason: overallDecision === 'return_for_evidence' ? returnReason : undefined,
      });
      alert('会诊结论已提交！');
      loadDetail();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const isMerged = detail?.batch.status === 'merged';

  if (loading || !detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#E8DDC9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B6914]/30 border-t-[#8B6914] rounded-full animate-spin" />
      </div>
    );
  }

  const statusColor = STATUS_COLORS[detail.batch.status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-[#EFE7D8] to-[#E8DDC9]">
      <header className="sticky top-0 z-20 bg-[#2C2416] text-[#F5F0E8] shadow-lg border-b-4 border-[#8B6914]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-lg bg-[#3D2F1A] border border-[#8B6914]/50 hover:bg-[#4d3d24] transition flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'serif' }}>
                会诊对比：{detail.batch.plaque_name}
              </h1>
              <p className="text-xs text-[#C9A44C] opacity-80">
                {detail.batch.batch_no} · 当前状态：{STATUS_LABELS[detail.batch.status]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2',
                statusColor.bg,
                statusColor.text,
                statusColor.border,
              )}
            >
              {isMerged && <Sparkles className="w-3.5 h-3.5" />}
              {STATUS_LABELS[detail.batch.status]}
            </span>
            <button
              onClick={() => navigate(`/history/${id}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-[#3D2F1A] border border-[#8B6914]/50 hover:bg-[#4d3d24] transition"
            >
              <History className="w-4 h-4" />
              会诊记录
            </button>
            <div className="flex items-center gap-2 bg-[#3D2F1A] px-3 py-1.5 rounded-lg border border-[#8B6914]/50 text-sm">
              <User className="w-4 h-4 text-[#C9A44C]" />
              {currentUser?.name}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6">
        {detail.readings.length < 2 && (
          <div className="mb-6 bg-slate-50 border-2 border-slate-300 rounded-xl p-5 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <UserX className="w-6 h-6 text-slate-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-800 mb-1">当前缺少一名观察人的读数</h3>
              <p className="text-sm text-slate-600 mb-3">
                请邀请第二名观察人提交读数，以便系统进行冲突比对。
              </p>
              <button
                onClick={() => navigate(`/submit/${id}`)}
                className="px-4 py-2 rounded-lg bg-[#8B6914] text-[#F5F0E8] text-sm font-medium hover:bg-[#755A10] transition shadow-sm"
              >
                去提交读数
              </button>
            </div>
          </div>
        )}

        {detail.conflicts.length > 0 && (
          <div className="mb-6 bg-[#FDFAF4] rounded-2xl border-2 border-[#8B6914]/30 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-[#2C2416] text-[#F5F0E8]">
              <h3 className="font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C9A44C]" />
                冲突字段摘要（{detail.conflicts.length} 项）
              </h3>
              <button
                onClick={() => setShowConflictsOnly(!showConflictsOnly)}
                className="text-xs px-3 py-1 rounded border border-[#C9A44C]/50 hover:bg-[#3D2F1A] transition"
              >
                {showConflictsOnly ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {!showConflictsOnly && (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-[#8B6914] border-b-2 border-[#8B6914]/20">
                      <th className="py-2 px-3 font-bold">字段</th>
                      <th className="py-2 px-3 font-bold">
                        <span className="text-blue-700">观察人A</span>
                        {readingA && <span className="text-xs text-slate-500 ml-1">（{readingA.observer}）</span>}
                      </th>
                      <th className="py-2 px-3 font-bold">
                        <span className="text-indigo-700">观察人B</span>
                        {readingB && <span className="text-xs text-slate-500 ml-1">（{readingB.observer}）</span>}
                      </th>
                      <th className="py-2 px-3 font-bold">严重级别</th>
                      <th className="py-2 px-3 font-bold">类型</th>
                      <th className="py-2 px-3 font-bold">采信决定</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.conflicts.map((c) => (
                      <tr key={c.id} className="border-b border-[#8B6914]/10 last:border-0 hover:bg-[#8B6914]/5">
                        <td className="py-3 px-3 font-medium text-[#2C2416]">{FIELD_LABELS[c.field_name] || c.field_name}</td>
                        <td className="py-3 px-3 text-blue-800 font-mono text-xs max-w-[240px] truncate" title={c.value_a}>
                          {c.value_a || '—'}
                        </td>
                        <td className="py-3 px-3 text-indigo-800 font-mono text-xs max-w-[240px] truncate" title={c.value_b}>
                          {c.value_b || '—'}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-xs font-bold',
                              c.severity === 'severe'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-amber-100 text-amber-700 border border-amber-200',
                            )}
                          >
                            {c.severity === 'severe' ? '严重' : '轻微'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {c.conflict_type === 'supplement' ? (
                            <span className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 border border-purple-200">补读冲突</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 border border-slate-200">常规</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {c.resolution ? (
                            <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              已裁定: {c.resolution === 'adopt_a' ? '采信A' : c.resolution === 'adopt_b' ? '采信B' : c.resolution === 'merge' ? '已合并' : c.resolution}
                            </span>
                          ) : (
                            <select
                              value={fieldDecisions[c.field_name]?.decision || 'adopt_a'}
                              onChange={(e) => setFieldDecision(c.field_name, e.target.value as Decision)}
                              className="text-xs px-2 py-1.5 rounded border-2 border-[#8B6914]/30 bg-white focus:border-[#8B6914] focus:outline-none cursor-pointer"
                              disabled={isMerged}
                            >
                              {DECISION_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {supplementConflicts.length > 0 && detail.supplement_conflict.oldTranscription && (
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-300 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-purple-800 text-white flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              <h3 className="font-bold">残缺铭文补读专项冲突</h3>
              <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded">特殊场景处理</span>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
                <p className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> 旧藏释文（既往记录）
                </p>
                <p className="text-[#2C2416] font-serif leading-relaxed italic">
                  {detail.supplement_conflict.oldTranscription}
                </p>
              </div>
              {supplementConflicts.map((s, idx) => (
                <div key={idx} className="bg-rose-50 rounded-lg p-4 border-2 border-rose-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <p className="text-xs font-bold text-rose-800">
                      观察人【{s.observer}】的补读与旧释文存在较大偏差
                    </p>
                  </div>
                  <p className="text-[#2C2416] font-serif leading-relaxed">{s.supplement}</p>
                </div>
              ))}
              <p className="text-xs text-purple-800 bg-white/50 rounded px-3 py-2 border border-purple-200/50">
                💡 请仔细审查补读依据。若采信补读，系统将标注补读来源；若保留旧释文，补读会记入备注供后续研究参考。
              </p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[readingA, readingB].map((r, idx) => {
                const side = idx === 0 ? 'A' : 'B';
                const sideColor = idx === 0 ? 'blue' : 'indigo';
                if (!r) {
                  return (
                    <div key={`empty-${side}`} className="bg-[#FDFAF4] rounded-2xl border-2 border-dashed border-[#8B6914]/30 p-10 text-center">
                      <UserX className="w-12 h-12 mx-auto text-[#8B6914]/40 mb-3" />
                      <h3 className="font-bold text-[#5A4A34] mb-2">观察人 {side} 读数待提交</h3>
                      <p className="text-xs text-[#8B6914]/60 mb-4">请邀请第二名观察人独立完成观察读数</p>
                      <button
                        onClick={() => navigate(`/submit/${id}`)}
                        className="px-4 py-2 rounded-lg bg-[#8B6914] text-[#F5F0E8] text-xs font-medium hover:bg-[#755A10] transition"
                      >
                        前往提交
                      </button>
                    </div>
                  );
                }
                return (
                  <div
                    key={r.id}
                    className={cn(
                      'bg-[#FDFAF4] rounded-2xl border-2 shadow-lg overflow-hidden',
                      sideColor === 'blue' ? 'border-blue-300' : 'border-indigo-300',
                    )}
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 24px rgba(44,36,22,0.1)' }}
                  >
                    <div className={cn(
                      'px-5 py-3 text-white font-bold flex items-center justify-between',
                      sideColor === 'blue' ? 'bg-gradient-to-r from-blue-700 to-blue-600' : 'bg-gradient-to-r from-indigo-700 to-indigo-600',
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">{side}</span>
                        <span>观察人：{r.observer}</span>
                      </div>
                      <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
                        {formatDate(r.submitted_at)}
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      {READING_FIELDS.map((f) => {
                        const val = r[f.key] as string | undefined;
                        const conflict = conflictsByField[f.key];
                        const isConflicted = !!conflict && !conflict.resolution;
                        const wasResolved = !!conflict?.resolution;

                        return (
                          <div
                            key={f.key}
                            className={cn(
                              'rounded-xl border-2 p-4 transition',
                              isConflicted
                                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200/60'
                                : wasResolved
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-white border-[#8B6914]/15',
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-xs font-bold text-[#8B6914] tracking-wide uppercase">{f.label}</p>
                              {isConflicted && (
                                <span className="text-[10px] font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                  <AlertTriangle className="w-3 h-3" /> 冲突
                                </span>
                              )}
                              {wasResolved && (
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                                  <CheckCircle className="w-3 h-3" /> 已裁定
                                </span>
                              )}
                            </div>
                            {f.key === 'rubbing_image' ? (
                              val ? (
                                <div className="relative">
                                  <img
                                    src={val}
                                    alt="拓印图"
                                    className="w-full h-48 object-contain rounded-lg bg-[#F5F0E8] border border-[#8B6914]/20"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 py-6 text-xs text-[#8B6914]/50 bg-[#F5F0E8]/60 rounded-lg">
                                  <Image className="w-4 h-4" /> 未上传拓印图
                                </div>
                              )
                            ) : f.type === 'text' ? (
                              <p
                                className={cn(
                                  'text-sm leading-relaxed whitespace-pre-wrap break-words',
                                  isConflicted ? 'text-rose-900 font-medium' : 'text-[#2C2416]',
                                  f.key === 'transcription' && 'font-serif',
                                )}
                              >
                                {val || <span className="text-[#8B6914]/40 italic">— 无内容 —</span>}
                              </p>
                            ) : (
                              <p className={cn(
                                'text-sm font-medium',
                                isConflicted ? 'text-rose-900' : 'text-[#2C2416]',
                              )}>
                                {val}
                              </p>
                            )}
                            {conflict?.resolution && conflict.resolved_value && (
                              <div className="mt-3 pt-3 border-t border-dashed border-emerald-300/60">
                                <p className="text-[10px] text-emerald-700 font-bold mb-1 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> 采信结论
                                </p>
                                <p className="text-sm text-emerald-900 font-serif bg-white/60 rounded px-2.5 py-1.5 border border-emerald-200/50">
                                  {conflict.resolved_value}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {r.supplement_basis && (
                        <div className="rounded-xl bg-amber-50 border-2 border-amber-200 p-4">
                          <p className="text-xs font-bold text-amber-800 mb-1.5">补读依据</p>
                          <p className="text-sm text-[#2C2416]">{r.supplement_basis}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {readingA && readingB && detail.conflicts.some((c) => !c.resolution) && !isMerged && (
              <div className="mt-6 bg-[#FDFAF4] rounded-2xl border-2 border-[#8B6914]/30 shadow-lg overflow-hidden"
                style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 24px rgba(44,36,22,0.1)' }}
              >
                <div className="bg-[#2C2416] text-[#F5F0E8] px-5 py-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C9A44C]" />
                  <h3 className="font-bold tracking-wider" style={{ fontFamily: 'serif' }}>逐字段采信裁定</h3>
                  <span className="ml-auto text-xs text-[#C9A44C] opacity-80">请对每一处冲突给出明确结论</span>
                </div>
                <div className="p-5 space-y-4">
                  {detail.conflicts.filter((c) => !c.resolution).map((c) => (
                    <div key={c.id} className="bg-white rounded-xl border-2 border-[#8B6914]/20 p-4 hover:border-[#8B6914]/40 transition">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                        <div>
                          <h4 className="font-bold text-[#2C2416] flex items-center gap-2">
                            {FIELD_LABELS[c.field_name] || c.field_name}
                            {c.severity === 'severe' && (
                              <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded">严重</span>
                            )}
                            {c.conflict_type === 'supplement' && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">补读冲突</span>
                            )}
                          </h4>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-3">
                          <p className="text-[10px] font-bold text-blue-700 mb-1">A · {readingA.observer}</p>
                          <p className="text-sm text-blue-900 font-serif leading-relaxed whitespace-pre-wrap break-words">
                            {c.value_a || '—'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-indigo-50 border-2 border-indigo-200 p-3">
                          <p className="text-[10px] font-bold text-indigo-700 mb-1">B · {readingB.observer}</p>
                          <p className="text-sm text-indigo-900 font-serif leading-relaxed whitespace-pre-wrap break-words">
                            {c.value_b || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {DECISION_OPTIONS.map((o) => {
                            const sel = fieldDecisions[c.field_name]?.decision === o.value;
                            return (
                              <button
                                key={o.value}
                                onClick={() => setFieldDecision(c.field_name, o.value)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border-2 transition',
                                  sel ? o.color + ' shadow-sm ring-2 ring-offset-1 ring-' + (o.value === 'adopt_a' ? 'blue' : o.value === 'adopt_b' ? 'indigo' : 'amber') + '-300' : 'bg-white border-[#8B6914]/30 text-[#5A4A34] hover:border-[#8B6914]/60',
                                )}
                              >
                                {o.icon}
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                        {fieldDecisions[c.field_name]?.decision === 'merge' && (
                          <div className="rounded-lg bg-amber-50 border-2 border-amber-300 p-3">
                            <p className="text-[10px] font-bold text-amber-800 mb-1.5 flex items-center gap-1">
                              <Merge className="w-3 h-3" /> 请输入合并后的值
                            </p>
                            <input
                              type="text"
                              value={fieldDecisions[c.field_name]?.custom_value || ''}
                              onChange={(e) => setFieldCustomValue(c.field_name, e.target.value)}
                              placeholder="输入合并后的最终值..."
                              className="w-full px-3 py-2 rounded-lg border-2 border-amber-300 bg-white text-sm focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">
              <div className="bg-[#FDFAF4] rounded-2xl border-2 border-[#8B6914]/30 shadow-lg overflow-hidden">
                <div className="bg-[#3D5A80] px-4 py-3 text-white">
                  <h3 className="font-bold tracking-wider text-sm" style={{ fontFamily: 'serif' }}>会诊结论提交</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#5A4A34]">总体决策</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { v: 'merge' as const, l: '合并冲突', i: <Merge className="w-4 h-4" />, c: 'bg-teal-600' },
                        { v: 'keep_divergent' as const, l: '保留分歧', i: <XCircle className="w-4 h-4" />, c: 'bg-amber-600' },
                        { v: 'return_for_evidence' as const, l: '退回补证', i: <UserX className="w-4 h-4" />, c: 'bg-rose-600' },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          onClick={() => {
                            setOverallDecision(opt.v);
                            setShowReturnPanel(opt.v === 'return_for_evidence');
                          }}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-white transition border-2',
                            overallDecision === opt.v ? opt.c + ' border-transparent shadow-md' : 'bg-white text-[#5A4A34] border-[#8B6914]/20 hover:border-[#8B6914]/40',
                          )}
                          disabled={isMerged}
                        >
                          {opt.i}
                          {opt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {showReturnPanel && overallDecision === 'return_for_evidence' && (
                    <div className="rounded-lg bg-rose-50 border-2 border-rose-200 p-3 space-y-3">
                      <p className="text-[10px] font-bold text-rose-700">退回对象</p>
                      <div className="flex gap-2">
                        {(['A', 'B'] as const).map((t) => (
                          <label key={t} className="flex-1">
                            <input
                              type="checkbox"
                              checked={returnTargets.includes(t)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setReturnTargets([...returnTargets, t]);
                                } else {
                                  setReturnTargets(returnTargets.filter((x) => x !== t));
                                }
                              }}
                              className="hidden peer"
                            />
                            <span className={cn(
                              'block text-center py-2 rounded-lg text-xs font-bold border-2 cursor-pointer transition',
                              returnTargets.includes(t) ? 'bg-rose-600 text-white border-rose-700' : 'bg-white text-rose-700 border-rose-200 hover:border-rose-400',
                            )}>
                              退回 {t} · {t === 'A' ? readingA?.observer : readingB?.observer}
                            </span>
                          </label>
                        ))}
                      </div>
                      <textarea
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        placeholder="退回理由（需详细说明补证要求）"
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border-2 border-rose-200 bg-white text-xs focus:outline-none focus:border-rose-500 resize-none"
                      />
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-bold text-[#5A4A34] mb-1.5">会诊备注</p>
                    <textarea
                      value={consultNotes}
                      onChange={(e) => setConsultNotes(e.target.value)}
                      placeholder="记录裁定思路、参考依据、特殊说明..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm focus:outline-none focus:border-[#8B6914] resize-none"
                      disabled={isMerged}
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || isMerged}
                    className="w-full py-3 rounded-lg bg-[#8B6914] text-[#F5F0E8] text-sm font-bold hover:bg-[#755A10] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-[#755A10]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#F5F0E8]/30 border-t-[#F5F0E8] rounded-full animate-spin" />
                        提交中...
                      </>
                    ) : isMerged ? (
                      <>
                        <Sparkles className="w-4 h-4" /> 已完成合并
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> 提交会诊结论
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-2 rounded-lg bg-white border-2 border-[#8B6914]/30 text-[#5A4A34] text-xs font-medium hover:bg-[#8B6914]/10 transition"
                  >
                    返回批次列表
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
