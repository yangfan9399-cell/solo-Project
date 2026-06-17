import { useEffect, useRef, useState } from 'react';
import type { StratigraphicUnit, StratigraphicRelation, HarrisMatrixNode, HarrisMatrixEdge } from '../types';

interface HarrisMatrixProps {
  units: StratigraphicUnit[];
  relations: StratigraphicRelation[];
}

export default function HarrisMatrix({ units, relations }: HarrisMatrixProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<HarrisMatrixNode[]>([]);
  const [edges, setEdges] = useState<HarrisMatrixEdge[]>([]);

  useEffect(() => {
    const { nodes: computedNodes, edges: computedEdges } = computeLayout(units, relations);
    setNodes(computedNodes);
    setEdges(computedEdges);
  }, [units, relations]);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = svgRef.current;
    const ns = 'http://www.w3.org/2000/svg';
    
    while (svg.firstChild) {
      if (svg.firstChild.tagName !== 'defs') {
        svg.removeChild(svg.firstChild);
      } else {
        break;
      }
    }

    const defs = svg.querySelector('defs');
    if (!defs) {
      const newDefs = document.createElementNS(ns, 'defs');
      const marker = document.createElementNS(ns, 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '9');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      const polygon = document.createElementNS(ns, 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', '#7a6c5d');
      marker.appendChild(polygon);
      newDefs.appendChild(marker);
      svg.insertBefore(newDefs, svg.firstChild);
    }

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    edges.forEach(edge => {
      const fromNode = nodeMap.get(edge.from);
      const toNode = nodeMap.get(edge.to);
      if (!fromNode || !toNode) return;

      const line = document.createElementNS(ns, 'path');
      const fromX = fromNode.x + 60;
      const fromY = fromNode.y + 50 + 40;
      const toX = toNode.x + 60;
      const toY = toNode.y + 50;

      const midY = (fromY + toY) / 2;
      const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
      
      line.setAttribute('d', d);
      line.setAttribute('class', `harris-edge ${edge.confirmed ? '' : 'unconfirmed'}`);
      svg.appendChild(line);
    });
  }, [nodes, edges]);

  return (
    <div ref={containerRef} className="harris-matrix">
      <svg ref={svgRef} className="harris-svg" />
      {nodes.map(node => (
        <div
          key={node.id}
          className={`harris-node ${node.type}`}
          style={{ left: node.x + 60, top: node.y + 50 }}
        >
          <div className="harris-node-number">{node.unitNumber}</div>
          <div className="harris-node-name">{node.designation || node.type}</div>
        </div>
      ))}
    </div>
  );
}

function computeLayout(
  units: StratigraphicUnit[],
  relations: StratigraphicRelation[]
): { nodes: HarrisMatrixNode[]; edges: HarrisMatrixEdge[] } {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  units.forEach(u => {
    adjacencyList.set(u.id, []);
    inDegree.set(u.id, 0);
  });

  relations.forEach(r => {
    if (r.relationType === 'above' || r.relationType === 'cut') {
      const list = adjacencyList.get(r.fromUnitId);
      if (list && !list.includes(r.toUnitId)) {
        list.push(r.toUnitId);
        inDegree.set(r.toUnitId, (inDegree.get(r.toUnitId) || 0) + 1);
      }
    }
  });

  const layers: StratigraphicUnit[][] = [];
  const visited = new Set<string>();
  const unitMap = new Map(units.map(u => [u.id, u]));

  while (visited.size < units.length) {
    const currentLayer: StratigraphicUnit[] = [];
    
    units.forEach(u => {
      if (!visited.has(u.id) && (inDegree.get(u.id) || 0) === 0) {
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
        inDegree.set(n, (inDegree.get(n) || 0) - 1);
      });
    });

    layers.push(currentLayer);
  }

  const nodes: HarrisMatrixNode[] = [];
  const nodeWidth = 130;
  const nodeHeight = 60;
  const layerGap = 80;

  layers.forEach((layerUnits, layerIndex) => {
    const totalWidth = layerUnits.length * nodeWidth + (layerUnits.length - 1) * 40;
    const startX = -totalWidth / 2;

    layerUnits.forEach((unit, unitIndex) => {
      nodes.push({
        id: unit.id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        designation: unit.designation,
        depthTop: unit.depthTop,
        depthBottom: unit.depthBottom,
        x: startX + unitIndex * (nodeWidth + 40),
        y: layerIndex * (nodeHeight + layerGap),
        layer: layerIndex
      });
    });
  });

  const edges: HarrisMatrixEdge[] = relations
    .filter(r => r.relationType === 'above' || r.relationType === 'below' || r.relationType === 'cut')
    .map(r => ({
      id: r.id,
      from: r.fromUnitId,
      to: r.toUnitId,
      type: r.relationType,
      confirmed: r.confirmed
    }));

  return { nodes, edges };
}
