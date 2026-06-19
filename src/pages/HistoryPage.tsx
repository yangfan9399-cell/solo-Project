import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  History,
  Merge,
  UserX,
  XCircle,
  User,
  FileText,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  CONSULTATION_DECISION_LABELS,
  READING_FIELDS,
  STATUS_LABELS,
  STATUS_COLORS,
  type BatchDetail,
  type Consultation,
  type FieldDecision,
} from '../types';
import { cn } from '../lib/utils';

const FIELD_LABELS: Record<string, string> = Object.fromEntries(
  READING_FIELDS.map((f) => [f.key, f.label]),
);

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

const DECISION_LABELS: Record<FieldDecision['decision'], string> = {
  adopt_a: '采信 A 说',
  adopt_b: '采信 B 说',
  merge: '合并为新值',
  keep_divergent: '保留双方分歧',
};

const DECISION_ICONS: Record<Consultation['decision'], React.ReactNode> = {
  merge: <Merge className="w-5 h-5 text-teal-600" />,
  keep_divergent: <XCircle className="w-5 h-5 text-amber-600" />,
  return_for_evidence: <UserX className="w-5 h-5 text-rose-600" />,
};

const DECISION_BADGE: Record<Consultation['decision'], string> = {
  merge: 'bg-teal-100 text-teal-800 border-teal-300',
  keep_divergent: 'bg-amber-100 text-amber-800 border-amber-300',
  return_for_evidence: 'bg-rose-100 text-rose-800 border-rose-300',
};

