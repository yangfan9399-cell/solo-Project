import React, { useMemo } from 'react';
import type { MasterRecord, DetailRecord, HistoryRecord, ResultRecord, ProfileData } from '../../shared/types.js';

interface DrawPoint { x: number; y: number }
type ToolType = 'none' | 'import' | 'scale' | 'contour' | 'ridge' | 'profile' | 'aspect';

interface Props {
  master: MasterRecord;
  details: DetailRecord[];
  histories: HistoryRecord[];
  result: ResultRecord;
  drawPoints?: DrawPoint[];
  activeTool?: ToolType;
  onCanvasClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

export function MapCanvas(props: Props) {
  const master = props.master;
  const details = props.details;
  const histories = props.histories;
  const result = props.result;
  const drawPoints = props.drawPoints || [];
  const activeTool = props.activeTool || 'none';
  const onCanvasClick = props.onCanvasClick;

  const visibleLayers = useMemo(function() {
    const layerMap = new Map(result.layers.map(function(l) { return [l.layerId, l]; }));
    return details.filter(function(d) {
      const layer = layerMap.get(d.id);
      return layer ? layer.visible : true;
    });
  }, [details, result.layers]);

  const ridges = histories.filter(function(h) { return h.type === 'ridge'; });
  const profiles = histories.filter(function(h) { return h.type === 'profile'; });
  const aspects = histories.filter(function(h) { return h.type === 'aspect'; });

  function pointsToPath(points: { x: number; y: number }[], smooth: boolean): string {
    smooth = smooth !== false;
    if (points.length === 0) return '';
    if (!smooth || points.length < 3) {
      return points.map(function(p, i) { return (i === 0 ? 'M' : 'L') + ' ' + p.x + ' ' + p.y; }).join(' ');
    }
    let path = 'M ' + points[0].x + ' ' + points[0].y;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      path += ' Q ' + points[i].x + ' ' + points[i].y + ' ' + xc + ' ' + yc;
    }
    path += ' L ' + points[points.length - 1].x + ' ' + points[points.length - 1].y;
    return path;
  }

  const profile = profiles.length > 0 ? profiles[0].data as ProfileData : null;

  function renderProfileLine() {
    if (!profile) return null;
    return React.createElement('line', {
      x1: profile.startPoint.x,
      y1: profile.startPoint.y,
      x2: profile.endPoint.x,
      y2: profile.endPoint.y,
      stroke: '#ff6b6b',
      strokeWidth: '2',
      strokeDasharray: '8,4',
    });
  }

  function renderDrawPreview() {
    if (drawPoints.length === 0) return null;

    const strokeColor = activeTool === 'contour' ? '#00ff88'
      : activeTool === 'ridge' ? '#ffd93d'
      : activeTool === 'scale' ? '#6bcfff'
      : activeTool === 'profile' ? '#ff6b6b'
      : '#ffffff';

    const children: any[] = [];

    if (drawPoints.length >= 2) {
      children.push(React.createElement('path', {
        key: 'preview-path',
        d: pointsToPath(drawPoints, false),
        fill: 'none',
        stroke: strokeColor,
        strokeWidth: '2.5',
        strokeDasharray: '6,4',
        opacity: '0.9',
        vectorEffect: 'non-scaling-stroke',
      }));
    }

    drawPoints.forEach(function(pt, idx) {
      children.push(React.createElement('circle', {
        key: 'pt-' + idx,
        cx: pt.x,
        cy: pt.y,
        r: idx === drawPoints.length - 1 ? 6 : 4,
        fill: strokeColor,
        stroke: '#000',
        strokeWidth: '1',
        opacity: '0.95',
      }));
      if (idx === 0 || idx === drawPoints.length - 1) {
        children.push(React.createElement('text', {
          key: 'lbl-' + idx,
          x: pt.x,
          y: pt.y - 10,
          fill: strokeColor,
          fontSize: '11',
          textAnchor: 'middle',
          fontWeight: 'bold',
        }, idx === 0 ? '起点' : (activeTool === 'scale' || activeTool === 'profile' ? '终点' : (idx + 1))));
      }
    });

    return React.createElement('g', { className: 'draw-preview-layer' },
      children
    );
  }

