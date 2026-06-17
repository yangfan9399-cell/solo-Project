'use client';

import { useState } from 'react';
import type { ColorLayer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  layers: ColorLayer[];
  onRequestAddPoint?: (layerId: number, refX: number, refY: number) => void;
}

export default function LayerStack({ layers, onRequestAddPoint }: Props) {
  const [hoverLayer, setHoverLayer] = useState<number | null>(null);

  if (!layers.length) {
    return (
      <div className="aspect-[3/4] w-full bg-paper border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center text-stone-400">
        暂无图层数据
      </div>
    );
  }

  const maxW = Math.max(...layers.map(l => l.image_width));
  const maxH = Math.max(...layers.map(l => l.image_height));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto w-full max-w-[480px]">
        <div
          className="relative aspect-[3/4] bg-gradient-to-br from-[#fdfaf3] to-[#f0e8d5] border border-stone-300 rounded-lg overflow-hidden shadow-inner wood-pattern"
          onClick={(e) => {
            if (!onRequestAddPoint || layers.length === 0) return;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const rx = ((e.clientX - rect.left) / rect.width) * maxW;
            const ry = ((e.clientY - rect.top) / rect.height) * maxH;
            const activeL = layers.find(l => l.id === hoverLayer) || layers[layers.length - 1];
            onRequestAddPoint(activeL.id, rx, ry);
          }}
          style={{ cursor: onRequestAddPoint ? 'crosshair' : 'default' }}
        >
          {layers.map((l, i) => {
            const pctW = (l.image_width / maxW) * 100;
            const pctH = (l.image_height / maxH) * 100;
            const offXpx = (l.offset_x / maxW) * 100;
            const offYpx = (l.offset_y / maxH) * 100;
            const isHover = hoverLayer === l.id;
            return (
              <div
                key={l.id}
                onMouseEnter={() => setHoverLayer(l.id)}
                onMouseLeave={() => setHoverLayer(prev => prev === l.id ? null : prev)}
                className={cn(
                  'absolute inset-0 rounded-md transition',
                  isHover ? 'z-20' : `z-${10 + i}`
                )}
                style={{
                  width: `${pctW}%`,
                  height: `${pctH}%`,
                  left: `calc(${50 - pctW / 2}% + ${offXpx}%)`,
                  top: `calc(${50 - pctH / 2}% + ${offYpx}%)`,
                  opacity: isHover ? 1 : l.opacity,
                  transform: `rotate(${l.rotation}deg)`,
                  mixBlendMode: i === 0 ? 'normal' : 'multiply',
                }}
              >
                <svg viewBox={`0 0 ${l.image_width} ${l.image_height}`} className="w-full h-full">
                  <defs>
                    <pattern id={`p-${l.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 20 L40 20 M20 0 L20 40" stroke={l.color_code} strokeWidth="0.3" opacity="0.15" />
                    </pattern>
                  </defs>
                  <rect x="0" y="0" width={l.image_width} height={l.image_height} fill={`url(#p-${l.id})`} />
                  <rect x="20" y="30" width={l.image_width - 40} height={l.image_height - 60} fill={l.color_code} opacity="0.12" rx="12" />
                  <rect x="40" y="60" width={l.image_width - 80} height="3" fill={l.color_code} opacity="0.7" />
                  <rect x="40" y={l.image_height - 70} width={l.image_width - 80} height="3" fill={l.color_code} opacity="0.7" />
                  <rect x="40" y="60" width="3" height={l.image_height - 130} fill={l.color_code} opacity="0.7" />
                  <rect x={l.image_width - 43} y="60" width="3" height={l.image_height - 130} fill={l.color_code} opacity="0.7" />
                  <circle cx={l.image_width / 2} cy={l.image_height / 2} r={Math.min(l.image_width, l.image_height) * 0.22} fill="none" stroke={l.color_code} strokeWidth="3" opacity="0.35" />
                  <text x={l.image_width / 2} y={l.image_height / 2 + 8} textAnchor="middle" fill={l.color_code} fontSize="32" fontWeight="bold" opacity="0.6" fontFamily="serif">
                    {l.color_name}
                  </text>
                  <text x={l.image_width / 2} y="110" textAnchor="middle" fill={l.color_code} fontSize="22" opacity="0.8" fontFamily="serif">
                    {l.layer_name}
                  </text>
                </svg>
              </div>
            );
          })}
          <div className="absolute bottom-2 right-2 text-[10px] text-stone-500 bg-white/70 px-2 py-0.5 rounded backdrop-blur">
            画布 {maxW}×{maxH}px · 悬停图层可高亮
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {layers.map(l => (
          <button
            key={l.id}
            type="button"
            onMouseEnter={() => setHoverLayer(l.id)}
            onMouseLeave={() => setHoverLayer(prev => prev === l.id ? null : prev)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition',
              hoverLayer === l.id
                ? 'bg-white border-ink/40 shadow-sm'
                : 'bg-white/50 border-stone-200 hover:bg-white'
            )}
          >
            <span
              className="w-3 h-3 rounded-full border border-stone-300"
              style={{ background: l.color_code }}
            ></span>
            <span className="text-ink/80">{l.layer_name}</span>
            {l.is_aligned && <span className="text-emerald-600 text-[10px]">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
