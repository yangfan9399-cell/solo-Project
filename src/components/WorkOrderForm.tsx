import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import type { PartRequirement, TowerSection, RiskLevel, WorkOrderStatus } from '@/types';
import { TOWER_SECTION_LABELS, RISK_LABELS } from '@/types';
import { X, Plus, Trash2, Save } from 'lucide-react';

const toLocalInput = (iso: string) => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};
const fromLocalInput = (v: string) => new Date(v).toISOString();

const TURBINES = ['WT-A01', 'WT-A02', 'WT-A03', 'WT-A04', 'WT-A05', 'WT-A06', 'WT-A07', 'WT-A08', 'WT-A09', 'WT-A10', 'WT-A11', 'WT-A12'];

export function WorkOrderForm() {
  const {
    ui, workOrders, partBatches, teams, closeWorkOrderModal,
    createWorkOrder, updateWorkOrder,
  } = useAppStore();

  const editing = ui.editingWorkOrderId ? workOrders.find((w) => w.id === ui.editingWorkOrderId) : undefined;
  const isEdit = !!editing;

  const [form, setForm] = useState({
    turbineId: editing?.turbineId ?? 'WT-A01',
    towerSection: (editing?.towerSection ?? 'nacelle') as TowerSection,
    title: editing?.title ?? '',
    description: editing?.description ?? '',
    startTime: toLocalInput(editing?.startTime ?? new Date().toISOString()),
    endTime: toLocalInput(editing?.endTime ?? new Date(Date.now() + 8 * 3600 * 1000).toISOString()),
    parts: editing?.parts ?? [] as PartRequirement[],
    teamId: editing?.teamId ?? teams[0]?.id ?? '',
    riskLevel: (editing?.riskLevel ?? 'medium') as RiskLevel,
    riskDescription: editing?.riskDescription ?? '',
    safetyConfirmed: editing?.safetyConfirmed ?? false,
    status: (editing?.status ?? 'draft') as WorkOrderStatus,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!ui.showWorkOrderModal) return;
    setForm({
      turbineId: editing?.turbineId ?? 'WT-A01',
      towerSection: (editing?.towerSection ?? 'nacelle') as TowerSection,
      title: editing?.title ?? '',
      description: editing?.description ?? '',
      startTime: toLocalInput(editing?.startTime ?? new Date().toISOString()),
      endTime: toLocalInput(editing?.endTime ?? new Date(Date.now() + 8 * 3600 * 1000).toISOString()),
      parts: editing?.parts ?? [],
      teamId: editing?.teamId ?? teams[0]?.id ?? '',
      riskLevel: (editing?.riskLevel ?? 'medium') as RiskLevel,
      riskDescription: editing?.riskDescription ?? '',
      safetyConfirmed: editing?.safetyConfirmed ?? false,
      status: (editing?.status ?? 'draft') as WorkOrderStatus,
    });
    setErrors({});
  }, [ui.showWorkOrderModal, ui.editingWorkOrderId]);

  const addPart = () => {
    const firstBatch = partBatches[0];
    if (!firstBatch) return;
    setForm({
      ...form,
      parts: [...form.parts, { partBatchId: firstBatch.id, partName: firstBatch.name, quantity: 1 }],
    });
  };
  const updatePart = (idx: number, patch: Partial<PartRequirement>) => {
    const parts = form.parts.map((p, i) => i === idx ? { ...p, ...patch } : p);
    if (patch.partBatchId) {
      const batch = partBatches.find((b) => b.id === patch.partBatchId);
      if (batch) parts[idx].partName = batch.name;
    }
    setForm({ ...form, parts });
  };
  const removePart = (idx: number) => {
    setForm({ ...form, parts: form.parts.filter((_, i) => i !== idx) });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = '请输入工单标题';
    if (!form.startTime || !form.endTime) e.time = '请选择停机窗口';
    if (new Date(form.startTime) >= new Date(form.endTime)) e.time = '结束时间必须晚于开始时间';
    if (!form.teamId) e.teamId = '请选择负责班组';
    if ((form.riskLevel === 'high' || form.riskLevel === 'critical') && !form.riskDescription.trim()) {
      e.riskDescription = '高/极高风险必须填写风险描述';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    const payload = {
      turbineId: form.turbineId,
      towerSection: form.towerSection,
      title: form.title.trim(),
      description: form.description.trim(),
      startTime: fromLocalInput(form.startTime),
      endTime: fromLocalInput(form.endTime),
      parts: form.parts.filter((p) => p.quantity > 0),
      teamId: form.teamId,
      riskLevel: form.riskLevel,
      riskDescription: form.riskDescription.trim(),
      safetyConfirmed: form.safetyConfirmed,
      status: form.status,
    };
    if (isEdit && editing) updateWorkOrder(editing.id, payload);
    else createWorkOrder(payload);
    closeWorkOrderModal();
  };

  if (!ui.showWorkOrderModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-deep-sea-950/85 flex items-center justify-center p-4" onClick={closeWorkOrderModal}>
      <div className="panel w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-xl tracking-wider text-industrial-copper-300">
            {isEdit ? '编辑检修工单' : '新建检修工单'}
          </h2>
          <button className="btn btn-ghost !p-1" onClick={closeWorkOrderModal}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">风车编号 <span className="text-alert-red-400">*</span></label>
              <select className="select" value={form.turbineId} onChange={(e) => setForm({ ...form, turbineId: e.target.value })}>
                {TURBINES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">塔段位置 <span className="text-alert-red-400">*</span></label>
              <select className="select" value={form.towerSection} onChange={(e) => setForm({ ...form, towerSection: e.target.value as TowerSection })}>
                {(Object.keys(TOWER_SECTION_LABELS) as TowerSection[]).map((k) => (
                  <option key={k} value={k}>{TOWER_SECTION_LABELS[k]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">工单标题 <span className="text-alert-red-400">*</span></label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：主轴承定期检查与润滑"
            />
            {errors.title && <p className="text-alert-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="label">工单描述</label>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="详细描述检修内容与要求..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">停机开始时间 <span className="text-alert-red-400">*</span></label>
              <input type="datetime-local" className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">停机结束时间 <span className="text-alert-red-400">*</span></label>
              <input type="datetime-local" className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            {errors.time && <div className="col-span-2 text-alert-red-400 text-xs">{errors.time}</div>}
          </div>

          <div>
            <label className="label">负责班组 <span className="text-alert-red-400">*</span></label>
            <select className="select" value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name} · 组长 {t.leader}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">备件需求（批号 + 数量）</label>
              <button type="button" className="btn btn-secondary !py-1 !px-2 text-[11px]" onClick={addPart}>
                <Plus className="w-3.5 h-3.5" /> 添加备件
              </button>
            </div>
            <div className="space-y-2">
              {form.parts.length === 0 && (
                <div className="text-[11px] text-deep-sea-500 py-2 px-3 border border-dashed border-deep-sea-700">
                  暂无备件需求，点击「添加备件」新增
                </div>
              )}
              {form.parts.map((p, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_120px_36px] gap-2 items-center">
                  <select
                    className="select"
                    value={p.partBatchId}
                    onChange={(e) => updatePart(idx, { partBatchId: e.target.value })}
                  >
                    {partBatches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} {b.name} (库存 {b.totalStock}{b.unit})
                      </option>
                    ))}
                  </select>
                  <div className="font-mono text-xs text-deep-sea-300 px-2 py-2 bg-deep-sea-900 border border-deep-sea-700">
                    {p.partName}
                  </div>
                  <input
                    type="number"
                    min="1"
                    className="input !py-1.5"
                    value={p.quantity}
                    onChange={(e) => updatePart(idx, { quantity: parseInt(e.target.value) || 0 })}
                  />
                  <button type="button" className="btn btn-ghost !p-1.5" onClick={() => removePart(idx)}>
                    <Trash2 className="w-4 h-4 text-alert-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">风险等级 <span className="text-alert-red-400">*</span></label>
              <select className="select" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}>
                {(Object.keys(RISK_LABELS) as RiskLevel[]).map((k) => (
                  <option key={k} value={k}>{RISK_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">工单状态</label>
              <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as WorkOrderStatus })}>
                <option value="draft">草稿</option>
                <option value="pending">待审批</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">
              风险描述
              {(form.riskLevel === 'high' || form.riskLevel === 'critical') && <span className="text-alert-red-400"> *</span>}
            </label>
            <textarea
              className="textarea"
              value={form.riskDescription}
              onChange={(e) => setForm({ ...form, riskDescription: e.target.value })}
              rows={2}
              placeholder="描述作业风险点与注意事项..."
            />
            {errors.riskDescription && <p className="text-alert-red-400 text-xs mt-1">{errors.riskDescription}</p>}
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-industrial-copper-500"
              checked={form.safetyConfirmed}
              onChange={(e) => setForm({ ...form, safetyConfirmed: e.target.checked })}
            />
            <span className="font-mono text-xs text-deep-sea-200">高风险作业已完成安全确认</span>
          </label>
        </div>

        <div className="panel-header border-t border-industrial-copper-600/30 px-5 py-3 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={closeWorkOrderModal}>取消</button>
          <button className="btn btn-primary" onClick={submit}>
            <Save className="w-4 h-4" />
            {isEdit ? '保存修改' : '创建工单'}
          </button>
        </div>
      </div>
    </div>
  );
}
