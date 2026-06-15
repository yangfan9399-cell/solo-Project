// @ts-nocheck
import { component$, useSignal, $, useComputed$ } from '@builder.io/qwik';
import {
  routeLoader$, Form, globalAction$, z, zod$, useLocation } from '@builder.io/qwik-city';
import {
  getFullBatch, createExposureDetail, deleteExposureDetail,
  createWashHistory, deleteWashHistory,
  createResultRecord, updateMainRecord,
  createPhoto, deletePhoto,
  archiveMainRecord, unarchiveMainRecord,
  cloneBatchForRecalc, rollbackToVersion,
  getVersionChain, updateResultRecord,
} from '~/lib/db';
import type { FailTag } from '~/lib/types';
import {
  FAIL_TAG_LABELS, WASH_STAGE_LABELS, PHOTO_STAGE_LABELS,
  STATUS_LABELS, fmtDate, runAnomalyCheck, computeBaseline, compareMainVersions, toCsv, detectSeed
} from '~/lib/utils';

export const useBatchDetail = routeLoader$(async (requestEvent) => {
  const id = requestEvent.params.id;
  const batch = getFullBatch(id);
  if (!batch) throw redirect(302, '/');
  const chain = getVersionChain(batch.main.batchNo);
  const baseline = computeBaseline();
  const anomalies = runAnomalyCheck(batch, baseline);
  const chainWithData = chain.map(v => ({ main: v, full: getFullBatch(v.id) }));
  return { batch, chain, baseline, anomalies, chainWithData };
});

export const useAddExposure = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const batchId = String(form.batchId);
  createExposureDetail({
    mainRecordId: batchId,
    sheetNo: Number(form.sheetNo),
    uvIntensityMwCm2: Number(form.uvIntensityMwCm2),
    exposureMinutes: Number(form.exposureMinutes),
    exposureSeconds: Number(form.exposureSeconds || 0),
    uvIndex: form.uvIndex ? Number(form.uvIndex) : null,
    lightSource: String(form.lightSource),
    distanceCm: Number(form.distanceCm),
  });
  throw redirect(303, `/batch/${batchId}#exposure`);
});

export const useDelExposure = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  const batchId = String(form.batchId);
  deleteExposureDetail(id);
  throw redirect(303, `/batch/${batchId}#exposure`);
});

export const useAddWash = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const batchId = String(form.batchId);
  createWashHistory({
    mainRecordId: batchId,
    orderIndex: Number(form.orderIndex),
    stage: String(form.stage) as any,
    durationMinutes: Number(form.durationMinutes),
    durationSeconds: Number(form.durationSeconds || 0),
    waterTempC: form.waterTempC ? Number(form.waterTempC) : null,
    phValue: form.phValue ? Number(form.phValue) : null,
    agitationHz: form.agitationHz ? Number(form.agitationHz) : null,
    operatorNote: String(form.operatorNote || '') || undefined,
  });
  throw redirect(303, `/batch/${batchId}#wash`);
});

export const useDelWash = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  const batchId = String(form.batchId);
  deleteWashHistory(id);
  throw redirect(303, `/batch/${batchId}#wash`);
});

export const useSaveResult = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const batchId = String(form.batchId);
  const existingId = form.existingResultId ? String(form.existingResultId) : null;
  const failTagsRaw = Array.isArray(form.failTags) ? (form.failTags as string[]) :
    typeof form.failTags === 'string' ? [form.failTags] : [];
  const visual = Number(form.visualGrade);
  const density = Number(form.densityGrade);
  const contrast = Number(form.contrastGrade);
  const overall = Number(form.overallScore ?? Math.round((visual + density + contrast) * 10 / 3));
  const payload = {
    mainRecordId: batchId,
    roomTempC: Number(form.roomTempC),
    humidityPct: Number(form.humidityPct),
    solutionTempC: Number(form.solutionTempC),
    dryingTempC: form.dryingTempC ? Number(form.dryingTempC) : null,
    dryingMethod: String(form.dryingMethod),
    visualGrade: visual,
    densityGrade: density,
    contrastGrade: contrast,
    overallScore: overall,
    failTags: (failTagsRaw as FailTag[]),
    isSuccess: overall >= 50,
    evaluator: String(form.evaluator),
    evaluationNote: String(form.evaluationNote || ''),
    evaluatedAt: Date.now(),
    recalculationCount: 0,
    lastRecalculatedAt: null,
    recalculationNote: null,
  };
  if (existingId) {
    updateResultRecord(existingId, payload);
  } else {
    createResultRecord(payload);
  }
  throw redirect(303, `/batch/${batchId}#result`);
});

