import { component$, useSignal, useTask$, useVisibleTask$, QRL, $ } from '@builder.io/qwik';

interface WaveformDisplayProps {
  waveformData: number[];
  segmentationPoints: number[];
  pitchData: number[];
  width?: number;
  height?: number;
  showPitch?: boolean;
  interactive?: boolean;
  onSegmentClick$?: QRL<(position: number) => void>;
}

function drawWaveform(
  canvas: HTMLCanvasElement,
  waveformData: number[],
  segmentationPoints: number[],
  pitchData: number[],
  width: number,
  height: number,
  showPitch: boolean
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#1a1d27';
  ctx.fillRect(0, 0, width, height);

  const centerY = height / 2;

  ctx.strokeStyle = '#2e3348';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(width, centerY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (waveformData.length === 0) return;

  const stepX = width / (waveformData.length - 1 || 1);

  const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
  fillGradient.addColorStop(0, 'rgba(74,108,247,0.3)');
  fillGradient.addColorStop(1, 'rgba(74,108,247,0.05)');

  ctx.beginPath();
  ctx.moveTo(0, centerY);
  for (let i = 0; i < waveformData.length; i++) {
    const x = i * stepX;
    const y = centerY - waveformData[i] * (height / 2) * 0.9;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, centerY);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < waveformData.length; i++) {
    const x = i * stepX;
    const y = centerY - waveformData[i] * (height / 2) * 0.9;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.strokeStyle = '#4a6cf7';
  ctx.lineWidth = 2;
  ctx.stroke();

  const sortedPoints = [...segmentationPoints].sort((a, b) => a - b);
  const boundaries = [0, ...sortedPoints, 1];

  for (const pt of sortedPoints) {
    const x = pt * width;

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(x - 5, 0);
    ctx.lineTo(x + 5, 0);
    ctx.lineTo(x, 8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, height / 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(251,191,36,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#1a1d27';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(251,191,36,0.8)';

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i] * width;
    const segEnd = boundaries[i + 1] * width;
    const segCenter = (segStart + segEnd) / 2;
    ctx.fillText(`段${i + 1}`, segCenter, 14);
  }

  if (showPitch && pitchData.length > 0) {
    const pitchStepX = width / (pitchData.length - 1 || 1);
    const pitchMin = Math.min(...pitchData);
    const pitchMax = Math.max(...pitchData);
    const pitchRange = pitchMax - pitchMin || 1;

    ctx.beginPath();
    for (let i = 0; i < pitchData.length; i++) {
      const x = i * pitchStepX;
      const normalized = (pitchData[i] - pitchMin) / pitchRange;
      const y = height * 0.1 + (1 - normalized) * height * 0.3;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    for (let i = 0; i < pitchData.length; i++) {
      const x = i * pitchStepX;
      const normalized = (pitchData[i] - pitchMin) / pitchRange;
      const y = height * 0.1 + (1 - normalized) * height * 0.3;
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export const WaveformDisplay = component$<WaveformDisplayProps>(
  ({ waveformData, segmentationPoints, pitchData, width = 600, height = 200, showPitch = true, interactive = false, onSegmentClick$ }) => {
    const canvasRef = useSignal<Element>();
    const segSignal = useSignal(segmentationPoints);
    const pitchSignal = useSignal(pitchData);
    const waveSignal = useSignal(waveformData);

    useTask$(({ track }) => {
      track(() => segmentationPoints);
      segSignal.value = [...segmentationPoints];
    });

    useTask$(({ track }) => {
      track(() => pitchData);
      pitchSignal.value = [...pitchData];
    });

    useTask$(({ track }) => {
      track(() => waveformData);
      waveSignal.value = [...waveformData];
    });

    useVisibleTask$(({ track }) => {
      track(() => segSignal.value);
      track(() => pitchSignal.value);
      track(() => waveSignal.value);
      const canvas = canvasRef.value as HTMLCanvasElement | undefined;
      if (!canvas) return;
      drawWaveform(canvas, waveSignal.value, segSignal.value, pitchSignal.value, width, height, showPitch);
    });

    const handleClick = $((e: MouseEvent) => {
      if (!interactive || !onSegmentClick$) return;
      const canvas = canvasRef.value as HTMLCanvasElement | undefined;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = width / rect.width;
      const x = (e.clientX - rect.left) * scaleX;
      const position = Math.round((x / width) * 100) / 100;
      if (position >= 0 && position <= 1) {
        onSegmentClick$(position);
      }
    });

    return (
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: interactive ? 'crosshair' : 'default' }}
        onClick$={handleClick}
      />
    );
  }
);
