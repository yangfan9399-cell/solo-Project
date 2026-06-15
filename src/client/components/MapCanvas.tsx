import React, { useMemo } from 'react';
import type { MasterRecord, DetailRecord, HistoryRecord, ResultRecord, ProfileData } from '../../shared/types.js';

interface Props {
  master: MasterRecord;
  details: DetailRecord[];
  histories: HistoryRecord[];
  result: ResultRecord;
}

export function MapCanvas({ master, details, histories, result }: Props) {
  const visibleLayers = useMemo(() => {
    const layerMap = new Map(result.layers.map(l => [l.layerId, l]));
    return details.filter(d => {
      const layer = layerMap.get(d.id);
      return layer ? layer.visible : true;
    });
  }, [details, result.layers]);

  const ridges = histories.filter(h => h.type === 'ridge');
  const profiles = histories.filter(h => h.type === 'profile');
  const aspects = histories.filter(h => h.type === 'aspect');

  function pointsToPath(points: { x: number; y: number }[], smooth: boolean = true): string {
    if (points.length === 0) return '';
    if (!smooth || points.length < 3) {
      return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    }
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ` Q ${points[i].x} ${points[i].y} ${xc} ${yc}`;
    }
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return path;
  }

  const profile = profiles.length > 0 ? profiles[0].data as ProfileData : null;

  function renderProfileLine() {
    if (!profile) return null;
    return (
      <line
        x1={profile.startPoint.x}
        y1={profile.startPoint.y}
        x2={profile.endPoint.x}
        y2={profile.endPoint.y}
        stroke="#ff6b6b"
        strokeWidth="2"
        strokeDasharray="8,4"
      />
    );
  }

  return (
    <div className="map-canvas-container">
      <div className="canvas-header">
        <span className="canvas-title">{master.name}</span>
        <span className="canvas-batch">{master.batch}</span>
      </div>
      <div className="canvas-wrapper">
        <svg
          className="map-svg"
          viewBox={`0 0 ${master.mapWidth} ${master.mapHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="paper" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise"/>
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
            </filter>
            <radialGradient id="terrainGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2a3a4a" />
              <stop offset="100%" stopColor="#1a2a3a" />
            </radialGradient>
          </defs>

          <rect
            x="0" y="0"
            width={master.mapWidth}
            height={master.mapHeight}
            fill="url(#terrainGrad)"
            rx="4"
          />

          <g dangerouslySetInnerHTML={{ __html: master.mapImage }} />

          <g className="contour-layer">
            {visibleLayers.map(detail => {
              const layerEdit = result.layers.find(l => l.layerId === detail.id);
              const color = layerEdit?.color || detail.color;
              const opacity = layerEdit?.opacity ?? 1;
              return (
                <path
                  key={detail.id}
                  d={pointsToPath(detail.points, detail.isSmooth)}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  opacity={opacity}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          <g className="ridge-layer">
            {ridges.map(r => {
              const ridge = r.data as any;
              return (
                <g key={r.id}>
                  <path
                    d={pointsToPath(ridge.points, false)}
                    fill="none"
                    stroke="#ffd93d"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={ridge.points[Math.floor(ridge.points.length / 2)].x}
                    y={ridge.points[Math.floor(ridge.points.length / 2)].y - 8}
                    fill="#ffd93d"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {ridge.name}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="profile-layer">
            {renderProfileLine()}
            {profile && (
              <>
                <circle cx={profile.startPoint.x} cy={profile.startPoint.y} r="5" fill="#ff6b6b" />
                <circle cx={profile.endPoint.x} cy={profile.endPoint.y} r="5" fill="#ff6b6b" />
                <text
                  x={profile.startPoint.x}
                  y={profile.startPoint.y - 10}
                  fill="#ff6b6b"
                  fontSize="11"
                  textAnchor="middle"
                >
                  起点
                </text>
                <text
                  x={profile.endPoint.x}
                  y={profile.endPoint.y - 10}
                  fill="#ff6b6b"
                  fontSize="11"
                  textAnchor="middle"
                >
                  终点
                </text>
              </>
            )}
          </g>

          <g className="aspect-layer">
            {aspects.map(a => {
              const aspect = a.data as any;
              const arrowLen = 20;
              const angle = (aspect.direction - 90) * Math.PI / 180;
              const x2 = aspect.position.x + Math.cos(angle) * arrowLen;
              const y2 = aspect.position.y + Math.sin(angle) * arrowLen;
              return (
                <g key={a.id}>
                  <line
                    x1={aspect.position.x}
                    y1={aspect.position.y}
                    x2={x2}
                    y2={y2}
                    stroke="#6bcfff"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                  <circle cx={aspect.position.x} cy={aspect.position.y} r="3" fill="#6bcfff" />
                </g>
              );
            })}
          </g>

          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6bcfff" />
            </marker>
          </defs>

          <g className="labels-layer">
            {result.pointLabels.map(label => (
            <g key={label.id}>
              <circle cx={label.x} cy={label.y} r="6" fill="white" stroke="#333" strokeWidth="1.5" />
              <text
                x={label.x}
                y={label.y + 4}
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
                fill="#333"
              >
                {label.type === 'elevation' ? label.elevation : label.text.charAt(0)}
              </text>
              <text
                x={label.x + 10}
                y={label.y + 4}
                fontSize="11"
                fill="white"
              >
                {label.text}
              </text>
            </g>
          ))}
          </g>

          <g className="error-notes-layer">
            {result.errorNotes.filter(n => !n.resolved).map(note => (
              <g key={note.id}>
                <circle
                  cx={note.x}
                  cy={note.y}
                  r="8"
                  fill={note.severity === 'high' ? '#ff4757' : note.severity === 'medium' ? '#ffa502' : '#70a1ff'}
                  opacity="0.8"
                />
                <text
                  x={note.x}
                  y={note.y + 4}
                  fontSize="10"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="white"
                >
                  !
                </text>
              </g>
            ))}
          </g>
        </svg>

        <div className="scale-bar">
          <div className="scale-bar-line" />
          <span className="scale-bar-text">{master.scale} {master.scaleUnit}</span>
        </div>

        <div className="map-info">
          <span>比例尺 1:{master.scale}</span>
          <span>{master.mapWidth}×{master.mapHeight}px</span>
        </div>
      </div>
    </div>
  );
}
