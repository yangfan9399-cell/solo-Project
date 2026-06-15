'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AnnealingItem = {
  annealing_time: string; temperature: number; duration: number;
  cooling_method: string; hardness_before: number | null; hardness_after: number | null;
  operator: string | null; notes: string | null;
};

type PatternItem = {
  pattern_stage: string; pattern_name: string; progress_pct: number;
  start_time: string | null; end_time: string | null;
  duration_minutes: number; chisels_used: string[];
  issues: string | null;
};

export default function NewLedgerPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [main, setMain] = useState({
    work_name: '', silversmith: '', chisel_set: '',
    main_chisels: [] as string[], material: 'S990 足银',
    material_weight: 30, start_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [annealings, setAnnealings] = useState<AnnealingItem[]>([
    { annealing_time: '', temperature: 680, duration: 45, cooling_method: '水淬',
      hardness_before: 120, hardness_after: 65, operator: '', notes: '初坯软化' },
  ]);

  const [patterns, setPatterns] = useState<PatternItem[]>([
    { pattern_stage: '起稿', pattern_name: '整体轮廓起稿', progress_pct: 0,
      start_time: null, end_time: null, duration_minutes: 0,
      chisels_used: ['HM-002'], issues: null },
    { pattern_stage: '贴样', pattern_name: '纹样转印', progress_pct: 0,
      start_time: null, end_time: null, duration_minutes: 0,
      chisels_used: [], issues: null },
    { pattern_stage: '初錾', pattern_name: '主干线条初錾', progress_pct: 0,
      start_time: null, end_time: null, duration_minutes: 0,
      chisels_used: ['CH-003', 'HM-001'], issues: null },
    { pattern_stage: '精錾', pattern_name: '细节錾刻', progress_pct: 0,
      start_time: null, end_time: null, duration_minutes: 0,
      chisels_used: ['CH-006', 'CH-002'], issues: null },
    { pattern_stage: '修光', pattern_name: '整体抛光修形', progress_pct: 0,
      start_time: null, end_time: null, duration_minutes: 0,
      chisels_used: [], issues: null },
  ]);

  const [result, setResult] = useState({
    surface_defects: [] as any[], defect_severity: '无',
    rework_count: 0, final_weight: null as number | null,
    delivery_requirements: {} as any, packaging: '', delivery_date: '',
    inspector: '', acceptance: '', acceptance_notes: '',
  });

  useEffect(() => {
    document.querySelectorAll('[data-nav]').forEach((el) => {
      const el2 = el as HTMLElement;
      el2.classList.toggle('active', el2.dataset.nav === 'new');
    });
  }, []);

  const steps = [
    { key: 'main', label: '主记录', icon: '📋', desc: '银匠、錾子、材料' },
    { key: 'annealing', label: '退火明细', icon: '🔥', desc: '退火次数记录' },
    { key: 'pattern', label: '纹样进度', icon: '✏️', desc: '工序顺序安排' },
    { key: 'result', label: '结果记录', icon: '✅', desc: '交付要求设置' },
  ];

  function addAnnealing() {
    setAnnealings([...annealings, {
      annealing_time: '', temperature: 650, duration: 40, cooling_method: '水淬',
      hardness_before: null, hardness_after: null, operator: '', notes: '',
    }]);
  }

  function removeAnnealing(idx: number) {
    if (annealings.length <= 1) return;
    setAnnealings(annealings.filter((_, i) => i !== idx));
  }

  function updateAnnealing(idx: number, key: keyof AnnealingItem, value: any) {
    const next = [...annealings];
    (next[idx] as any)[key] = value;
    setAnnealings(next);
  }

  function addPattern() {
    setPatterns([...patterns, {
      pattern_stage: '其他', pattern_name: '', progress_pct: 0,
      start_time: null, end_time: null, duration_minutes: 0,
      chisels_used: [], issues: null,
    }]);
  }

  function removePattern(idx: number) {
    if (patterns.length <= 1) return;
    setPatterns(patterns.filter((_, i) => i !== idx));
  }

  function updatePattern(idx: number, key: keyof PatternItem, value: any) {
    const next = [...patterns];
    (next[idx] as any)[key] = value;
    setPatterns(next);
  }

  async function handleSubmit() {
    if (!main.work_name || !main.silversmith) {
      alert('请填写作品名称和银匠姓名');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        ...main,
        annealing_records: annealings,
        pattern_progress: patterns,
        surface_defects: result.surface_defects,
        defect_severity: result.defect_severity,
        rework_count: result.rework_count,
        final_weight: result.final_weight,
        delivery_requirements: result.delivery_requirements,
        packaging: result.packaging,
        delivery_date: result.delivery_date,
        inspector: result.inspector,
        acceptance: result.acceptance,
        acceptance_notes: result.acceptance_notes,
      };
      const r = await fetch('/api/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.ok) {
        alert(`台账创建成功！\n作品编号：${data.work_no}`);
        router.push(`/ledger/${data.id}`);
      } else {
        alert('创建失败：' + data.error);
      }
    } catch (e: any) {
      alert('创建失败：' + e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-wrap">
      {/* Steps */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 0, alignItems: 'stretch' }}>
          {steps.map((s, i) => (
            <div
              key={s.key}
              onClick={() => setActiveStep(i)}
              style={{
                flex: 1, padding: '16px 20px', cursor: 'pointer',
                borderRight: i < steps.length - 1 ? '1px solid #e5e7eb' : 'none',
                background: activeStep === i ? '#faf9f6' : '#fff',
                borderBottom: activeStep === i ? '2px solid #2a2a35' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: activeStep === i ? '#2a2a35' : '#e5e7eb',
                  color: activeStep === i ? '#fff' : '#6a6a75',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 600,
                }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: activeStep === i ? 600 : 500 }}>
                    {s.icon} {s.label}
                  </div>
                  <div className="text-xs text-muted">{s.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="card" style={{ marginBottom: 16 }}>
        {activeStep === 0 && (
          <div>
            <h3 className="card-title">
              <span>📋 主记录 - 基础信息</span>
              <span className="meta">行业对象 · 批次 · 版本</span>
            </h3>
            <div className="card-hint">
              主记录保存银匠、錾子、材料等基础信息，是整个台账档案的核心。系统将自动生成作品编号和版本号。
            </div>
            <div className="row-fields">
              <label className="field">
                <span>作品名称 *</span>
                <input
                  type="text" placeholder="如：缠枝莲纹银手镯"
                  value={main.work_name}
                  onChange={(e) => setMain({ ...main, work_name: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                <span>银匠姓名 *</span>
                <input
                  type="text" placeholder="如：张银匠"
                  value={main.silversmith}
                  onChange={(e) => setMain({ ...main, silversmith: e.target.value })}
                  required
                />
              </label>
            </div>
            <div className="row-fields">
              <label className="field">
                <span>錾具套装</span>
                <input
                  type="text" placeholder="如：标准套装A / 高级套装B"
                  value={main.chisel_set}
                  onChange={(e) => setMain({ ...main, chisel_set: e.target.value })}
                />
              </label>
              <label className="field">
                <span>主要錾子（编码，多个用逗号分隔）</span>
                <input
                  type="text" placeholder="如：CH-001, CH-003, CH-006"
                  value={main.main_chisels.join(', ')}
                  onChange={(e) => setMain({
                    ...main,
                    main_chisels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })}
                />
              </label>
            </div>
            <div className="row-fields">
              <label className="field">
                <span>材料</span>
                <select
                  value={main.material}
                  onChange={(e) => setMain({ ...main, material: e.target.value })}
                >
                  <option value="S990 足银">S990 足银</option>
                  <option value="S925 银">S925 银</option>
                  <option value="S999 千足银">S999 千足银</option>
                </select>
              </label>
              <label className="field">
                <span>下料重量 (g)</span>
                <input
                  type="number" step="0.1" min="0"
                  value={main.material_weight}
                  onChange={(e) => setMain({ ...main, material_weight: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                <span>开工日期</span>
                <input
                  type="date"
                  value={main.start_date}
                  onChange={(e) => setMain({ ...main, start_date: e.target.value })}
                />
              </label>
            </div>
            <label className="field">
              <span>备注说明</span>
              <textarea
                placeholder="如：客户定制款，母亲生日礼物..."
                value={main.notes}
                onChange={(e) => setMain({ ...main, notes: e.target.value })}
              />
            </label>
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <h3 className="card-title">
              <span>🔥 退火明细记录</span>
              <span className="meta">明细记录 · 共 {annealings.length} 次</span>
            </h3>
            <div className="card-hint">
              退火是银饰錾刻中的关键工序，通过加热和冷却改变银料硬度。每次退火都需要记录温度、时长、冷却方式及硬度变化。
            </div>

            {annealings.map((a, idx) => (
              <div key={idx} className="muted-block" style={{ marginBottom: 12, position: 'relative' }}>
                <div className="flex-b" style={{ marginBottom: 10 }}>
                  <strong style={{ color: '#2a2a35' }}>第 {idx + 1} 次退火</strong>
                  {annealings.length > 1 && (
                    <button
                      type="button" className="btn btn-sm btn-danger"
                      onClick={() => removeAnnealing(idx)}
                    >✕ 删除</button>
                  )}
                </div>
                <div className="row-fields-3">
                  <label className="field">
                    <span>退火时间</span>
                    <input
                      type="datetime-local"
                      value={a.annealing_time}
                      onChange={(e) => updateAnnealing(idx, 'annealing_time', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>温度 (℃)</span>
                    <input
                      type="number" min="500" max="800"
                      value={a.temperature}
                      onChange={(e) => updateAnnealing(idx, 'temperature', Number(e.target.value))}
                    />
                  </label>
                  <label className="field">
                    <span>持续时间 (s)</span>
                    <input
                      type="number" min="10"
                      value={a.duration}
                      onChange={(e) => updateAnnealing(idx, 'duration', Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="row-fields">
                  <label className="field">
                    <span>冷却方式</span>
                    <select
                      value={a.cooling_method}
                      onChange={(e) => updateAnnealing(idx, 'cooling_method', e.target.value)}
                    >
                      <option value="水淬">水淬</option>
                      <option value="自然冷却">自然冷却</option>
                      <option value="油淬">油淬</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>硬度(前)</span>
                    <input
                      type="number"
                      value={a.hardness_before ?? ''}
                      onChange={(e) => updateAnnealing(idx, 'hardness_before', e.target.value ? Number(e.target.value) : null)}
                    />
                  </label>
                  <label className="field">
                    <span>硬度(后)</span>
                    <input
                      type="number"
                      value={a.hardness_after ?? ''}
                      onChange={(e) => updateAnnealing(idx, 'hardness_after', e.target.value ? Number(e.target.value) : null)}
                    />
                  </label>
                  <label className="field">
                    <span>操作人员</span>
                    <input
                      type="text"
                      value={a.operator ?? ''}
                      onChange={(e) => updateAnnealing(idx, 'operator', e.target.value || null)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>备注</span>
                  <input
                    type="text"
                    value={a.notes ?? ''}
                    onChange={(e) => updateAnnealing(idx, 'notes', e.target.value || null)}
                    placeholder="如：初坯软化 / 纹样錾刻前 / 精修前退火..."
                  />
                </label>
              </div>
            ))}

            <button
              type="button" className="btn btn-outline btn-sm"
              onClick={addAnnealing}
            >+ 添加退火记录</button>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h3 className="card-title">
              <span>✏️ 纹样进度安排</span>
              <span className="meta">历史记录 · 共 {patterns.length} 道工序</span>
            </h3>
            <div className="card-hint">
              按起稿→贴样→初錾→精錾→修光的标准工序顺序安排，记录每道工序的进度、耗时、使用錾子等信息。
            </div>

            {patterns.map((p, idx) => (
              <div key={idx} className="muted-block" style={{ marginBottom: 12, position: 'relative' }}>
                <div className="flex-b" style={{ marginBottom: 10 }}>
                  <strong style={{ color: '#2a2a35' }}>工序 #{idx + 1}</strong>
                  {patterns.length > 1 && (
                    <button
                      type="button" className="btn btn-sm btn-danger"
                      onClick={() => removePattern(idx)}
                    >✕ 删除</button>
                  )}
                </div>
                <div className="row-fields">
                  <label className="field">
                    <span>工序阶段</span>
                    <select
                      value={p.pattern_stage}
                      onChange={(e) => updatePattern(idx, 'pattern_stage', e.target.value)}
                    >
                      <option value="起稿">起稿</option>
                      <option value="贴样">贴样</option>
                      <option value="初錾">初錾</option>
                      <option value="精錾">精錾</option>
                      <option value="修光">修光</option>
                      <option value="其他">其他</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>工序名称</span>
                    <input
                      type="text" placeholder="如：主干线条初錾"
                      value={p.pattern_name}
                      onChange={(e) => updatePattern(idx, 'pattern_name', e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>进度 (%)</span>
                    <input
                      type="number" min="0" max="100"
                      value={p.progress_pct}
                      onChange={(e) => updatePattern(idx, 'progress_pct', Number(e.target.value))}
                    />
                  </label>
                  <label className="field">
                    <span>耗时 (分钟)</span>
                    <input
                      type="number" min="0"
                      value={p.duration_minutes}
                      onChange={(e) => updatePattern(idx, 'duration_minutes', Number(e.target.value))}
                    />
                  </label>
                </div>
                <div className="row-fields">
                  <label className="field">
                    <span>开始时间</span>
                    <input
                      type="datetime-local"
                      value={p.start_time ?? ''}
                      onChange={(e) => updatePattern(idx, 'start_time', e.target.value || null)}
                    />
                  </label>
                  <label className="field">
                    <span>结束时间</span>
                    <input
                      type="datetime-local"
                      value={p.end_time ?? ''}
                      onChange={(e) => updatePattern(idx, 'end_time', e.target.value || null)}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>使用錾子（编码，多个用逗号分隔）</span>
                  <input
                    type="text" placeholder="如：CH-003, HM-001"
                    value={p.chisels_used.join(', ')}
                    onChange={(e) => updatePattern(idx, 'chisels_used',
                      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    )}
                  />
                </label>
                <label className="field">
                  <span>问题备注</span>
                  <input
                    type="text"
                    value={p.issues ?? ''}
                    onChange={(e) => updatePattern(idx, 'issues', e.target.value || null)}
                    placeholder="记录该工序遇到的问题..."
                  />
                </label>
              </div>
            ))}

            <button
              type="button" className="btn btn-outline btn-sm"
              onClick={addPattern}
            >+ 添加工序</button>
          </div>
        )}

        {activeStep === 3 && (
          <div>
            <h3 className="card-title">
              <span>✅ 结果记录与交付</span>
              <span className="meta">表面缺陷 · 交付要求 · 验收</span>
            </h3>
            <div className="card-hint">
              结果记录集中保存表面缺陷检查、最终交付要求及验收结果。这些信息将用于生成最终的交付单。
            </div>

            <div className="row-fields">
              <label className="field">
                <span>缺陷等级</span>
                <select
                  value={result.defect_severity}
                  onChange={(e) => setResult({ ...result, defect_severity: e.target.value })}
                >
                  <option value="无">无缺陷</option>
                  <option value="轻微">轻微</option>
                  <option value="中度">中度</option>
                  <option value="严重">严重</option>
                </select>
              </label>
              <label className="field">
                <span>返工次数</span>
                <input
                  type="number" min="0"
                  value={result.rework_count}
                  onChange={(e) => setResult({ ...result, rework_count: Number(e.target.value) })}
                />
              </label>
              <label className="field">
                <span>成品重量 (g)</span>
                <input
                  type="number" step="0.1" min="0"
                  value={result.final_weight ?? ''}
                  onChange={(e) => setResult({ ...result, final_weight: e.target.value ? Number(e.target.value) : null })}
                />
              </label>
              <label className="field">
                <span>包装要求</span>
                <input
                  type="text" placeholder="如：锦盒包装 + 丝带"
                  value={result.packaging}
                  onChange={(e) => setResult({ ...result, packaging: e.target.value })}
                />
              </label>
            </div>
            <div className="row-fields">
              <label className="field">
                <span>交付日期</span>
                <input
                  type="date"
                  value={result.delivery_date}
                  onChange={(e) => setResult({ ...result, delivery_date: e.target.value })}
                />
              </label>
              <label className="field">
                <span>验收人</span>
                <input
                  type="text" placeholder="如：王检验"
                  value={result.inspector}
                  onChange={(e) => setResult({ ...result, inspector: e.target.value })}
                />
              </label>
              <label className="field">
                <span>验收状态</span>
                <select
                  value={result.acceptance}
                  onChange={(e) => setResult({ ...result, acceptance: e.target.value })}
                >
                  <option value="">未验收</option>
                  <option value="待检验">待检验</option>
                  <option value="待复检">待复检</option>
                  <option value="合格">合格</option>
                  <option value="不合格">不合格</option>
                </select>
              </label>
            </div>
            <label className="field">
              <span>验收意见</span>
              <textarea
                placeholder="记录验收过程中的发现和意见..."
                value={result.acceptance_notes}
                onChange={(e) => setResult({ ...result, acceptance_notes: e.target.value })}
              />
            </label>

            <div className="muted-block mt-16">
              <strong>📦 交付要求 (JSON格式)</strong>
              <div className="text-xs text-muted mt-4">
                输入客户交付要求的键值对，如客户姓名、联系电话、礼品包装需求等。
                这些信息将被包含在最终的交付单中。
              </div>
              <textarea
                placeholder='{"customer": "李女士", "phone": "138****1234", "giftWrap": true}'
                value={JSON.stringify(result.delivery_requirements, null, 2)}
                onChange={(e) => {
                  try {
                    setResult({ ...result, delivery_requirements: JSON.parse(e.target.value) });
                  } catch {}
                }}
                style={{ fontFamily: 'SF Mono, Menlo, monospace', fontSize: 11, marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-b">
        <div>
          <Link href="/" className="btn btn-outline btn-sm">← 取消</Link>
        </div>
        <div className="btn-group">
          {activeStep > 0 && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveStep(activeStep - 1)}
            >← 上一步</button>
          )}
          {activeStep < steps.length - 1 ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActiveStep(activeStep + 1)}
            >下一步 →</button>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '创建中...' : '✓ 创建台账'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
