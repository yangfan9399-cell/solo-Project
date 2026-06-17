import { component$, useSignal, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { anomalyDao, sectionDao, anomalyDetector } from '~/server/dao';
import { SeverityBadge } from '~/components/badges';
import type { DataAnomaly } from '~/types/mineral';

type AnomalyWithSection = DataAnomaly & {
  mineralName?: string;
  thinSectionNumber?: string;
};

export const useAnomalyList = routeLoader$(async (requestEvent) => {
  const includeResolved = requestEvent.url.searchParams.get('includeResolved') === 'true';
  const severityFilter = requestEvent.url.searchParams.get('severity');
  const typeFilter = requestEvent.url.searchParams.get('type');

  const anomalies = (await anomalyDao.listAll(includeResolved)) as AnomalyWithSection[];
  
  const anomaliesWithSection: AnomalyWithSection[] = [];
  for (const anomaly of anomalies) {
    const section = await sectionDao.getById(anomaly.sectionId);
    if (section) {
      anomaliesWithSection.push({
        ...anomaly,
        mineralName: section.mineralName,
        thinSectionNumber: section.thinSectionNumber,
      });
    }
  }

  const filtered = anomaliesWithSection.filter(a => {
    if (severityFilter && a.severity !== severityFilter) return false;
    if (typeFilter && a.anomalyType !== typeFilter) return false;
    return true;
  });

  const stats = {
    total: anomaliesWithSection.length,
    unresolved: anomaliesWithSection.filter(a => !a.resolvedAt).length,
    bySeverity: {
      critical: anomaliesWithSection.filter(a => a.severity === 'critical' && !a.resolvedAt).length,
      high: anomaliesWithSection.filter(a => a.severity === 'high' && !a.resolvedAt).length,
      medium: anomaliesWithSection.filter(a => a.severity === 'medium' && !a.resolvedAt).length,
      low: anomaliesWithSection.filter(a => a.severity === 'low' && !a.resolvedAt).length,
    },
    byType: {} as Record<string, number>,
  };

  anomaliesWithSection.forEach(a => {
    if (!a.resolvedAt) {
      stats.byType[a.anomalyType] = (stats.byType[a.anomalyType] || 0) + 1;
    }
  });

  const anomalyTypes = Array.from(new Set(anomaliesWithSection.map(a => a.anomalyType)));

  return {
    anomalies: filtered,
    stats,
    anomalyTypes,
    includeResolved,
    severityFilter,
    typeFilter,
  };
});

export default component$(() => {
  const data = useAnomalyList();
  const showResolveModal = useSignal<number | null>(null);
  const resolveNote = useSignal('');

  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const sortedAnomalies = useComputed$(() => {
    return [...data.value.anomalies].sort((a, b) => {
      if (!a.resolvedAt && b.resolvedAt) return -1;
      if (a.resolvedAt && !b.resolvedAt) return 1;
      const sevDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      if (sevDiff !== 0) return sevDiff;
      return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
    });
  });

  const anomalyTypeLabels: Record<string, string> = {
    thickness_out_of_range: '薄片厚度异常',
    birefringence_out_of_range: '双折射率范围异常',
    refractive_index_inverted: '折射率倒置',
    relief_out_of_range: '突起值范围异常',
    interference_birefringence_mismatch: '干涉色双折率估算异常',
    interference_order_invalid: '干涉色级序异常',
    abundance_sum_exceeded: '矿物含量总和异常',
    no_micrographs: '缺少显微照片',
    no_optical_data: '缺少光学数据',
  };

  const runDetection = $(async () => {
    const sections = await sectionDao.list({ pageSize: 1000 });
    let detected = 0;
    for (const section of sections) {
      const newAnomalies = await anomalyDetector.checkAll(section.id);
      for (const anomaly of newAnomalies) {
        await anomalyDao.create(anomaly as any);
        detected++;
      }
    }
    alert(`检测完成，新发现 ${detected} 条异常`);
    location.reload();
  });

  const resolveAnomaly = $(async (id: number) => {
    await anomalyDao.resolve(id, resolveNote.value || undefined);
    showResolveModal.value = null;
    resolveNote.value = '';
    location.reload();
  });

  const severityColors: Record<string, string> = {
    critical: 'from-red-900 to-red-950',
    high: 'from-orange-900 to-orange-950',
    medium: 'from-yellow-900 to-yellow-950',
    low: 'from-blue-900 to-blue-950',
  };

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-mineral-50">数据异常检测</h1>
          <p class="text-mineral-400 mt-1">
            自动检测数据质量问题，确保观测记录的准确性和完整性
          </p>
        </div>
        <button onClick$={runDetection} class="btn-primary">
          🔍 重新检测所有数据
        </button>
      </div>

      <div class="grid grid-cols-5 gap-4">
        <div class="card p-4 bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-800">
          <p class="text-red-400 text-sm">严重</p>
          <p class="text-3xl font-bold text-red-300">{data.value.stats.bySeverity.critical}</p>
        </div>
        <div class="card p-4 bg-gradient-to-br from-orange-900/30 to-orange-950/30 border-orange-800">
          <p class="text-orange-400 text-sm">高</p>
          <p class="text-3xl font-bold text-orange-300">{data.value.stats.bySeverity.high}</p>
        </div>
        <div class="card p-4 bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 border-yellow-800">
          <p class="text-yellow-400 text-sm">中</p>
          <p class="text-3xl font-bold text-yellow-300">{data.value.stats.bySeverity.medium}</p>
        </div>
        <div class="card p-4 bg-gradient-to-br from-blue-900/30 to-blue-950/30 border-blue-800">
          <p class="text-blue-400 text-sm">低</p>
          <p class="text-3xl font-bold text-blue-300">{data.value.stats.bySeverity.low}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">待处理总数</p>
          <p class="text-3xl font-bold text-mineral-100">{data.value.stats.unresolved}</p>
        </div>
      </div>

      <div class="card p-4">
        <h3 class="text-sm font-medium text-mineral-400 mb-3">异常类型分布</h3>
        <div class="grid grid-cols-3 gap-3">
          {Object.entries(data.value.stats.byType).map(([type, count]) => (
            <div key={type} class="flex items-center justify-between p-3 bg-mineral-800/50 rounded-lg">
              <span class="text-mineral-300 text-sm">{anomalyTypeLabels[type] || type}</span>
              <span class="px-2 py-0.5 bg-mineral-700 text-mineral-200 rounded text-sm font-mono">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="p-4 border-b border-mineral-700 flex items-center justify-between">
          <h3 class="font-medium text-mineral-100">异常列表</h3>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 text-sm text-mineral-400">
              <input
                type="checkbox"
                checked={data.value.includeResolved}
                onChange$={(e) => {
                  const target = e.target as HTMLInputElement;
                  const url = new URL(location.href);
                  if (target.checked) {
                    url.searchParams.set('includeResolved', 'true');
                  } else {
                    url.searchParams.delete('includeResolved');
                  }
                  location.href = url.toString();
                }}
                class="w-4 h-4 rounded bg-mineral-800 border-mineral-600"
              />
              显示已解决
            </label>
            <select
              class="select-field text-sm"
              value={data.value.severityFilter || ''}
              onChange$={(e) => {
                const target = e.target as HTMLSelectElement;
                const url = new URL(location.href);
                if (target.value) {
                  url.searchParams.set('severity', target.value);
                } else {
                  url.searchParams.delete('severity');
                }
                location.href = url.toString();
              }}
            >
              <option value="">全部严重程度</option>
              <option value="critical">严重</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            <select
              class="select-field text-sm"
              value={data.value.typeFilter || ''}
              onChange$={(e) => {
                const target = e.target as HTMLSelectElement;
                const url = new URL(location.href);
                if (target.value) {
                  url.searchParams.set('type', target.value);
                } else {
                  url.searchParams.delete('type');
                }
                location.href = url.toString();
              }}
            >
              <option value="">全部类型</option>
              {data.value.anomalyTypes.map(t => (
                <option key={t} value={t}>{anomalyTypeLabels[t] || t}</option>
              ))}
            </select>
          </div>
        </div>

        <div class="divide-y divide-mineral-700/50">
          {sortedAnomalies.value.length > 0 ? (
            sortedAnomalies.value.map((anomaly) => (
              <div
                key={anomaly.id}
                class={[
                  'p-4 hover:bg-mineral-800/30 transition-colors',
                  anomaly.resolvedAt && 'opacity-60',
                  `bg-gradient-to-r ${severityColors[anomaly.severity]}/10 to-transparent`
                ]}
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-4">
                    <div class="flex-shrink-0 pt-1">
                      <SeverityBadge severity={anomaly.severity} />
                    </div>
                    <div>
                      <div class="flex items-center gap-3 mb-1">
                        <Link
                          href={`/sections/${anomaly.sectionId}`}
                          class="font-medium text-mineral-100 hover:text-mineral-50 transition-colors"
                        >
                          {anomaly.mineralName}
                        </Link>
                        <span class="text-mineral-500 font-mono text-xs">
                          {anomaly.thinSectionNumber}
                        </span>
                        <span class="px-2 py-0.5 bg-mineral-700/50 text-mineral-400 rounded text-xs">
                          {anomalyTypeLabels[anomaly.anomalyType] || anomaly.anomalyType}
                        </span>
                        {anomaly.resolvedAt && (
                          <span class="px-2 py-0.5 bg-green-900/50 text-green-300 rounded text-xs">
                            ✓ 已解决
                          </span>
                        )}
                      </div>
                      <p class="text-mineral-300 text-sm">{anomaly.description}</p>
                      <div class="mt-2 flex flex-wrap gap-3 text-xs">
                        {anomaly.fieldName && (
                          <span class="text-mineral-500">
                            字段: <code class="bg-mineral-900 px-1.5 py-0.5 rounded text-mineral-400">{anomaly.fieldName}</code>
                          </span>
                        )}
                        {anomaly.currentValue !== null && anomaly.currentValue !== undefined && (
                          <span class="text-orange-400">
                            当前值: {anomaly.currentValue}
                          </span>
                        )}
                        {anomaly.expectedRange && (
                          <span class="text-mineral-400">
                            预期范围: {anomaly.expectedRange}
                          </span>
                        )}
                        <span class="text-mineral-600">
                          检测时间: {new Date(anomaly.detectedAt).toLocaleString('zh-CN')}
                        </span>
                        {anomaly.resolvedAt && (
                          <span class="text-green-500">
                            解决时间: {new Date(anomaly.resolvedAt).toLocaleString('zh-CN')}
                          </span>
                        )}
                        {anomaly.resolverNote && (
                          <span class="text-green-400">
                            处理说明: {anomaly.resolverNote}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="flex-shrink-0 ml-4">
                    {!anomaly.resolvedAt ? (
                      <button
                        onClick$={() => { showResolveModal.value = anomaly.id; }}
                        class="px-3 py-1.5 bg-green-900/50 hover:bg-green-800/50 text-green-300 rounded text-sm transition-colors"
                      >
                        标记已解决
                      </button>
                    ) : (
                      <Link
                        href={`/sections/${anomaly.sectionId}`}
                        class="px-3 py-1.5 bg-mineral-700 hover:bg-mineral-600 text-mineral-200 rounded text-sm transition-colors inline-block"
                      >
                        查看记录
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div class="p-12 text-center text-mineral-500">
              <span class="text-5xl block mb-4">✅</span>
              <p class="text-lg">数据质量良好，未检测到异常</p>
              <p class="text-sm mt-2">所有记录均符合专业标准</p>
            </div>
          )}
        </div>
      </div>

      {showResolveModal.value !== null && (
        <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div class="card p-6 w-full max-w-md">
            <h3 class="text-lg font-semibold text-mineral-100 mb-4">标记异常为已解决</h3>
            <p class="text-mineral-400 text-sm mb-4">
              确认此数据异常已被检查和处理。您可以添加处理说明作为记录。
            </p>
            <div class="mb-4">
              <label class="label">处理说明（可选）</label>
              <textarea
                class="input-field min-h-[80px]"
                placeholder="描述您是如何处理这个异常的..."
                bind:value={resolveNote}
              />
            </div>
            <div class="flex justify-end gap-3">
              <button
                onClick$={() => { showResolveModal.value = null; resolveNote.value = ''; }}
                class="btn-secondary"
              >
                取消
              </button>
              <button
                onClick$={() => resolveAnomaly(showResolveModal.value!)}
                class="btn-primary"
              >
                确认解决
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
