import { useAppStore } from '@/store';
import { StatusBadge, RiskBadge } from './StatusBadge';
import { ApprovalTimeline } from './ApprovalTimeline';
import { TOWER_SECTION_LABELS } from '@/types';
import { X, MapPin, Calendar, Users, ShieldAlert, Package, FileText, Edit2, Lock, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function WorkOrderDetail() {
  const { ui, workOrders, partBatches, teams, conflicts, selectWorkOrder, openWorkOrderModal, lockWorkOrder, confirmSafety, unlockWorkOrder } = useAppStore();
  const wo = workOrders.find((w) => w.id === ui.selectedWorkOrderId);

  if (!wo) return null;

  const team = teams.find((t) => t.id === wo.teamId);
  const relatedConflicts = conflicts.filter((c) => c.workOrderIds.includes(wo.id));

  return (
    <div className="fixed inset-0 z-50 bg-deep-sea-950/85 flex items-center justify-center p-4" onClick={() => selectWorkOrder(undefined)}>
      <div className="panel w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-display text-2xl text-industrial-copper-400 glow-copper tracking-wider">{wo.code}</div>
            <StatusBadge status={wo.status} />
            <RiskBadge level={wo.riskLevel} />
            {relatedConflicts.length > 0 && (
              <span className="tag bg-alert-red-600 border-alert-red-400 text-white conflict-pulse">
                {relatedConflicts.length} 项冲突
              </span>
            )}
          </div>
          <button className="btn btn-ghost !p-1" onClick={() => selectWorkOrder(undefined)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          <h2 className="text-xl text-deep-sea-50 font-mono mb-4">{wo.title}</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-industrial-copper-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-mono text-[10px] uppercase text-industrial-copper-400 tracking-wider">风车 / 塔段</div>
                <div className="text-deep-sea-100 text-sm">{wo.turbineId} · {TOWER_SECTION_LABELS[wo.towerSection]}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-industrial-copper-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-mono text-[10px] uppercase text-industrial-copper-400 tracking-wider">停机窗口</div>
                <div className="text-deep-sea-100 text-sm font-mono">
                  {format(parseISO(wo.startTime), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  <span className="mx-1 text-deep-sea-500">→</span>
                  {format(parseISO(wo.endTime), 'MM-dd HH:mm', { locale: zhCN })}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-industrial-copper-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-mono text-[10px] uppercase text-industrial-copper-400 tracking-wider">负责班组</div>
                <div className="text-deep-sea-100 text-sm">{team?.name} <span className="text-deep-sea-400 text-xs">· 组长 {team?.leader}</span></div>
                {team && <div className="text-[11px] text-deep-sea-400 mt-0.5">{team.members.join('、')}</div>}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-industrial-copper-400 mt-0.5 shrink-0" />
              <div>
                <div className="font-mono text-[10px] uppercase text-industrial-copper-400 tracking-wider">安全确认</div>
                <div className="text-deep-sea-100 text-sm">
                  {wo.safetyConfirmed
                    ? <span className="text-safety-green-400"><Check className="w-3.5 h-3.5 inline" /> 已完成</span>
                    : <span className="text-alert-red-400">未确认</span>}
                </div>
              </div>
            </div>
          </div>

          {wo.description && (
            <div className="mb-4">
              <div className="font-mono text-[10px] uppercase text-industrial-copper-400 tracking-wider mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> 工单描述
              </div>
              <div className="bg-deep-sea-900 border border-deep-sea-700 p-3 text-sm text-deep-sea-100 leading-relaxed">{wo.description}</div>
            </div>
          )}

          {(wo.riskLevel === 'high' || wo.riskLevel === 'critical') && (
            <div className="mb-4 border border-alert-red-600/50 bg-alert-red-900/20 p-3">
              <div className="font-mono text-[10px] uppercase text-alert-red-400 tracking-wider mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> 风险描述
              </div>
              <div className="text-sm text-alert-red-200">{wo.riskDescription}</div>
            </div>
          )}

          <div className="mb-4">
            <div className="font-mono text-[10px] uppercase text-industrial-copper-400 tracking-wider mb-2 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> 备件需求 ({wo.parts.length})
            </div>
            {wo.parts.length === 0 ? (
              <div className="text-xs text-deep-sea-500">无需备件</div>
            ) : (
              <div className="space-y-1">
                {wo.parts.map((p) => {
                  const batch = partBatches.find((b) => b.id === p.partBatchId);
                  const short = batch && p.quantity > batch.totalStock;
                  return (
                    <div key={p.partBatchId} className={`flex items-center justify-between px-3 py-2 border ${short ? 'bg-alert-red-900/30 border-alert-red-700' : 'bg-deep-sea-900/60 border-deep-sea-700'}`}>
                      <div>
                        <div className="text-sm text-deep-sea-100 font-mono">{p.partBatchId}</div>
                        <div className="text-[11px] text-deep-sea-300">{p.partName}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono text-sm ${short ? 'text-alert-red-300 glow-red' : 'text-industrial-copper-300'}`}>
                          需求 {p.quantity} {batch?.unit}
                        </div>
                        {batch && <div className="text-[10px] text-deep-sea-400">库存 {batch.totalStock}{batch.unit}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {wo.rejectionReason && (
            <div className="mb-4 border border-alert-red-600/40 bg-alert-red-900/20 p-3">
              <div className="font-mono text-[10px] uppercase text-alert-red-400 tracking-wider mb-1">驳回原因</div>
              <div className="text-sm text-alert-red-200">{wo.rejectionReason}</div>
            </div>
          )}

          <div className="mt-5">
            <ApprovalTimeline workOrderId={wo.id} />
          </div>
        </div>

        <div className="panel-header border-t border-industrial-copper-600/30 px-5 py-3 flex justify-end gap-2 flex-wrap">
          {wo.status === 'approved' && (
            <>
              <button className="btn btn-secondary" onClick={() => openWorkOrderModal(wo.id)}>
                <Edit2 className="w-4 h-4" /> 编辑
              </button>
              {(wo.riskLevel === 'high' || wo.riskLevel === 'critical') && !wo.safetyConfirmed && (
                <button className="btn btn-success" onClick={() => confirmSafety(wo.id)}>
                  <ShieldAlert className="w-4 h-4" /> 完成安全确认
                </button>
              )}
              <button className="btn btn-primary" onClick={() => lockWorkOrder(wo.id)}>
                <Lock className="w-4 h-4" /> 锁定排程
              </button>
            </>
          )}
          {wo.status === 'locked' && (
            <button className="btn btn-secondary" onClick={() => unlockWorkOrder(wo.id)}>
              <Lock className="w-4 h-4" /> 解除锁定
            </button>
          )}
          {(wo.status === 'draft' || wo.status === 'pending') && (
            <button className="btn btn-secondary" onClick={() => openWorkOrderModal(wo.id)}>
              <Edit2 className="w-4 h-4" /> 编辑
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => selectWorkOrder(undefined)}>关闭</button>
        </div>
      </div>
    </div>
  );
}
