import { getAllUnits } from './units';
import { getRelationsByProject } from './relations';
import type { StratigraphicUnit, StratigraphicRelation, HarrisMatrixNode, HarrisMatrixEdge } from '../types';

export function generateHarrisMatrix(projectId: string): { nodes: HarrisMatrixNode[]; edges: HarrisMatrixEdge[] } {
  const units = getAllUnits(projectId);
  const relations = getRelationsByProject(projectId);
  
  const adjacencyList = buildAdjacencyList(units, relations);
  const layers = topologicalSort(units, adjacencyList);
  
  const nodes: HarrisMatrixNode[] = [];
  const nodeMap = new Map<string, HarrisMatrixNode>();
  
  layers.forEach((layerUnits, layerIndex) => {
    const layerWidth = layerUnits.length;
    const spacing = 200;
    const startX = -(layerWidth - 1) * spacing / 2;
    
    layerUnits.forEach((unit, unitIndex) => {
      const node: HarrisMatrixNode = {
        id: unit.id,
        unitNumber: unit.unitNumber,
        type: unit.type,
        designation: unit.designation,
        depthTop: unit.depthTop,
        depthBottom: unit.depthBottom,
        x: startX + unitIndex * spacing,
        y: layerIndex * 100,
        layer: layerIndex
      };
      nodes.push(node);
      nodeMap.set(unit.id, node);
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

function buildAdjacencyList(
  units: StratigraphicUnit[],
  relations: StratigraphicRelation[]
): Map<string, string[]> {
  const adjacency = new Map<string, string[]>();
  
  units.forEach(u => adjacency.set(u.id, []));
  
  relations.forEach(r => {
    if (r.relationType === 'above' || r.relationType === 'cut') {
      const list = adjacency.get(r.fromUnitId);
      if (list && !list.includes(r.toUnitId)) {
        list.push(r.toUnitId);
      }
    } else if (r.relationType === 'below' || r.relationType === 'fills') {
      const list = adjacency.get(r.toUnitId);
      if (list && !list.includes(r.fromUnitId)) {
        list.push(r.fromUnitId);
      }
    }
  });
  
  return adjacency;
}

function topologicalSort(
  units: StratigraphicUnit[],
  adjacencyList: Map<string, string[]>
): StratigraphicUnit[][] {
  const inDegree = new Map<string, number>();
  const unitMap = new Map<string, StratigraphicUnit>();
  
  units.forEach(u => {
    inDegree.set(u.id, 0);
    unitMap.set(u.id, u);
  });
  
  adjacencyList.forEach((neighbors) => {
    neighbors.forEach(n => {
      inDegree.set(n, (inDegree.get(n) || 0) + 1);
    });
  });
  
  const layers: StratigraphicUnit[][] = [];
  const visited = new Set<string>();
  
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
  
  return layers;
}

export function detectCycles(projectId: string): string[][] {
  const units = getAllUnits(projectId);
  const relations = getRelationsByProject(projectId);
  const adjacencyList = buildAdjacencyList(units, relations);
  
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];
  
  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);
    
    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return true;
      }
    }
    
    path.pop();
    recStack.delete(nodeId);
    return false;
  }
  
  units.forEach(u => {
    if (!visited.has(u.id)) {
      dfs(u.id);
    }
  });
  
  return cycles;
}