export const useUpdateMain = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  updateMainRecord(id, {
    solutionARatio: Number(form.solutionARatio),
    solutionBRatio: Number(form.solutionBRatio),
    solutionC_Ratio: form.solutionC_Ratio ? Number(form.solutionC_Ratio) : null,
    totalVolumeMl: Number(form.totalVolumeMl),
    paperType: String(form.paperType),
    paperWeightGsm: Number(form.paperWeightGsm),
    notes: String(form.notes || '') || undefined,
    status: String(form.status) as any,
  });
  throw redirect(303, `/batch/${id}#main`);
});

export const useAddPhoto = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const batchId = String(form.batchId);
  const dataUrl = String(form.dataUrl || '');
  const stage = String(form.stage);
  const caption = String(form.caption || '');
  if (dataUrl) {
    createPhoto({ batchId, stage: stage as any, caption, dataUrl });
  }
  throw redirect(303, `/batch/${batchId}#photos`);
}, zod$({ batchId: z.string(), dataUrl: z.string(), stage: z.string(), caption: z.string() }));

export const useDelPhoto = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  const batchId = String(form.batchId);
  deletePhoto(id);
  throw redirect(303, `/batch/${batchId}#photos`);
});

export const useArchive = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  const reason = String(form.reason || '未填写原因');
  archiveMainRecord(id, reason);
  throw redirect(303, `/batch/${id}`);
});

export const useUnarchive = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  unarchiveMainRecord(id);
  throw redirect(303, `/batch/${id}`);
});

export const useRecalc = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  const by = String(form.createdBy);
  const r = cloneBatchForRecalc(id, by);
  if (r) throw redirect(302, `/batch/${r.id}`);
  throw redirect(303, `/batch/${id}`);
});

export const useRollback = globalAction$(async (form: Record<string, any>, { redirect }) => {
  const id = String(form.id);
  const by = String(form.createdBy);
  const reason = String(form.reason || '参数不理想');
  const r = rollbackToVersion(id, by, reason);
  if (r) throw redirect(302, `/batch/${r.id}`);
  throw redirect(303, `/batch/${id}`);
});

