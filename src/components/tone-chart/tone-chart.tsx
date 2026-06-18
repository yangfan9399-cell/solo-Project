import { component$, useSignal, useVisibleTask$, useTask$ } from '@builder.io/qwik';

interface ToneCategory {
  category: string;
  value: string;
  color: string;
}

interface ToneChartProps {
  toneCategories: ToneCategory[];
  width?: number;
  height?: number;
}

const DEFAULT_COLORS = ['#4a6cf7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf'];

function drawChart(
  canvas: HTMLCanvasElement,
  toneCategories: ToneCategory[],
  width: number,
  height: number
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  const padding = { top: 40, right: 60, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#2e3348';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + chartH - (i / 5) * chartH;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }

  for (let i = 0; i <= 10; i++) {
    const x = padding.left + (i / 10) * chartW;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + chartH);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  ctx.fillStyle = '#8b8fa3';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + chartH - (i / 5) * chartH;
    ctx.fillText(`${i}`, padding.left - 10, y);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let i = 0; i <= 10; i++) {
    const x = padding.left + (i / 10) * chartW;
    ctx.fillText(`${(i / 10).toFixed(1)}`, x, padding.top + chartH + 8);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('时长', padding.left + chartW + 8, padding.top + chartH);

  ctx.strokeStyle = '#3d4260';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + chartH);
  ctx.lineTo(padding.left + chartW, padding.top + chartH);
  ctx.stroke();

  toneCategories.forEach((tone, idx) => {
    const color = tone.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    const digits = tone.value.split('').map(Number).filter((n) => !isNaN(n));
    if (digits.length === 0) return;

    const points = digits.map((d, i) => ({
      x: padding.left + (i / (digits.length - 1 || 1)) * chartW,
      y: padding.top + chartH - (d / 5) * chartH,
    }));

    if (points.length === 1) {
      points.unshift({ x: padding.left, y: points[0].y });
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else if (points.length >= 3) {
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[Math.max(i - 1, 0)];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[Math.min(i + 2, points.length - 1)];

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    }

    ctx.stroke();

    points.forEach((p) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const lastPoint = points[points.length - 1];
    ctx.fillStyle = color;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${tone.category}:${tone.value}`, lastPoint.x + 8, lastPoint.y);
  });

  const legendX = width - padding.right - 10;
  let legendY = padding.top + 8;

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '11px sans-serif';

  toneCategories.forEach((tone, idx) => {
    const color = tone.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
    ctx.fillStyle = color;
    ctx.fillRect(legendX - 80, legendY - 5, 12, 12);
    ctx.fillText(`${tone.category} ${tone.value}`, legendX, legendY + 1);
    legendY += 20;
  });
}

export const ToneChart = component$<ToneChartProps>(({ toneCategories, width = 400, height = 300 }) => {
  const canvasRef = useSignal<Element>();
  const toneSignal = useSignal(toneCategories);

  useTask$(({ track }) => {
    track(() => toneCategories);
    toneSignal.value = [...toneCategories];
  });

  useVisibleTask$(({ track }) => {
    track(() => toneSignal.value);
    const canvas = canvasRef.value as HTMLCanvasElement | undefined;
    if (!canvas) return;
    drawChart(canvas, toneSignal.value, width, height);
  });

  return <canvas ref={canvasRef} style={{ display: 'block' }} />;
});
