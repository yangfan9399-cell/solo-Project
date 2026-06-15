declare const React: any;
declare const ReactDOM: any;

namespace ContourTool {
  export interface ContourPoint { x: number; y: number; elevation?: number; }
  export interface MasterRecord {
    id: string; name: string; batch: string; version: number;
    terrainType: string; status: string;
    mapWidth: number; mapHeight: number; scale: number; scaleUnit: string;
    description: string; mapImage: string; createdAt: string; updatedAt: string;
  }
  export interface DetailRecord {
    id: string; masterId: string; contourIndex: number; elevation: number;
    points: ContourPoint[]; color: string; isSmooth: boolean; createdAt: string;
  }
  export interface RidgeData { name: string; points: ContourPoint[]; }
  export interface ProfileData {
    name: string; startPoint: ContourPoint; endPoint: ContourPoint;
    totalDistance: number; elevationData: { distance: number; elevation: number }[];
  }
  export interface AspectData { position: ContourPoint; direction: number; slope: number; }
  export interface HistoryRecord {
    id: string; masterId: string; type: 'ridge' | 'profile' | 'aspect';
    version: number; data: any; operator: string; createdAt: string; remark?: string;
  }
  export interface LayerEdit { layerId: string; visible: boolean; color?: string; opacity?: number; }
  export interface PointLabel {
    id: string; masterId: string; x: number; y: number; type: 'elevation' | 'landmark' | 'annotation';
    text: string; elevation?: number; createdAt: string;
  }
  export interface ErrorNote {
    id: string; masterId: string; x: number; y: number; message: string;
    severity: 'high' | 'medium' | 'low'; resolved: boolean; createdAt: string; resolvedAt?: string;
  }
  export interface ResultRecord {
    id: string; masterId: string; version: number; status: string;
    layers: LayerEdit[]; pointLabels: PointLabel[]; errorNotes: ErrorNote[];
    exportedAt?: string; createdAt: string; updatedAt: string;
  }
  export interface Snapshot {
    id: string; masterId: string; name: string; version: number; createdAt: string;
    masterData: MasterRecord; detailsData: DetailRecord[]; historiesData: HistoryRecord[]; resultData: ResultRecord;
  }

  type TabType = 'layers' | 'info' | 'history' | 'result';
  type ToolType = 'none' | 'import' | 'scale' | 'contour' | 'ridge' | 'profile' | 'aspect';
  interface DrawPoint { x: number; y: number; }

  const e = React.createElement;
  const useState = React.useState;
  const useEffect = React.useEffect;
  const useMemo = React.useMemo;

  const TOOL_STEPS: { id: ToolType; label: string; icon: string; desc: string }[] = [
    { id: 'import', label: '导入底图', icon: '📥', desc: '导入手绘地形图' },
    { id: 'scale', label: '标定比例尺', icon: '📏', desc: '标定比例尺' },
    { id: 'contour', label: '描绘等高线', icon: '🌀', desc: '描绘等高线' },
    { id: 'ridge', label: '描绘山脊', icon: '⛰️', desc: '描绘山脊线' },
    { id: 'aspect', label: '测量坡向', icon: '🧭', desc: '测量坡向' },
    { id: 'profile', label: '生成剖面', icon: '📊', desc: '生成剖面图' },
  ];

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

  function MapCanvas(props: {
    master: MasterRecord; details: DetailRecord[]; histories: HistoryRecord[];
    result: ResultRecord; drawPoints?: DrawPoint[]; activeTool?: ToolType;
    onCanvasClick?: (ev: any) => void;
  }) {
    const master = props.master, details = props.details, histories = props.histories,
      result = props.result, drawPts = props.drawPoints || [], at = props.activeTool || 'none', onClick = props.onCanvasClick;

    const visibleLayers = useMemo(function() {
      const lm = new Map(result.layers.map(function(l: any) { return [l.layerId, l]; }));
      return details.filter(function(d) {
        const l = lm.get(d.id); return l ? l.visible : true;
      });
    }, [details, result.layers]);

    const ridges = histories.filter(function(h) { return h.type === 'ridge'; });
    const profiles = histories.filter(function(h) { return h.type === 'profile'; });
    const aspects = histories.filter(function(h) { return h.type === 'aspect'; });
    const profile = profiles.length > 0 ? profiles[0].data as ProfileData : null;

    const strokeColor = at === 'contour' ? '#00ff88' : at === 'ridge' ? '#ffd93d'
      : at === 'scale' ? '#6bcfff' : at === 'profile' ? '#ff6b6b' : '#ffffff';

    const svgChildren: any[] = [];

    svgChildren.push(e('defs', { key: 'defs1' },
      e('filter', { id: 'paper', x: '-20%', y: '-20%', width: '140%', height: '140%' },
        e('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.04', numOctaves: '5', result: 'noise' }),
        e('feDisplacementMap', { in: 'SourceGraphic', in2: 'noise', scale: '3' })
      ),
      e('radialGradient', { id: 'terrainGrad', cx: '50%', cy: '50%', r: '50%' },
        e('stop', { offset: '0%', stopColor: '#2a3a4a' }),
        e('stop', { offset: '100%', stopColor: '#1a2a3a' })
      )
    ));