export default component$(() => {
  const data = useBatchDetail();
  const loc = useLocation();
  const showRecalc = useSignal(false);
  const showRollback = useSignal(false);
  const showArchive = useSignal(false);
  const showExport = useSignal(false);
  const photoDataUrl = useSignal('');
  const photoStage = useSignal<'before_exposure' | 'after_exposure' | 'after_wash' | 'dried'>('dried');
  const photoCaption = useSignal('');
  const diffTargetId = useSignal<string>('');
  const showDiff = useSignal(false);

  const { batch, chain, anomalies, chainWithData } = data.value;
  const m = batch.main;

  const failTagsAll: FailTag[] = ['insufficient_blue', 'over_exposure', 'under_exposure',
    'uneven_coating', 'paper_stain', 'washing_insufficient', 'yellowing', 'poor_contrast', 'other'];

  const anomaliesCount = anomalies.filter(a => a.isAnomaly).length;
  const highAnomalies = anomalies.filter(a => a.isAnomaly && a.severity === 'high').length;

  const statusClass = (s: string) => {
    if (m.isArchived) return 'status-tag status-archived';
    if (s === 'completed') return 'status-tag status-normal';
    if (s === 'failed') return 'status-tag status-danger';
    return 'status-tag status-warning';
  };

  const handlePhotoFile = $((ev: Event) => {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { photoDataUrl.value = String(reader.result || ''); };
    reader.readAsDataURL(file);
  });

  const currentIdx = chain.findIndex(v => v.id === m.id);
  const prevMain = currentIdx > 0 ? chain[currentIdx - 1] : null;
  const nextMain = currentIdx >= 0 && currentIdx < chain.length - 1 ? chain[currentIdx + 1] : null;
  const versionDiffs = prevMain ? compareMainVersions(prevMain, m) : [];
  const changedCount = versionDiffs.filter(d => d.changed).length;

  const targetForDiff = useComputed$(() => {
    if (!diffTargetId.value) return null;
    const t = chainWithData.find(x => x.main.id === diffTargetId.value);
    return t?.main ?? null;
  });

  const diffWithTarget = useComputed$(() => {
    if (!targetForDiff.value) return [] as ReturnType<typeof compareMainVersions>;
    return compareMainVersions(targetForDiff.value!, m);
  });

  return (
    <div>
      <div class="card" style={{
        borderLeft: `5px solid ${m.status === 'failed' ? 'var(--danger-red)' :
          m.isArchived ? 'var(--ink-muted)' : 'var(--cyan-blue)'}`
      }}>
        <div class="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontSize: 20, fontWeight: 700 }}>{m.batchNo}</span>
              <span style={{
                marginLeft: 10, padding: '3px 12px', background: 'var(--cyan-pale)',
                borderRadius: 12, color: 'var(--cyan-blue)', fontWeight: 600
              }}>v{m.version}</span>
              <span style={{ marginLeft: 10 }} class={statusClass(m.status)}>{STATUS_LABELS[m.status]}</span>
              {m.isArchived && <span class="status-tag status-archived" style={{ marginLeft: 8 }}>📦 已归档</span>}
            </div>
            {m.rollbackFromId && (
              <span style={{ fontSize: 12, color: 'var(--warning-amber)', fontWeight: 600 }}>
                ↩ 回滚版本 · {m.rollbackReason}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button class="btn" onClick$={() => showRecalc.value = true}>🔁 重算版本</button>
            <button class="btn btn-warning" onClick$={() => showRollback.value = true}>↩ 回滚到此</button>
            {m.isArchived
              ? <Form action={useUnarchive}><button class="btn" name="id" value={m.id}>↩ 取消归档</button></Form>
              : <button class="btn" onClick$={() => showArchive.value = true}>📦 归档</button>}
            <button class="btn btn-primary" onClick$={() => showExport.value = true}>⬇ 导出</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, fontSize: 13 }}>
          <div><span style={{ color: 'var(--ink-muted)' }}>记录人</span><div style={{ fontWeight: 600 }}>{m.createdBy}</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>创建时间</span><div>{fmtDate(m.createdAt)}</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>更新时间</span><div>{fmtDate(m.updatedAt)}</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>曝光记录</span><div style={{ color: 'var(--cyan-blue)', fontWeight: 600 }}>{batch.exposureDetails.length} 张</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>冲洗步骤</span><div style={{ color: 'var(--warning-amber)', fontWeight: 600 }}>{batch.washHistories.length} 步</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>综合评分</span><div style={{
            fontWeight: 700, fontSize: 18,
            color: batch.result ? (batch.result.overallScore >= 70 ? 'var(--success-green)' :
              batch.result.overallScore >= 50 ? 'var(--warning-amber)' : 'var(--danger-red)') : 'var(--ink-muted)',
          }}>{batch.result?.overallScore ?? '待评'}</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>异常参数</span><div style={{
            fontWeight: 600,
            color: highAnomalies > 0 ? 'var(--danger-red)' : anomaliesCount > 0 ? 'var(--warning-amber)' : 'var(--success-green)'
          }}>{anomaliesCount} 项 {highAnomalies > 0 ? `(${highAnomalies}严重)` : ''}</div></div>
          <div><span style={{ color: 'var(--ink-muted)' }}>批次照片</span><div style={{ color: 'var(--cyan-blue)', fontWeight: 600 }}>🖼 {batch.photos.length}</div></div>
        </div>
      </div>

      {(() => {
        const seed = detectSeed(m, batch.result, batch.photos, chain);
        if (seed.type === 'custom') return null;
        return (
          <div style={{
            padding: 16, borderRadius: 10, marginBottom: 18,
            background: seed.type === 'sample1_normal' ? 'var(--success-green-faint)' :
              seed.type === 'sample2_anomaly' ? 'var(--danger-red-faint)' : 'var(--warning-amber-faint)',
            border: `2px solid ${seed.type === 'sample1_normal' ? 'var(--success-green)' :
              seed.type === 'sample2_anomaly' ? 'var(--danger-red)' : 'var(--warning-amber)'}`
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{seed.label}</div>
            <div style={{ fontSize: 13, marginBottom: 12, color: 'var(--ink-body)', lineHeight: 1.7 }}>
              <b>样本说明：</b>{seed.summary}
            </div>
            {seed.beforeAfter && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border-line)' }}>
                  <div style={{ fontSize: 11, marginBottom: 6, color: 'var(--ink-muted)', fontWeight: 600 }}>⟵ 前 / BEFORE</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-body)' }}>{seed.beforeAfter.before}</div>
                </div>
                <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border-line)' }}>
                  <div style={{ fontSize: 11, marginBottom: 6, color: 'var(--ink-muted)', fontWeight: 600 }}>⟶ 后 / AFTER</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-body)' }}>{seed.beforeAfter.after}</div>
                </div>
                <div style={{ padding: 12, background: 'white', borderRadius: 8, border: `2px solid ${seed.type === 'sample2_anomaly' ? 'var(--danger-red)' : 'var(--success-green)'}` }}>
                  <div style={{ fontSize: 11, marginBottom: 6, fontWeight: 700, color: seed.type === 'sample2_anomaly' ? 'var(--danger-red)' : 'var(--success-green)' }}>🔀 变化原因 / Δ</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-body)' }}>{seed.beforeAfter.change}</div>
                </div>
              </div>
            )}
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-muted)', borderTop: '1px dashed var(--border-line)', paddingTop: 10 }}>
              <b>对页面的影响：</b>{seed.impact}
            </div>
          </div>
        );
      })()}

      {chain.length > 1 && (
        <div class="card" id="version-chain">
          <div class="card-title">
            <span>🔗 版本时间线 · 同批次 {chain.length} 个版本</span>
            <span class="badge">{changedCount > 0 ? `上版变更 ${changedCount} 处` : '首个版本'}</span>
          </div>
          <div class="version-timeline">
            {chainWithData.map((item, idx) => {
              const v = item.main;
              const isCur = v.id === m.id;
              const isRb = !!v.rollbackFromId;
              return (
                <div key={v.id} class={`version-item ${isCur ? 'current' : ''} ${isRb ? 'rolled-back' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <b style={{ fontSize: 15 }}>
                        v{v.version}
                        {isCur && <span style={{ marginLeft: 8, color: 'var(--success-green)' }}>● 当前</span>}
                        {isRb && <span style={{ marginLeft: 8, color: 'var(--warning-amber)' }}>↩ 回滚</span>}
                        {v.isArchived && <span style={{ marginLeft: 8, color: 'var(--ink-muted)' }}>📦</span>}
                      </b>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                        {v.solutionARatio}:{v.solutionBRatio} · {v.paperType} · 评分 {item.full?.result?.overallScore ?? '待评'} · {fmtDate(v.createdAt)}
                      </div>
                      {v.notes && <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, maxWidth: 600 }}>{v.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {!isCur && <a class="btn" style={{ padding: '3px 10px', fontSize: 12 }} href={`/batch/${v.id}`}>查看</a>}
                      {!isCur && (
                        <button class="btn" style={{ padding: '3px 10px', fontSize: 12 }}
                          onClick$={() => { diffTargetId.value = v.id; showDiff.value = true; }}>⇄ 对比</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div id="main" class="card">
        <div class="card-title"><span>🧪 主记录 · 药液配比与纸张</span><span class="badge">L1 · 主记录层</span></div>
        <Form action={useUpdateMain} class="form-grid">
          <input type="hidden" name="id" value={m.id} />
          <div class="form-field"><label>药液 A (g)</label><input name="solutionARatio" type="number" step="0.1" value={m.solutionARatio} /></div>
          <div class="form-field"><label>药液 B (g)</label><input name="solutionBRatio" type="number" step="0.1" value={m.solutionBRatio} /></div>
          <div class="form-field"><label>药液 C (g)</label><input name="solutionC_Ratio" type="number" step="0.1" value={m.solutionC_Ratio ?? ''} /></div>
          <div class="form-field"><label>总容量 (ml)</label><input name="totalVolumeMl" type="number" step="1" value={m.totalVolumeMl} /></div>
          <div class="form-field"><label>纸张类型</label><input name="paperType" type="text" value={m.paperType} /></div>
          <div class="form-field"><label>克重 (g/m²)</label><input name="paperWeightGsm" type="number" step="1" value={m.paperWeightGsm} /></div>
          <div class="form-field">
            <label>状态</label>
            <select name="status" value={m.status}>
              <option value="draft">草稿</option>
              <option value="processing">进行中</option>
              <option value="completed">已完成</option>
              <option value="failed">失败</option>
            </select>
          </div>
          <div class="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>备注</label>
            <textarea name="notes" value={m.notes ?? ''}></textarea>
          </div>
          <div style={{ gridColumn: '1 / -1' }} class="btn-row">
            <button class="btn btn-primary" type="submit">💾 更新主记录</button>
          </div>
        </Form>
      </div>

      <div id="exposure" class="card">
        <div class="card-title">
          <span>📷 明细记录 · 曝光参数</span>
          <span class="badge">L2 · 明细记录层 · {batch.exposureDetails.length} 条</span>
        </div>
        {batch.exposureDetails.length > 0 && (
          <table class="data-table" style={{ marginBottom: 18 }}>
            <thead><tr>
              <th>Sheet#</th><th>UV强度 (mW/cm²)</th><th>曝光时长</th><th>UV指数</th>
              <th>光源</th><th>距离(cm)</th><th>操作</th>
            </tr></thead>
            <tbody>
              {batch.exposureDetails.map(e => (
                <tr key={e.id}>
                  <td><b>Sheet {e.sheetNo}</b></td>
                  <td>{e.uvIntensityMwCm2}</td>
                  <td>{e.exposureMinutes}分{e.exposureSeconds}秒</td>
                  <td>{e.uvIndex ?? '-'}</td>
                  <td>{e.lightSource}</td>
                  <td>{e.distanceCm}</td>
                  <td>
                    <Form action={useDelExposure}>
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="batchId" value={m.id} />
                      <button class="btn btn-danger" style={{ padding: '3px 10px', fontSize: 12 }} type="submit">删除</button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div class="section-subtitle">➕ 新增曝光记录</div>
        <Form action={useAddExposure} class="form-grid">
          <input type="hidden" name="batchId" value={m.id} />
          <div class="form-field"><label>Sheet 编号</label><input name="sheetNo" type="number" min="1" value={batch.exposureDetails.length + 1} required /></div>
          <div class="form-field"><label>UV强度 mW/cm²</label><input name="uvIntensityMwCm2" type="number" step="0.1" placeholder="如 6.8" required /></div>
          <div class="form-field"><label>分钟</label><input name="exposureMinutes" type="number" min="0" value="10" required /></div>
          <div class="form-field"><label>秒</label><input name="exposureSeconds" type="number" min="0" max="59" value="0" /></div>
          <div class="form-field"><label>UV指数</label><input name="uvIndex" type="number" step="0.1" placeholder="可选" /></div>
          <div class="form-field"><label>距离 (cm)</label><input name="distanceCm" type="number" step="0.5" value="0" required /></div>
          <div class="form-field" style={{ gridColumn: 'span 2 / auto' }}>
            <label>光源</label>
            <select name="lightSource">
              <option>太阳光(正午)</option><option>太阳光(上午)</option>
              <option>太阳光(下午)</option><option>UV灯箱(365nm)</option>
              <option>UV灯箱(405nm)</option><option>LED紫外</option><option>其他</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }} class="btn-row">
            <button class="btn btn-primary" type="submit">➕ 添加曝光记录</button>
          </div>
        </Form>
      </div>

      <div id="wash" class="card">
        <div class="card-title">
          <span>💧 历史记录 · 冲洗流程</span>
          <span class="badge">L3 · 历史记录层 · {batch.washHistories.length} 步</span>
        </div>
        {batch.washHistories.length > 0 && (
          <table class="data-table" style={{ marginBottom: 18 }}>
            <thead><tr>
              <th>顺序</th><th>阶段</th><th>时长</th><th>水温℃</th>
              <th>pH</th><th>搅拌Hz</th><th>备注</th><th>操作</th>
            </tr></thead>
            <tbody>
              {batch.washHistories.map(w => (
                <tr key={w.id}>
                  <td>#{w.orderIndex}</td>
                  <td><b>{WASH_STAGE_LABELS[w.stage]}</b></td>
                  <td>{w.durationMinutes}分{w.durationSeconds}秒</td>
                  <td>{w.waterTempC ?? '-'}</td>
                  <td>{w.phValue ?? '-'}</td>
                  <td>{w.agitationHz ?? '-'}</td>
                  <td style={{ fontSize: 12, maxWidth: 280 }}>{w.operatorNote || '-'}</td>
                  <td>
                    <Form action={useDelWash}>
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="batchId" value={m.id} />
                      <button class="btn btn-danger" style={{ padding: '3px 10px', fontSize: 12 }} type="submit">删除</button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div class="section-subtitle">➕ 新增冲洗步骤</div>
        <Form action={useAddWash} class="form-grid">
          <input type="hidden" name="batchId" value={m.id} />
          <div class="form-field"><label>步骤序号</label><input name="orderIndex" type="number" min="1" value={batch.washHistories.length + 1} required /></div>
          <div class="form-field">
            <label>阶段</label>
            <select name="stage">
              <option value="first_wash">初次水洗</option>
              <option value="acid_bath">酸浴定影</option>
              <option value="second_wash">二次水洗</option>
              <option value="final_rinse">最终漂洗</option>
            </select>
          </div>
          <div class="form-field"><label>分钟</label><input name="durationMinutes" type="number" min="0" value="5" required /></div>
          <div class="form-field"><label>秒</label><input name="durationSeconds" type="number" min="0" max="59" value="0" /></div>
          <div class="form-field"><label>水温 ℃</label><input name="waterTempC" type="number" step="0.5" placeholder="可选" /></div>
          <div class="form-field"><label>pH值</label><input name="phValue" type="number" step="0.1" placeholder="可选" /></div>
          <div class="form-field"><label>搅拌 Hz</label><input name="agitationHz" type="number" step="0.1" placeholder="可选" /></div>
          <div class="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>操作员备注</label>
            <input name="operatorNote" type="text" placeholder="观察到的现象..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }} class="btn-row">
            <button class="btn btn-primary" type="submit">➕ 添加冲洗步骤</button>
          </div>
        </Form>
      </div>

      <div id="result" class="card">
        <div class="card-title">
          <span>🎯 结果记录 · 环境与评估</span>
          <span class="badge">L4 · 结果记录层 {batch.result ? `· 重算 ${batch.result.recalculationCount} 次` : ''}</span>
        </div>
        <Form action={useSaveResult} class="form-grid">
          <input type="hidden" name="batchId" value={m.id} />
          {batch.result && <input type="hidden" name="existingResultId" value={batch.result.id} />}
          <div class="section-subtitle" style={{ gridColumn: '1 / -1' }}>🌡 环境参数</div>
          <div class="form-field"><label>室温 ℃</label><input name="roomTempC" type="number" step="0.1" value={batch.result?.roomTempC ?? 23} required /></div>
          <div class="form-field"><label>湿度 %</label><input name="humidityPct" type="number" step="1" value={batch.result?.humidityPct ?? 55} required /></div>
          <div class="form-field"><label>药液温度 ℃</label><input name="solutionTempC" type="number" step="0.1" value={batch.result?.solutionTempC ?? 21} required /></div>
          <div class="form-field"><label>干燥温度 ℃</label><input name="dryingTempC" type="number" step="0.5" value={batch.result?.dryingTempC ?? ''} /></div>
          <div class="form-field" style={{ gridColumn: 'span 2 / auto' }}>
            <label>干燥方式</label>
            <select name="dryingMethod">
              <option>自然阴干</option><option>通风晾干</option><option>烘干加速</option><option>压平干燥</option><option>其他</option>
            </select>
          </div>
          <div class="section-subtitle" style={{ gridColumn: '1 / -1' }}>📐 质量评分（1-10）</div>
          <div class="form-field"><label>视觉呈现</label><input name="visualGrade" type="range" min="1" max="10" value={batch.result?.visualGrade ?? 7} required /><div style={{ textAlign: 'center', fontWeight: 600 }}>{batch.result?.visualGrade ?? 7}</div></div>
          <div class="form-field"><label>密度饱和</label><input name="densityGrade" type="range" min="1" max="10" value={batch.result?.densityGrade ?? 7} required /><div style={{ textAlign: 'center', fontWeight: 600 }}>{batch.result?.densityGrade ?? 7}</div></div>
          <div class="form-field"><label>对比度</label><input name="contrastGrade" type="range" min="1" max="10" value={batch.result?.contrastGrade ?? 7} required /><div style={{ textAlign: 'center', fontWeight: 600 }}>{batch.result?.contrastGrade ?? 7}</div></div>
          <div class="form-field">
            <label>综合评分（自动或手动）</label>
            <input name="overallScore" type="number" min="0" max="100"
              value={batch.result?.overallScore ?? 70} />
          </div>
          <div class="section-subtitle" style={{ gridColumn: '1 / -1' }}>🏷 失败标签（多选)</div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {failTagsAll.map(t => (
              <label key={t} style={{
                padding: '5px 10px', border: '1px solid var(--border-line)',
                borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                background: batch.result?.failTags?.includes(t) ? '#fde8e8' : 'white',
                color: batch.result?.failTags?.includes(t) ? 'var(--danger-red)' : 'var(--ink-dark)',
              }}>
                <input type="checkbox" name="failTags" value={t}
                  checked={batch.result?.failTags?.includes(t)} />
                {FAIL_TAG_LABELS[t]}
              </label>
            ))}
          </div>
          <div class="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>评估人</label>
            <input name="evaluator" type="text" value={batch.result?.evaluator ?? m.createdBy} required />
          </div>
          <div class="form-field" style={{ gridColumn: '1 / -1' }}>
            <label>评估备注</label>
            <textarea name="evaluationNote" value={batch.result?.evaluationNote ?? ''}></textarea>
          </div>
          {batch.result && batch.result.recalculationNote && (
            <div style={{ gridColumn: '1 / -1', padding: 10, background: '#fef3e2', borderRadius: 6, fontSize: 12, color: 'var(--warning-amber)' }}>
              <b>重算记录：</b>第{batch.result.recalculationCount}次重算 · {fmtDate(batch.result.lastRecalculatedAt)}<br />
              {batch.result.recalculationNote}
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }} class="btn-row">
            <button class="btn btn-success" type="submit">
              {batch.result ? '💾 更新评估结果' : '✅ 提交评估结果'}
            </button>
          </div>
        </Form>
      </div>

      <div id="anomaly" class="card">
        <div class="card-title">
          <span>⚠ 参数对比与异常检测</span>
          <span class="badge" style={{
            background: highAnomalies > 0 ? '#fde8e8' : anomaliesCount > 0 ? '#fef3e2' : '#e6f4ea',
            color: highAnomalies > 0 ? 'var(--danger-red)' : anomaliesCount > 0 ? 'var(--warning-amber)' : 'var(--success-green)',
          }}>
            {highAnomalies > 0 ? `${highAnomalies} 严重异常` : anomaliesCount > 0 ? `${anomaliesCount} 项偏离` : '✓ 正常'}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 14 }}>
          基线样本：{data.value.baseline.sampleCount} 批次 · 平均综合得分 {data.value.baseline.avgOverallScore.toFixed(1)}
        </div>
        <div class="param-compare">
          {anomalies.map(a => (
            <div key={a.field} class={`compare-item ${a.isAnomaly ? 'anomaly' : ''}`}>
              <div class="compare-label">{a.label}</div>
              <div class="compare-value">{a.currentValue}</div>
              <div class="compare-delta">
                <span class={
                  a.deviationPct > 0 ? 'delta-up' : a.deviationPct < 0 ? 'delta-down' : 'delta-normal'}>
                  {a.deviationPct > 0 ? '▲' : a.deviationPct < 0 ? '▼' : '='} {Math.abs(a.deviationPct)}%
                </span>
                <span style={{ color: 'var(--ink-muted)' }}> · 基线 {a.baselineValue}</span>
              </div>
              <div style={{ fontSize: 11, marginTop: 6, color: a.isAnomaly ? 'var(--danger-red)' : 'var(--success-green)' }}>
                {a.isAnomaly && <b>[{a.severity === 'high' ? '严重' : a.severity === 'medium' ? '中度' : '轻度'}] </b>}
                {a.suggestion}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="photos" class="card">
        <div class="card-title">
          <span>🖼 批次照片档案</span>
          <span class="badge">{batch.photos.length} 张</span>
        </div>
        {batch.photos.length > 0 && (
          <>
            <div class="photo-grid" style={{ marginBottom: 20 }}>
              {batch.photos.map(p => (
                <div key={p.id} class="photo-item">
                  <div class="photo-placeholder" style={p.dataUrl.startsWith('data:') ?
                    { backgroundImage: `url(${p.dataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
                    {!p.dataUrl.startsWith('data:image') && PHOTO_STAGE_LABELS[p.stage]}
                  </div>
                  <div class="photo-caption">
                    <div><b>{PHOTO_STAGE_LABELS[p.stage]}</b></div>
                    {p.caption && <div style={{ marginTop: 2 }}>{p.caption}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ color: 'var(--ink-muted)' }}>{fmtDate(p.createdAt)}</span>
                      <Form action={useDelPhoto}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="batchId" value={m.id} />
                        <button class="btn btn-danger" style={{ padding: '1px 6px', fontSize: 10 }} type="submit">删</button>
                      </Form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div class="section-subtitle">➕ 上传照片</div>
        <Form action={useAddPhoto} class="form-grid" onSubmit$={() => { }}>
          <input type="hidden" name="batchId" value={m.id} />
          <input type="hidden" name="dataUrl" bind:value={photoDataUrl} />
          <div class="form-field">
            <label>选择图片</label>
            <input type="file" accept="image/*" onInput$={handlePhotoFile} />
            {photoDataUrl.value && (
              <img src={photoDataUrl.value} alt="preview"
                style={{ marginTop: 8, maxWidth: 160, maxHeight: 120, borderRadius: 6, border: '1px solid var(--border-line)' }} />
            )}
          </div>
          <div class="form-field">
            <label>阶段</label>
            <select name="stage" onChange$={(e) => { photoStage.value = (e.target as HTMLSelectElement).value as any; }}>
              <option value="before_exposure">曝光前</option>
              <option value="after_exposure">曝光后</option>
              <option value="after_wash">水洗后</option>
              <option value="dried">干燥成品</option>
            </select>
          </div>
          <div class="form-field" style={{ gridColumn: 'span 2 / auto' }}>
            <label>说明文字</label>
            <input name="caption" type="text" onInput$={(e) => { photoCaption.value = (e.target as HTMLInputElement).value; }}
              placeholder="观察到的关键特征..." />
          </div>
          <div style={{ gridColumn: '1 / -1' }} class="btn-row">
            <button class="btn btn-primary" type="submit">📤 上传照片</button>
          </div>
        </Form>
      </div>

      {showDiff.value && targetForDiff.value && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20
        }} onClick$={() => showDiff.value = false}>
          <div style={{
            background: 'white', borderRadius: 10, maxWidth: 760, width: '100%',
            maxHeight: '85vh', overflow: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick$={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: 'var(--cyan-blue)' }}>
                ⇄ 版本对比：{targetForDiff.value.batchNo} v{targetForDiff.value.version} → v{m.version}
              </h3>
              <button class="btn" onClick$={() => showDiff.value = false}>✕ 关闭</button>
            </div>
            <div style={{ display: 'flex', gap: 16, padding: 12, background: 'var(--paper-cream)', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--danger-red)' }}>◀ 旧版本 v{targetForDiff.value.version}</b>
                <div style={{ color: 'var(--ink-muted)', marginTop: 2 }}>{fmtDate(targetForDiff.value.createdAt)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <b style={{ color: 'var(--success-green)' }}>新版本 v{m.version} ▶</b>
                <div style={{ color: 'var(--ink-muted)', marginTop: 2 }}>{fmtDate(m.createdAt)}</div>
              </div>
            </div>
            <div>
              {diffWithTarget.value.map(d => (
                <div key={d.field} class="diff-row">
                  <div class="diff-label">{d.label}</div>
                  <div class={d.changed ? 'diff-old' : 'diff-same'}>
                    {d.oldValue === null || d.oldValue === undefined || d.oldValue === '' ? '(空)' : String(d.oldValue)}
                  </div>
                  <div class={d.changed ? 'diff-new' : 'diff-same'}>
                    {d.newValue === null || d.newValue === undefined || d.newValue === '' ? '(空)' : String(d.newValue)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showRecalc.value && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick$={() => showRecalc.value = false}>
          <div style={{ background: 'white', padding: 24, borderRadius: 10, maxWidth: 440, width: '100%' }} onClick$={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--warning-amber)' }}>🔁 创建重算版本</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 14px' }}>
              基于当前 v{m.version} 创建新版本：复制全部四层数据，配方、曝光、冲洗记录都将继承，您可以在新版本上修改关键参数后重新评估。
            </p>
            <Form action={useRecalc}>
              <input type="hidden" name="id" value={m.id} />
              <div class="form-field">
                <label>操作人</label>
                <input name="createdBy" type="text" value={m.createdBy} required />
              </div>
              <div class="btn-row">
                <button class="btn btn-warning" type="submit">确认创建重算版本</button>
                <button type="button" class="btn" onClick$={() => showRecalc.value = false}>取消</button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showRollback.value && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick$={() => showRollback.value = false}>
          <div style={{ background: 'white', padding: 24, borderRadius: 10, maxWidth: 440, width: '100%' }} onClick$={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--warning-amber)' }}>↩ 回滚到此版本参数</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 14px' }}>
              将本版 v{m.version} 作为回滚目标，创建一个新版本继承本版参数（可用于撤销后续改动）。
            </p>
            <Form action={useRollback}>
              <input type="hidden" name="id" value={m.id} />
              <div class="form-field">
                <label>操作人</label>
                <input name="createdBy" type="text" value={m.createdBy} required />
              </div>
              <div class="form-field">
                <label>回滚原因</label>
                <textarea name="reason" placeholder="如：后续版本曝光参数偏离过多"></textarea>
              </div>
              <div class="btn-row">
                <button class="btn btn-warning" type="submit">确认创建回滚版本</button>
                <button type="button" class="btn" onClick$={() => showRollback.value = false}>取消</button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showArchive.value && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick$={() => showArchive.value = false}>
          <div style={{ background: 'white', padding: 24, borderRadius: 10, maxWidth: 440, width: '100%' }} onClick$={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--ink-muted)' }}>📦 归档批次</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', margin: '0 0 14px' }}>
              归档后该批次将从默认列表和基线计算中移除，但数据永久保留。
            </p>
            <Form action={useArchive}>
              <input type="hidden" name="id" value={m.id} />
              <div class="form-field">
                <label>归档原因</label>
                <textarea name="reason" placeholder="如：参数不理想，作为对照样本" required></textarea>
              </div>
              <div class="btn-row">
                <button class="btn" type="submit">确认归档</button>
                <button type="button" class="btn" onClick$={() => showArchive.value = false}>取消</button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showExport.value && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick$={() => showExport.value = false}>
          <div style={{ background: 'white', padding: 24, borderRadius: 10, maxWidth: 520, width: '100%' }} onClick$={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--cyan-blue)' }}>⬇ 导出批次记录</h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <a class="btn btn-primary" style={{ flex: 1, justifyContent: 'center', display: 'flex' }}
                href={`/export?id=${encodeURIComponent(m.id)}&format=json`} target="_blank" rel="noopener">
                JSON 完整导出
              </a>
              <a class="btn btn-primary" style={{ flex: 1, justifyContent: 'center', display: 'flex' }}
                href={`/export?id=${encodeURIComponent(m.id)}&format=csv`} target="_blank" rel="noopener">
                CSV 摘要导出
              </a>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              JSON 包含全部四层记录明细；CSV 仅包含批次摘要信息，便于表格查看。
            </div>
            <div class="btn-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
              <button type="button" class="btn" onClick$={() => showExport.value = false}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {prevMain && (
        <div class="card" style={{ borderColor: 'var(--warning-amber)', background: '#fffbf2' }}>
          <div class="card-title">
            <span>🔍 上版差异 (v{prevMain.version} → v{m.version})</span>
            <span class="badge" style={{ background: '#fef3e2', color: 'var(--warning-amber)' }}>
              变更 {changedCount} / {versionDiffs.length}
            </span>
          </div>
          <div>
            {versionDiffs.map(d => (
              <div key={d.field} class="diff-row">
                <div class="diff-label">{d.label}</div>
                <div class={d.changed ? 'diff-old' : 'diff-same'}>
                  {d.oldValue ?? '(空)'}</div>
                <div class={d.changed ? 'diff-new' : 'diff-same'}>
                  {d.newValue ?? '(空)'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
