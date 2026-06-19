import { useMemo } from 'react';
import { useAppStore } from '@/store';
import type { WorkOrder, PartBatch } from '@/types';
import { Grid3x3, AlertTriangle } from 'lucide-react';
import {
  eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, format, parseISO, isWithinInterval,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function PartsMatrix() {
  const {
    workOrders, partBatches, conflicts, selectWorkOrder, setMatrixWeekOffset, setMatrixSelectedPartId, ui,
  } = useAppStore();
  const weekOffset = ui.matrixWeekOffset ?? 0;
  const selectedPartId = ui.matrixSelectedPartId ?? 'all';

  const days = useMemo(() => {
    const base = new Date('2026-06-20');
    const start = startOfWeek(addWeeks(base, weekOffset), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [weekOffset]);

  const activeWOs = useMemo(
    () => workOrders.filter((w) => !['rejected', 'completed'].includes(w.status)),
    [workOrders],
  );

  const parts: PartBatch[] = useMemo(
    () => (selectedPartId === 'all' ? partBatches : partBatches.filter((p) => p.id === selectedPartId)),
    [partBatches, selectedPartId],
  );

  const cellData = (part: PartBatch, day: Date) => {
    const orders: (WorkOrder & { qty: number })[] = [];
    for (const wo of activeWOs) {
      for (const p of wo.parts) {
        if (p.partBatchId !== part.id) continue;
        try {
          if (isWithinInterval(day, { start: parseISO(wo.startTime), end: parseISO(wo.endTime) })) {
            orders.push({ ...wo, qty: p.quantity });
          }
        } catch { /* ignore */ }
      }
    }
    const total = orders.reduce((s, o) => s + o.qty, 0);
    const isConflict = conflicts.some((c) => c.partBatchId === part.id && c.type === 'part_overlap');
    let heat = 'heat-0';
    if (orders.length === 1) heat = 'heat-1';
    else if (orders.length === 2) heat = 'heat-2';
    else if (orders.length >= 3) heat = 'heat-3';
    if (isConflict && total > part.totalStock) heat = 'heat-conflict';
    return { orders, total, heatClass: heat, isShort: total > part.totalStock };
  };

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4 text-industrial-copper-400" />
          <h2 className="font-display text-lg tracking-wider text-industrial-copper-300">备件占用矩阵</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="text-[11px] bg-deep-sea-800 border border-deep-sea-600 text-deep-sea-100 px-2 py-1 font-mono"
            value={selectedPartId}
            onChange={(e) => setMatrixSelectedPartId(e.target.value)}
          >
            <option value="all">全部备件</option>
            {partBatches.map((p) => <option key={p.id} value={p.id}>{p.id} {p.name}</option>)}
          </select>
          <button className="btn btn-ghost !py-1 !px-2 text-[11px]" onClick={() => setMatrixWeekOffset(weekOffset - 1)}>上一周</button>
          <span className="font-mono text-xs text-deep-sea-200 min-w-[180px] text-center">
            {format(days[0], 'MM/dd', { locale: zhCN })} – {format(days[6], 'MM/dd', { locale: zhCN })}
          </span>
          <button className="btn btn-ghost !py-1 !px-2 text-[11px]" onClick={() => setMatrixWeekOffset(weekOffset + 1)}>下一周</button>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-2 border-b border-deep-sea-700 bg-deep-sea-900/40 items-center flex-wrap">
        <div className="flex items-center gap-1.5"><span className="w-4 h-3 heat-1 border border-deep-sea-700" /><span className="font-mono text-[10px] text-deep-sea-400">单工单</span></div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-3 heat-2 border border-deep-sea-700" /><span className="font-mono text-[10px] text-deep-sea-400">双工单</span></div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-3 heat-3 border border-deep-sea-700" /><span className="font-mono text-[10px] text-deep-sea-400">多工单</span></div>
        <div className="flex items-center gap-1.5"><span className="w-4 h-3 heat-conflict border border-alert-red-500" /><span className="font-mono text-[10px] text-alert-red-400">库存冲突</span></div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="sticky top-0 bg-deep-sea-900 z-10">
              <th className="text-left font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-3 py-2 border-b border-deep-sea-700 w-[200px]">
                备件批号 (库存)
              </th>
              {days.map((d) => (
                <th key={d.toISOString()} className="font-mono text-[10px] uppercase tracking-wider text-industrial-copper-400 px-2 py-2 border-b border-deep-sea-700 border-l border-deep-sea-700">
                  <div>{format(d, 'EEE', { locale: zhCN })}</div>
                  <div className="text-deep-sea-200">{format(d, 'MM/dd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.id}>
                <td className="px-3 py-2 border-b border-deep-sea-800 align-top">
                  <div className="font-mono text-xs text-industrial-copper-300">{part.id}</div>
                  <div className="text-[11px] text-deep-sea-100">{part.name}</div>
                  <div className="text-[10px] text-deep-sea-500 mt-0.5">
                    库存 {part.totalStock}{part.unit} · {part.category}
                  </div>
                </td>
                {days.map((d) => {
                  const cell = cellData(part, d);
                  return (
                    <td
                      key={d.toISOString()}
                      className={`border-b border-l border-deep-sea-800 align-top p-1 w-[90px] ${cell.heatClass} transition-all`}
                    >
                      {cell.orders.length > 0 && (
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            <span className={cell.isShort ? 'text-white glow-red' : 'text-deep-sea-100'}>
                              {cell.total}/{part.totalStock}
                            </span>
                            {cell.isShort && <AlertTriangle className="w-3 h-3 text-alert-red-200" />}
                          </div>
                          {cell.orders.slice(0, 2).map((o) => (
                            <button
                              key={o.id}
                              onClick={() => selectWorkOrder(o.id)}
                              className="block w-full text-left text-[10px] font-mono bg-deep-sea-800/70 border border-deep-sea-600 px-1 py-0.5 truncate hover:bg-industrial-copper-700 hover:border-industrial-copper-500 hover:text-white transition-all"
                              title={`${o.code} ${o.turbineId} · 需求 ${o.qty}${part.unit}`}
                            >
                              {o.code.slice(-4)} {o.turbineId} ×{o.qty}
                            </button>
                          ))}
                          {cell.orders.length > 2 && (
                            <div className="text-[10px] text-industrial-copper-400 font-mono px-1">
                              +{cell.orders.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