  const svgChildren: any[] = [];

  svgChildren.push(React.createElement('defs', { key: 'defs1' },
    React.createElement('filter', { id: 'paper', x: '-20%', y: '-20%', width: '140%', height: '140%' },
      React.createElement('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.04', numOctaves: '5', result: 'noise' }),
      React.createElement('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: '3' })
    ),
    React.createElement('radialGradient', { id: 'terrainGrad', cx: '50%', cy: '50%', r: '50%' },
      React.createElement('stop', { offset: '0%', stopColor: '#2a3a4a' }),
      React.createElement('stop', { offset: '100%', stopColor: '#1a2a3a' })
    )
  ));

  svgChildren.push(React.createElement('rect', {
    key: 'bg-rect',
    x: '0', y: '0',
    width: master.mapWidth,
    height: master.mapHeight,
    fill: 'url(#terrainGrad)',
    rx: '4',
  }));

  svgChildren.push(React.createElement('g', {
    key: 'terrain-image',
    dangerouslySetInnerHTML: { __html: master.mapImage },
  }));

  const contourChildren = visibleLayers.map(function(detail) {
    const layerEdit = result.layers.find(function(l) { return l.layerId === detail.id; });
    const color = layerEdit && layerEdit.color ? layerEdit.color : detail.color;
    const opacity = layerEdit && typeof layerEdit.opacity === 'number' ? layerEdit.opacity : 1;
    return React.createElement('path', {
      key: detail.id,
      d: pointsToPath(detail.points, detail.isSmooth),
      fill: 'none',
      stroke: color,
      strokeWidth: '1.5',
      opacity: opacity,
      vectorEffect: 'non-scaling-stroke',
    });
  });
  svgChildren.push(React.createElement('g', { key: 'contour-layer', className: 'contour-layer' }, contourChildren));

  const ridgeChildren = ridges.map(function(r) {
    const ridge = r.data as any;
    return React.createElement('g', { key: r.id },
      React.createElement('path', {
        d: pointsToPath(ridge.points, false),
        fill: 'none',
        stroke: '#ffd93d',
        strokeWidth: '2.5',
        strokeLinecap: 'round',
        vectorEffect: 'non-scaling-stroke',
      }),
      React.createElement('text', {
        x: ridge.points[Math.floor(ridge.points.length / 2)].x,
        y: ridge.points[Math.floor(ridge.points.length / 2)].y - 8,
        fill: '#ffd93d',
        fontSize: '12',
        textAnchor: 'middle',
      }, ridge.name)
    );
  });
  svgChildren.push(React.createElement('g', { key: 'ridge-layer', className: 'ridge-layer' }, ridgeChildren));

  const profileChildren: any[] = [];
  profileChildren.push(renderProfileLine());
  if (profile) {
    profileChildren.push(React.createElement('circle', { key: 'sp', cx: profile.startPoint.x, cy: profile.startPoint.y, r: '5', fill: '#ff6b6b' }));
    profileChildren.push(React.createElement('circle', { key: 'ep', cx: profile.endPoint.x, cy: profile.endPoint.y, r: '5', fill: '#ff6b6b' }));
    profileChildren.push(React.createElement('text', {
      key: 'sl', x: profile.startPoint.x, y: profile.startPoint.y - 10,
      fill: '#ff6b6b', fontSize: '11', textAnchor: 'middle',
    }, '起点'));
    profileChildren.push(React.createElement('text', {
      key: 'el', x: profile.endPoint.x, y: profile.endPoint.y - 10,
      fill: '#ff6b6b', fontSize: '11', textAnchor: 'middle',
    }, '终点'));
  }
  svgChildren.push(React.createElement('g', { key: 'profile-layer', className: 'profile-layer' }, profileChildren));

