import { useState, useMemo } from 'react';

interface Props {
  errors: number[];
  currentDay: number;
  target: number;
  tolerance: number;
  onPointClick?: (day: number) => void;
}

interface Point {
  day: number;
  x: number;
  y: number;
  value: number;
}

export default function ErrorCurveChart({ errors, currentDay, target, tolerance, onPointClick }: Props) {
  const [hover, setHover] = useState<Point | null>(null);
  const width = 600;
  const height = 180;
  const padding = { top: 20, right: 15, bottom: 25, left: 40 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxY = useMemo(() => {
    const allVals = [...errors, target, tolerance * 2];
    return Math.max(10, Math.ceil(Math.max(...allVals) * 1.15));
  }, [errors, target, tolerance]);

  const points: Point[] = useMemo(() => {
    const totalDays = 7;
    return errors.map((val, idx) => {
      const day = idx + 1;
      const x = padding.left + (day - 1) * (innerW / Math.max(totalDays - 1, 1));
      const y = padding.top + innerH - (val / maxY) * innerH;
      return { day, x, y, value: val };
    });
  }, [errors, maxY, innerW, innerH, padding]);

  const targetY = padding.top + innerH - (target / maxY) * innerH;
  const tolY = padding.top + innerH - (tolerance / maxY) * innerH;

  const yTicks = [0, Math.round(maxY / 2), maxY];
  const totalDays = 7;

  return (
    <div className="error-curve-container" style={{ position: 'relative' }}>
      <svg className="curve-svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        <rect
          x={padding.left}
          y={targetY}
          width={innerW}
          height={tolY - targetY}
          className="curve-tolerance-band"
        />
        {yTicks.map((t, i) => {
          const y = padding.top + innerH - (t / maxY) * innerH;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(138,122,92,0.2)"
                strokeDasharray="2 3"
              />
              <text x={padding.left - 6} y={y + 3} className="curve-axis-label" textAnchor="end">{t}s</text>
            </g>
          );
        })}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => {
          const x = padding.left + (d - 1) * (innerW / Math.max(totalDays - 1, 1));
          return (
            <text key={d} x={x} y={height - 6} className="curve-axis-label" textAnchor="middle">
              Day {d}
            </text>
          );
        })}

        <line
          x1={padding.left}
          y1={targetY}
          x2={width - padding.right}
          y2={targetY}
          className="curve-line-target"
        />
        <line
          x1={padding.left}
          y1={tolY}
          x2={width - padding.right}
          y2={tolY}
          className="curve-line-tolerance"
        />

        {points.length > 1 && (
          <polyline
            points={points.map(p => `${p.x},${p.y}`).join(' ')}
            className="curve-line-actual"
          />
        )}

        {points.map(p => (
          <g key={p.day}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.day === currentDay ? 7 : 5}
              className="curve-point"
              style={{ cursor: onPointClick ? 'pointer' : 'default', fill: p.value <= target ? '#5a9e5a' : p.value <= tolerance ? '#d47a2a' : '#c84b4b' }}
              onClick={() => onPointClick?.(p.day)}
              onMouseEnter={() => setHover(p)}
              onMouseLeave={() => setHover(null)}
            />
            {p.day === currentDay && (
              <circle cx={p.x} cy={p.y} r={11} fill="none" stroke="#d4a84b" strokeWidth="1.5" strokeDasharray="3 2" />
            )}
          </g>
        ))}

        <g transform={`translate(${width - padding.right - 90}, ${padding.top - 2})`}>
          <circle cx={4} cy={6} r={3} fill="#5a9e5a" />
          <text x={12} y={9} className="curve-axis-label">目标线</text>
          <circle cx={50} cy={6} r={3} fill="#d47a2a" />
          <text x={58} y={9} className="curve-axis-label">容差线</text>
        </g>
      </svg>
      {hover && (
        <div
          className="curve-tooltip"
          style={{
            left: `${Math.min(85, (hover.x / width) * 100)}%`,
            top: `${(hover.y / height) * 100 - 8}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          Day {hover.day} 误差: <strong style={{ color: hover.value <= target ? '#5a9e5a' : hover.value <= tolerance ? '#d47a2a' : '#c84b4b' }}>{hover.value.toFixed(2)}s</strong>
        </div>
      )}
    </div>
  );
}
