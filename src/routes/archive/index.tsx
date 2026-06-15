import { component$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { listMainRecords, getFullBatch } from '~/lib/db';
import { STATUS_LABELS, FAIL_TAG_LABELS, fmtDate } from '~/lib/utils';

export const useArchiveList = routeLoader$(async () => {
  const archived = listMainRecords({ includeArchived: true }).filter(m => m.isArchived);
  return archived.map(m => {
    const batch = getFullBatch(m.id);
    return {
      main: m,
      result: batch?.result ?? null,
      photos: batch?.photos.length ?? 0,
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
                <tr key={item.main.id}>
                  <td><b>{item.main.batchNo}</b></td>
                  <td>v{item.main.version}</td>
                  <td>{item.main.solutionARatio}:{item.main.solutionBRatio} / {item.main.totalVolumeMl}ml</td>
                  <td style={{ fontWeight: 600, color: 'var(--ink-muted)' }}>
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
                  <td style={{ fontSize: 12, maxWidth: 260 }}>{item.main.archiveReason || '-'}</td>
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
    </div>
  );
});
