'use client';

import { useState, useTransition } from 'react';
import type { RepairRecord, ColorLayer, ScanVersion } from '@/lib/types';
import { ACTION_LABEL, ACTION_CLASS, formatDateTime } from '@/lib/utils';
import { createRepair } from '@/app/actions';
import { cn } from '@/lib/utils';

interface Props {
  records: RepairRecord[];
  layers: ColorLayer[];
  versions: ScanVersion[];
  projectId: number;
  defaultVersionId: number;
}

export default function RepairsTimeline({ records, layers, versions, projectId, defaultVersionId }: Props) {
  const [show, setShow] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<string>('note');
  const [versionId, setVersionId] = useState(defaultVersionId);
  const [layerId, setLayerId] = useState<string>('');
  const [desc, setDesc] = useState('');
  const [op, setOp] = useState('');
  const [before, setBefore] = useState(0);
  const [after, setAfter] = useState(0);
  const [list, setList] = useState(records);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;
    const fd = new FormData();
    fd.append('project_id', String(projectId));
    fd.append('version_id', String(versionId));
    fd.append('action_type', action);
    fd.append('description', desc);
    fd.append('operator', op || '匿名');
    fd.append('before_offset', String(before));
    fd.append('after_offset', String(after));
    if (layerId) fd.append('layer_id', layerId);
    startTransition(async () => {
      await createRepair(fd);
      const tmp: RepairRecord = {
        id: Date.now(),
        project_id: projectId,
        version_id: versionId,
        layer_id: layerId ? Number(layerId) : null,
        action_type: action as RepairRecord['action_type'],
        description: desc,
        operator: op || '匿名',
        before_offset: before,
        after_offset: after,
        created_at: new Date().toISOString(),
      };
      setList([tmp, ...list]);
      setShow(false);
      setDesc('');
    });
  };

  const layerMap = new Map(layers.map(l => [l.id, l]));
  const vMap = new Map(versions.map(v => [v.id, v]));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-stone-500">共 {list.length} 条记录</span>
        <button type="button" className="btn-secondary text-xs" onClick={() => setShow(v => !v)}>
          {show ? '收起' : '+ 添加修版记录'}
        </button>
      </div>
      {show && (
        <form onSubmit={submit} className="paper-card p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] text-stone-500">类型</label>
            <select value={action} onChange={(e) => setAction(e.target.value)} className="input-field !py-1 text-xs">
              {Object.entries(ACTION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-stone-500">版本</label>
            <select value={versionId} onChange={(e) => setVersionId(Number(e.target.value))} className="input-field !py-1 text-xs">
              {versions.map(v => <option key={v.id} value={v.id}>{v.version_no} · {v.batch_no}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-stone-500">色版（可选）</label>
            <select value={layerId} onChange={(e) => setLayerId(e.target.value)} className="input-field !py-1 text-xs">
              <option value="">(整体版本)</option>
              {layers.map(l => <option key={l.id} value={l.id}>{l.layer_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-stone-500">操作人</label>
            <input className="input-field !py-1 text-xs" value={op} onChange={(e) => setOp(e.target.value)} placeholder="如：王师傅" />
          </div>
          <div>
            <label className="text-[11px] text-stone-500">修前平均偏移 (px)</label>
            <input type="number" step="0.01" className="input-field !py-1 text-xs" value={before} onChange={(e) => setBefore(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-[11px] text-stone-500">修后平均偏移 (px)</label>
            <input type="number" step="0.01" className="input-field !py-1 text-xs" value={after} onChange={(e) => setAfter(Number(e.target.value))} />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <label className="text-[11px] text-stone-500">描述</label>
            <textarea rows={2} className="input-field !py-1 text-xs" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="说明操作内容、原因和结果…" required />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary text-xs" disabled={isPending}>
              {isPending ? '保存中…' : '提交记录'}
            </button>
          </div>
        </form>
      )}
      <div className="relative pl-5 border-l-2 border-dashed border-stone-200 space-y-3 max-h-[460px] overflow-y-auto scroll-thin pr-1">
        {list.length === 0 ? (
          <div className="py-6 text-center text-stone-400 text-sm">暂无修版记录</div>
        ) : list.map(r => {
          const layer = r.layer_id ? layerMap.get(r.layer_id) : null;
          const v = vMap.get(r.version_id);
          const improved = r.after_offset < r.before_offset;
          return (
            <div key={r.id} className="relative">
              <span className={cn(
                'absolute -left-[27px] top-1.5 w-3 h-3 rounded-full ring-2 ring-white',
                layer ? '' : 'bg-stone-400'
              )} style={layer ? { background: layer.color_code } : undefined}></span>
              <div className="paper-card p-2.5">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className={cn('chip', ACTION_CLASS[r.action_type])}>{ACTION_LABEL[r.action_type]}</span>
                  <span className="text-xs text-stone-600">版本 <b>{v?.version_no || '-'}</b></span>
                  {layer && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-stone-600">
                      <span className="w-2 h-2 rounded-full border border-stone-300" style={{ background: layer.color_code }}></span>
                      {layer.layer_name}
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-stone-400 font-mono">{formatDateTime(r.created_at)}</span>
                </div>
                <div className="text-sm text-ink/90 mb-1">{r.description}</div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span className="text-stone-500">操作人 <b className="text-ink/80">{r.operator}</b></span>
                  {r.before_offset !== r.after_offset && (
                    <span className={cn('font-mono', improved ? 'text-emerald-700' : 'text-rose-700')}>
                      {r.before_offset.toFixed(2)} → {r.after_offset.toFixed(2)} px
                      <span className="ml-1">
                        {improved ? '↓' : '↑'} {Math.abs(r.before_offset - r.after_offset).toFixed(2)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
