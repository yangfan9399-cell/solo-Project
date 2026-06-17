'use client';

import { useRouter } from 'next/navigation';
import type { ScanVersion, ColorLayer, OffsetStat } from '@/lib/types';
import { formatDateTime, cn, STATUS_CLASS, STATUS_LABEL } from '@/lib/utils';
import type { ProjectStatus } from '@/lib/types';
import { recomputeStats, patchProject, bulkSyncLayerOffsets } from '@/app/actions';
import { useState, useTransition } from 'react';

interface Props {
  versions: ScanVersion[];
  currentVersionId: number;
  projectId: number;
  currentStatus: ProjectStatus;
  currentAnomaly: string;
  currentAnomalyNotes: string | null;
  layersInCurrent: ColorLayer[];
  statsByVersion: Map<number, OffsetStat>;
}

const ALL_STATUS: ProjectStatus[] = ['draft', 'in_progress', 'review', 'completed'];
const ANOMALIES: Array<{ v: string; l: string }> = [
  { v: 'none', l: '正常' }, { v: 'minor', l: '轻微' },
  { v: 'moderate', l: '中等' }, { v: 'severe', l: '严重' },
];

export default function VersionSelector({
  versions, currentVersionId, projectId, currentStatus,
  currentAnomaly, currentAnomalyNotes, layersInCurrent, statsByVersion,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [status, setStatus] = useState<ProjectStatus>(currentStatus);
  const [anomaly, setAnomaly] = useState(currentAnomaly);
  const [anomalyNotes, setAnomalyNotes] = useState(currentAnomalyNotes || '');
  const [editingMeta, setEditingMeta] = useState(false);
  const [, startTransition] = useTransition();

  const switchVersion = (id: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('version', String(id));
    router.push(`/project/${projectId}?${params.toString()}`);
  };

  const doRecompute = () => {
    setPending('recompute');
    startTransition(async () => {
      await recomputeStats(projectId, currentVersionId);
      setPending(null);
    });
  };

  const doSync = () => {
    setPending('sync');
    startTransition(async () => {
      await bulkSyncLayerOffsets(projectId, currentVersionId);
      setPending(null);
    });
  };

  const saveMeta = () => {
    setPending('meta');
    startTransition(async () => {
      await patchProject(projectId, {
        status,
        anomaly_level: anomaly as never,
        anomaly_notes: anomalyNotes || null,
      });
      setEditingMeta(false);
      setPending(null);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title">版本 / 批次历史</h3>
          <button type="button" className="text-xs text-gold hover:underline" onClick={doRecompute} disabled={pending === 'recompute'}>
            {pending === 'recompute' ? '重算中…' : '↻ 重新统计'}
          </button>
        </div>
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto scroll-thin pr-1">
          {versions.map(v => {
            const active = v.id === currentVersionId;
            const stat = statsByVersion.get(v.id);
            const off = stat?.avg_distance ?? 0;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => switchVersion(v.id)}
                className={cn(
                  'w-full text-left p-2.5 rounded-md border transition flex items-start gap-2.5',
                  active
                    ? 'bg-ink text-paper border-ink shadow'
                    : 'bg-white/70 border-stone-200 hover:bg-white hover:border-gold/60'
                )}
              >
                <div className={cn(
                  'w-2 h-2 mt-1.5 rounded-full shrink-0',
                  active ? 'bg-gold' : 'bg-stone-300'
                )}></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{v.version_no}</span>
                    <span className={cn(
                      'text-[11px] font-mono',
                      active ? 'text-paper/70' : 'text-stone-500'
                    )}>{v.batch_no}</span>
                    {active && <span className="chip !text-[10px] !bg-gold !text-ink !ring-0">当前</span>}
                  </div>
                  <div className={cn(
                    'text-[11px] mt-0.5',
                    active ? 'text-paper/80' : 'text-stone-500'
                  )}>
                    {formatDateTime(v.scanned_at)} · {v.resolution_dpi}dpi
                  </div>
                  {v.notes && (
                    <div className={cn(
                      'text-[11px] mt-0.5 line-clamp-1',
                      active ? 'text-paper/90' : 'text-stone-600'
                    )}>📝 {v.notes}</div>
                  )}
                  {stat && (
                    <div className={cn(
                      'text-[11px] mt-1 font-mono',
                      off > 2 ? (active ? 'text-rose-200' : 'text-rose-700') : (active ? 'text-emerald-200' : 'text-emerald-700')
                    )}>
                      平均 {off.toFixed(2)}px · 最大 {stat.max_distance.toFixed(2)}px
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="section-title">项目属性</h3>
          <button type="button" className="text-xs text-gold hover:underline" onClick={() => setEditingMeta(v => !v)}>
            {editingMeta ? '取消编辑' : '✎ 编辑'}
          </button>
        </div>
        {editingMeta ? (
          <div className="stat-card !gap-2">
            <div>
              <label className="text-[11px] text-stone-500">状态</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="input-field !py-1 text-xs">
                {ALL_STATUS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-stone-500">异常等级</label>
              <select value={anomaly} onChange={(e) => setAnomaly(e.target.value)} className="input-field !py-1 text-xs">
                {ANOMALIES.map(a => <option key={a.v} value={a.v}>{a.l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-stone-500">异常说明</label>
              <textarea rows={2} value={anomalyNotes} onChange={(e) => setAnomalyNotes(e.target.value)} className="input-field !py-1 text-xs" placeholder="说明情况和处理建议" />
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-primary text-xs" onClick={saveMeta} disabled={!!pending}>
                {pending === 'meta' ? '保存中…' : '保存变更'}
              </button>
              <button type="button" className="btn-secondary text-xs" onClick={doSync} disabled={!!pending}>
                {pending === 'sync' ? '同步中…' : '按控制点自动同步图层偏移'}
              </button>
            </div>
          </div>
        ) : (
          <div className="stat-card !gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500">状态</span>
              <span className={cn('chip', STATUS_CLASS[status])}>{STATUS_LABEL[status]}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-stone-500 shrink-0">异常</span>
              <div>
                <span className="font-medium" style={{
                  color: anomaly === 'severe' ? '#be123c' : anomaly === 'moderate' ? '#c2410c' : anomaly === 'minor' ? '#b45309' : '#047857'
                }}>
                  {ANOMALIES.find(a => a.v === anomaly)?.l || '正常'}
                </span>
                {anomalyNotes && <div className="text-stone-600 mt-0.5">{anomalyNotes}</div>}
              </div>
            </div>
            <div className="pt-2">
              <div className="text-stone-500 mb-1">当前版本图层概览 ({layersInCurrent.length} 版)</div>
              <div className="flex flex-wrap gap-1">
                {layersInCurrent.map(l => (
                  <span key={l.id} className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border',
                    l.is_aligned ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-700'
                  )}>
                    <span className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ background: l.color_code }}></span>
                    {l.layer_name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
