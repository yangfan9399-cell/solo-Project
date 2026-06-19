import { useMemo, useState } from 'react';
import { useAppStore } from '@/store';
import { StatusBadge, RiskBadge } from './StatusBadge';
import { TOWER_SECTION_LABELS, STATUS_LABELS, RISK_LABELS } from '@/types';
import type { WorkOrderStatus, RiskLevel } from '@/types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ListFilter, Filter, X, Eye, Edit2, Trash2, Check, Lock, XCircle,
  ShieldAlert, Clock, CheckCircle2, ArrowUpCircle,
} from 'lucide-react';

export function WorkOrderQueue() {
  const {
    workOrders, teams, filters, setFilters, clearFilters, selectWorkOrder,
    openWorkOrderModal, deleteWorkOrder, conflicts,
    submitForApproval, approveWorkOrder, rejectWorkOrder,
    lockWorkOrder, unlockWorkOrder, confirmSafety, markDelayed, markCompleted,
  } = useAppStore();
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = useMemo(() => {
    let list = [...workOrders];
    if (filters.status?.length) list = list.filter((w) => filters.status!.includes(w.status));
    if (filters.turbineId) list = list.filter((w) => w.turbineId === filters.turbineId);
    if (filters.teamId) list = list.filter((w) => w.teamId === filters.teamId);
    if (filters.riskLevel?.length) list = list.filter((w) => filters.riskLevel!.includes(w.riskLevel));
    return list.sort((a, b) => parseISO(b.updatedAt).getTime() - parseISO(a.updatedAt).getTime());
  }, [workOrders, filters]);

  const turbineIds = Array.from(new Set(workOrders.map((w) => w.turbineId))).sort();
  const toggleStatus = (s: WorkOrderStatus) => {
    const curr = filters.status ?? [];
    setFilters({ status: curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s] });
  };
  const toggleRisk = (r: RiskLevel) => {
    const curr = filters.riskLevel ?? [];
    setFilters({ riskLevel: curr.includes(r) ? curr.filter((x) => x !== r) : [...curr, r] });
  };

  const hasConflict = (woId: string) =>
    conflicts.some((c) => c.workOrderIds.includes(woId));

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-industrial-copper-400" />
          <h2 className="font-display text-lg tracking-wider text-industrial-copper-300">工单队列</h2>
          <span className="font-mono text-[11px] text-deep-sea-400">{filtered.length} / {workOrders.length}</span>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-deep-sea-700 space-y-2 bg-deep-sea-900/40">
        <div className="flex flex-wrap gap-1.5 items-center">
          <Filter className="w-3.5 h-3.5 text-industrial-copper-400" />
          <span className="font-mono text-[10px] text-industrial-copper-400 uppercase tracking-wider mr-1">状态:</span>
          {(Object.keys(STATUS_LABELS) as WorkOrderStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`text-[10px] px-2 py-0.5 border font-mono transition-all
                ${filters.status?.includes(s)
                  ? 'bg-industrial-copper-600 border-industrial-copper-400 text-deep-sea-950'
                  : 'bg-deep-sea-800 border-deep-sea-600 text-deep-sea-200 hover:bg-deep-sea-700'}`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="font-mono text-[10px] text-industrial-copper-400 uppercase tracking-wider mr-1 w-10">风险:</span>
          {(Object.keys(RISK_LABELS) as RiskLevel[]).map((r) => (
            <button
              key={r}
              onClick={() => toggleRisk(r)}
              className={`text-[10px] px-2 py-0.5 border font-mono transition-all
                ${filters.riskLevel?.includes(r)
                  ? 'bg-industrial-copper-600 border-industrial-copper-400 text-deep-sea-950'
                  : 'bg-deep-sea-800 border-deep-sea-600 text-deep-sea-200 hover:bg-deep-sea-700'}`}
            >
              {RISK_LABELS[r]}
            </button>
          ))}
          <select
            className="ml-auto text-[11px] bg-deep-sea-800 border border-deep-sea-600 text-deep-sea-100 px-2 py-1 font-mono"
            value={filters.turbineId ?? ''}
            onChange={(e) => setFilters({ turbineId: e.target.value || undefined })}
          >
            <option value="">全部风车</option>
            {turbineIds.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            className="text-[11px] bg-deep-sea-800 border border-deep-sea-600 text-deep-sea-100 px-2 py-1 font-mono"
            value={filters.teamId ?? ''}
            onChange={(e) => setFilters({ teamId: e.target.value || undefined })}
          >
            <option value="">全部班组</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={clearFilters} className="btn btn-ghost !py-0.5 !px-2 text-[10px]">
            <X className="w-3 h-3" />清除
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="table-industrial w-full">
          <thead className="sticky top-0 bg-deep-sea-900 z-10">
            <tr>
              <th>工单编号</th>
              <th>风车/塔段</th>
              <th>标题</th>
              <th>停机窗口</th>
              <th>班组</th>
              <th>风险</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((wo) => {
              const team = teams.find((t) => t.id === wo.teamId);
              const conflicted = hasConflict(wo.id);
              return (
                <tr
                  key={wo.id}
                  className={`cursor-pointer ${conflicted ? 'bg-alert-red-900/20' : ''}`}
                  onClick={() => selectWorkOrder(wo.id)}
                >
                  <td className="font-mono text-xs text-industrial-copper-300 whitespace-nowrap">
                    {conflicted && <span className="inline-block w-1.5 h-1.5 bg-alert-red-500 rounded-full mr-1.5 conflict-pulse align-middle" />}
                    {wo.code}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="font-mono text-xs text-deep-sea-100">{wo.turbineId}</div>
                    <div className="text-[10px] text-deep-sea-400">{TOWER_SECTION_LABELS[wo.towerSection]}</div>
                  </td>
                  <td className="text-sm text-deep-sea-100 max-w-[200px] truncate" title={wo.title}>
                    {wo.title}
                  </td>
                  <td className="font-mono text-[11px] text-deep-sea-300 whitespace-nowrap">
                    <div>{format(parseISO(wo.startTime), 'MM-dd HH:mm', { locale: zhCN })}</div>
                    <div className="text-deep-sea-500">→ {format(parseISO(wo.endTime), 'MM-dd HH:mm', { locale: zhCN })}</div>
                  </td>
                  <td className="text-xs text-deep-sea-200">{team?.name}</td>
                  <td><RiskBadge level={wo.riskLevel} /></td>
                  <td><StatusBadge status={wo.status} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      <button className="btn btn-ghost !p-1" onClick={() => selectWorkOrder(wo.id)} title="查看">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {wo.status !== 'locked' && wo.status !== 'completed' && (
                        <button className="btn btn-ghost !p-1" onClick={() => openWorkOrderModal(wo.id)} title="编辑">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {wo.status === 'draft' && (
                        <button className="btn btn-secondary !py-0.5 !px-2 text-[10px]" onClick={() => submitForApproval(wo.id)}>
                          <ArrowUpCircle className="w-3 h-3" />提交
                        </button>
                      )}
                      {wo.status === 'pending' && (
                        <>
                          <button className="btn btn-success !py-0.5 !px-2 text-[10px]" onClick={() => approveWorkOrder(wo.id)}>
                            <Check className="w-3 h-3" />通过
                          </button>
                          <button className="btn btn-danger !py-0.5 !px-2 text-[10px]" onClick={() => { setRejectTarget(wo.id); setRejectReason(''); }}>
                            <XCircle className="w-3 h-3" />驳回
                          </button>
                        </>
                      )}
                      {wo.status === 'approved' && (
                        <>
                          <button className="btn btn-primary !py-0.5 !px-2 text-[10px]" onClick={() => lockWorkOrder(wo.id)}>
                            <Lock className="w-3 h-3" />锁定
                          </button>
                          {(wo.riskLevel === 'high' || wo.riskLevel === 'critical') && !wo.safetyConfirmed && (
                            <button className="btn btn-secondary !py-0.5 !px-2 text-[10px]" onClick={() => confirmSafety(wo.id)}>
                              <ShieldAlert className="w-3 h-3" />安全确认
                            </button>
                          )}
                        </>
                      )}
                      {wo.status === 'locked' && (
                        <button className="btn btn-secondary !py-0.5 !px-2 text-[10px]" onClick={() => unlockWorkOrder(wo.id)}>
                          <Lock className="w-3 h-3" />解锁
                        </button>
                      )}
                      {(wo.status === 'approved' || wo.status === 'locked') && (
                        <>
                          <button className="btn btn-secondary !py-0.5 !px-2 text-[10px]" onClick={() => markDelayed(wo.id)}>
                            <Clock className="w-3 h-3" />延期
                          </button>
                          <button className="btn btn-success !py-0.5 !px-2 text-[10px]" onClick={() => markCompleted(wo.id)}>
                            <CheckCircle2 className="w-3 h-3" />完成
                          </button>
                        </>
                      )}
                      {wo.status === 'draft' && (
                        <button className="btn btn-ghost !p-1" onClick={() => {
                          if (confirm(`确定删除工单 ${wo.code}?`)) deleteWorkOrder(wo.id);
                        }} title="删除">
                          <Trash2 className="w-3.5 h-3.5 text-alert-red-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-deep-sea-500 font-mono text-xs">
                  暂无匹配的工单
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-deep-sea-950/80 flex items-center justify-center p-4" onClick={() => setRejectTarget(null)}>
          <div className="panel w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg text-industrial-copper-300 mb-3">驳回工单</h3>
            <label className="label">驳回原因</label>
            <textarea className="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="请输入驳回原因..." rows={4} />
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>取消</button>
              <button className="btn btn-danger" disabled={!rejectReason.trim()} onClick={() => {
                rejectWorkOrder(rejectTarget, rejectReason.trim());
                setRejectTarget(null);
              }}>确认驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
