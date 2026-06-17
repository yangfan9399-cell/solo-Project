import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { versionDao, sectionDao } from '~/server/dao';
import { VersionBadge } from '~/components/badges';

export const useVersionList = routeLoader$(async () => {
  const batches = await versionDao.getDistinctBatches();
  const recentVersions = await versionDao.listRecent(100);

  return {
    batches,
    recentVersions,
    totalChanges: recentVersions.length,
    sectionCount: new Set(recentVersions.map((v: any) => v.sectionId)).size,
  };
});

export default component$(() => {
  const data = useVersionList();
  const activeTab = useSignal<'recent' | 'batches'>('recent');
  const selectedBatch = useSignal<string | null>(null);

  const changeTypeLabel: Record<string, string> = {
    create: '创建',
    update: '更新',
    revert: '回退',
  };

  const changeTypeColor: Record<string, string> = {
    create: 'bg-green-900/50 text-green-300 border-green-700',
    update: 'bg-blue-900/50 text-blue-300 border-blue-700',
    revert: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  };

  const filteredVersions = selectedBatch.value
    ? data.value.recentVersions.filter((v: any) => v.batchId === selectedBatch.value)
    : data.value.recentVersions;

  type VersionWithInfo = typeof data.value.recentVersions[number];
  const groupedByDate = filteredVersions.reduce((acc: Record<string, VersionWithInfo[]>, v: any) => {
    const date = new Date(v.changedAt).toLocaleDateString('zh-CN');
    if (!acc[date]) acc[date] = [];
    acc[date].push(v);
    return acc;
  }, {} as Record<string, VersionWithInfo[]>);

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-mineral-50">版本与批次历史</h1>
          <p class="text-mineral-400 mt-1">
            追踪所有数据变更，支持批次管理和版本回溯
          </p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">总变更次数</p>
          <p class="text-2xl font-bold text-mineral-100">{data.value.recentVersions.length}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">涉及薄片数</p>
          <p class="text-2xl font-bold text-purple-400">{data.value.sectionCount}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">批次数量</p>
          <p class="text-2xl font-bold text-blue-400">{data.value.batches.length}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">最近批次</p>
          <p class="text-lg font-bold text-green-400 font-mono">
            {data.value.batches[0]?.batchId?.slice(0, 8) || '-'}
          </p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="flex border-b border-mineral-700">
          <button
            onClick$={() => { activeTab.value = 'recent'; selectedBatch.value = null; }}
            class={[
              'px-6 py-3 text-sm font-medium transition-colors relative',
              activeTab.value === 'recent'
                ? 'text-mineral-100 bg-mineral-800/50'
                : 'text-mineral-400 hover:text-mineral-200 hover:bg-mineral-800/30'
            ]}
          >
            最近变更
            {activeTab.value === 'recent' && (
              <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-mineral-500"></span>
            )}
          </button>
          <button
            onClick$={() => activeTab.value = 'batches'}
            class={[
              'px-6 py-3 text-sm font-medium transition-colors relative',
              activeTab.value === 'batches'
                ? 'text-mineral-100 bg-mineral-800/50'
                : 'text-mineral-400 hover:text-mineral-200 hover:bg-mineral-800/30'
            ]}
          >
            批次管理
            {activeTab.value === 'batches' && (
              <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-mineral-500"></span>
            )}
          </button>
        </div>

        <div class="p-6">
          {activeTab.value === 'recent' && (
            <div class="space-y-6">
              {selectedBatch.value && (
                <div class="flex items-center justify-between p-4 bg-purple-900/20 border border-purple-800 rounded-lg mb-4">
                  <div class="flex items-center gap-3">
                    <span class="text-purple-400">📦</span>
                    <div>
                      <p class="text-purple-200 font-medium">筛选批次</p>
                      <p class="text-purple-400 font-mono text-sm">{selectedBatch.value}</p>
                    </div>
                  </div>
                  <button
                    onClick$={() => selectedBatch.value = null}
                    class="px-3 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded text-sm transition-colors"
                  >
                    清除筛选
                  </button>
                </div>
              )}

              {Object.entries(groupedByDate).map(([date, versions]) => (
                <div key={date}>
                  <h3 class="text-sm font-medium text-mineral-400 mb-3 flex items-center gap-2">
                    <span class="text-lg">📅</span>
                    {date}
                    <span class="text-mineral-600">({versions.length} 条变更)</span>
                  </h3>
                  <div class="space-y-2">
                    {versions.map((v: any) => (
                      <div
                        key={v.id}
                        class="flex items-start gap-4 p-4 bg-mineral-800/30 rounded-lg border border-mineral-700 hover:border-mineral-600 transition-colors"
                      >
                        <div class="flex-shrink-0 pt-1">
                          <VersionBadge version={v.version} />
                        </div>
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-3 mb-1">
                            <Link
                              href={`/sections/${v.sectionId}`}
                              class="font-medium text-mineral-100 hover:text-mineral-50 transition-colors"
                            >
                              {v.mineralName}
                            </Link>
                            <span class="text-mineral-500 font-mono text-xs">{v.thinSectionNumber}</span>
                            <span class={`px-2 py-0.5 rounded text-xs font-medium border ${changeTypeColor[v.changeType] || ''}`}>
                              {changeTypeLabel[v.changeType] || v.changeType}
                            </span>
                          </div>
                          <p class="text-mineral-300 text-sm">{v.changeDescription}</p>
                          {v.fieldName && (
                            <div class="mt-2 flex items-center gap-2 text-sm">
                              <span class="text-mineral-500">
                                <code class="bg-mineral-900 px-1.5 py-0.5 rounded">{v.fieldName}</code>
                              </span>
                              {v.oldValue !== null && v.oldValue !== undefined && (
                                <span class="text-red-400 line-through">{String(v.oldValue)}</span>
                              )}
                              {v.oldValue !== null && v.oldValue !== undefined && v.newValue !== null && v.newValue !== undefined && (
                                <span class="text-mineral-500">→</span>
                              )}
                              {v.newValue !== null && v.newValue !== undefined && (
                                <span class="text-green-400">{String(v.newValue)}</span>
                              )}
                            </div>
                          )}
                          {v.batchId && (
                            <button
                              onClick$={() => { selectedBatch.value = v.batchId; activeTab.value = 'recent'; }}
                              class="mt-2 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                            >
                              📦 批次: {v.batchId.slice(0, 8)}...
                            </button>
                          )}
                        </div>
                        <div class="flex-shrink-0 text-right">
                          <p class="text-mineral-500 text-xs font-mono">
                            {new Date(v.changedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                          {v.changedBy && (
                            <p class="text-mineral-600 text-xs mt-1">{v.changedBy}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredVersions.length === 0 && (
                <div class="text-center py-12 text-mineral-500">
                  <span class="text-4xl block mb-2">📜</span>
                  <p>暂无版本历史记录</p>
                </div>
              )}
            </div>
          )}

          {activeTab.value === 'batches' && (
            <div class="space-y-4">
              {data.value.batches.length > 0 ? (
                <div class="grid grid-cols-1 gap-4">
                  {data.value.batches.map((batch: any) => (
                    <div
                      key={batch.batchId}
                      class="p-5 bg-mineral-800/30 rounded-lg border border-mineral-700 hover:border-mineral-600 transition-colors"
                    >
                      <div class="flex items-start justify-between">
                        <div>
                          <div class="flex items-center gap-3 mb-2">
                            <span class="text-2xl">📦</span>
                            <div>
                              <p class="font-mono text-lg text-mineral-100">{batch.batchId}</p>
                              <p class="text-mineral-500 text-sm">
                                {new Date(batch.earliestAt).toLocaleString('zh-CN')} - {new Date(batch.latestAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div class="text-right">
                          <span class="inline-flex items-center gap-1 px-3 py-1 bg-purple-900/50 text-purple-300 rounded-lg text-sm">
                            {batch.count} 条变更
                          </span>
                        </div>
                      </div>
                      <div class="mt-4 flex items-center gap-3">
                        <button
                          onClick$={() => { selectedBatch.value = batch.batchId; activeTab.value = 'recent'; }}
                          class="px-4 py-2 bg-mineral-700 hover:bg-mineral-600 text-mineral-200 rounded-lg text-sm transition-colors"
                        >
                          查看批次详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="text-center py-12 text-mineral-500">
                  <span class="text-4xl block mb-2">📦</span>
                  <p>暂无批次记录</p>
                  <p class="text-sm mt-2">批量编辑时会自动创建批次</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
