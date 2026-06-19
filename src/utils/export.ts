import type { WorkOrder, PartBatch, TechnicianTeam, Conflict } from '@/types';
import { TOWER_SECTION_LABELS, STATUS_LABELS, RISK_LABELS, CONFLICT_TYPE_LABELS } from '@/types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  } catch {
    return iso;
  }
}

export function generateWorkOrderCSV(
  workOrders: WorkOrder[],
  teams: TechnicianTeam[],
): string {
  const headers = [
    '工单编号', '风车编号', '塔段位置', '标题', '描述',
    '开始时间', '结束时间', '负责班组', '备件需求',
    '风险等级', '风险描述', '安全确认', '状态', '创建人', '审批人',
  ];
  const rows = workOrders.map((w) => {
    const team = teams.find((t) => t.id === w.teamId)?.name ?? w.teamId;
    const parts = w.parts.map((p) => `${p.partName}×${p.quantity}`).join('; ');
    return [
      w.code, w.turbineId, TOWER_SECTION_LABELS[w.towerSection], w.title, w.description,
      fmtDate(w.startTime), fmtDate(w.endTime), team, parts,
      RISK_LABELS[w.riskLevel], w.riskDescription, w.safetyConfirmed ? '是' : '否',
      STATUS_LABELS[w.status], w.createdBy, w.approvedBy ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function generatePartsMatrixCSV(
  workOrders: WorkOrder[],
  partBatches: PartBatch[],
): string {
  const headers = ['备件批号', '备件名称', '分类', '库存总量', '单位', '占用工单编号', '合计占用量'];
  const map = new Map<string, { code: string; qty: number }[]>();
  for (const w of workOrders) {
    if (['rejected', 'completed', 'draft'].includes(w.status)) continue;
    for (const p of w.parts) {
      const list = map.get(p.partBatchId) ?? [];
      list.push({ code: w.code, qty: p.quantity });
      map.set(p.partBatchId, list);
    }
  }
  const rows = partBatches.map((pb) => {
    const uses = map.get(pb.id) ?? [];
    const codes = uses.map((u) => u.code).join('; ');
    const total = uses.reduce((s, u) => s + u.qty, 0);
    return [
      pb.id, pb.name, pb.category, pb.totalStock, pb.unit, codes, total,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function generateConflictsCSV(conflicts: Conflict[]): string {
  const headers = ['冲突类型', '严重程度', '标题', '解释', '关联工单', '检测时间'];
  const rows = conflicts.map((c) => [
    CONFLICT_TYPE_LABELS[c.type],
    c.severity === 'critical' ? '严重' : '警告',
    c.title,
    c.explanation,
    c.workOrderIds.join('; '),
    fmtDate(c.detectedAt),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toJSONPretty<T>(data: T): string {
  return JSON.stringify(data, null, 2);
}
