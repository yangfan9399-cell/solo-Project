import { useAppStore } from '@/store';
import type { ApprovalAction } from '@/types';
import { ScrollText, Send, CheckCircle, XCircle, Lock, Unlock, ShieldAlert, Clock, CheckCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ACTION_META: Record<ApprovalAction, { label: string; Icon: typeof Send; color: string }> = {
  submit: { label: '提交审批', Icon: Send, color: 'bg-warn-orange-600 border-warn-orange-400 text-white' },
  approve: { label: '审批通过', Icon: CheckCircle, color: 'bg-safety-green-600 border-safety-green-400 text-white' },
  reject: { label: '审批驳回', Icon: XCircle, color: 'bg-alert-red-600 border-alert-red-400 text-white' },
  lock: { label: '排程锁定', Icon: Lock, color: 'bg-industrial-copper-600 border-industrial-copper-400 text-deep-sea-950' },
  unlock: { label: '解除锁定', Icon: Unlock, color: 'bg-deep-sea-500 border-deep-sea-300 text-white' },
  safety_confirm: { label: '安全确认', Icon: ShieldAlert, color: 'bg-safety-green-700 border-safety-green-500 text-white' },
  delay: { label: '标记延期', Icon: Clock, color: 'bg-warn-orange-700 border-warn-orange-500 text-white' },
  complete: { label: '工单完成', Icon: CheckCheck, color: 'bg-safety-green-600 border-safety-green-400 text-white' },
};

export function ApprovalTimeline({ workOrderId }: { workOrderId?: string }) {
  const { approvals, workOrders, selectWorkOrder } = useAppStore();
  const list = workOrderId
    ? approvals.filter((a) => a.workOrderId === workOrderId)
    : approvals.slice().sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()).slice(0, 50);

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-industrial-copper-400" />
          <h2 className="font-display text-lg tracking-wider text-industrial-copper-300">
            {workOrderId ? '工单审批记录' : '审批历史'}
          </h2>
        </div>
        <span className="font-mono text-[11px] text-deep-sea-400">{list.length} 条</span>
      </div>

      <div className="flex-1 overflow-auto p-3">
        {list.length === 0 ? (
          <div className="text-center py-8 text-deep-sea-500 font-mono text-xs">暂无记录</div>
        ) : (
          <div className="relative pl-5">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-deep-sea-700" />
            <div className="space-y-3">
              {list.map((a) => {
                const meta = ACTION_META[a.action];
                const wo = workOrders.find((w) => w.id === a.workOrderId);
                const Icon = meta.Icon;
                return (
                  <div key={a.id} className="relative">
                    <div className={`absolute -left-3.5 w-5 h-5 rounded-sm flex items-center justify-center border ${meta.color}`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="ml-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`tag ${meta.color}`}>{meta.label}</span>
                        {wo && !workOrderId && (
                          <button
                            onClick={() => selectWorkOrder(wo.id)}
                            className="font-mono text-xs text-industrial-copper-300 hover:text-industrial-copper-200 hover:underline"
                          >
                            {wo.code}
                          </button>
                        )}
                        <span className="font-mono text-[10px] text-deep-sea-500">
                          {format(parseISO(a.timestamp), 'MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      </div>
                      <div className="text-[11px] text-deep-sea-200 mt-0.5">
                        <span className="text-industrial-copper-400">{a.operator}</span>
                        <span className="text-deep-sea-500 mx-1">·</span>
                        <span className="text-deep-sea-400">{a.operatorRole}</span>
                      </div>
                      {a.comment && (
                        <div className="text-[11px] text-deep-sea-300 mt-1 bg-deep-sea-800/60 border border-deep-sea-700 px-2 py-1">
                          {a.comment}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
