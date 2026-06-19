import { useAppStore } from '@/store';
import { ConflictTypeBadge } from './StatusBadge';
import { AlertTriangle, AlertOctagon, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function ConflictPanel() {
  const { conflicts, workOrders, selectWorkOrder } = useAppStore();

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 text-alert-red-400" />
          <h2 className="font-display text-lg tracking-wider text-industrial-copper-300">冲突检测</h2>
          <span className={`font-mono text-[11px] px-2 py-0.5 border ${conflicts.length > 0 ? 'bg-alert-red-700 border-alert-red-500 text-white' : 'bg-safety-green-700 border-safety-green-500 text-white'}`}>
            {conflicts.length} 项
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2.5">
        {conflicts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-deep-sea-500">
            <AlertTriangle className="w-10 h-10 opacity-40 mb-2" />
            <p className="font-mono text-sm">当前无冲突 · 排程健康</p>
          </div>
        ) : (
          conflicts.map((c) => {
            const related = workOrders.filter((w) => c.workOrderIds.includes(w.id));
            return (
              <div
                key={c.id}
                className={`animate-slide-in border p-3 transition-all
                  ${c.severity === 'critical'
                    ? 'bg-alert-red-900/30 border-alert-red-600/60 conflict-pulse'
                    : 'bg-warn-orange-900/20 border-warn-orange-600/50'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ConflictTypeBadge type={c.type} severity={c.severity} />
                    <h3 className={`font-mono text-sm font-bold ${c.severity === 'critical' ? 'text-white' : 'text-warn-orange-200'}`}>
                      {c.title}
                    </h3>
                  </div>
                  <span className="font-mono text-[10px] text-deep-sea-400 whitespace-nowrap">
                    {format(parseISO(c.detectedAt), 'MM-dd HH:mm', { locale: zhCN })}
                  </span>
                </div>
                <p className="text-[12px] text-deep-sea-200 leading-relaxed mb-2">
                  {c.explanation}
                </p>
                {related.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="font-mono text-[10px] text-industrial-copper-400 uppercase tracking-wider self-center mr-1">关联:</span>
                    {related.map((wo) => (
                      <button
                        key={wo.id}
                        onClick={() => selectWorkOrder(wo.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] bg-deep-sea-800 border border-deep-sea-600 text-deep-sea-100 hover:bg-industrial-copper-700 hover:border-industrial-copper-500 hover:text-white transition-all"
                      >
                        {wo.code}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
