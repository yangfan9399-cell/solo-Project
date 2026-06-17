'use client';

import { useState, useTransition } from 'react';
import type { ColorLayer } from '@/lib/types';
import { saveLayerOffset } from '@/app/actions';
import { cn } from '@/lib/utils';

interface Props {
  layers: ColorLayer[];
}

export default function LayerTuningPanel({ layers: initial }: Props) {
  const [layers, setLayers] = useState<ColorLayer[]>(initial);
  const [selected, setSelected] = useState<number>(initial[0]?.id ?? -1);
  const [isPending, startTransition] = useTransition();

  const current = layers.find(l => l.id === selected) || layers[0];
  if (!current) return <div className="p-6 text-stone-400 text-sm">暂无可调图层</div>;

  const update = (patch: Partial<ColorLayer>) => {
    setLayers(prev => prev.map(l => l.id === current.id ? { ...l, ...patch } : l));
  };

  const persist = () => {
    const fd = new FormData();
    fd.append('layer_id', String(current.id));
    fd.append('offset_x', String(current.offset_x));
    fd.append('offset_y', String(current.offset_y));
    fd.append('rotation', String(current.rotation));
    fd.append('opacity', String(current.opacity));
    fd.append('is_aligned', current.is_aligned ? '1' : '0');
    startTransition(async () => {
      await saveLayerOffset(fd);
    });
  };

  const Slider = ({ label, unit, value, min, max, step, onChange }: {
    label: string; unit: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
  }) => (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-stone-600">{label}</span>
        <span className="font-mono text-ink">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-gold"
        />
        <input
          type="number" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 input-field !py-1 !text-xs"
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5">
        {layers.map(l => (
          <button
            key={l.id}
            type="button"
            onClick={() => setSelected(l.id)}
            className={cn(
              'text-left px-2.5 py-2 rounded-md border text-xs transition flex items-center gap-2',
              selected === l.id
                ? 'bg-ink text-paper border-ink shadow'
                : 'bg-white/60 border-stone-200 hover:bg-white'
            )}
          >
            <span className="w-4 h-4 rounded border border-white/40 shrink-0" style={{ background: l.color_code }}></span>
            <span className="truncate">{l.layer_name}</span>
            {l.is_aligned && <span className="ml-auto text-[10px] opacity-80">✓</span>}
          </button>
        ))}
      </div>
      <div className="stat-card gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm border border-stone-300" style={{ background: current.color_code }}></span>
            <span className="font-medium text-sm">{current.layer_name}</span>
            <span className="text-xs text-stone-500">({current.color_name})</span>
          </div>
          <label className="flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={current.is_aligned}
              onChange={(e) => update({ is_aligned: e.target.checked })}
              className="accent-emerald-600"
            />
            <span className={current.is_aligned ? 'text-emerald-700' : 'text-stone-500'}>标记对齐</span>
          </label>
        </div>
        <Slider label="X 轴偏移" unit="px" value={current.offset_x} min={-30} max={30} step={0.01}
          onChange={(v) => update({ offset_x: Math.round(v * 100) / 100 })} />
        <Slider label="Y 轴偏移" unit="px" value={current.offset_y} min={-30} max={30} step={0.01}
          onChange={(v) => update({ offset_y: Math.round(v * 100) / 100 })} />
        <Slider label="旋转" unit="°" value={current.rotation} min={-5} max={5} step={0.01}
          onChange={(v) => update({ rotation: Math.round(v * 100) / 100 })} />
        <Slider label="图层透明度" unit="%" value={current.opacity * 100} min={0} max={100} step={1}
          onChange={(v) => update({ opacity: Math.round(v) / 100 })} />
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-primary text-xs" onClick={persist} disabled={isPending}>
            {isPending ? '保存中…' : '保存图层设置'}
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={() => update({ offset_x: 0, offset_y: 0, rotation: 0 })}>
            重置位移
          </button>
        </div>
      </div>
    </div>
  );
}
