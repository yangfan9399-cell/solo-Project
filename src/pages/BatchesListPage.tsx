import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Scroll, AlertTriangle, CheckCircle, XCircle, History, User, Sparkles, Clock } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { STATUS_LABELS, STATUS_COLORS, type BatchStatus, type Stats } from '../types';
import { api } from '../lib/api';
import { cn } from '../lib/utils';

const STATUSES: (BatchStatus | 'all')[] = [
  'all',
  'consistent',
  'minor_deviation',
  'severe_conflict',
  'missing_evidence',
  'merged',
];

const STATUS_LABELS_WITH_ALL: Record<BatchStatus | 'all', string> = {
  all: '全部',
  ...STATUS_LABELS,
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StatusBadge({ status }: { status: BatchStatus }) {
  const c = STATUS_COLORS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
        c.bg,
        c.text,
        c.border,
      )}
    >
      {status === 'consistent' && <CheckCircle className="w-3 h-3" />}
      {status === 'minor_deviation' && <AlertTriangle className="w-3 h-3" />}
      {status === 'severe_conflict' && <XCircle className="w-3 h-3" />}
      {status === 'missing_evidence' && <Clock className="w-3 h-3" />}
      {status === 'merged' && <Sparkles className="w-3 h-3" />}
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function BatchesListPage() {
  const navigate = useNavigate();
  const {
    batches,
    statusFilter,
    searchQuery,
    loading,
    currentUser,
    setStatusFilter,
    setSearchQuery,
    loadBatches,
  } = useAppStore();

  const [stats, setStats] = useState<Stats | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batch_no: '',
    plaque_name: '',
    old_transcription: '',
  });

  useEffect(() => {
    loadBatches();
    api.getStats().then(setStats).catch(console.error);
  }, [loadBatches]);

  const handleCreate = async () => {
    if (!newBatch.batch_no || !newBatch.plaque_name) return;
    try {
      await api.createBatch(newBatch);
      setShowCreate(false);
      setNewBatch({ batch_no: '', plaque_name: '', old_transcription: '' });
      loadBatches();
      api.getStats().then(setStats).catch(console.error);
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const statsCards = stats
    ? [
        { key: 'total', label: '批次总数', count: stats.total, color: 'from-amber-100 to-amber-50', icon: <Scroll className="w-5 h-5 text-amber-700" /> },
        { key: 'missing_evidence', label: '缺证待补', count: stats.missing_evidence, color: 'from-slate-100 to-slate-50', icon: <Clock className="w-5 h-5 text-slate-600" /> },
        { key: 'severe_conflict', label: '严重冲突', count: stats.severe_conflict, color: 'from-rose-100 to-rose-50', icon: <XCircle className="w-5 h-5 text-rose-600" /> },
        { key: 'merged', label: '已合并', count: stats.merged, color: 'from-teal-100 to-teal-50', icon: <Sparkles className="w-5 h-5 text-teal-700" /> },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0E8] via-[#EFE7D8] to-[#E8DDC9]">
      <header className="sticky top-0 z-20 bg-[#2C2416] text-[#F5F0E8] shadow-lg border-b-4 border-[#8B6914]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#8B6914] flex items-center justify-center border-2 border-[#C9A44C]">
              <Scroll className="w-5 h-5 text-[#F5F0E8]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider" style={{ fontFamily: 'serif' }}>
                古井铭牌批次异常会诊工具
              </h1>
              <p className="text-xs text-[#C9A44C] opacity-80">Ancient Well Plaques Review System</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#3D2F1A] px-3 py-1.5 rounded-lg border border-[#8B6914]/50">
              <User className="w-4 h-4 text-[#C9A44C]" />
              <span className="text-sm">{currentUser?.name || '未登录'}</span>
              <span className="text-xs px-2 py-0.5 bg-[#8B6914] rounded">
                {currentUser?.role === 'consultant' ? '会诊官' : '观察人'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsCards.map((s) => (
            <div
              key={s.key}
              className={cn(
                'rounded-xl border-2 border-[#8B6914]/30 p-5 shadow-sm',
                'bg-gradient-to-br backdrop-blur-sm',
                s.color,
              )}
              style={{
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6), 0 4px 14px rgba(44,36,22,0.08)',
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#5A4A34] font-medium mb-1">{s.label}</p>
                  <p className="text-3xl font-bold text-[#2C2416] mt-1" style={{ fontFamily: 'serif' }}>
                    {s.count}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center border border-[#8B6914]/20">
                  {s.icon}
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mb-6 bg-[#FDFAF4] border-2 border-[#8B6914]/30 rounded-xl p-5 shadow-sm"
          style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(44,36,22,0.06)' }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => {
                const active = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-all border-2',
                      active
                        ? 'bg-[#8B6914] text-[#F5F0E8] border-[#8B6914] shadow-md'
                        : 'bg-white/70 text-[#5A4A34] border-[#8B6914]/30 hover:bg-[#8B6914]/10 hover:border-[#8B6914]/60',
                    )}
                  >
                    {STATUS_LABELS_WITH_ALL[s]}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B6914]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索批次编号或铭牌名称..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-[#8B6914]/30 bg-white/80 text-sm text-[#2C2416] placeholder:text-[#8B6914]/50 focus:outline-none focus:border-[#8B6914] transition"
                />
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3D5A80] text-white text-sm font-medium hover:bg-[#324a6b] transition shadow-md border border-[#2a3c56]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">新建批次</span>
              </button>
            </div>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="text-center py-20 text-[#8B6914]">
              <div className="inline-block w-10 h-10 border-4 border-[#8B6914]/30 border-t-[#8B6914] rounded-full animate-spin mb-3" />
              <p>加载中...</p>
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center py-20 bg-[#FDFAF4] rounded-xl border-2 border-dashed border-[#8B6914]/30">
              <Scroll className="w-14 h-14 mx-auto text-[#8B6914]/40 mb-4" />
              <p className="text-[#5A4A34] mb-2">暂无符合条件的批次</p>
              <p className="text-xs text-[#8B6914]/60">请尝试调整筛选条件</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {batches.map((b) => {
                const c = STATUS_COLORS[b.status];
                return (
                  <div
                    key={b.id}
                    className="group relative bg-[#FDFAF4] rounded-xl overflow-hidden border-2 border-[#8B6914]/30 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}
                  >
                    <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', c.bar)} />
                    <div className="p-5 pl-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-xs text-[#8B6914] font-medium tracking-wide">{b.batch_no}</p>
                          <h3 className="text-lg font-bold text-[#2C2416] mt-1" style={{ fontFamily: 'serif' }}>
                            {b.plaque_name}
                          </h3>
                        </div>
                        <StatusBadge status={b.status} />
                      </div>

                      {b.conflict_count > 0 && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-[#C74438] bg-[#FDECEA] border border-[#F5B4AA] px-2.5 py-1 rounded-lg w-fit">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>检测到 <strong>{b.conflict_count}</strong> 处冲突待会诊</span>
                        </div>
                      )}

                      <div className="space-y-1.5 text-sm text-[#5A4A34] border-t border-[#8B6914]/15 pt-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#8B6914]" />
                          <span className="font-medium">观察人：</span>
                          <span>{b.observer_a || '—'}</span>
                          {b.observer_b && (
                            <>
                              <span className="text-[#8B6914]/40">/</span>
                              <span>{b.observer_b}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#8B6914]/70">
                          <Clock className="w-3.5 h-3.5" />
                          <span>更新：{formatDate(b.updated_at)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#8B6914]/15">
                        <button
                          onClick={() => navigate(`/batch/${b.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#8B6914] text-[#F5F0E8] hover:bg-[#755A10] transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          会诊对比
                        </button>
                        <button
                          onClick={() => navigate(`/submit/${b.id}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white border-2 border-[#8B6914]/40 text-[#5A4A34] hover:bg-[#8B6914]/10 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          提交读数
                        </button>
                        <button
                          onClick={() => navigate(`/history/${b.id}`)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#F5F0E8] border-2 border-[#8B6914]/20 text-[#5A4A34] hover:bg-[#8B6914]/10 transition"
                          title="会诊记录"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-[#2C2416]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFAF4] rounded-2xl shadow-2xl border-2 border-[#8B6914]/40 w-full max-w-md overflow-hidden">
            <div className="bg-[#2C2416] text-[#F5F0E8] px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold tracking-wider" style={{ fontFamily: 'serif' }}>新建铭牌批次</h2>
              <button onClick={() => setShowCreate(false)} className="text-[#C9A44C] hover:text-[#F5F0E8] transition text-2xl leading-none">
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#2C2416] mb-1.5">批次编号 *</label>
                <input
                  type="text"
                  value={newBatch.batch_no}
                  onChange={(e) => setNewBatch({ ...newBatch, batch_no: e.target.value })}
                  placeholder="例：GJ-2024-006"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C2416] mb-1.5">铭牌名称 *</label>
                <input
                  type="text"
                  value={newBatch.plaque_name}
                  onChange={(e) => setNewBatch({ ...newBatch, plaque_name: e.target.value })}
                  placeholder="例：玉澜古井铭"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2C2416] mb-1.5">旧藏释文（可选）</label>
                <textarea
                  value={newBatch.old_transcription}
                  onChange={(e) => setNewBatch({ ...newBatch, old_transcription: e.target.value })}
                  placeholder="输入既往已有释文，用于与残缺补读比对冲突"
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-[#8B6914]/30 bg-white text-sm text-[#2C2416] focus:outline-none focus:border-[#8B6914] resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-[#F5F0E8] border-t border-[#8B6914]/20 flex justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-white border-2 border-[#8B6914]/30 text-[#5A4A34] hover:bg-[#8B6914]/10 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                disabled={!newBatch.batch_no || !newBatch.plaque_name}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-[#8B6914] text-[#F5F0E8] hover:bg-[#755A10] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
