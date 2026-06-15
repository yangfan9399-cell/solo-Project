// @ts-nocheck
import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { listMainRecords, getFullBatch, getVersionChain } from '~/lib/db';
import { STATUS_LABELS, FAIL_TAG_LABELS, fmtDate, detectSeed } from '~/lib/utils';

export const useArchiveList = routeLoader$(async () => {
  const archived = listMainRecords({ includeArchived: true }).filter(m => m.isArchived);
  return archived.map(m => {
    const batch = getFullBatch(m.id);
    const chain = getVersionChain(m.batchNo);
    const seed = detectSeed(m, batch?.result, batch?.photos, chain);
    return {
      main: m,
      result: batch?.result ?? null,
      photos: batch?.photos.length ?? 0,
      seed,
    };
  });
});

export default component$(() => {
  const data = useArchiveList();
  return (
    <div>
      <div class="card">
        <div class="card-title">
          <span>📦 归档批次库</span>
          <span class="badge">{data.value.length} 条</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 14, lineHeight: 1.7 }}>
          归档库保留<b>失败案例、历史版本、已完成但不再参考的批次</b>。
          归档记录不参与默认基线计算，但可以在参数对比页勾选后进行对比，作为边界样本的负参考。
        </div>
        {data.value.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">📦</div>
            <p>归档库为空</p>
            <p style={{ fontSize: 12 }}>失败或完成不再使用的批次可以归档，保留数据但不参与默认对比基线</p>
          </div>
        ) : (
          <table class="data-table">
            <thead>
              <tr>
                <th>批次号</th>
                <th>版本</th>
                <th>药液配比</th>
                <th>评分</th>
                <th>失败标签</th>
                <th>归档原因</th>
                <th>归档时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.value.map(item => (
                <tr key={item.main.id} style={{ background: item.seed.type !== 'custom' ? 'var(--warning-amber-faint)' : undefined }}>
                  <td>
                    <div><b>{item.main.batchNo}</b></div>
                    <div style={{ marginTop: 4 }}>
                      <span class={item.seed.badgeClass} style={{ padding: '1px 6px', fontSize: 10, border: 'none' }}>
                        {item.seed.shortLabel}
                      </span>
                    </div>
                  </td>
                  <td>v{item.main.version}</td>
                  <td>{item.main.solutionARatio}:{item.main.solutionBRatio} / {item.main.totalVolumeMl}ml</td>
                  <td style={{ fontWeight: 600, color: item.result?.overallScore != null && item.result.overallScore < 50 ? 'var(--danger-red)' : 'var(--ink-muted)' }}>
                    {item.result?.overallScore ?? '—'}
                  </td>
                  <td>
                    {item.result?.failTags?.length ? (
                      <div class="fail-tags">
                        {item.result.failTags.slice(0, 3).map(t => (
                          <span key={t} class="fail-tag">{FAIL_TAG_LABELS[t]}</span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: 12, maxWidth: 260 }}>
                    <div>{item.main.archiveReason || '-'}</div>
                    {item.seed.beforeAfter && (
                      <div style={{ fontSize: 11, marginTop: 6, color: 'var(--warning-amber)', fontWeight: 600 }}>
                        Δ {item.seed.beforeAfter.change}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{fmtDate(item.main.archivedAt)}</td>
                  <td>
                    <Link href={`/batch/${item.main.id}`} class="btn" style={{ padding: '4px 10px', fontSize: 12 }}>
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(() => {
        const seeded = data.value.filter(i => i.seed.type !== 'custom');
        if (seeded.length === 0) return null;
        return (
          <div class="card" style={{ borderColor: 'var(--warning-amber)', background: 'linear-gradient(135deg, var(--warning-amber-faint) 0%, white 100%)' }}>
            <div class="card-title">
              <span>🧪 边界样本归档说明 · 为什么这些版本会被归档</span>
              <span class="badge">{seeded.length} 个边界样本</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {seeded.map(item => (
                <div key={item.main.id} style={{
                  padding: 14, borderRadius: 8, background: 'white',
                  border: '1px solid var(--border-line)'
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {item.main.batchNo} v{item.main.version}
                    <span class={item.seed.badgeClass} style={{ padding: '1px 6px', fontSize: 10, border: 'none' }}>
                      {item.seed.shortLabel}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-body)', lineHeight: 1.6, marginBottom: 10 }}>
                    {item.seed.summary}
                  </div>
                  {item.seed.beforeAfter && (
                    <div style={{
                      padding: 10, background: 'var(--cyan-pale-faint)', borderRadius: 6,
                      border: '1px dashed var(--border-line)', fontSize: 12,
                    }}>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>失败前：</span>
                        <span>{item.seed.beforeAfter.before}</span>
                      </div>
                      <div style={{ marginBottom: 6 }}>
                        <span style={{ color: 'var(--ink-muted)', fontWeight: 600 }}>后续：</span>
                        <span>{item.seed.beforeAfter.after}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--warning-amber)' }}>
                        🔀 {item.seed.beforeAfter.change}
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-muted)', borderTop: '1px dashed var(--border-line)', paddingTop: 8 }}>
                    <b>归档影响：</b>从基线计算中排除此版本，避免失败配方影响参考标准；在参数对比页仍可勾选作为负样本对照。
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
});
