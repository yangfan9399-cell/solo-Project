import React, { useRef, useEffect } from 'react';

interface SpectrumDataPoint {
  frequency: number;
  amplitude: number;
}

interface SpectrumChartProps {
  current: SpectrumDataPoint[];
  target: SpectrumDataPoint[];
  width?: number;
  height?: number;
}

const SpectrumChart = React.memo(function SpectrumChart({
  current,
  target,
  width = 500,
  height = 200,
}: SpectrumChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 35, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    const allData = [...current, ...target];
    const minFreq = Math.min(...allData.map(d => d.frequency));
    const maxFreq = Math.max(...allData.map(d => d.frequency));

    const toX = (freq: number) =>
      padding.left + ((freq - minFreq) / (maxFreq - minFreq || 1)) * chartWidth;
    const toY = (amp: number) =>
      padding.top + (1 - amp) * chartHeight;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartWidth, y);
      ctx.stroke();
    }

    const freqRange = maxFreq - minFreq || 1;
    const gridCount = 6;
    for (let i = 0; i <= gridCount; i++) {
      const x = padding.left + (i / gridCount) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + chartHeight);
      ctx.stroke();
    }

    const drawArea = (data: SpectrumDataPoint[], fillStyle: string, strokeStyle: string) => {
      if (data.length === 0) return;
      const sorted = [...data].sort((a, b) => a.frequency - b.frequency);

      ctx.beginPath();
      ctx.moveTo(toX(sorted[0].frequency), toY(0));
      for (const point of sorted) {
        ctx.lineTo(toX(point.frequency), toY(point.amplitude));
      }
      ctx.lineTo(toX(sorted[sorted.length - 1].frequency), toY(0));
      ctx.closePath();
      ctx.fillStyle = fillStyle;
      ctx.fill();

      ctx.beginPath();
      for (let i = 0; i < sorted.length; i++) {
        const x = toX(sorted[i].frequency);
        const y = toY(sorted[i].amplitude);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawArea(target, 'rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.8)');
    drawArea(current, 'rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.8)');

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding.left, padding.top, chartWidth, chartHeight);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= gridCount; i++) {
      const freq = minFreq + (i / gridCount) * freqRange;
      const x = padding.left + (i / gridCount) * chartWidth;
      ctx.fillText(Math.round(freq).toString(), x, height - 8);
    }
    ctx.fillText('频率 (Hz)', padding.left + chartWidth / 2, height - 0);

    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const amp = 1 - i / 5;
      const y = padding.top + (i / 5) * chartHeight;
      ctx.fillText(amp.toFixed(1), padding.left - 6, y + 4);
    }

    ctx.save();
    ctx.translate(12, padding.top + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('振幅', 0, 0);
    ctx.restore();
  }, [current, target, width, height]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
});

export default SpectrumChart;