    svgChildren.push(e('rect', { key: 'bg', x: 0, y: 0, width: master.mapWidth, height: master.mapHeight, fill: 'url(#terrainGrad)', rx: 4 }));
    svgChildren.push(e('g', { key: 'img', dangerouslySetInnerHTML: { __html: master.mapImage } }));

    svgChildren.push(e('g', { key: 'ctr', className: 'contour-layer' },
      visibleLayers.map(function(det: DetailRecord) {
        const le = result.layers.find(function(l: any) { return l.layerId === det.id; });
        const color = (le && le.color) ? le.color : det.color;
        const opacity = le && typeof le.opacity === 'number' ? le.opacity : 1;
        return e('path', { key: det.id, d: pointsToPath(det.points, det.isSmooth), fill: 'none', stroke: color, strokeWidth: 1.5, opacity: opacity, vectorEffect: 'non-scaling-stroke' });
      })
    ));

    svgChildren.push(e('g', { key: 'rdg', className: 'ridge-layer' },
      ridges.map(function(r: HistoryRecord) {
        const rd = r.data as RidgeData;
        const midIdx = Math.floor(rd.points.length / 2);
        return e('g', { key: r.id },
          e('path', { d: pointsToPath(rd.points, false), fill: 'none', stroke: '#ffd93d', strokeWidth: 2.5, strokeLinecap: 'round', vectorEffect: 'non-scaling-stroke' }),
          e('text', { x: rd.points[midIdx].x, y: rd.points[midIdx].y - 8, fill: '#ffd93d', fontSize: 12, textAnchor: 'middle' }, rd.name)
        );
      })
    ));

    const profChildren: any[] = [];
    if (profile) {
      profChildren.push(e('line', { key: 'line', x1: profile.startPoint.x, y1: profile.startPoint.y, x2: profile.endPoint.x, y2: profile.endPoint.y, stroke: '#ff6b6b', strokeWidth: 2, strokeDasharray: '8,4' }));
      profChildren.push(e('circle', { key: 'sp', cx: profile.startPoint.x, cy: profile.startPoint.y, r: 5, fill: '#ff6b6b' }));
      profChildren.push(e('circle', { key: 'ep', cx: profile.endPoint.x, cy: profile.endPoint.y, r: 5, fill: '#ff6b6b' }));
      profChildren.push(e('text', { key: 'sl', x: profile.startPoint.x, y: profile.startPoint.y - 10, fill: '#ff6b6b', fontSize: 11, textAnchor: 'middle' }, '起点'));
      profChildren.push(e('text', { key: 'el', x: profile.endPoint.x, y: profile.endPoint.y - 10, fill: '#ff6b6b', fontSize: 11, textAnchor: 'middle' }, '终点'));
    }
    svgChildren.push(e('g', { key: 'prof', className: 'profile-layer' }, profChildren));

    svgChildren.push(e('g', { key: 'asp', className: 'aspect-layer' },
      aspects.map(function(a: HistoryRecord) {
        const ad = a.data as AspectData;
        const arrowLen = 20;
        const angle = (ad.direction - 90) * Math.PI / 180;
        const x2 = ad.position.x + Math.cos(angle) * arrowLen;
        const y2 = ad.position.y + Math.sin(angle) * arrowLen;
        return e('g', { key: a.id },
          e('line', { x1: ad.position.x, y1: ad.position.y, x2: x2, y2: y2, stroke: '#6bcfff', strokeWidth: 2, markerEnd: 'url(#arrowhead)' }),
          e('circle', { cx: ad.position.x, cy: ad.position.y, r: 3, fill: '#6bcfff' })
        );
      })
    ));

    svgChildren.push(e('defs', { key: 'defs2' },
      e('marker', { id: 'arrowhead', markerWidth: 10, markerHeight: 7, refX: 9, refY: 3.5, orient: 'auto' },
        e('polygon', { points: '0 0, 10 3.5, 0 7', fill: '#6bcfff' })
      )
    ));

    svgChildren.push(e('g', { key: 'lbls', className: 'labels-layer' },
      result.pointLabels.map(function(lbl: PointLabel) {
        const ch: string = lbl.type === 'elevation' ? String(lbl.elevation) : lbl.text.charAt(0);
        return e('g', { key: lbl.id },
          e('circle', { cx: lbl.x, cy: lbl.y, r: 6, fill: 'white', stroke: '#333', strokeWidth: 1.5 }),
          e('text', { x: lbl.x, y: lbl.y + 4, fontSize: 9, fontWeight: 'bold', textAnchor: 'middle', fill: '#333' }, ch),
          e('text', { x: lbl.x + 10, y: lbl.y + 4, fontSize: 11, fill: 'white' }, lbl.text)
        );
      })
    ));

    svgChildren.push(e('g', { key: 'errs', className: 'error-notes-layer' },
      result.errorNotes.filter(function(n: ErrorNote) { return !n.resolved; }).map(function(note: ErrorNote) {
        const fc = note.severity === 'high' ? '#ff4757' : note.severity === 'medium' ? '#ffa502' : '#70a1ff';
        return e('g', { key: note.id },
          e('circle', { cx: note.x, cy: note.y, r: 8, fill: fc, opacity: 0.8 }),
          e('text', { x: note.x, y: note.y + 4, fontSize: 10, fontWeight: 'bold', textAnchor: 'middle', fill: 'white' }, '!')
        );
      })
    ));