export default function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getBatchDetail(id).then((d) => setDetail(d)).finally(() => setLoading(false));
  }, [id]);

  if (loading || !detail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] to-[#E8DDC9] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#8B6914]/30 border-t-[#8B6914] rounded-full animate-spin" />
      </div>
    );
  }

  const statusColor = STATUS_COLORS[detail.batch.status];
  const consultations = detail.consultations;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-[#EFE7D8] to-[#E8DDC9]">
      <header className="sticky top-0 z-20 bg-[#2C2416] text-[#F5F0E8] shadow-lg border-b-4 border-[#8B6914]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/batch/${id}`)}
              className="w-9 h-9 rounded-lg bg-[#3D2F1A] border border-[#8B6914]/50 hover:bg-[#4d3d24] transition flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-wider flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                <History className="w-5 h-5 text-[#C9A44C]" />
                会诊决策追溯
              </h1>
              <p className="text-xs text-[#C9A44C] opacity-80">
                {detail.batch.batch_no} · {detail.batch.plaque_name}
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
              当前状态：{STATUS_LABELS[detail.batch.status]}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <section className="mb-8 bg-[#FDFAF4] rounded-2xl border-2 border-[#8B6914]/30 shadow-sm overflow-hidden"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}
        >
          <div className="bg-gradient-to-r from-[#2C2416] to-[#3D2F1A] px-6 py-4 border-b-4 border-[#8B6914]">
            <h2 className="text-[#F5F0E8] font-bold flex items-center gap-2" style={{ fontFamily: 'serif' }}>
              <FileText className="w-4 h-4 text-[#C9A44C]" />
              批次概览
            </h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-xs text-[#8B6914] font-medium mb-1">批次编号</p>
              <p className="font-bold text-[#2C2416] text-lg" style={{ fontFamily: 'serif' }}>{detail.batch.batch_no}</p>
            </div>
            <div>
              <p className="text-xs text-[#8B6914] font-medium mb-1">铭牌名称</p>
              <p className="font-bold text-[#2C2416] text-lg" style={{ fontFamily: 'serif' }}>{detail.batch.plaque_name}</p>
            </div>
            <div>
              <p className="text-xs text-[#8B6914] font-medium mb-1">会诊参与观察人</p>
              <p className="text-[#2C2416] font-medium">
                {detail.batch.observer_a || '—'}
                {detail.batch.observer_b && (
                  <>
                    <span className="mx-1.5 text-[#8B6914]/40">·</span>
                    {detail.batch.observer_b}
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#8B6914] font-medium mb-1">冲突字段数</p>
              <p className="text-[#2C2416] font-medium">{detail.batch.conflict_count} 项</p>
            </div>
            <div>
              <p className="text-xs text-[#8B6914] font-medium mb-1">历史会诊次数</p>
              <p className="text-[#2C2416] font-medium">{consultations.length} 次</p>
            </div>
            <div>
              <p className="text-xs text-[#8B6914] font-medium mb-1">最近更新</p>
              <p className="text-[#2C2416] font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#8B6914]" />
                {formatDate(detail.batch.updated_at)}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#2C2416] mb-5 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
            <span className="w-1.5 h-6 bg-[#8B6914] rounded-full" />
            决策时间线（按时间倒序）
          </h2>

          {consultations.length === 0 ? (
            <div className="bg-[#FDFAF4] rounded-2xl border-2 border-dashed border-[#8B6914]/30 py-16 text-center">
              <History className="w-14 h-14 mx-auto text-[#8B6914]/30 mb-4" />
              <p className="text-[#5A4A34] mb-2">尚未产生任何会诊决策</p>
              <p className="text-xs text-[#8B6914]/60 mb-6">请前往会诊对比页提交首次结论</p>
              <button
                onClick={() => navigate(`/batch/${id}`)}
                className="px-5 py-2.5 rounded-lg bg-[#8B6914] text-[#F5F0E8] text-sm font-medium hover:bg-[#755A10] transition shadow-sm"
              >
                前往会诊对比
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8B6914] via-[#C9A44C] to-[#8B6914]/30" />

              <div className="space-y-6">
                {consultations.map((c, idx) => {
                  let decisions: Record<string, FieldDecision> = {};
                  try {
                    decisions = JSON.parse(c.decisions_json) || {};
                  } catch {
                    decisions = {};
                  }
                  const fieldKeys = Object.keys(decisions);
                  const isExpanded = expandedId === c.id;

                  return (
                    <div key={c.id} className="relative pl-16">
                      <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-[#FDFAF4] border-4 border-[#8B6914]/40 flex items-center justify-center shadow-md z-10"
                        style={{ boxShadow: '0 0 0 4px rgba(139,105,20,0.1)' }}
                      >
                        {DECISION_ICONS[c.decision]}
                      </div>
                      <div className="bg-[#FDFAF4] rounded-2xl border-2 border-[#8B6914]/30 shadow-sm overflow-hidden hover:shadow-md transition"
                        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}
                      >
                        <div className="bg-gradient-to-r from-[#8B6914]/10 to-transparent px-5 py-4 border-b border-[#8B6914]/20 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              'px-3 py-1 rounded-full text-xs font-bold border-2',
                              DECISION_BADGE[c.decision],
                            )}>
                              #{consultations.length - idx} · {CONSULTATION_DECISION_LABELS[c.decision]}
                            </span>
                            <div className="flex items-center gap-1.5 text-sm text-[#2C2416] font-medium">
                              <User className="w-4 h-4 text-[#8B6914]" />
                              {c.consultant}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-[#5A4A34]">
                            <Clock className="w-3.5 h-3.5 text-[#8B6914]" />
                            {formatDate(c.created_at)}
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {c.notes && (
                            <div className="rounded-xl bg-[#F5F0E8] border border-[#8B6914]/20 p-4">
                              <p className="text-xs font-bold text-[#8B6914] mb-2 flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" /> 会诊备注
                              </p>
                              <p className="text-sm text-[#2C2416] leading-relaxed font-serif">{c.notes}</p>
                            </div>
                          )}

                          {fieldKeys.length > 0 && (
                            <div>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : c.id)}
                                className="w-full flex items-center justify-between text-xs font-bold text-[#5A4A34] hover:text-[#8B6914] transition py-2 px-3 rounded-lg hover:bg-[#8B6914]/5"
                              >
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-[#4A7C59]" />
                                  字段决策详情（{fieldKeys.length} 项）
                                </span>
                                <span className="text-[#8B6914]">
                                  {isExpanded ? '收起 ▲' : '展开 ▼'}
                                </span>
                              </button>

                              {isExpanded && (
                                <div className="mt-3 space-y-2">
                                  {fieldKeys.map((k) => {
                                    const d = decisions[k];
                                    const conflict = detail.conflicts.find(
                                      (cf) => cf.field_name === k && cf.resolved_at && cf.resolved_at <= c.created_at,
                                    );
                                    return (
                                      <div key={k} className="rounded-xl bg-white border-2 border-[#8B6914]/15 p-4 hover:border-[#8B6914]/35 transition">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                          <h4 className="font-bold text-[#2C2416] text-sm">
                                            {FIELD_LABELS[k] || k}
                                          </h4>
                                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#8B6914]/10 text-[#5A4A34] font-bold whitespace-nowrap shrink-0">
                                            {DECISION_LABELS[d.decision]}
                                          </span>
                                        </div>
                                        {conflict && (
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-2">
                                            <div className="rounded-lg bg-blue-50 border border-blue-100 p-2">
                                              <p className="text-[10px] font-bold text-blue-700 mb-0.5">A 说</p>
                                              <p className="text-blue-900 break-words">{conflict.value_a}</p>
                                            </div>
                                            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-2">
                                              <p className="text-[10px] font-bold text-indigo-700 mb-0.5">B 说</p>
                                              <p className="text-indigo-900 break-words">{conflict.value_b}</p>
                                            </div>
                                          </div>
                                        )}
                                        {(d.decision === 'merge' || conflict?.resolved_value) && (
                                          <div className="rounded-lg bg-teal-50 border-2 border-teal-200 p-2.5 mt-2">
                                            <p className="text-[10px] font-bold text-teal-700 mb-0.5 flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3" /> 最终采信值
                                            </p>
                                            <p className="text-teal-900 text-sm font-serif break-words">
                                              {d.custom_value || conflict?.resolved_value || '—'}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
