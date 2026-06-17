import { getAllUnits } from './units';
import { getRelationsByProject } from './relations';
import { detectCycles } from './harrisMatrix';
import type { Anomaly } from '../types';
import { generateId, now } from './utils';

export function detectAnomalies(projectId: string): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  anomalies.push(...detectStratigraphicCycles(projectId));
  anomalies.push(...detectDepthConflicts(projectId));
  anomalies.push(...detectOrphanUnits(projectId));
  anomalies.push(...detectThicknessMismatch(projectId));
  anomalies.push(...detectUnconfirmedRelations(projectId));
  
  return anomalies;
}

function detectStratigraphicCycles(projectId: string): Anomaly[] {
  const cycles = detectCycles(projectId);
  
  return cycles.map((cycle, index) => ({
    id: generateId(),
    projectId,
    type: 'stratigraphic_cycle' as const,
    severity: 'error' as const,
    title: `层位循环关系 #${index + 1}`,
    description: `检测到 ${cycle.length} 个层位单元形成循环关系，这在地层学中是不可能的。请检查关系设置。`,
    relatedUnitIds: cycle,
    resolved: false,
    createdAt: now()
  }));
}

function detectDepthConflicts(projectId: string): Anomaly[] {
  const units = getAllUnits(projectId);
  const relations = getRelationsByProject(projectId);
  const anomalies: Anomaly[] = [];
  
  relations.forEach(rel => {
    if (rel.relationType === 'above') {
      const fromUnit = units.find(u => u.id === rel.fromUnitId);
      const toUnit = units.find(u => u.id === rel.toUnitId);
      
      if (fromUnit && toUnit) {
        if (fromUnit.depthBottom > toUnit.depthTop) {
          anomalies.push({
            id: generateId(),
            projectId,
            type: 'depth_conflict',
            severity: 'warning',
            title: `深度冲突: ${fromUnit.unitNumber} / ${toUnit.unitNumber}`,
            description: `${fromUnit.unitNumber} 被标记为在 ${toUnit.unitNumber} 之上，但其底部深度 (${fromUnit.depthBottom}m) 大于 ${toUnit.unitNumber} 的顶部深度 (${toUnit.depthTop}m)。`,
            relatedUnitIds: [fromUnit.id, toUnit.id],
            resolved: false,
            createdAt: now()
          });
        }
      }
    }
  });
  
  return anomalies;
}

function detectOrphanUnits(projectId: string): Anomaly[] {
  const units = getAllUnits(projectId);
  const relations = getRelationsByProject(projectId);
  const anomalies: Anomaly[] = [];
  
  units.forEach(unit => {
    const hasRelation = relations.some(
      r => r.fromUnitId === unit.id || r.toUnitId === unit.id
    );
    
    if (!hasRelation && units.length > 1) {
      anomalies.push({
        id: generateId(),
        projectId,
        type: 'orphan_unit',
        severity: 'info',
        title: `孤立层位: ${unit.unitNumber}`,
        description: `${unit.unitNumber} (${unit.designation || '未命名'}) 尚未与任何其他层位单元建立关系。建议添加上下层关系。`,
        relatedUnitIds: [unit.id],
        resolved: false,
        createdAt: now()
      });
    }
  });
  
  return anomalies;
}

function detectThicknessMismatch(projectId: string): Anomaly[] {
  const units = getAllUnits(projectId);
  const anomalies: Anomaly[] = [];
  
  units.forEach(unit => {
    const calculatedThickness = unit.depthBottom - unit.depthTop;
    const expectedThickness = unit.thickness;
    
    if (Math.abs(calculatedThickness - expectedThickness) > 0.01) {
      anomalies.push({
        id: generateId(),
        projectId,
        type: 'thickness_mismatch',
        severity: 'warning',
        title: `厚度不一致: ${unit.unitNumber}`,
        description: `${unit.unitNumber} 的记录厚度为 ${expectedThickness}m，但根据顶底深度计算应为 ${calculatedThickness.toFixed(2)}m。`,
        relatedUnitIds: [unit.id],
        resolved: false,
        createdAt: now()
      });
    }
  });
  
  return anomalies;
}

function detectUnconfirmedRelations(projectId: string): Anomaly[] {
  const relations = getRelationsByProject(projectId);
  const units = getAllUnits(projectId);
  const anomalies: Anomaly[] = [];
  
  const unconfirmed = relations.filter(r => !r.confirmed);
  
  if (unconfirmed.length > 0) {
    const unitIds = [...new Set([...unconfirmed.map(r => r.fromUnitId), ...unconfirmed.map(r => r.toUnitId)])];
    
    anomalies.push({
      id: generateId(),
      projectId,
      type: 'unconfirmed_relation',
      severity: 'info',
      title: `未确认关系`,
      description: `共有 ${unconfirmed.length} 条层位关系尚未确认。建议核实后标记为已确认。`,
      relatedUnitIds: unitIds,
      resolved: false,
      createdAt: now()
    });
  }
  
  return anomalies;
}

export function getAnomalySummary(anomalies: Anomaly[]) {
  const errors = anomalies.filter(a => a.severity === 'error').length;
  const warnings = anomalies.filter(a => a.severity === 'warning').length;
  const infos = anomalies.filter(a => a.severity === 'info').length;
  
  return { errors, warnings, infos, total: anomalies.length };
}