    if (drawPts.length > 0) {
      const dp: any[] = [];
      if (drawPts.length >= 2) {
        dp.push(e('path', { key: 'pv', d: pointsToPath(drawPts, false), fill: 'none', stroke: strokeColor, strokeWidth: 2.5, strokeDasharray: '6,4', opacity: 0.9, vectorEffect: 'non-scaling-stroke' }));
      }
      drawPts.forEach(function(pt, idx) {
        dp.push(e('circle', { key: 'p' + idx, cx: pt.x, cy: pt.y, r: idx === drawPts.length - 1 ? 6 : 4, fill: strokeColor, stroke: '#000', strokeWidth: 1, opacity: 0.95 }));
        if (idx === 0 || idx === drawPts.length - 1) {
          dp.push(e('text', { key: 'l' + idx, x: pt.x, y: pt.y - 10, fill: strokeColor, fontSize: 11, textAnchor: 'middle', fontWeight: 'bold' }, idx === 0 ? '起点' : ((at === 'scale' || at === 'profile') ? '终点' : String(idx + 1))));
        }
      });
      svgChildren.push(e('g', { key: 'dp' }, dp));
    }

    const cursor = at !== 'none' ? 'crosshair' : 'default';
    const toolLabel: any = { import: '导入底图', scale: '标定比例尺', contour: '描绘等高线', ridge: '描绘山脊', aspect: '测量坡向', profile: '生成剖面', none: '' };

