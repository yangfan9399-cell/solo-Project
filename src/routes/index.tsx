import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { listMainRecords, getResultRecordByMain, getFullBatch } from '~/lib/db';
import { STATUS_LABELS, FAIL_TAG_LABELS, fmtDate } from '~/lib/utils';

export const useBatchList = routeLoader$(async () => {
  const mains = listMainRecords({ includeArchived: false });
  return mains.map(m => {
    const result = getResultRecordByMain(m.id);
    const batch = getFullBatch(m.id);
    return {
      main: m,
      overallScore: result?.overallScore ?? null,
      failTags: result?.failTags ?? [],
      isSuccess: result?.isSuccess ?? null,
      exposureCount: batch?.exposureDetails.length ?? 0,
      washCount: batch?.washHistories.length ?? 0,
      photoCount: batch?.photos.length ?? 0,
      hasResult: !!result,
    };
  });
});

export default component$(() => {
  const data = useBatchList();

  const statusClass = (s: string, archived: boolean) => {
    if (archived) return 'status-tag status-archived';
    if (s === 'completed') return 'status-tag status-normal';
    if (s === 'failed') return 'status-tag status-danger';
    if (s === 'archived' || s === 'rolled_back') return 'status-tag status-archived';
    return 'status-tag status-warning';
  };

  return (
    <div>
      <div class="card">
        <div class="card-title">
          <span>🧪 活跃批次列表</span>
          <span class="badge">{data.value.length} 条记录</span>
        </div>

        {data.value.length === 0 ? (
          <div class="empty-state">
            <div class="empty-state-icon">🧪</div>
            <p>暂无批次记录</p>
            <p style={{ fontSize: 12 }}>点击「新建批次」开始记录您的第一次晒蓝工艺实验</p>
          </div>
        ) : (
          <table class="data-table">
            <thead>
              <tr>
                <th>批次号</th>
                <th>版本</th>
                <th>药液配比 A:B</th>
                <th>纸张</th>
                <th>曝光/冲洗</th>
                <th>评分</th>
                <th>失败标签</th>
                <th>照片</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.value.map(item => {
                const m = item.main;
                return (
                  <tr key={m.id}>
                    <td>
                      <div class="batch-tree">
                        <span class="batch-level-dot"></span>
                        <b>{m.batchNo}</b>
                      </div>
                      {m.parentId && (
                        <div style={{ fontSize: 11, color: 'var(--ink-muted)', paddingLeft: 14 }}>
                          ↳ 派生版本
                        </div>
                      )}
                      {m.rollbackFromId && (
                        <div style={{ fontSize: 11, color: 'var(--warning-amber)', paddingLeft: 14 }}>
                          ↩ 回滚版本
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        background: 'var(--cyan-pale)',
                        borderRadius: 10,
                        color: 'var(--cyan-blue)',
                        fontWeight: 600,
                        fontSize: 12,
                      }}>v{m.version}</span>
                    </td>
                    <td>
                      <div>{m.solutionARatio} : {m.solutionBRatio}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                        {m.totalVolumeMl}ml{m.solutionC_Ratio ? ` +C${m.solutionC_Ratio}` : ''}
                      </div>
                    </td>
                    <td>
                      <div>{m.paperType}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{m.paperWeightGsm} g/m²</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--cyan-blue)' }}>📷 {item.exposureCount}</span>
                      <span style={{ margin: '0 4px', color: 'var(--border-line)' }}>|</span>
                      <span style={{ color: 'var(--warning-amber)' }}>💧 {item.washCount}</span>
                    </td>
                    <td>
                      {item.overallScore !== null ? (
                        <div>
                          <div style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: item.overallScore >= 70 ? 'var(--success-green)' :
                              item.overallScore >= 50 ? 'var(--warning-amber)' : 'var(--danger-red)',
                          }}>
                            {item.overallScore}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--ink-muted)' }}>/ 100</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                    <td>
                      {item.failTags.length > 0 ? (
                        <div class="fail-tags">
                          {item.failTags.slice(0, 2).map(t => (
                            <span key={t} class="fail-tag">{FAIL_TAG_LABELS[t]}</span>
                          ))}
                          {item.failTags.length > 2 && (
                            <span class="fail-tag">+{item.failTags.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        item.hasResult ? (
                          <span class="status-tag status-normal">✓ 无</span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>待评估</span>
                        )
                      )}
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        background: item.photoCount > 0 ? 'var(--cyan-pale)' : '#f0f0f0',
                        borderRadius: 10,
                        fontSize: 11,
                        color: item.photoCount > 0 ? 'var(--cyan-blue)' : 'var(--ink-muted)',
                      }}>
                        🖼 {item.photoCount}
                      </span>
                    </td>
                    <td>
                      <span class={statusClass(m.status, m.isArchived)}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      {fmtDate(m.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <Link href={`/batch/${m.id}`} class="btn" style={{ padding: '4px 10px', fontSize: 12 }}>
                          详情
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div class="card" style={{ borderColor: 'var(--cyan-pale)', background: 'linear-gradient(135deg, var(--cyan-pale) 0%, white 100%)' }}>
        <div class="card-title">
          <span>📖 数据结构说明 · 四层专属记录模型</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border-line)' }}>
            <div class="batch-tree"><span class="batch-level-dot"></span><b>主记录 (Main)</b></div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>
              保存药液 A/B/C 比例、总容量、纸张类型与克重。控制批次号、版本链、归档与回滚关系。
            </div>
          </div>
          <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border-line)' }}>
            <div class="batch-tree"><span class="batch-level-dot l2"></span><b>明细记录 (Exposure)</b></div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>
              每个 sheet 的 UV 强度、曝光分/秒、光源、距离。支持一个批次多纸张多种曝光参数。
            </div>
          </div>
          <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border-line)' }}>
            <div class="batch-tree"><span class="batch-level-dot l3"></span><b>历史记录 (Wash)</b></div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>
              四阶段冲洗（初洗/酸浴/二洗/漂洗）的时长、水温、pH、搅拌频率与操作员备注。
            </div>
          </div>
          <div style={{ padding: 12, background: 'white', borderRadius: 8, border: '1px solid var(--border-line)' }}>
            <div class="batch-tree"><span class="batch-level-dot l4"></span><b>结果记录 (Result)</b></div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 6 }}>
              环境温湿度、四维度评分、失败标签、综合得分。支持重算与回滚溯源。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
