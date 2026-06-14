'use client';

interface Props {
  waveform: number[];
  width?: number;
  height?: number;
  showBreakpoints?: { position: number; correctSplice: number }[];
  showSplices?: { position: number; isCorrect: boolean }[];
  onClickPosition?: (position: number) => void;
  highlightRegions?: { start: number; end: number; color: string }[];
  label?: string;
}

export default function WaveformView({
  waveform,
  width = 800,
  height = 200,
  showBreakpoints = [],
  showSplices = [],
  onClickPosition,
  highlightRegions = [],
  label,
}: Props) {
  const padding = { top: 20, bottom: 30, left: 40, right: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const barWidth = Math.max(1, chartWidth / waveform.length - 1);

  const xToIndex = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left - padding.left;
    const ratio = x / chartWidth;
    return Math.max(0, Math.min(waveform.length - 1, Math.floor(ratio * waveform.length)));
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onClickPosition) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const idx = xToIndex(e.clientX, rect);
    onClickPosition(idx);
  };

  return (
    <div className="relative">
      {label && (
        <div className="text-tape-muted text-xs mb-1 font-mono">{label}</div>
      )}
      <svg
        width={width}
        height={height}
        className="bg-tape-panel border border-tape-border rounded cursor-crosshair waveform-glow"
        onClick={handleClick}
      >
        {highlightRegions.map((region, i) => (
          <rect
            key={`hl-${i}`}
            x={padding.left + (region.start / waveform.length) * chartWidth}
            y={padding.top}
            width={((region.end - region.start) / waveform.length) * chartWidth}
            height={chartHeight}
            fill={region.color}
            opacity={0.2}
          />
        ))}

        <line
          x1={padding.left}
          y1={padding.top + chartHeight / 2}
          x2={padding.left + chartWidth}
          y2={padding.top + chartHeight / 2}
          stroke="#4a3f35"
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />

        {waveform.map((value, i) => {
          const x = padding.left + (i / waveform.length) * chartWidth;
          const barHeight = Math.abs(value) * (chartHeight / 2);
          const y = padding.top + chartHeight / 2 - barHeight;
          const color = value >= 0 ? '#d4a84b' : '#8b7355';
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(1, barHeight * 2)}
              fill={color}
              opacity={0.75}
            />
          );
        })}

        {showBreakpoints.map((bp, i) => {
          const x = padding.left + (bp.position / waveform.length) * chartWidth;
          return (
            <g key={`bp-${i}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke="#c0392b"
                strokeWidth={2}
                strokeDasharray="4,2"
              />
              <text
                x={x + 4}
                y={padding.top + 12}
                fill="#c0392b"
                fontSize="10"
                fontFamily="monospace"
              >
                断点#{i + 1} @{bp.position}
              </text>
            </g>
          );
        })}

        {showSplices.map((s, i) => {
          const x = padding.left + (s.position / waveform.length) * chartWidth;
          const color = s.isCorrect ? '#27ae60' : '#e67e22';
          return (
            <g key={`sp-${i}`}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={x + 4}
                y={padding.top + chartHeight - 4}
                fill={color}
                fontSize="10"
                fontFamily="monospace"
              >
                {s.isCorrect ? '✓拼接' : '✗错位拼接'}@{s.position}
              </text>
            </g>
          );
        })}

        {Array.from({ length: 5 }).map((_, i) => {
          const tick = i * (waveform.length / 4);
          const x = padding.left + (tick / waveform.length) * chartWidth;
          return (
            <g key={`t-${i}`}>
              <line
                x1={x}
                y1={padding.top + chartHeight}
                x2={x}
                y2={padding.top + chartHeight + 4}
                stroke="#4a3f35"
                strokeWidth={1}
              />
              <text
                x={x}
                y={padding.top + chartHeight + 16}
                fill="#8b7355"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {Math.floor(tick)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
