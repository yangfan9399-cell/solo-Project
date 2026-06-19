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

const schedulingStatuses: WorkOrder['status'][] = [
  'draft', 'pending', 'approved', 'locked', 'in_progress', 'delayed', 'missing_parts',
];

const activeStatuses: WorkOrder['status'][] = [
  'pending', 'approved', 'locked', 'in_progress', 'delayed', 'missing_parts',
];

const isInScheduling = (wo: WorkOrder) => schedulingStatuses.includes(wo.status);
const isWorkOrderActive = (wo: WorkOrder) => activeStatuses.includes(wo.status);

export function detectConflicts(
  workOrders: WorkOrder[],
  partBatches: PartBatch[],
): Conflict[] {
  const conflicts: Conflict[] = [];
  const detectedAt = new Date().toISOString();

  // ========== 1. 备件库存不足（所有排程中状态 + 数量 > 库存） ==========
  for (const wo of workOrders) {
    if (!isInScheduling(wo)) continue;
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

  // ========== 2. 高风险作业未确认（含 draft/pending/approved/locked/in_progress/delayed/missing_parts） ==========
  for (const wo of workOrders) {
    if (!isInScheduling(wo)) continue;
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

  // ========== 3. 停机窗口冲突（同一风车 + 时间重叠） ==========
  // 所有排程中状态均参与检测 — 草稿也是排程计划，需要与已排定的窗口做冲突预警
  const scheduled = workOrders.filter(isInScheduling);
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];
      if (a.turbineId !== b.turbineId) continue;
      try {
        const overlap = areIntervalsOverlapping(
          { start: parseISO(a.startTime), end: parseISO(a.endTime) },
          { start: parseISO(b.startTime), end: parseISO(b.endTime) },
        );
        if (overlap) {
          // 有一方是 draft 则 severity 降为 warning（因为草稿可调整）
          const hasDraft = a.status === 'draft' || b.status === 'draft';
          conflicts.push({
            id: genId(),
            type: 'window_overlap',
            severity: hasDraft ? 'warning' : 'critical',
            title: `停机窗口冲突：${a.turbineId}`,
            explanation: `风车 ${a.turbineId} 在同一时段被两条工单占用：${a.code}[${a.status}] (${formatRange(a.startTime, a.endTime)}) 与 ${b.code}[${b.status}] (${formatRange(b.startTime, b.endTime)})。同一风车无法同时执行两项检修${hasDraft ? '，其中一方仍为草稿可调整排期' : '，必须调整排程窗口'}。`,
            workOrderIds: [a.id, b.id],
            detectedAt,
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // ========== 4. 备件占用冲突（同一备件批号 + 时间重叠） ==========
  // 核心修复：只要同一备件批号在时间段上被多个工单占用 — 就告警（物理件无法同时被两处使用）
  // 再叠加「累计用量 > 库存」提升严重级别
  const partMap = new Map<string, (WorkOrder & { reqQty: number })[]>();
  for (const wo of workOrders) {
    if (!isInScheduling(wo)) continue; // draft/pending/approved/locked/in_progress/delayed/missing_parts 都纳入
    for (const part of wo.parts) {
      const list = partMap.get(part.partBatchId) ?? [];
      list.push({ ...wo, reqQty: part.quantity });
      partMap.set(part.partBatchId, list);
    }
  }

  for (const [partId, orders] of partMap) {
    if (orders.length < 2) continue;
    const batch = partBatches.find((p) => p.id === partId);
    if (!batch) continue;

    for (let i = 0; i < orders.length; i++) {
      for (let j = i + 1; j < orders.length; j++) {
        const a = orders[i];
        const b = orders[j];
        try {
          const overlap = areIntervalsOverlapping(
            { start: parseISO(a.startTime), end: parseISO(a.endTime) },
            { start: parseISO(b.startTime), end: parseISO(b.endTime) },
          );
          if (overlap) {
            const sumQty = a.reqQty + b.reqQty;
            // 时间重叠即告警（物理占用冲突），再按数量定级
            const stockExceeded = sumQty > batch.totalStock;
            const hasDraft = a.status === 'draft' || b.status === 'draft';
            let severity: 'warning' | 'critical';
            if (stockExceeded) severity = 'critical';
            else if (hasDraft) severity = 'warning';
            else severity = 'warning';

            conflicts.push({
              id: genId(),
              type: 'part_overlap',
              severity,
              title: `备件占用冲突：${batch.name} [${batch.id}]`,
              explanation:
                stockExceeded
                  ? `批号 ${batch.id}（${batch.name}）库存 ${batch.totalStock}${batch.unit}，工单 ${a.code} 需求 ${a.reqQty}${batch.unit} 与 ${b.code} 需求 ${b.reqQty}${batch.unit} 在时段 (${formatRange(a.startTime, a.endTime)} ∩ ${formatRange(b.startTime, b.endTime)}) 重叠，合计 ${sumQty}${batch.unit} 超出库存且物理上无法同时使用。`
                  : `批号 ${batch.id}（${batch.name}）为同一物理备件，工单 ${a.code} 需求 ${a.reqQty}${batch.unit} 与 ${b.code} 需求 ${b.reqQty}${batch.unit} 在时段 (${formatRange(a.startTime, a.endTime)} ∩ ${formatRange(b.startTime, b.endTime)}) 重叠，无法同时被两处作业占用${hasDraft ? '，可通过调整排期或改派备件解决' : ''}。`,
              workOrderIds: [a.id, b.id],
              partBatchId: partId,
              detectedAt,
            });
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