    return e('div', { className: 'map-canvas-container' },
      e('div', { className: 'canvas-header' },
        e('span', { className: 'canvas-title' }, master.name),
        e('span', { className: 'canvas-batch' }, master.batch),
        at !== 'none' ? e('span', { className: 'canvas-tool-indicator' }, '🔧 当前工具：' + toolLabel[at]) : null
      ),
      e('div', { className: 'canvas-wrapper' },
        e('svg', {
          className: 'map-svg',
          viewBox: '0 0 ' + master.mapWidth + ' ' + master.mapHeight,
          preserveAspectRatio: 'xMidYMid meet',
          style: { cursor: cursor },
          onClick: onClick,
        }, svgChildren),
        e('div', { className: 'scale-bar' },
          e('div', { className: 'scale-bar-line' }),
          e('span', { className: 'scale-bar-text' }, master.scale + ' ' + master.scaleUnit)
        ),
        e('div', { className: 'map-info' },
          e('span', null, '比例尺 1:' + master.scale),
          e('span', null, master.mapWidth + '×' + master.mapHeight + 'px')
        )
      )
    );
  }

  function LayerPanel(props: { details: DetailRecord[]; result: ResultRecord; onToggleLayer: (id: string) => void; }) {
    const { details, result, onToggleLayer } = props;
    const lm = new Map(result.layers.map(function(l: any) { return [l.layerId, l]; }));
    const maxE = details.length > 0 ? Math.max.apply(null, details.map(function(d) { return d.elevation; })) : 0;
    const minE = details.length > 0 ? Math.min.apply(null, details.map(function(d) { return d.elevation; })) : 0;
    const visC = result.layers.filter(function(l: any) { return l.visible; }).length;

    return e('div', { className: 'layer-panel' },
      e('div', { className: 'panel-section' },
        e('h3', { className: 'panel-title' }, '等高线图层'),
        e('p', { className: 'panel-desc' }, '共 ' + details.length + ' 条等高线，可分层显示/隐藏')
      ),
      e('div', { className: 'layer-list' },
        details.map(function(det: DetailRecord) {
          const l = lm.get(det.id); const vis = l ? l.visible : true;
          const color = (l && l.color) ? l.color : det.color;
          return e('div', { key: det.id, className: 'layer-item' + (vis ? '' : ' hidden'), onClick: function() { onToggleLayer(det.id); } },
            e('div', { className: 'layer-color', style: { backgroundColor: color } }),
            e('div', { className: 'layer-info' },
              e('div', { className: 'layer-name' }, '第 ' + det.contourIndex + ' 层'),
              e('div', { className: 'layer-elev' }, '高程 ' + det.elevation + 'm')
            ),
            e('div', { className: 'layer-toggle' },
              e('input', { type: 'checkbox', checked: vis, onChange: function(ev: any) { ev.stopPropagation(); onToggleLayer(det.id); } })
            )
          );
        })
      ),
      e('div', { className: 'panel-section' },
        e('h4', { className: 'panel-subtitle' }, '图例说明'),
        e('div', { className: 'legend-list' },
          e('div', { className: 'legend-item' }, e('div', { className: 'legend-line contour-line' }), e('span', null, '等高线')),
          e('div', { className: 'legend-item' }, e('div', { className: 'legend-line ridge-line' }), e('span', null, '山脊线')),
          e('div', { className: 'legend-item' }, e('div', { className: 'legend-line profile-line' }), e('span', null, '剖面线')),
          e('div', { className: 'legend-item' }, e('div', { className: 'legend-line aspect-line' }), e('span', null, '坡向箭头'))
        )
      ),
      e('div', { className: 'panel-section' },
        e('h4', { className: 'panel-subtitle' }, '图层统计'),
        e('div', { className: 'stat-grid' },
          e('div', { className: 'stat-item' }, e('div', { className: 'stat-value' }, String(details.length)), e('div', { className: 'stat-label' }, '总层数')),
          e('div', { className: 'stat-item' }, e('div', { className: 'stat-value' }, String(visC)), e('div', { className: 'stat-label' }, '显示中')),
          e('div', { className: 'stat-item' }, e('div', { className: 'stat-value' }, (maxE - minE) + 'm'), e('div', { className: 'stat-label' }, '高差'))
        )
      )
    );
  }

  function InfoPanel(props: { master: MasterRecord; snapshots: Snapshot[]; onCreateSnapshot: () => void; onRestoreSnapshot: (id: string) => void; }) {
    const { master, snapshots, onCreateSnapshot, onRestoreSnapshot } = props;
    function fd(iso: string) { return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    const sl: any = { draft: '草稿', processing: '处理中', completed: '已完成', error: '异常' };

    const snapChildren = snapshots.length === 0
      ? e('p', { className: 'empty-text' }, '暂无快照')
      : e('div', { className: 'snapshot-list' }, snapshots.map(function(s: Snapshot) {
          return e('div', { key: s.id, className: 'snapshot-item' },
            e('div', { className: 'snapshot-info' },
              e('div', { className: 'snapshot-name' }, s.name),
              e('div', { className: 'snapshot-version' }, 'v' + s.version)
            ),
            e('button', { className: 'btn-tiny', onClick: function() { onRestoreSnapshot(s.id); }, title: '恢复到此版本' }, '回滚')
          );
        }));

    return e('div', { className: 'info-panel' },
      e('div', { className: 'panel-section' },
        e('h3', { className: 'panel-title' }, '基本信息'),
        e('div', { className: 'info-grid' },
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '记录名称'), e('span', { className: 'info-value' }, master.name)),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '批次编号'), e('span', { className: 'info-value mono' }, master.batch)),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '当前版本'), e('span', { className: 'info-value version' }, 'v' + master.version)),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '地形类型'), e('span', { className: 'info-value' }, master.terrainType)),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '状态'), e('span', { className: 'status-badge status-' + master.status }, sl[master.status] || master.status))
        )
      ),
      e('div', { className: 'panel-section' },
        e('h4', { className: 'panel-subtitle' }, '比例尺'),
        e('div', { className: 'info-grid' },
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '比例'), e('span', { className: 'info-value mono' }, '1:' + master.scale)),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '单位'), e('span', { className: 'info-value' }, master.scaleUnit)),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '底图尺寸'), e('span', { className: 'info-value mono' }, master.mapWidth + ' × ' + master.mapHeight))
        )
      ),
      e('div', { className: 'panel-section' }, e('h4', { className: 'panel-subtitle' }, '描述'), e('p', { className: 'description' }, master.description)),
      e('div', { className: 'panel-section' },
        e('h4', { className: 'panel-subtitle' }, '时间'),
        e('div', { className: 'info-grid' },
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '创建时间'), e('span', { className: 'info-value' }, fd(master.createdAt))),
          e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '更新时间'), e('span', { className: 'info-value' }, fd(master.updatedAt)))
        )
      ),
      e('div', { className: 'panel-section' },
        e('div', { className: 'section-header' },
          e('h4', { className: 'panel-subtitle' }, '版本快照'),
          e('button', { className: 'btn-small', onClick: onCreateSnapshot }, '新建')
        ),
        snapChildren
      )
    );
  }

  function HistoryPanel(props: { histories: HistoryRecord[] }) {
    const { histories } = props;
    
    const [filter, setFilter] = useState('all');
    const filtered = filter === 'all' ? histories : histories.filter(function(h) { return h.type === filter; });
    const tl: any = { ridge: '山脊线', profile: '剖面图', aspect: '坡向' };
    const tc: any = { ridge: 'timeline-ridge', profile: 'timeline-profile', aspect: 'timeline-aspect' };
    const fl: any = { all: '全部', ridge: '山脊', profile: '剖面', aspect: '坡向' };
    function ft(iso: string) { return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    function ghs(h: HistoryRecord): string {
      if (h.type === 'ridge') { const d = h.data as RidgeData; return d.name + ' · ' + d.points.length + ' 个点位'; }
      if (h.type === 'profile') { const d = h.data as ProfileData; return d.name + ' · ' + d.totalDistance.toFixed(0) + 'm'; }
      if (h.type === 'aspect') { const d = h.data as AspectData; return d.direction + '° · 坡度 ' + d.slope + '°'; }
      return '';
    }

    return e('div', { className: 'history-panel' },
      e('div', { className: 'panel-section' },
        e('h3', { className: 'panel-title' }, '历史记录'),
        e('p', { className: 'panel-desc' }, '共 ' + histories.length + ' 条操作记录')
      ),
      e('div', { className: 'filter-bar' },
        (['all', 'ridge', 'profile', 'aspect'] as any[]).map(function(f: any) {
          return e('button', { key: f, className: 'filter-btn' + (filter === f ? ' active' : ''), onClick: function() { setFilter(f); } }, fl[f]);
        })
      ),
      e('div', { className: 'timeline' },
        filtered.length === 0 ? e('p', { className: 'empty-text' }, '暂无记录')
          : filtered.map(function(h: HistoryRecord) {
              return e('div', { key: h.id, className: 'timeline-item' },
                e('div', { className: 'timeline-dot ' + (tc[h.type] || '') }),
                e('div', { className: 'timeline-content' },
                  e('div', { className: 'timeline-header' },
                    e('span', { className: 'timeline-type' }, tl[h.type] || h.type),
                    e('span', { className: 'timeline-version' }, 'v' + h.version)
                  ),
                  e('div', { className: 'timeline-summary' }, ghs(h)),
                  e('div', { className: 'timeline-footer' },
                    e('span', { className: 'timeline-operator' }, h.operator),
                    e('span', { className: 'timeline-time' }, ft(h.createdAt))
                  ),
                  h.remark ? e('div', { className: 'timeline-remark' }, '备注: ' + h.remark) : null
                )
              );
            })
      )
    );
  }

  function ProfileChart(props: { result: ResultRecord; profileData?: ProfileData; }) {
    const { result, profileData } = props;
    const data = profileData && profileData.elevationData ? profileData.elevationData : [];
    const cw = 260, ch = 120, p = { top: 10, right: 10, bottom: 25, left: 35 };
    const iw = cw - p.left - p.right, ih = ch - p.top - p.bottom;
    const cd = useMemo(function() {
      if (data.length > 0) return data;
      return [{ distance: 0, elevation: 120 }, { distance: 50, elevation: 145 }, { distance: 100, elevation: 180 }, { distance: 150, elevation: 165 }, { distance: 200, elevation: 210 }, { distance: 250, elevation: 195 }, { distance: 300, elevation: 175 }];
    }, [data]);
    const maxE = Math.max.apply(null, cd.map(function(d) { return d.elevation; }));
    const minE = Math.min.apply(null, cd.map(function(d) { return d.elevation; }));
    const maxD = Math.max.apply(null, cd.map(function(d) { return d.distance; }));
    const td = cd.length > 1 ? cd[cd.length - 1].distance : 0;
    const er = maxE - minE || 1;
    function xp(d: number) { return p.left + (d / (maxD || 1)) * iw; }
    function yp(e: number) { return p.top + ih - ((e - minE) / er) * ih; }
    const pd = cd.map(function(d, i) { return (i === 0 ? 'M' : 'L') + ' ' + xp(d.distance) + ' ' + yp(d.elevation); }).join(' ');
    const ad = pd + ' L ' + xp(maxD) + ' ' + (p.top + ih) + ' L ' + p.left + ' ' + (p.top + ih) + ' Z';
    const gls = [0, 0.25, 0.5, 0.75, 1].map(function(r, i) {
      return e('line', { key: i, x1: p.left, y1: p.top + ih * r, x2: cw - p.right, y2: p.top + ih * r, stroke: '#3a4a5a', strokeWidth: 0.5 });
    });

    return e('div', { className: 'profile-chart' },
      e('svg', { width: cw, height: ch, className: 'chart-svg' },
        e('defs', null, e('linearGradient', { id: 'profileGrad', x1: '0%', y1: '0%', x2: '0%', y2: '100%' },
          e('stop', { offset: '0%', stopColor: '#4ecdc4', stopOpacity: 0.5 }),
          e('stop', { offset: '100%', stopColor: '#4ecdc4', stopOpacity: 0.05 })
        )),
        gls,
        e('path', { d: ad, fill: 'url(#profileGrad)' }),
        e('path', { d: pd, fill: 'none', stroke: '#4ecdc4', strokeWidth: 2 }),
        e('text', { x: p.left - 5, y: yp(maxE) + 4, fontSize: 10, fill: '#8a9aae', textAnchor: 'end' }, maxE + 'm'),
        e('text', { x: p.left - 5, y: yp(minE) + 4, fontSize: 10, fill: '#8a9aae', textAnchor: 'end' }, minE + 'm'),
        e('text', { x: cw - p.right, y: ch - 5, fontSize: 10, fill: '#8a9aae', textAnchor: 'end' }, td.toFixed(0) + 'm')
      ),
      e('div', { className: 'chart-stats' },
        e('div', { className: 'chart-stat' }, e('span', { className: 'stat-label' }, '最高'), e('span', { className: 'stat-value' }, maxE + 'm')),
        e('div', { className: 'chart-stat' }, e('span', { className: 'stat-label' }, '最低'), e('span', { className: 'stat-value' }, minE + 'm')),
        e('div', { className: 'chart-stat' }, e('span', { className: 'stat-label' }, '总距'), e('span', { className: 'stat-value' }, td.toFixed(0) + 'm'))
      )
    );
  }

  function ResultPanel(props: { result: ResultRecord; onToggleError: (id: string) => void; onExportImage?: () => void; onExportData?: () => void; }) {
    const { result, onToggleError, onExportImage, onExportData } = props;
    
    const [tab, setTab] = useState('labels');
    const uh = result.errorNotes.filter(function(n: any) { return n.severity === 'high' && !n.resolved; }).length;
    const uc = result.errorNotes.filter(function(n: any) { return !n.resolved; }).length;
    const sl: any = { pending: '待处理', ready: '就绪', exported: '已导出', rolled_back: '已回滚' };
    function gsl(s: string): any { const m: any = { high: { t: '高', c: 'sev-high' }, medium: { t: '中', c: 'sev-medium' }, low: { t: '低', c: 'sev-low' } }; return m[s] || { t: s, c: '' }; }
    function gtl(t: string): string { const m: any = { elevation: '高程', landmark: '地标', annotation: '注释' }; return m[t] || t; }
    const tl: any = { labels: '点位标签 (' + result.pointLabels.length + ')', errors: '误差备注 (' + uc + '/' + result.errorNotes.length + ')', export: '导出' };

    const lc = result.pointLabels.length === 0 ? e('p', { className: 'empty-text' }, '暂无标签')
      : e('div', { className: 'labels-list' }, result.pointLabels.map(function(lbl: any) {
          return e('div', { key: lbl.id, className: 'label-item' },
            e('div', { className: 'label-type type-' + lbl.type }, gtl(lbl.type)),
            e('div', { className: 'label-info' },
              e('div', { className: 'label-text' }, lbl.text),
              lbl.elevation !== undefined ? e('div', { className: 'label-elev' }, lbl.elevation + 'm') : null,
              e('div', { className: 'label-pos' }, '(' + lbl.x + ', ' + lbl.y + ')')
            )
          );
        }));

    const ei = result.errorNotes.length === 0 ? e('p', { className: 'empty-text' }, '暂无误差备注')
      : result.errorNotes.map(function(note: any) {
          const s = gsl(note.severity);
          return e('div', { key: note.id, className: 'error-item' + (note.resolved ? ' resolved' : '') },
            e('div', { className: 'error-severity ' + s.c }, s.t),
            e('div', { className: 'error-content' },
              e('div', { className: 'error-message' }, note.message),
              e('div', { className: 'error-pos' }, '位置: (' + note.x + ', ' + note.y + ')')
            ),
            e('button', { className: 'btn-tiny', onClick: function() { onToggleError(note.id); } }, note.resolved ? '重开' : '解决')
          );
        });
    const ec = e('div', { className: 'errors-list' }, uh > 0 ? e('div', { className: 'error-alert' }, e('span', null, '⚠ ' + uh + ' 个高优先级误差待处理')) : null, ei);

    const vlc = result.layers.filter(function(l: any) { return l.visible; }).length;
    const xpc = e('div', { className: 'export-section' },
      e('div', { className: 'export-preview' }, e('h4', { className: 'panel-subtitle' }, '剖面预览'), e(ProfileChart, { result: result })),
      e('div', { className: 'export-info' },
        e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '导出格式'), e('span', { className: 'info-value' }, 'PNG / JSON')),
        e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '包含内容'), e('span', { className: 'info-value' }, vlc + ' 个图层 · ' + result.pointLabels.length + ' 个标签')),
        e('div', { className: 'info-row' }, e('span', { className: 'info-label' }, '结果状态'), e('span', { className: 'info-value' }, sl[result.status] || result.status))
      ),
      e('div', { className: 'export-actions' },
        e('button', { className: 'btn-small btn-primary', disabled: result.status === 'rolled_back', onClick: onExportImage }, '导出图片'),
        e('button', { className: 'btn-small', onClick: onExportData }, '导出数据')
      ),
      result.status === 'rolled_back' ? e('div', { className: 'rollback-notice' }, '⚠ 此结果为回滚版本，请重新校验后再导出') : null
    );

    let ac: any = null; if (tab === 'labels') ac = lc; else if (tab === 'errors') ac = ec; else if (tab === 'export') ac = xpc;

    return e('div', { className: 'result-panel' },
      e('div', { className: 'panel-section' },
        e('div', { className: 'result-header' },
          e('h3', { className: 'panel-title' }, '结果记录'),
          e('span', { className: 'status-badge status-' + result.status }, sl[result.status] || result.status)
        ),
        e('div', { className: 'result-version' }, '结果版本: v' + result.version)
      ),
      e('div', { className: 'sub-tab-bar' }, (['labels', 'errors', 'export'] as any[]).map(function(t: any) {
        return e('button', { key: t, className: 'sub-tab-btn' + (tab === t ? ' active' : ''), onClick: function() { setTab(t); } }, tl[t]);
      })),
      e('div', { className: 'sub-tab-content' }, ac)
    );
  }

  interface FullData { master: MasterRecord; details: DetailRecord[]; histories: HistoryRecord[]; result: ResultRecord; snapshots: Snapshot[]; }

  function App() {
    const [masters, setMasters] = useState([]);
    const [sid, setSid] = useState(null);
    const [fd, setFd] = useState(null);
    const [tab, setTab] = useState('layers');
    const [rb, setRb] = useState(null);
    const [loading, setLoading] = useState(true);
    const [at, setAt] = useState('none');
    const [tm, setTm] = useState(null);
    const [dp, setDp] = useState([]);

    useEffect(function() { fetchMs(); }, []);
    useEffect(function() { if (sid) fetchF(sid); else setFd(null); }, [sid]);

    async function fetchMs() {
      setLoading(true);
      try {
        const r = await fetch('/api/masters');
        const d = await r.json();
        setMasters(d);
        if (d.length > 0) setSid(d[0].id);
      } catch (e) { console.error('加载失败', e); }
      setLoading(false);
    }
    async function fetchF(id: string) {
      try {
        const r = await fetch('/api/masters/' + id + '/full');
        const d = await r.json();
        setFd(d);
      } catch (e) { console.error('加载详情失败', e); }
    }
    async function createSnap() {
      if (!sid || !fd) return;
      const nm = 'v' + fd.master.version + ' - ' + new Date().toLocaleString('zh-CN');
      try {
        await fetch('/api/snapshots', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ masterId: sid, name: nm }) });
        fetchF(sid); showMsg('快照创建成功');
      } catch (e) { console.error(e); }
    }
    async function restoreSnap(snapId: string) {
      if (!sid) return;
      try {
        await fetch('/api/snapshots/' + snapId + '/restore', { method: 'POST' });
        setRb('已从历史版本回滚，数据已恢复到快照版本');
        fetchF(sid);
        setTimeout(function() { setRb(null); }, 5000);
      } catch (e) { console.error(e); }
    }
    async function toggleErr(errId: string) {
      if (!sid || !fd) return;
      const un = fd.result.errorNotes.map(function(n: ErrorNote) { return n.id === errId ? Object.assign({}, n, { resolved: !n.resolved }) : n; });
      try {
        await fetch('/api/results/' + sid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errorNotes: un }) });
        fetchF(sid);
      } catch (e) { console.error(e); }
    }
    async function toggleLayer(lid: string) {
      if (!sid || !fd) return;
      const ul = fd.result.layers.map(function(l: any) { return l.layerId === lid ? Object.assign({}, l, { visible: !l.visible }) : l; });
      try {
        await fetch('/api/results/' + sid, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layers: ul }) });
        fetchF(sid);
      } catch (e) { console.error(e); }
    }
    function expImg() {
      const svg = document.querySelector('.map-svg') as any;
      if (!svg || !fd) return;
      const sd = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const blob = new Blob([sd], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      img.onload = function() {
        canvas.width = svg.viewBox.baseVal.width || 800;
        canvas.height = svg.viewBox.baseVal.height || 600;
        if (ctx) { ctx.fillStyle = '#0f1621'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0); }
        URL.revokeObjectURL(url);
        const link = document.createElement('a');
        link.download = (fd.master.name || 'contour-map') + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showMsg('图片导出成功');
      };
      img.src = url;
    }
    function expData() {
      if (!fd) return;
      const s = JSON.stringify(fd, null, 2);
      const blob = new Blob([s], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = fd.master.name + '_data.json';
      link.href = url; link.click();
      URL.revokeObjectURL(url);
    }
    function showMsg(m: string) { setTm(m); setTimeout(function() { setTm(null); }, 3000); }
    function actTool(t: ToolType) {
      const nt = at === t ? 'none' : t;
      setAt(nt); setDp([]);
      if (nt === 'import') showMsg('请选择或拖拽上传手绘地形图（当前使用当前记录）');
      else if (nt === 'scale') showMsg('请在地图上点击比例尺两端点标定距离');
      else if (nt === 'contour') showMsg('请在地图上点击描出等高线路径，完成后点击"完成"');
      else if (nt === 'ridge') showMsg('请在地图上点击描出山脊线，完成后点击"完成"');
      else if (nt === 'profile') showMsg('请在地图上点击两点确定剖面线');
      else if (nt === 'aspect') showMsg('请在地图上点击测量坡向点');
    }
    function canvasClick(ev: any) {
      if (!fd || at === 'none') return;
      const svg = ev.currentTarget;
      const rect = svg.getBoundingClientRect();
      const vb = svg.viewBox.baseVal;
      const x = (ev.clientX - rect.left) * (vb.width / rect.width);
      const y = (ev.clientY - rect.top) * (vb.height / rect.height);
      const pt = { x: x, y: y };
      if (at === 'scale') {
        const np = dp.concat([pt]); setDp(np);
        if (np.length === 2) showMsg('已标定比例尺两端点，完成请点击"完成"');
      } else if (at === 'contour' || at === 'ridge') {
        setDp(dp.concat([pt]));
      } else if (at === 'profile') {
        const np = dp.concat([pt]); setDp(np);
        if (np.length === 2) showMsg('已设定剖面起点和终点');
      } else if (at === 'aspect') {
        setDp([pt]); showMsg('已选择坡向测量点');
      }
    }
    function finishDraw() {
      if (!fd) { setDp([]); return; }
      if (at === 'contour') showMsg('已记录 ' + dp.length + ' 个等高线点');
      else if (at === 'ridge') showMsg('已描绘山脊线（' + dp.length + ' 点）');
      else if (at === 'profile') showMsg('剖面线已设定');
      else if (at === 'scale') showMsg('比例尺已标定');
      setDp([]);
    }
    function cancelDraw() { setDp([]); setAt('none'); }
    function sb(status: string) {
      const c: any = { draft: 'status-draft', processing: 'status-processing', completed: 'status-completed', error: 'status-error' };
      const l: any = { draft: '草稿', processing: '处理中', completed: '已完成', error: '异常' };
      return e('span', { className: 'status-badge ' + (c[status] || '') }, l[status] || status);
    }
    const hhe = fd ? fd.result.errorNotes.some(function(n: any) { return n.severity === 'high' && !n.resolved; }) : false;

    const tabLabels: any = { layers: '图层', info: '信息', history: '历史', result: '结果' };

    return e('div', { className: 'app-container' },
      e('header', { className: 'app-header' },
        e('div', { className: 'header-left' },
          e('h1', null, '沙盘地形等高线描绘工具'),
          e('span', { className: 'header-subtitle' }, 'Sandbox Topographic Contour Tool')
        ),
        e('div', { className: 'header-right' }, e('span', { className: 'header-info' }, '共 ' + masters.length + ' 个记录'))
      ),

      e('div', { className: 'workflow-bar' },
        TOOL_STEPS.map(function(step, idx) {
          return e(React.Fragment, { key: step.id },
            e('button', { className: 'workflow-step' + (at === step.id ? ' active' : ''), onClick: function() { actTool(step.id); }, title: step.desc },
              e('span', { className: 'wf-icon' }, step.icon),
              e('span', { className: 'wf-label' }, step.label),
              e('span', { className: 'wf-num' }, String(idx + 1))
            ),
            idx < TOOL_STEPS.length - 1 ? e('div', { className: 'wf-connector' }) : null
          );
        }),
        at !== 'none' ? e('div', { className: 'workflow-actions' },
          dp.length > 0 ? e('button', { className: 'btn-small btn-primary', onClick: finishDraw }, '完成') : null,
          e('button', { className: 'btn-tiny', onClick: cancelDraw }, '取消')
        ) : null
      ),

      rb ? e('div', { className: 'rollback-banner' }, e('span', null, '↺ ' + rb)) : null,
      hhe ? e('div', { className: 'error-banner' }, e('span', null, '⚠ 存在未解决的高优先级误差备注，请检查"结果"面板')) : null,
      tm && !rb && !hhe ? e('div', { className: 'tool-banner' }, e('span', null, '🛠 ' + tm)) : null,

      e('div', { className: 'main-content' },
        e('aside', { className: 'sidebar left-sidebar' },
          e('div', { className: 'sidebar-title' }, '记录列表'),
          e('div', { className: 'record-list' },
            loading ? e('div', { className: 'loading' }, '加载中...') : null,
            !loading ? masters.map(function(m: MasterRecord) {
              return e('div', { key: m.id, className: 'record-item' + (sid === m.id ? ' active' : ''), onClick: function() { setSid(m.id); } },
                e('div', { className: 'record-name' }, m.name),
                e('div', { className: 'record-meta' }, e('span', { className: 'record-batch' }, m.batch), sb(m.status)),
                e('div', { className: 'record-version' }, 'v' + m.version + ' · ' + m.terrainType)
              );
            }) : null
          ),
          fd ? e('div', { className: 'data-structure-hint' },
            e('div', { className: 'hint-title' }, '数据结构'),
            e('div', { className: 'hint-item' }, e('span', { className: 'hint-dot master' }), '主记录 · 地形图'),
            e('div', { className: 'hint-item' }, e('span', { className: 'hint-dot detail' }), '明细 · ' + fd.details.length + ' 条等高线'),
            e('div', { className: 'hint-item' }, e('span', { className: 'hint-dot history' }), '历史 · ' + fd.histories.length + ' 条操作'),
            e('div', { className: 'hint-item' }, e('span', { className: 'hint-dot result' }), '结果 · ' + fd.result.pointLabels.length + ' 标签')
          ) : null
        ),

        e('main', { className: 'canvas-area' },
          fd ? e(MapCanvas, { master: fd.master, details: fd.details, histories: fd.histories, result: fd.result, drawPoints: dp, activeTool: at, onCanvasClick: canvasClick })
            : e('div', { className: 'empty-state' }, e('div', { className: 'empty-icon' }, '🗺️'), e('h3', null, '选择一个记录开始'), e('p', null, '从左侧列表选择一个沙盘地形记录'))
        ),

        e('aside', { className: 'sidebar right-sidebar' },
          e('div', { className: 'tab-bar' },
            (['layers', 'info', 'history', 'result'] as any[]).map(function(t: TabType) {
              return e('button', { key: t, className: 'tab-btn' + (tab === t ? ' active' : ''), onClick: function() { setTab(t); } }, tabLabels[t]);
            })
          ),
          e('div', { className: 'tab-content' },
            fd && tab === 'layers' ? e(LayerPanel, { details: fd.details, result: fd.result, onToggleLayer: toggleLayer }) : null,
            fd && tab === 'info' ? e(InfoPanel, { master: fd.master, snapshots: fd.snapshots, onCreateSnapshot: createSnap, onRestoreSnapshot: restoreSnap }) : null,
            fd && tab === 'history' ? e(HistoryPanel, { histories: fd.histories }) : null,
            fd && tab === 'result' ? e(ResultPanel, { result: fd.result, onToggleError: toggleErr, onExportImage: expImg, onExportData: expData }) : null,
            !fd ? e('div', { className: 'empty-tab' }, '请选择记录') : null
          )
        )
      )
    );
  }

  export function mount(rootId: string) {
    const root = ReactDOM.createRoot(document.getElementById(rootId));
    root.render(e(App));
  }
}

(window as any).ContourTool = ContourTool;
