import { useRef, useState, useEffect } from "react";
import type { MasterRecord, DetailRecord, ResultRecord, HistoryRecord } from "~/types";

interface MapCanvasProps {
  master: MasterRecord;
  details: DetailRecord[];
  result: ResultRecord | null;
  histories: HistoryRecord[];
  activeTool: string;
}

export default function MapCanvas({ master, details, result, histories, activeTool }: MapCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);
  
  const pixelPerUnit = master.scaleBarRealDistance > 0 
    ? master.scaleBarLength / master.scaleBarRealDistance 
    : 1;
  
  const ridgeHistories = histories.filter(h => h.type === 'ridge');
  const profileHistories = histories.filter(h => h.type === 'profile');
  
  const visibleDetails = details.filter(d => d.isVisible);
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, elev: 0 });
  
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    setMousePos({ x, y, elev: 0 });
  };
  
  return (
    <div className="map-canvas" style={{ width: master.mapWidth, height: master.mapHeight }}>
      <svg
        ref={svgRef}
        width={master.mapWidth}
        height={master.mapHeight}
        viewBox={`0 0 ${master.mapWidth} ${master.mapHeight}`}
        onMouseMove={handleMouseMove}
        style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
      >
        <image
          href={master.mapImageData}
          width={master.mapWidth}
          height={master.mapHeight}
          preserveAspectRatio="xMidYMid meet"
        />
        
        {visibleDetails.map(detail => (
          <g key={detail.id}>
            <path
              d={pointsToPath(detail.contourPoints)}
              fill="none"
              stroke={detail.color}
              strokeWidth={detail.lineWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
            />
            {detail.contourPoints.length > 0 && (
              <text
                x={detail.contourPoints[0].x + 5}
                y={detail.contourPoints[0].y}
                fill={detail.color}
                fontSize="10"
                fontWeight="bold"
                style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 2 }}
              >
                {detail.contourElevation}m
              </text>
            )}
          </g>
        ))}
        
        {ridgeHistories.map((ridge, idx) => {
          const data = ridge.data as any;
          return (
            <g key={ridge.id}>
              <path
                d={pointsToPath(data.points || [])}
                fill="none"
                stroke="#92400e"
                strokeWidth={3}
                strokeDasharray="8,4"
                opacity={0.7}
              />
              {data.points?.[0] && (
                <text
                  x={data.points[0].x + 8}
                  y={data.points[0].y - 5}
                  fill="#92400e"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {ridge.name}
                </text>
              )}
            </g>
          );
        })}
        
        {profileHistories.map((profile, idx) => {
          const data = profile.data as any;
          if (!data.startPoint || !data.endPoint) return null;
          const statusColor = data.status === 'success' ? '#10b981' : data.status === 'error' ? '#dc2626' : '#f59e0b';
          return (
            <g key={profile.id}>
              <line
                x1={data.startPoint.x}
                y1={data.startPoint.y}
                x2={data.endPoint.x}
                y2={data.endPoint.y}
                stroke={statusColor}
                strokeWidth={2}
                strokeDasharray="6,3"
              />
              <circle cx={data.startPoint.x} cy={data.startPoint.y} r={5} fill={statusColor} />
              <circle cx={data.endPoint.x} cy={data.endPoint.y} r={5} fill={statusColor} />
              <text
                x={(data.startPoint.x + data.endPoint.x) / 2}
                y={(data.startPoint.y + data.endPoint.y) / 2 - 8}
                textAnchor="middle"
                fill={statusColor}
                fontSize="10"
                fontWeight="bold"
                style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
              >
                {profile.name}
              </text>
            </g>
          );
        })}
        
        {result?.pointLabels.map(label => (
          <g key={label.id}>
            <circle
              cx={label.x}
              cy={label.y}
              r={8}
              fill="#0ea5e9"
              stroke="white"
              strokeWidth={2}
            />
            <text
              x={label.x + 12}
              y={label.y + 4}
              fill="#0f172a"
              fontSize="11"
              fontWeight="600"
              style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 3 }}
            >
              {label.text}
              {label.elevation ? ` (${label.elevation}m)` : ''}
            </text>
          </g>
        ))}
        
        {result?.errorNotes.filter(n => !n.resolved).map(note => (
          <g key={note.id}>
            <circle
              cx={note.x}
              cy={note.y}
              r={10}
              fill={note.severity === 'high' ? '#dc2626' : note.severity === 'medium' ? '#f59e0b' : '#3b82f6'}
              stroke="white"
              strokeWidth={2}
              opacity={0.9}
            />
            <text
              x={note.x}
              y={note.y + 4}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              !
            </text>
            <text
              x={note.x + 15}
              y={note.y + 4}
              fill={note.severity === 'high' ? '#dc2626' : note.severity === 'medium' ? '#f59e0b' : '#3b82f6'}
              fontSize="10"
              style={{ paintOrder: 'stroke', stroke: 'white', strokeWidth: 2 }}
            >
              {note.message.slice(0, 15)}...
            </text>
          </g>
        ))}
      </svg>
      
      <div className="scale-bar">
        <div className="scale-line"></div>
        <span>{master.scaleBarRealDistance} {master.scaleUnit}</span>
      </div>
    </div>
  );
}

function pointsToPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx1 = prev.x + (curr.x - prev.x) / 3;
    const cpy1 = prev.y + (curr.y - prev.y) / 3;
    const cpx2 = prev.x + (curr.x - prev.x) * 2 / 3;
    const cpy2 = prev.y + (curr.y - prev.y) * 2 / 3;
    d += ` C ${cpx1.toFixed(1)} ${cpy1.toFixed(1)}, ${cpx2.toFixed(1)} ${cpy2.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  return d;
}
