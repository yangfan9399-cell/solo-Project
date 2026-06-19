import {
  areIntervalsOverlapping,
  parseISO,
} from 'date-fns';
import type {
  WorkOrder,
  PartBatch,
  Conflict,
  ConflictType,
} from '@/types';

const genId = () => `conflict-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const activeStatuses: WorkOrder['status'][] = [
  'pending', 'approved', 'locked', 'in_progress', 'delayed', 'missing_parts',
];

const isWorkOrderActive = (wo: WorkOrder) => activeStatuses.includes(wo.status);

export function detectConflicts(
  workOrders: WorkOrder[],
  partBatches: PartBatch[],
): Conflict[] {
  const conflicts: Conflict[] = [];
  const detectedAt = new Date().toISOString();

  for (const wo of workOrders) {
    if (!isWorkOrderActive(wo) && wo.status !== 'approved') continue;

    for (const part of wo.parts) {
      const batch = partBatches.find((p) => p.id === part.partBatchId);
      if (batch && part.quantity > batch.totalStock) {
        conflicts.push({
          id: genId(),
          type: 'part_shortage',
          severity: 'critical',
          title: `备件库存不足：${part.partName}`,
          explanation: `工单 ${wo.code} 需求 ${part.quantity}${batch.unit}，但批号 ${batch.id} 库存仅 ${batch.totalStock}${batch.unit}。`,
          workOrderIds: [wo.id],
          partBatchId: part.partBatchId,
          detectedAt,
        });
      }
    }
  }

  for (const wo of workOrders) {
    if (!['approved', 'locked', 'in_progress'].includes(wo.status)) continue;
    if ((wo.riskLevel === 'high' || wo.riskLevel === 'critical') && !wo.safetyConfirmed) {
      conflicts.push({
        id: genId(),
        type: 'safety_unconfirmed',
        severity: 'critical',
        title: `高风险作业未确认：${wo.code}`,
        explanation: `工单 ${wo.code}（${wo.riskLevel === 'critical' ? '极高' : '高'}风险）尚未由安全审批人完成安全确认，不得执行。风险描述：${wo.riskDescription}`,
        workOrderIds: [wo.id],
        detectedAt,
      });
    }
  }

  const active = workOrders.filter(isWorkOrderActive);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.turbineId !== b.turbineId) continue;
      try {
        const overlap = areIntervalsOverlapping(
          { start: parseISO(a.startTime), end: parseISO(a.endTime) },
          { start: parseISO(b.startTime), end: parseISO(b.endTime) },
        );
        if (overlap) {
          conflicts.push({
            id: genId(),
            type: 'window_overlap',
            severity: 'critical',
            title: `停机窗口冲突：${a.turbineId}`,
            explanation: `风车 ${a.turbineId} 在同一时段被两条工单占用：${a.code} (${formatRange(a.startTime, a.endTime)}) 与 ${b.code} (${formatRange(b.startTime, b.endTime)})。同一风车无法同时执行两项检修。`,
            workOrderIds: [a.id, b.id],
            detectedAt,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  const partMap = new Map<string, (WorkOrder & { reqQty: number })[]>();
  for (const wo of workOrders) {
    if (!['pending', 'approved', 'locked', 'in_progress'].includes(wo.status)) continue;
    for (const part of wo.parts) {
      const list = partMap.get(part.partBatchId) ?? [];
      list.push({ ...wo, reqQty: part.quantity });
      partMap.set(part.partBatchId, list);
    }
  }

  for (const [partId, orders] of partMap) {
    if (orders.length < 2) continue;
    const batch = partBatches.find((p) => p.id === partId);
    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const a = orders[i];
        const b = orders[j];
        try {
          const overlap = areIntervalsOverlapping(
            { start: parseISO(a.startTime), end: parseISO(a.endTime) },
            { start: parseISO(b.startTime), end: parseISO(b.endTime) },
          );
          if (overlap && batch) {
            const sumQty = a.reqQty + b.reqQty;
            if (sumQty > batch.totalStock) {
              conflicts.push({
                id: genId(),
                type: 'part_overlap',
                severity: sumQty > batch.totalStock * 1.5 ? 'critical' : 'warning',
                title: `备件占用冲突：${batch.name}`,
                explanation: `批号 ${batch.id}（${batch.name}）库存 ${batch.totalStock}${batch.unit}，但工单 ${a.code} 需求 ${a.reqQty}${batch.unit} 与工单 ${b.code} 需求 ${b.reqQty}${batch.unit} 在时段重叠，合计 ${sumQty}${batch.unit} 超出库存。`,
                workOrderIds: [a.id, b.id],
                partBatchId: partId,
                detectedAt,
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return conflicts;
}

function formatRange(start: string, end: string): string {
  try {
    const s = parseISO(start);
    const e = parseISO(end);
    const fmt = (d: Date) =>
      `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${fmt(s)}–${fmt(e)}`;
  } catch {
    return `${start}–${end}`;
  }
}

export const CONFLICT_ORDER: Record<ConflictType, number> = {
  safety_unconfirmed: 0,
  window_overlap: 1,
  part_overlap: 2,
  part_shortage: 3,
};

export function sortConflicts(conflicts: Conflict[]): Conflict[] {
  return [...conflicts].sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'critical' ? -1 : 1;
    return CONFLICT_ORDER[a.type] - CONFLICT_ORDER[b.type];
  });
}
