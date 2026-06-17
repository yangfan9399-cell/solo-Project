import type { DeviationPoint } from '../types';

interface Props {
  points: DeviationPoint[];
  width?: number;
  height?: number;
  title?: string;
}

export default function DeviationCurveChart({ points, width = 720, height = 360, title }: Props) {
  const padding = { top: 40, right: 30, bottom: 50, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const cx = padding.left + chartW / 2;
  const cy = padding.top + chartH / 2;
  const radius = Math.min(chartW, chartH) / 2 - 20;

  const maxDev = Math.max(15, ...points.map(p => p.deviation), ...points.map(p => -p.deviation * (p.deviation_direction === 'W' ? 1 : 0) < 0 ? 0 : p.deviation));
  const radialScale = radius / Math.max(10, maxDev + 2);

  const getPoint = (heading: number, deviation: number, direction: 'E' | 'W') => {
    const rad = ((heading - 90) * Math.PI) / 180;
    const sign = direction === 'E' ? 1 : -1;
    const r = radius - deviation * radialScale * sign;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const buildPath = () => {
    if (points.length === 0) return '';
    const sorted = [...points].sort((a, b) => a.ship_heading - b.ship_heading);
    const start = getPoint(sorted[0].ship_heading, sorted[0].deviation, sorted[0].deviation_direction);
    let d = `M ${start.x} ${start.y}`;
    for (let i = 1; i < sorted.length; i++) {
      const p = sorted[i];
      const pt = getPoint(p.ship_heading, p.deviation, p.deviation_direction);
      d += ` L ${pt.x} ${pt.y}`;
    }
    const closePt = getPoint(sorted[0].ship_heading + 360, sorted[0].deviation, sorted[0].deviation_direction);
    if (sorted.length >= 24) d += ` L ${closePt.x} ${closePt.y}`;
    return d;
  };

  const rings = [0, 0.25, 0.5, 0.75, 1];
  const ringLabels = [0, Math.round(maxDev * 0.25), Math.round(maxDev * 0.5), Math.round(maxDev * 0.75), Math.round(maxDev)];
  const headings = [0, 45, 90, 135, 180, 225, 270, 315];
  const headingNames = ['N (北)', 'NE (东北)', 'E (东)', 'SE (东南)', 'S (南)', 'SW (西南)', 'W (西)', 'NW (西北)'];

  return (
    <div className="curve-wrap">
      {title && (
        <div style={{ color: '#e0bb66', fontSize: '14px', fontWeight: 700, marginBottom: '12px', letterSpacing: '1px' }}>
          {title}
        </div>
      )}
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width + 'px', margin: '0 auto' }}>
        <defs>
          <radialGradient id="eastGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0c1a2f" />
          </radialGradient>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0bb66" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>

        {rings.map((r, i) => (
          <circle key={i} cx={cx} cy={cy} r={radius * (1 - r)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        {rings.map((r, i) => (
          <text key={`rl-${i}`} x={cx + 3} y={cy - radius * (1 - r) - 3} fill="rgba(255,255,255,0.35)" fontSize="10">
            {r === 0 ? `±${ringLabels[i]}°` : ringLabels[i] > 0 ? `${ringLabels[i]}` : ''}
          </text>
        ))}

        {headings.map((h, i) => {
          const rad = ((h - 90) * Math.PI) / 180;
          const x1 = cx + radius * 0.15 * Math.cos(rad);
          const y1 = cy + radius * 0.15 * Math.sin(rad);
          const x2 = cx + (radius + 4) * Math.cos(rad);
          const y2 = cy + (radius + 4) * Math.sin(rad);
          const lx = cx + (radius + 22) * Math.cos(rad);
          const ly = cy + (radius + 22) * Math.sin(rad);
          return (
            <g key={h}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray={h % 90 === 0 ? '' : '3,3'} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill={h % 90 === 0 ? '#e0bb66' : 'rgba(255,255,255,0.55)'}
                fontSize={h % 90 === 0 ? '12' : '11'} fontWeight={h % 90 === 0 ? 700 : 500}>
                {headingNames[i]}
              </text>
              <text x={lx} y={ly + 13} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">
                {h}°
              </text>
            </g>
          );
        })}

        <circle cx={cx} cy={cy} r={2} fill="#e0bb66" />
        <text x={cx} y={cy - 8} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10">基准圆</text>

        {points.length > 0 && (
          <path d={buildPath()} fill="none" stroke="url(#curveGrad)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        )}

        {points.map((p, i) => {
          const pt = getPoint(p.ship_heading, p.deviation, p.deviation_direction);
          const isMeasured = p.measured;
          return (
            <g key={i}>
              <circle cx={pt.x} cy={pt.y} r={isMeasured ? 4 : 2.5}
                fill={isMeasured ? '#f97316' : '#e0bb66'}
                stroke={isMeasured ? '#fed7aa' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isMeasured ? 1.5 : 1} />
              {isMeasured && p.deviation > 5 && (
                <text x={pt.x + 7} y={pt.y + 2} fill={p.deviation_direction === 'E' ? '#93c5fd' : '#fca5a5'} fontSize="9.5" fontWeight={600}>
                  {p.deviation.toFixed(1)}{p.deviation_direction}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '12px', color: 'rgba(255,255,255,0.55)', fontSize: '11.5px' }}>
        <div className="flex-gap">
          <span style={{ width: '20px', height: '2px', background: 'linear-gradient(90deg, #e0bb66, #f97316)', display: 'inline-block', verticalAlign: 'middle' }} />
          自差闭合曲线
        </div>
        <div className="flex-gap"><span className="severity-dot" style={{ background: '#f97316', marginRight: 4 }} />实测点</div>
        <div className="flex-gap"><span className="severity-dot" style={{ background: '#e0bb66', width: 5, height: 5, marginRight: 4 }} />插值点</div>
        <div className="flex-gap" style={{ color: '#93c5fd' }}>东偏差 E (向外)</div>
        <div className="flex-gap" style={{ color: '#fca5a5' }}>西偏差 W (向内)</div>
      </div>
    </div>
  );
}
