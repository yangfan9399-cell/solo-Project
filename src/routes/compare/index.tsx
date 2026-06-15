import { component$, useComputed$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link, Form, globalAction$ } from '@builder.io/qwik-city';
import { listMainRecords, getFullBatch } from '~/lib/db';
import { STATUS_LABELS, FAIL_TAG_LABELS, WASH_STAGE_LABELS, fmtDate, runAnomalyCheck, computeBaseline } from '~/lib/utils';

export const useCompareData = routeLoader$(async () => {
  const mains = listMainRecords({ includeArchived: true });
  const baseline = computeBaseline();
  const enriched = mains.map(m => {
    const batch = getFullBatch(m.id);
    return {
      main: m,
      result: batch?.result ?? null,
      exposures: batch?.exposureDetails ?? [],
      washes: batch?.washHistories ?? [],
      photoCount: batch?.photos.length ?? 0,
    };
  });
  return { enriched, baseline };
});

export default component$(() => {
  const { enriched, baseline } = useCompareData();
  const selectedIds = useSignal<string[]>([]);
  const maxSelect = 4;

  const toggleSelect = $((id: string) => {
    if (selectedIds.value.includes(id)) {
      selectedIds.value = selectedIds.value.filter(x => x !== id);
    } else if (selectedIds.value.length < maxSelect) {
      selectedIds.value = [...selectedIds.value, id];
    }
  });

  const selected = useComputed$(() =>
    enriched.value.filter(x => selectedIds.value.includes(x.main.id))
  );

  const selectedAnomalies = useComputed$(() =>
    selected.value.map(s => {
      const batch = {
        main: s.main, exposureDetails: s.exposures,
        washHistories: s.washes, result: s.result, photos: [] as any[],
      };
      return {
        id: s.main.id,
        batchNo: s.main.batchNo,
        version: s.main.version,
        anomalies: runAnomalyCheck(batch as any, baseline.value),
      };
    })
  );

  return (
    <div>
      <div class="card">
        <div class="card-title">
          <span>⇄ 全局参数对比 · 异常检测</span>
          <span class="badge">已选 {selectedIds.value.length} / {maxSelect}</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 14 }}>
          点击下方批次行进行选择对比（最多 {maxSelect} 个），或勾选后在下方查看详细参数对比与异常热力图。
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>批次号</th>
              <th>版本</th>
              <th>药液A:B</th>
              <th>总容量</th>
              <th>纸张</th>
              <th>曝光时长</th>
              <th>室温/湿度</th>
              <th>评分</th>
              <th>失败标签</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {enriched.value.map(item => {
              const m = item.main;
              const r = item.result;
              const exp = item.exposures[0];
              const totalExpSec = exp ? exp.exposureMinutes * 60 + exp.exposureSeconds : 0;
              const isSel = selectedIds.value.includes(m.id);
              return (
                <tr key={m.id}
                  onClick$={() => toggleSelect(m.id)}
                  style={{ cursor: 'pointer', background: isSel ? 'var(--cyan-pale)' : undefined }}>
                  <td onClick$={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={isSel} onChange$={() => toggleSelect(m.id)} />
                  </td>
                  <td>
                    <b>{m.batchNo}</b>
                    {m.isArchived && <span style={{ fontSize: 10, color: 'var(--ink-muted)', marginLeft: 4 }}>📦</span>}
                    {m.rollbackFromId && <span style={{ fontSize: 10, color: 'var(--warning-amber)', marginLeft: 4 }}>↩</span>}
                  </td>
                  <td>v{m.version}</td>
                  <td>{m.solutionARatio}:{m.solutionBRatio}{m.solutionC_Ratio ? `:${m.solutionC_Ratio}` : ''}</td>
                  <td>{m.totalVolumeMl}ml</td>
                  <td style={{ fontSize: 12 }}>{m.paperType}</td>
                  <td>{exp ? `${Math.floor(totalExpSec / 60)}分${totalExpSec % 60}秒` : '—'}</td>
                  <td>{r ? `${r.roomTempC}℃ / ${r.humidityPct}%` : '—'}</td>
                  <td style={{
                    fontWeight: 700,
                    color: r ? (r.overallScore >= 70 ? 'var(--success-green)' :
                      r.overallScore >= 50 ? 'var(--warning-amber)' : 'var(--danger-red)') : 'var(--ink-muted)',
                  }}>
                    {r?.overallScore ?? '—'}
                  </td>
                  <td>
                    {r?.failTags?.length ? (
                      <div class="fail-tags">{r.failTags.slice(0, 2).map(t =>
                        <span key={t} class="fail-tag">{FAIL_TAG_LABELS[t]}</span>)}
                      </div>
                    ) : (r ? '—' : '待评')}
                  </td>
                  <td><span class={`status-tag ${
                    m.status === 'completed' ? 'status-normal' :
                    m.status === 'failed' ? 'status-danger' : 'status-warning'
                  }`}>{STATUS_LABELS[m.status]}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected.value.length >= 2 && (
        <div class="card">
          <div class="card-title">
            <span>📊 参数对比矩阵</span>
            <span class="badge">{selected.value.length} 个批次</span>
          </div>
          <div style={{ overflow: 'auto' }}>
            <table class="data-table">
              <thead>
                <tr>
                  <th>参数项</th>
                  {selected.value.map(s => (
                    <th key={s.main.id}>
                      <div>{s.main.batchNo}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, color: 'var(--ink-muted)' }}>v{s.main.version}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, background: 'var(--paper-cream)' }} colSpan={selected.value.length + 1}>
                    <div class="batch-tree"><span class="batch-level-dot"></span> L1 · 主记录层</div>
                  </td>
                </tr>
                {[
                  ['药液A (g)', (s: any) => s.main.solutionARatio],
                  ['药液B (g)', (s: any) => s.main.solutionBRatio],
                  ['药液C (g)', (s: any) => s.main.solutionC_Ratio ?? '—'],
                  ['总容量 (ml)', (s: any) => s.main.totalVolumeMl],
                  ['纸张', (s: any) => s.main.paperType],
                  ['克重 (gsm)', (s: any) => s.main.paperWeightGsm],
                  ['状态', (s: any) => STATUS_LABELS[s.main.status]],
                ].map(([label, fn]) => (
                  <tr key={label as string}>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{label}</td>
                    {selected.value.map(s => {
                      const vals = selected.value.map(x => (fn as any)(x));
                      const unique = [...new Set(vals.map(v => JSON.stringify(v)))];
                      const hasDiff = unique.length > 1;
                      const v = (fn as any)(s);
                      return (
                        <td key={s.main.id} style={{
                          fontWeight: hasDiff ? 600 : 400,
                          background: hasDiff ? 'rgba(42,125,225,0.05)' : undefined,
                          color: hasDiff ? 'var(--cyan-blue)' : undefined,
                        }}>{v}</td>
                      );
                    })}
                  </tr>
                ))}

                <tr>
                  <td style={{ fontWeight: 600, background: 'var(--paper-cream)' }} colSpan={selected.value.length + 1}>
                    <div class="batch-tree"><span class="batch-level-dot l2"></span> L2 · 曝光明细（首条）</div>
                  </td>
                </tr>
                {[
                  ['UV强度 mW/cm²', (s: any) => s.exposures[0]?.uvIntensityMwCm2 ?? '—'],
                  ['曝光时长', (s: any) => s.exposures[0] ?
                    `${s.exposures[0].exposureMinutes}分${s.exposures[0].exposureSeconds}秒` : '—'],
                  ['光源', (s: any) => s.exposures[0]?.lightSource ?? '—'],
                ].map(([label, fn]) => (
                  <tr key={label as string}>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{label}</td>
                    {selected.value.map(s => {
                      const vals = selected.value.map(x => JSON.stringify((fn as any)(x)));
                      const hasDiff = [...new Set(vals)].length > 1;
                      return (
                        <td key={s.main.id} style={{
                          background: hasDiff ? 'rgba(42,125,225,0.05)' : undefined,
                          color: hasDiff ? 'var(--cyan-blue)' : undefined,
                        }}>{(fn as any)(s)}</td>
                      );
                    })}
                  </tr>
                ))}

                <tr>
                  <td style={{ fontWeight: 600, background: 'var(--paper-cream)' }} colSpan={selected.value.length + 1}>
                    <div class="batch-tree"><span class="batch-level-dot l3"></span> L3 · 冲洗历史</div>
                  </td>
                </tr>
                {[
                  ['步骤数', (s: any) => s.washes.length],
                  ['总时长(分)', (s: any) =>
                    s.washes.reduce((t: number, w: any) =>
                      t + w.durationMinutes + w.durationSeconds / 60, 0).toFixed(1)],
                  ['平均水温℃', (s: any) => {
                    const ts = s.washes.filter((w: any) => w.waterTempC != null);
                    return ts.length ? (ts.reduce((a: number, w: any) => a + w.waterTempC, 0) / ts.length).toFixed(1) : '—';
                  }],
                ].map(([label, fn]) => (
                  <tr key={label as string}>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{label}</td>
                    {selected.value.map(s => {
                      const vals = selected.value.map(x => String((fn as any)(x)));
                      const hasDiff = [...new Set(vals)].length > 1;
                      return (
                        <td key={s.main.id} style={{
                          background: hasDiff ? 'rgba(42,125,225,0.05)' : undefined,
                          color: hasDiff ? 'var(--cyan-blue)' : undefined,
                        }}>{(fn as any)(s)}</td>
                      );
                    })}
                  </tr>
                ))}

                <tr>
                  <td style={{ fontWeight: 600, background: 'var(--paper-cream)' }} colSpan={selected.value.length + 1}>
                    <div class="batch-tree"><span class="batch-level-dot l4"></span> L4 · 结果评估</div>
                  </td>
                </tr>
                {[
                  ['室温℃', (s: any) => s.result?.roomTempC ?? '—'],
                  ['湿度%', (s: any) => s.result?.humidityPct ?? '—'],
                  ['药液温度℃', (s: any) => s.result?.solutionTempC ?? '—'],
                  ['视觉评分', (s: any) => s.result?.visualGrade ?? '—'],
                  ['密度评分', (s: any) => s.result?.densityGrade ?? '—'],
                  ['对比度评分', (s: any) => s.result?.contrastGrade ?? '—'],
                  ['综合得分', (s: any) => s.result?.overallScore ?? '—'],
                  ['是否成功', (s: any) => s.result ? (s.result.isSuccess ? '✓ 成功' : '✗ 失败') : '—'],
                  ['失败标签', (s: any) => s.result?.failTags?.length ?
                    s.result.failTags.map((t: string) => FAIL_TAG_LABELS[t as keyof typeof FAIL_TAG_LABELS]).join('、') : '—'],
                  ['评估人', (s: any) => s.result?.evaluator ?? '—'],
                  ['重算次数', (s: any) => s.result?.recalculationCount ?? 0],
                  ['照片', (s: any) => `${s.photoCount} 张`],
                ].map(([label, fn]) => (
                  <tr key={label as string}>
                    <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{label}</td>
                    {selected.value.map(s => {
                      const vals = selected.value.map(x => JSON.stringify((fn as any)(x)));
                      const hasDiff = [...new Set(vals)].length > 1;
                      const v = (fn as any)(s);
                      return (
                        <td key={s.main.id} style={{
                          fontWeight: hasDiff ? 600 : 400,
                          background: hasDiff ? 'rgba(42,125,225,0.05)' : undefined,
                          color: hasDiff ? 'var(--cyan-blue)' : undefined,
                          fontSize: 12,
                        }}>{v}</td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected.value.length >= 1 && (
        <div class="card">
          <div class="card-title">
            <span>🚩 异常检测汇总 · 基于 {baseline.value.sampleCount} 批次基线</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(320px, 1fr))`, gap: 16 }}>
            {selectedAnomalies.value.map(sa => {
              const anomalies = sa.anomalies.filter(a => a.isAnomaly);
              const normal = sa.anomalies.filter(a => !a.isAnomaly);
              return (
                <div key={sa.id} style={{
                  padding: 16, borderRadius: 10,
                  border: `1px solid ${anomalies.length ? 'var(--danger-red)' : 'var(--success-green)'}`,
                  background: anomalies.length ? '#fff7f7' : '#f5fbf7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <b>{sa.batchNo}</b> <span style={{ color: 'var(--ink-muted)' }}>v{sa.version}</span>
                    </div>
                    <span style={{
                      padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: anomalies.length ? '#fde8e8' : '#e6f4ea',
                      color: anomalies.length ? 'var(--danger-red)' : 'var(--success-green)',
                    }}>
                      {anomalies.length} 异常 / {normal.length} 正常
                    </span>
                  </div>
                  {anomalies.length ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {anomalies.map(a => (
                        <div key={a.field} style={{
                          padding: '6px 8px', background: 'white', borderRadius: 6,
                          borderLeft: `3px solid ${a.severity === 'high' ? 'var(--danger-red)' : 'var(--warning-amber)'}`,
                          fontSize: 12,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <b>{a.label}</b>
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 8,
                              background: a.severity === 'high' ? '#fde8e8' : '#fef3e2',
                              color: a.severity === 'high' ? 'var(--danger-red)' : 'var(--warning-amber)',
                            }}>
                              {a.severity === 'high' ? '严重' : a.severity === 'medium' ? '中度' : '轻度'}
                              {' '}{a.deviationPct > 0 ? '↑' : '↓'}{Math.abs(a.deviationPct)}%
                            </span>
                          </div>
                          <div style={{ color: 'var(--ink-muted)', marginTop: 2 }}>{a.suggestion}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--success-green)', fontSize: 13 }}>✓ 所有参数均在正常范围内</div>
                  )}
                  <div style={{ marginTop: 10, textAlign: 'right' }}>
                    <Link class="btn" style={{ padding: '3px 10px', fontSize: 12 }} href={`/batch/${sa.id}`}>查看详情 →</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div class="card">
        <div class="card-title"><span>📏 基线参考值（全量样本均值）</span></div>
        <div class="param-compare">
          <div class="compare-item"><div class="compare-label">药液A 平均</div><div class="compare-value">{baseline.value.avgSolutionA.toFixed(1)}g</div></div>
          <div class="compare-item"><div class="compare-label">药液B 平均</div><div class="compare-value">{baseline.value.avgSolutionB.toFixed(1)}g</div></div>
          <div class="compare-item"><div class="compare-label">总容量 平均</div><div class="compare-value">{baseline.value.avgTotalVolume.toFixed(0)}ml</div></div>
          <div class="compare-item"><div class="compare-label">曝光分钟 平均</div><div class="compare-value">{baseline.value.avgExposureMin.toFixed(1)}分</div></div>
          <div class="compare-item"><div class="compare-label">UV强度 平均</div><div class="compare-value">{baseline.value.avgUvIntensity.toFixed(1)}</div></div>
          <div class="compare-item"><div class="compare-label">水洗总时长 平均</div><div class="compare-value">{baseline.value.avgWashTotalMin.toFixed(1)}分</div></div>
          <div class="compare-item"><div class="compare-label">室温 平均</div><div class="compare-value">{baseline.value.avgRoomTemp.toFixed(1)}℃</div></div>
          <div class="compare-item"><div class="compare-label">湿度 平均</div><div class="compare-value">{baseline.value.avgHumidity.toFixed(0)}%</div></div>
          <div class="compare-item"><div class="compare-label">综合得分 平均</div><div class="compare-value">{baseline.value.avgOverallScore.toFixed(1)}</div></div>
        </div>
      </div>
    </div>
  );
});