  const aspectChildren = aspects.map(function(a) {
    const aspect = a.data as any;
    const arrowLen = 20;
    const angle = (aspect.direction - 90) * Math.PI / 180;
    const x2 = aspect.position.x + Math.cos(angle) * arrowLen;
    const y2 = aspect.position.y + Math.sin(angle) * arrowLen;
    return React.createElement('g', { key: a.id },
      React.createElement('line', {
        x1: aspect.position.x, y1: aspect.position.y,
        x2: x2, y2: y2,
        stroke: '#6bcfff', strokeWidth: '2',
        markerEnd: 'url(#arrowhead)',
      }),
      React.createElement('circle', { cx: aspect.position.x, cy: aspect.position.y, r: '3', fill: '#6bcfff' })
    );
  });
  svgChildren.push(React.createElement('g', { key: 'aspect-layer', className: 'aspect-layer' }, aspectChildren));

  svgChildren.push(React.createElement('defs', { key: 'defs2' },
    React.createElement('marker', {
      id: 'arrowhead',
      markerWidth: '10', markerHeight: '7',
      refX: '9', refY: '3.5',
      orient: 'auto',
    }, React.createElement('polygon', { points: '0 0, 10 3.5, 0 7', fill: '#6bcfff' }))
  ));

  const labelChildren = result.pointLabels.map(function(label) {
    const ch: string = label.type === 'elevation' ? String(label.elevation) : label.text.charAt(0);
    return React.createElement('g', { key: label.id },
      React.createElement('circle', { cx: label.x, cy: label.y, r: '6', fill: 'white', stroke: '#333', strokeWidth: '1.5' }),
      React.createElement('text', {
        x: label.x, y: label.y + 4,
        fontSize: '9', fontWeight: 'bold',
        textAnchor: 'middle', fill: '#333',
      }, ch),
      React.createElement('text', {
        x: label.x + 10, y: label.y + 4,
        fontSize: '11', fill: 'white',
      }, label.text)
    );
  });
  svgChildren.push(React.createElement('g', { key: 'labels-layer', className: 'labels-layer' }, labelChildren));

  const errorChildren = result.errorNotes.filter(function(n) { return !n.resolved; }).map(function(note) {
    const fillColor = note.severity === 'high' ? '#ff4757' : (note.severity === 'medium' ? '#ffa502' : '#70a1ff');
    return React.createElement('g', { key: note.id },
      React.createElement('circle', {
        cx: note.x, cy: note.y, r: '8',
        fill: fillColor, opacity: '0.8',
      }),
      React.createElement('text', {
        x: note.x, y: note.y + 4,
        fontSize: '10', fontWeight: 'bold',
        textAnchor: 'middle', fill: 'white',
      }, '!')
    );
  });
  svgChildren.push(React.createElement('g', { key: 'error-layer', className: 'error-notes-layer' }, errorChildren));

  svgChildren.push(renderDrawPreview());

  const cursorStyle = activeTool !== 'none' ? 'crosshair' : 'default';

  return React.createElement('div', { className: 'map-canvas-container' },
    React.createElement('div', { className: 'canvas-header' },
      React.createElement('span', { className: 'canvas-title' }, master.name),
      React.createElement('span', { className: 'canvas-batch' }, master.batch),
      activeTool !== 'none' ? React.createElement('span', { className: 'canvas-tool-indicator' },
        '🔧 当前工具：' + ({
          import: '导入底图', scale: '标定比例尺', contour: '描绘等高线',
          ridge: '描绘山脊', aspect: '测量坡向', profile: '生成剖面', none: '',
        } as any)[activeTool]
      ) : null
    ),
    React.createElement('div', { className: 'canvas-wrapper' },
      React.createElement('svg', {
        className: 'map-svg',
        viewBox: '0 0 ' + master.mapWidth + ' ' + master.mapHeight,
        preserveAspectRatio: 'xMidYMid meet',
        style: { cursor: cursorStyle },
        onClick: onCanvasClick,
      }, svgChildren),
      React.createElement('div', { className: 'scale-bar' },
        React.createElement('div', { className: 'scale-bar-line' }),
        React.createElement('span', { className: 'scale-bar-text' }, master.scale + ' ' + master.scaleUnit)
      ),
      React.createElement('div', { className: 'map-info' },
        React.createElement('span', null, '比例尺 1:' + master.scale),
        React.createElement('span', null, master.mapWidth + '\u00D7' + master.mapHeight + 'px')
      )
    )
  );
}
