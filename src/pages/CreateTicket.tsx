import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTicketStore } from '@/store/ticketStore';
import type { CreateTicketDto, RiskLevel, UpdateTicketDto, WorkTicket } from '../../shared/types';
import { AlertCircle, ArrowLeft, Plus, Trash2, CheckCircle2, User, Shield, Wrench, AlertTriangle, ListChecks, Save, Send } from 'lucide-react';

export default function CreateTicket() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { users, currentUser, fetchUsers, createTicket, updateTicket, fetchTicket } = useTicketStore();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [towerPosition, setTowerPosition] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [workSteps, setWorkSteps] = useState<string[]>(['']);
  const [isolationMeasures, setIsolationMeasures] = useState<{ description: string; implemented: boolean }[]>([
    { description: '', implemented: true },
  ]);
  const [tools, setTools] = useState<{ name: string; quantity: number }[]>([{ name: '', quantity: 1 }]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  const [initiatorId, setInitiatorId] = useState('');
  const [reviewerId, setReviewerId] = useState('');
  const [originalTicket, setOriginalTicket] = useState<WorkTicket | null>(null);

  useEffect(() => {
    fetchUsers();
    if (id) {
      setIsEditing(true);
      (async () => {
        const t = await fetchTicket(id);
        if (t) {
          setOriginalTicket(t);
          setTowerPosition(t.towerPosition);
          setWorkDescription(t.workDescription);
          setWorkSteps(t.workSteps.map((s) => s.description));
          setIsolationMeasures(t.isolationMeasures.map((m) => ({ description: m.description, implemented: m.implemented })));
          setTools(t.tools.map((tl) => ({ name: tl.name, quantity: tl.quantity })));
          setRiskLevel(t.riskLevel);
          setInitiatorId(t.initiatorId);
          setReviewerId(t.reviewerId);
        }
      })();
    }
  }, [id, fetchUsers, fetchTicket]);

  useEffect(() => {
    if (currentUser && !initiatorId && !isEditing) {
      setInitiatorId(currentUser.id);
    }
  }, [currentUser, initiatorId, isEditing]);

  const roleConflict = initiatorId && reviewerId && initiatorId === reviewerId;
  const isolationIncompleteForHighRisk =
    riskLevel === 'high' &&
    (isolationMeasures.filter((m) => m.description.trim()).length < 2 ||
      !isolationMeasures.every((m) => m.implemented || !m.description.trim()));

  const canSubmit =
    towerPosition.trim() &&
    workDescription.trim() &&
    workSteps.some((s) => s.trim()) &&
    isolationMeasures.some((m) => m.description.trim()) &&
    tools.some((t) => t.name.trim()) &&
    initiatorId &&
    reviewerId &&
    !roleConflict;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    const createDto: CreateTicketDto = {
      towerPosition: towerPosition.trim(),
      workDescription: workDescription.trim(),
      workSteps: workSteps.filter((s) => s.trim()),
      isolationMeasures: isolationMeasures.filter((m) => m.description.trim()),
      tools: tools.filter((t) => t.name.trim()).map((t) => ({ name: t.name.trim(), quantity: t.quantity || 1 })),
      riskLevel,
      initiatorId,
      reviewerId,
    };

    let result;
    if (isEditing && id) {
      const updateDto: UpdateTicketDto = createDto;
      result = await updateTicket(id, updateDto);
    } else {
      result = await createTicket(createDto);
    }

    setLoading(false);
    if (!result.success) {
      setError(result.error || '提交失败');
    } else {
      navigate('/');
    }
  };

  const SectionIcon = ({ icon: Icon }: { icon: typeof AlertCircle }) => (
    <div className="w-8 h-8 rounded bg-industrial-100 text-industrial-700 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary !px-3 !py-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-industrial-900">
              {isEditing ? '修改作业票' : '发起作业票'}
            </h2>
            <p className="text-sm text-industrial-500 mt-0.5">
              {isEditing ? '根据驳回意见修改作业票信息' : '填写作业信息，提交复核人双人签核'}
            </p>
          </div>
        </div>
      </div>

      {isEditing && originalTicket && originalTicket.rejectionHistory.length > 0 && (
        <div className="card mb-6 border-l-4 border-l-safety-red p-5 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-safety-red shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-safety-red mb-2">驳回历史记录</h3>
              <div className="space-y-3">
                {originalTicket.rejectionHistory.map((r, idx) => (
                  <div key={r.id} className="bg-white rounded p-3 border border-red-100">
                    <div className="text-xs text-industrial-500 mb-1">
                      第 {idx + 1} 次驳回 · 驳回人：{r.rejectedByName} · {new Date(r.timestamp).toLocaleString()}
                    </div>
                    <div className="text-sm text-industrial-800">{r.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-safety-red text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="space-y-5">
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <SectionIcon icon={Shield} />
            <h3 className="text-lg font-bold text-industrial-900">基本信息</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label-field">塔位编号 <span className="text-safety-red">*</span></label>
              <input
                type="text"
                placeholder="例如：A区-07号风机"
                value={towerPosition}
                onChange={(e) => setTowerPosition(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">风险等级 <span className="text-safety-red">*</span></label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as RiskLevel[]).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setRiskLevel(lv)}
                    className={`flex-1 py-2.5 px-3 rounded border-2 font-semibold text-sm transition-all ${
                      riskLevel === lv
                        ? lv === 'low'
                          ? 'bg-green-500 text-white border-green-500'
                          : lv === 'medium'
                          ? 'bg-safety-yellow text-white border-safety-yellow'
                          : 'bg-safety-red text-white border-safety-red'
                        : 'bg-white border-industrial-200 text-industrial-600 hover:border-industrial-400'
                    }`}
                  >
                    {lv === 'low' ? '低风险' : lv === 'medium' ? '中风险' : '高风险'}
                  </button>
                ))}
              </div>
              {riskLevel === 'high' && (
                <div className="mt-2 text-xs text-safety-orange flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  高风险作业需至少 2 项已落实的隔离措施
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="label-field">作业内容描述 <span className="text-safety-red">*</span></label>
              <textarea
                placeholder="详细描述本次作业的目的和主要内容..."
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows={3}
                className="input-field resize-none"
              />
            </div>
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <SectionIcon icon={ListChecks} />
            <h3 className="text-lg font-bold text-industrial-900">作业步骤 <span className="text-safety-red text-sm">*</span></h3>
            <button
              type="button"
              onClick={() => setWorkSteps([...workSteps, ''])}
              className="ml-auto text-sm text-safety-orange hover:text-orange-700 font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> 添加步骤
            </button>
          </div>
          <div className="space-y-3">
            {workSteps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-industrial-800 text-white text-sm font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  placeholder={`作业步骤 ${idx + 1}`}
                  value={step}
                  onChange={(e) => {
                    const next = [...workSteps];
                    next[idx] = e.target.value;
                    setWorkSteps(next);
                  }}
                  className="input-field flex-1"
                />
                {workSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setWorkSteps(workSteps.filter((_, i) => i !== idx))}
                    className="text-industrial-400 hover:text-safety-red p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <SectionIcon icon={Shield} />
            <h3 className="text-lg font-bold text-industrial-900">隔离措施 <span className="text-safety-red text-sm">*</span></h3>
            <button
              type="button"
              onClick={() => setIsolationMeasures([...isolationMeasures, { description: '', implemented: true }])}
              className="ml-auto text-sm text-safety-orange hover:text-orange-700 font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> 添加措施
            </button>
          </div>
          {isolationIncompleteForHighRisk && (
            <div className="mb-4 p-3 rounded bg-orange-50 border border-orange-200 text-safety-orange text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              高风险作业必须至少 2 项已落实的隔离措施
            </div>
          )}
          <div className="space-y-3">
            {isolationMeasures.map((m, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={m.implemented}
                    onChange={(e) => {
                      const next = [...isolationMeasures];
                      next[idx] = { ...m, implemented: e.target.checked };
                      setIsolationMeasures(next);
                    }}
                    className="w-5 h-5 rounded border-2 border-industrial-300 text-safety-green focus:ring-safety-green"
                  />
                  <span className={`text-sm font-semibold ${m.implemented ? 'text-safety-green' : 'text-industrial-400'}`}>
                    {m.implemented ? '已落实' : '未落实'}
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="隔离措施描述..."
                  value={m.description}
                  onChange={(e) => {
                    const next = [...isolationMeasures];
                    next[idx] = { ...m, description: e.target.value };
                    setIsolationMeasures(next);
                  }}
                  className="input-field flex-1"
                />
                {isolationMeasures.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsolationMeasures(isolationMeasures.filter((_, i) => i !== idx))}
                    className="text-industrial-400 hover:text-safety-red p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <SectionIcon icon={Wrench} />
            <h3 className="text-lg font-bold text-industrial-900">工具清单 <span className="text-safety-red text-sm">*</span></h3>
            <button
              type="button"
              onClick={() => setTools([...tools, { name: '', quantity: 1 }])}
              className="ml-auto text-sm text-safety-orange hover:text-orange-700 font-semibold inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> 添加工具
            </button>
          </div>
          <div className="space-y-3">
            {tools.map((t, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="工具名称..."
                  value={t.name}
                  onChange={(e) => {
                    const next = [...tools];
                    next[idx] = { ...t, name: e.target.value };
                    setTools(next);
                  }}
                  className="input-field flex-1"
                />
                <div className="flex items-center gap-2 w-32">
                  <label className="text-xs text-industrial-500">数量</label>
                  <input
                    type="number"
                    min={1}
                    value={t.quantity}
                    onChange={(e) => {
                      const next = [...tools];
                      next[idx] = { ...t, quantity: parseInt(e.target.value) || 1 };
                      setTools(next);
                    }}
                    className="input-field !w-16 !px-2"
                  />
                </div>
                {tools.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTools(tools.filter((_, i) => i !== idx))}
                    className="text-industrial-400 hover:text-safety-red p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <SectionIcon icon={User} />
            <h3 className="text-lg font-bold text-industrial-900">双人签核人员 <span className="text-safety-red text-sm">*</span></h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label-field">发起人 <span className="text-safety-red">*</span></label>
              <select
                value={initiatorId}
                onChange={(e) => setInitiatorId(e.target.value)}
                className="input-field"
              >
                <option value="">请选择发起人</option>
                {users.filter((u) => u.role !== 'reviewer').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'initiator' ? '发起人' : '发起人/复核人'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">复核人 <span className="text-safety-red">*</span></label>
              <select
                value={reviewerId}
                onChange={(e) => setReviewerId(e.target.value)}
                className="input-field"
              >
                <option value="">请选择复核人</option>
                {users.filter((u) => u.role !== 'initiator').map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'reviewer' ? '复核人' : '发起人/复核人'})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {roleConflict && (
            <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-safety-red text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              发起人和复核人不能为同一人
            </div>
          )}
          <div className="mt-4 p-3 rounded bg-industrial-50 border border-industrial-200 text-xs text-industrial-600">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-safety-green" />
            提交后发起人视为已确认塔位、步骤、隔离措施、工具清单和风险等级；复核人需在复核工作台逐项二次确认。
          </div>
        </section>
      </div>

      <div className="mt-8 flex justify-end gap-3 sticky bottom-6">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          取消
        </button>
        <button onClick={handleSubmit} disabled={!canSubmit || loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="animate-spin">⏳</span>
          ) : isEditing ? (
            <><Save className="w-4 h-4" /> 保存修改并重新提交</>
          ) : (
            <><Send className="w-4 h-4" /> 提交复核</>
          )}
        </button>
      </div>
    </div>
  );
}
