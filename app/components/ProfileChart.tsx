interface ProfileChartProps {
  profileData: any;
  width?: number;
  height?: number;
}

export default function ProfileChart({ profileData, width = 260, height = 120 }: ProfileChartProps) {
  if (!profileData || !profileData.elevationPoints || profileData.elevationPoints.length === 0) {
    return (
      <div 
        style={{ 
          width, 
          height, 
          background: '#0f172a',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '12px',
          border: '1px solid #334155',
        }}
      >
        暂无剖面数据
      </div>
    );
  }
  
  const points = profileData.elevationPoints;
  const padding = { top: 15, right: 10, bottom: 25, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxElev = profileData.maxElevation || Math.max(...points.map((p: any) => p.elevation));
  const minElev = profileData.minElevation || Math.min(...points.map((p: any) => p.elevation));
  const maxDist = profileData.totalDistance || Math.max(...points.map((p: any) => p.distance));
  
  const elevRange = maxElev - minElev || 100;
  const distRange = maxDist || 100;
  
  const toX = (dist: number) => padding.left + (dist / distRange) * chartWidth;
  const toY = (elev: number) => padding.top + chartHeight - ((elev - minElev) / elevRange) * chartHeight;
  
  let pathD = '';
  let areaD = '';
  
  points.forEach((p: any, i: number) => {
    const x = toX(p.distance);
    const y = toY(p.elevation);
    if (i === 0) {
      pathD += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      areaD += `M ${x.toFixed(1)} ${padding.top + chartHeight} L ${x.toFixed(1)} ${y.toFixed(1)}`;
    } else {
      pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      areaD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
  });
  
  areaD += ` L ${toX(maxDist).toFixed(1)} ${padding.top + chartHeight} Z`;
  
  const statusColor = profileData.status === 'success' ? '#10b981' : profileData.status === 'error' ? '#dc2626' : '#f59e0b';
  
  return (
    <div style={{ background: '#0f172a', borderRadius: '6px', padding: '10px', border: '1px solid #334155' }}>
      <svg width={width} height={height}>
        <defs>
          <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={statusColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={statusColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartHeight * ratio}
            x2={padding.left + chartWidth}
            y2={padding.top + chartHeight * ratio}
            stroke="#334155"
            strokeWidth="0.5"
            strokeDasharray="3,3"
          />
        ))}
        
        <path d={areaD} fill="url(#areaGrad)" />
        
        <path
          d={pathD}
          fill="none"
          stroke={statusColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        
        <text
          x={padding.left - 5}
          y={padding.top}
          textAnchor="end"
          fill="#64748b"
          fontSize="9"
          alignmentBaseline="middle"
        >
          {maxElev}m
        </text>
        <text
          x={padding.left - 5}
          y={padding.top + chartHeight}
          textAnchor="end"
          fill="#64748b"
          fontSize="9"
          alignmentBaseline="middle"
        >
          {minElev}m
        </text>
        
        <text
          x={padding.left}
          y={height - 8}
          fill="#64748b"
          fontSize="9"
        >
          0
        </text>
        <text
          x={padding.left + chartWidth}
          y={height - 8}
          textAnchor="end"
          fill="#64748b"
          fontSize="9"
        >
          {maxDist.toFixed(0)}m
        </text>
        
        <text
          x={width / 2}
          y={10}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="10"
          fontWeight="600"
        >
          高程剖面图
        </text>
      </svg>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px' }}>
        <div>
          <span style={{ color: '#64748b' }}>最高: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{maxElev} m</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>最低: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{minElev} m</span>
        </div>
        <div>
          <span style={{ color: '#64748b' }}>距离: </span>
          <span style={{ color: '#f1f5f9', fontWeight: 500 }}>{maxDist.toFixed(0)} m</span>
        </div>
      </div>
    </div>
  );
}
