'use client';

import { useState } from 'react';
import type { ColorLayer, ControlPoint } from '@/lib/types';
import { createControlPoint, deleteControlPoint } from '@/app/actions';
import { cn } from '@/lib/utils';

interface Props {
  layers: ColorLayer[];
  initialPoints: ControlPoint[];
  projectId: number;
  versionId: number;
}

export default function ControlPointsTable({ layers, initialPoints, projectId, versionId }: Props) {
  const [points, setPoints] = useState<ControlPoint[]>(initialPoints);
  const [filter, setFilter] = useState<number | 'all'>('all');
  const [onlyBad, setOnlyBad] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addLabel, setAddLabel] = useState('新控制点');
  const [addRefX, setAddRefX] = useState(600);
  const [addRefY, setAddRefY] = useState(800);
  const [addCurX, setAddCurX] = useState(600);
  const [addCurY, setAddCurY] = useState(800);
  const [addLayer, setAddLayer] = useState<number>(layers[0]?.id ?? 0);
  const [pending, setPending] = useState<string | null>(null);

  const layerMap = new Map(layers.map(l => [l.id, l]));
  const filtered = points
    .filter(p => filter === 'all' || p.layer_id === filter)
    .filter(p => !onlyBad || p.distance > 1.5);

  const doAdd = async () => {
    if (!addLayer) return;
    setPending('add');
    const result = await createControlPoint({
      layer_id: addLayer, project_id: projectId, version_id: versionId,
      label: addLabel, ref_x: addRefX, ref_y: addRefY, cur_x: addCurX, cur_y: addCurY,
    });
    const dx = addCurX - addRefX, dy = addCurY - addRefY;
    const newId = result.id || Date.now();
    setPoints(prev => [
      ...prev,
      {
        id: newId, layer_id: addLayer, project_id: projectId, version_id: versionId,
        label: addLabel, ref_x: addRefX, ref_y: addRefY, cur_x: addCurX, cur_y: addCurY,
        delta_x: Math.round(dx * 100) / 100, delta_y: Math.round(dy * 100) / 100,
        distance: Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100,
      },
    ]);
    setShowAdd(false);
    setPending(null);
  };

  const doDelete = async (id: number) => {
    setPending(`del-${id}`);
    await deleteControlPoint(id, projectId, versionId);
    setPoints(prev => prev.filter(p => p.id !== id));
    setPending(null);
  };

  const addQuick = (layerId: number, refX: number, refY: number) => {
    setAddLayer(layerId);
    setAddRefX(Math.round(refX));
    setAddRefY(Math.round(refY));
    setAddCurX(Math.round(refX));
    setAddCurY(Math.round(refY));
    setShowAdd(true);
  };

  void addQuick;

  const threshold = (d: number) =>
    d <= 1.5 ? 'ok' : d <= 3 ? 'warn' : 'bad';

  const cls = (k: 'ok' | 'warn' | 'bad') =>
    k === 'ok' ? 'text-emerald-700' : k === 'warn' ? 'text-amber-700' : 'text-rose-700';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filter === 'all' ? 'all' : String(filter)} onChange={(e) => setFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="input-field !w-auto !py-1 text-xs">
          <option value="all">全部色版</option>
          {layers.map(l => <option key={l.id} value={l.id}>{l.layer_name}</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-stone-600">
          <input type="checkbox" checked={onlyBad} onChange={(e) => setOnlyBad(e.target.checked)} className="accent-rose-600" />
          仅显示超标点
        </label>
        <div className="ml-auto flex gap-2">
          <button type="button" className="btn-secondary text-xs" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? '取消新增' : '+ 新增控制点'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="stat-card !gap-2">
          <div className="text-xs font-medium text-ink mb-1">新增控制点</div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="md:col-span-1">
              <label className="text-[11px] text-stone-500">色版</label>
              <select value={addLayer} onChange={(e) => setAddLayer(Number(e.target.value))} className="input-field !py-1 text-xs">
                {layers.map(l => <option key={l.id} value={l.id}>{l.layer_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-stone-500">标签</label>
              <input className="input-field !py-1 text-xs" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] text-stone-500">参考X</label>
              <input type="number" className="input-field !py-1 text-xs" value={addRefX} onChange={(e) => setAddRefX(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] text-stone-500">参考Y</label>
              <input type="number" className="input-field !py-1 text-xs" value={addRefY} onChange={(e) => setAddRefY(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] text-stone-500">实测X</label>
              <input type="number" className="input-field !py-1 text-xs" value={addCurX} onChange={(e) => setAddCurX(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-[11px] text-stone-500">实测Y</label>
              <input type="number" className="input-field !py-1 text-xs" value={addCurY} onChange={(e) => setAddCurY(Number(e.target.value))} />
            </div>
          </div>
          <div className="pt-1">
            <button type="button" className="btn-primary text-xs" onClick={doAdd} disabled={pending === 'add'}>
              {pending === 'add' ? '添加中…' : '确认添加'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto scroll-thin border border-stone-200 rounded-md">
        <table className="w-full text-xs">
          <thead className="bg-stone-100/70 text-stone-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">色版</th>
              <th className="px-3 py-2 text-left font-medium">标签</th>
              <th className="px-3 py-2 text-right font-medium">参考 X,Y</th>
              <th className="px-3 py-2 text-right font-medium">实测 X,Y</th>
              <th className="px-3 py-2 text-right font-medium">ΔX</th>
              <th className="px-3 py-2 text-right font-medium">ΔY</th>
              <th className="px-3 py-2 text-right font-medium">距离</th>
              <th className="px-3 py-2 text-center font-medium">判定</th>
              <th className="px-3 py-2 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-6 py-8 text-center text-stone-400">暂无控制点数据</td></tr>
            ) : filtered.map(p => {
              const layer = layerMap.get(p.layer_id);
              const t = threshold(p.distance);
              return (
                <tr key={p.id} className="hover:bg-amber-50/30 transition">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-stone-300" style={{ background: layer?.color_code || '#999' }}></span>
                      <span>{layer?.layer_name || '未知'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 font-medium">{p.label}</td>
                  <td className="px-3 py-2 text-right font-mono text-stone-600">{p.ref_x.toFixed(1)}, {p.ref_y.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right font-mono text-stone-600">{p.cur_x.toFixed(1)}, {p.cur_y.toFixed(1)}</td>
                  <td className={cn('px-3 py-2 text-right font-mono', p.delta_x === 0 ? 'text-stone-400' : cls(Math.abs(p.delta_x) <= 1 ? 'ok' : Math.abs(p.delta_x) <= 2 ? 'warn' : 'bad'))}>
                    {p.delta_x > 0 ? '+' : ''}{p.delta_x.toFixed(2)}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono', p.delta_y === 0 ? 'text-stone-400' : cls(Math.abs(p.delta_y) <= 1 ? 'ok' : Math.abs(p.delta_y) <= 2 ? 'warn' : 'bad'))}>
                    {p.delta_y > 0 ? '+' : ''}{p.delta_y.toFixed(2)}
                  </td>
                  <td className={cn('px-3 py-2 text-right font-mono font-semibold', cls(t))}>
                    {p.distance.toFixed(3)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={cn(
                      'chip',
                      t === 'ok' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : t === 'warn' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                    )}>
                      {t === 'ok' ? '达标' : t === 'warn' ? '预警' : '超限'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => doDelete(p.id)}
                      disabled={pending === `del-${p.id}`}
                      className="text-rose-600 hover:text-rose-800 text-xs disabled:opacity-40"
                    >删除</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
