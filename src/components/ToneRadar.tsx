import React, { useRef, useEffect } from 'react';
import type { ToneProfile } from '@/types/game';

interface ToneRadarProps {
  current: ToneProfile | null;
  target: ToneProfile | null;
  size?: number;
}

const AXES = [
  { key: 'brightness' as const, label: '明亮度' },
  { key: 'warmth' as const, label: '温暖度' },
  { key: 'resonance' as const, label: '共鸣' },
  { key: 'sustain' as const, label: '延音' },
  { key: 'projection' as const, label: '穿透力' },
  { key: 'clarity' as const, label: '清晰度' },
];

const GRID_LEVELS = [0.33, 0.66, 1.0];

function getAxisPoint(
  centerX: number,
  centerY: number,
  maxRadius: number,
  index: number,
  value: number
) {
  const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2;
  const r = maxRadius * (value / 100);
  return {
    x: centerX + r * Math.cos(angle),
    y: centerY + r * Math.sin(angle),
  };
}

function drawHexGrid(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number
) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;

  for (const level of GRID_LEVELS) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const pt = getAxisPoint(centerX, centerY, maxRadius, i, level * 100);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  for (let i = 0; i < 6; i++) {
    const pt = getAxisPoint(centerX, centerY, maxRadius, i, 100);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  profile: ToneProfile,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
  dashed: boolean
) {
  if (dashed) ctx.setLineDash([6, 4]);
  else ctx.setLineDash([]);

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const value = profile[AXES[i].key];
    const pt = getAxisPoint(centerX, centerY, maxRadius, i, value);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.closePath();

  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.setLineDash([]);
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  maxRadius: number,
  current: ToneProfile | null,
  target: ToneProfile | null
) {
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const labelRadius = maxRadius + 28;
    const lx = centerX + labelRadius * Math.cos(angle);
    const ly = centerY + labelRadius * Math.sin(angle);

    ctx.fillStyle = '#ccc';
    ctx.fillText(AXES[i].label, lx, ly - 7);

    const parts: string[] = [];
    if (target) parts.push(`T:${target[AXES[i].key]}`);
    if (current) parts.push(`C:${current[AXES[i].key]}`);
    if (parts.length > 0) {
      ctx.fillStyle = '#999';
      ctx.font = '10px sans-serif';
      ctx.fillText(parts.join(' '), lx, ly + 8);
      ctx.font = '12px sans-serif';
    }
  }
}

const ToneRadar = React.memo(function ToneRadar({
  current,
  target,
  size = 280,
}: ToneRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = (size / 2) - 40;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    drawHexGrid(ctx, centerX, centerY, maxRadius);

    if (target) {
      drawPolygon(
        ctx,
        centerX,
        centerY,
        maxRadius,
        target,
        'rgba(59, 130, 246, 0.15)',
        'rgba(59, 130, 246, 0.7)',
        1.5,
        true
      );
    }

    if (current) {
      drawPolygon(
        ctx,
        centerX,
        centerY,
        maxRadius,
        current,
        'rgba(245, 158, 11, 0.25)',
        'rgba(245, 158, 11, 0.9)',
        2,
        false
      );
    }

    drawLabels(ctx, centerX, centerY, maxRadius, current, target);
  }, [current, target, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
    />
  );
});

export default ToneRadar;
