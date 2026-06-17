import { useMemo } from 'react';
import type { StratigraphicUnit, StratigraphicRelation, HarrisMatrixNode, HarrisMatrixEdge } from '../types';

interface HarrisMatrixProps {
  units: StratigraphicUnit[];
  relations: StratigraphicRelation[];
}

const relationColors: Record<string, string> = {
  above: '#7a6c5d',
  below: '#7a6c5d',
  cut: '#c44536',
  fills: '#197278',
  equal: '#9e7b2f',
  contemporary: '#9e7b2f'
};

const relationLabels: Record<string, string> = {
  above: '叠压',
  below: '叠压',
  cut: '打破',
  fills: '填充',
  equal: '同期',
  contemporary: '同期'
};

export default function HarrisMatrix({ units, relations }: HarrisMatrixProps) {
  const layout = useMemo(() => computeLayout(units, relations), [units, relations]);
  const { nodes, edges } = layout;

  const svgPadding = 60;
  const nodeWidth = 130;
  const nodeHeight = 60;

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + nodeWidth);
      maxY = Math.max(maxY, n.y + nodeHeight);
    });
    return { minX, minY, maxX, maxY };
  }, [nodes]);

  const svgWidth = (bounds.maxX - bounds.minX) + svgPadding * 2;
  const svgHeight = (bounds.maxY - bounds.minY) + svgPadding * 2;

  const translateX = -bounds.minX + svgPadding;
  const translateY = -bounds.minY + svgPadding;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div style={{ overflow: 'auto', background: 'var(--color-bg)', borderRadius: 8, padding: 8 }}>
      {nodes.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="empty-icon">📊</div>
          <div className="empty-title">暂无层位数据</div>
          <div className="empty-desc">请先添加层位单元以生成 Harris 矩阵</div>
        </div>
      ) : (
        <svg
          width={svgWidth}
          height={svgHeight}
          style={{ display: 'block' }}
        >
          <defs>
            {Object.entries(relationColors).map(([type, color]) => (
              <marker
                key={type}
                id={`arrow-${type}`}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={color} />
              </marker>
            ))}
            <marker
              id="arrow-default"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#7a6c5d" />
            </marker>
          </defs>

          <g transform={`translate(${translateX}, ${translateY})`}>
            {edges.map(edge => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;

              const isAbove = edge.type === 'above' || edge.type === 'cut' || edge.type === 'fills';
              let startX: number, startY: number, endX: number, endY: number;
              
              const fromCenterX = fromNode.x + nodeWidth / 2;
              const fromBottomY = fromNode.y + nodeHeight;
              const toCenterX = toNode.x + nodeWidth / 2;
              const toTopY = toNode.y;

              if (isAbove) {
                startX = fromCenterX;
                startY = fromBottomY;
                endX = toCenterX;
                endY = toTopY;
              } else {
                startX = toCenterX;
                startY = fromBottomY;
                endX = fromCenterX;
                endY = toTopY;
              }

              const sameX = Math.abs(startX - endX) < 5;
              let d: string;
              if (sameX) {
                d = `M ${startX} ${startY} L ${endX} ${endY - 4}`;
              } else {
                const midY = (startY + endY) / 2;
                d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY - 4}`;
              }

              const stroke = relationColors[edge.type] || '#7a6c5d';
              const markerEnd = relationColors[edge.type] ? `url(#arrow-${edge.type})` : 'url(#arrow-default)';
              const label = relationLabels[edge.type] || '';

              const labelX = (startX + endX) / 2;
              const labelY = (startY + endY) / 2;

              return (
                <g key={edge.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={edge.confirmed ? 2 : 1.5}
                    strokeDasharray={edge.confirmed ? undefined : '5,3'}
                    markerEnd={markerEnd}
                    opacity={0.8}
                  />
                  {label && !sameX && (
                    <>
                      <rect
                        x={labelX - 22}
                        y={labelY - 9}
                        width="44"
                        height="18"
                        rx="4"
                        fill="white"
                        stroke={stroke}
                        strokeWidth="1"
                        opacity="0.95"
                      />
                      <text
                        x={labelX}
                        y={labelY + 4}
                        textAnchor="middle"
                        fontSize="11"
                        fill={stroke}
                        fontWeight="500"
                      >
                        {label}
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {nodes.map(node => {
              const borderStyles: Record<string, { stroke: string; dasharray?: string }> = {
                layer: { stroke: '#7a6c5d' },
                feature: { stroke: '#c44536', dasharray: '8,3' },
                disturbance: { stroke: '#9e7b2f', dasharray: '2,3' }
              };
              const style = borderStyles[node.type] || borderStyles.layer;
              const fillColors: Record<string, string> = {
                layer: '#f5efe8',
                feature: '#fdecea',
                disturbance: '#fdf6e7'
              };

              return (
                <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="6"
                    fill={fillColors[node.type] || '#f5efe8'}
                    stroke={style.stroke}
                    strokeWidth="2"
                    strokeDasharray={style.dasharray}
                  />
                  <text
                    x={nodeWidth / 2}
                    y="22"
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="600"
                    fill="#3d3426"
                  >
                    {node.unitNumber}
                  </text>
                  <text
                    x={nodeWidth / 2}
                    y="42"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#7a6c5d"
                  >
                    {(node.designation || node.type).slice(0, 10)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}

      <div style={{ 
        display: 'flex', 
        gap: 16, 
        marginTop: 12, 
        padding: '10px 14px', 
        background: 'white',
        border: '1px solid var(--color-border)',
        borderRadius: 6,
        fontSize: 12,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, border: '2px solid #7a6c5d', borderRadius: 2, background: '#f5efe8' }} />
          <span>地层</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, border: '2px dashed #c44536', borderRadius: 2, background: '#fdecea' }} />
          <span>遗迹</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, border: '2px dotted #9e7b2f', borderRadius: 2, background: '#fdf6e7' }} />
          <span>扰动</span>
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--color-border)', margin: '0 4px' }} />
        {Object.entries(relationColors).slice(0, 4).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 2, background: color }} />
            <span>{relationLabels[type]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function computeLayout(
  units: StratigraphicUnit[],
  relations: StratigraphicRelation[]
): { nodes: HarrisMatrixNode[]; edges: HarrisMatrixEdge[] } {
  if (units.length === 0) return { nodes: [], edges: [] };

  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  units.forEach(u => {
    adjacencyList.set(u.id, []);
    inDegree.set(u.id, 0);
  });

  relations.forEach(r => {
    let from: string | null = null;
    let to: string | null = null;
    switch (r.relationType) {
      case 'above':
      case 'cut':
      case 'fills':
        from = r.fromUnitId; to = r.toUnitId; break;
      case 'below':
        from = r.toUnitId; to = r.fromUnitId; break;
      default:
        return;
    }
    if (from && to) {
      const list = adjacencyList.get(from);
      if (list && !list.includes(to)) {
        list.push(to);
        inDegree.set(to, (inDegree.get(to) || 0) + 1);
      }
    }
  });

  const layers: StratigraphicUnit[][] = [];
  const visited = new Set<string>();
  const tempInDegree = new Map(inDegree);

  while (visited.size < units.length) {
    const currentLayer: StratigraphicUnit[] = [];
    units.forEach(u => {
      if (!visited.has(u.id) && (tempInDegree.get(u.id) || 0) === 0) {
        currentLayer.push(u);
      }
    });

    if (currentLayer.length === 0) {
      const remaining = units.filter(u => !visited.has(u.id));
      if (remaining.length > 0) {
        layers.push(remaining);
        remaining.forEach(u => visited.add(u.id));
      }
      break;
    }

    currentLayer.forEach(u => {
      visited.add(u.id);
      const neighbors = adjacencyList.get(u.id) || [];
      neighbors.forEach(n => {
        tempInDegree.set(n, (tempInDegree.get(n) || 0) - 1);
      });
    });
    layers.push(currentLayer);
  }

  layers.reverse();

  const nodeWidth = 130;
  const nodeHeight = 60;
  const nodeGap = 24;
  const layerGap = 60;

  let maxLayerWidth = 0;
  layers.forEach(layer => {
    const w = layer.length * nodeWidth + (layer.length - 1) * nodeGap;
    if (w > maxLayerWidth) maxLayerWidth = w;
  });

  const nodes: HarrisMatrixNode[] = [];
  layers.forEach((layerUnits, layerIndex) => {
    const totalWidth = layerUnits.length * nodeWidth + (layerUnits.length - 1) * nodeGap;
    const startX = (maxLayerWidth - totalWidth) / 2;

    layerUnits.forEach((unit, unitIndex) => {
      nodes.push({
        id: unit.id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        designation: unit.designation,
        depthTop: unit.depthTop,
        depthBottom: unit.depthBottom,
        x: startX + unitIndex * (nodeWidth + nodeGap),
        y: layerIndex * (nodeHeight + layerGap),
        layer: layerIndex
      });
    });
  });

  const edges: HarrisMatrixEdge[] = [];
  const edgeSet = new Set<string>();
  relations.forEach(r => {
    if (r.relationType === 'equal' || r.relationType === 'contemporary') return;
    let from: string, to: string;
    if (r.relationType === 'below') {
      from = r.toUnitId;
      to = r.fromUnitId;
    } else {
      from = r.fromUnitId;
      to = r.toUnitId;
    }
    const key = `${from}->${to}-${r.relationType}`;
    if (!edgeSet.has(key) && from !== to) {
      edgeSet.add(key);
      edges.push({
        id: r.id,
        from,
        to,
        type: r.relationType === 'below' ? 'above' : r.relationType,
        confirmed: r.confirmed
      });
    }
  });

  return { nodes, edges };
}
