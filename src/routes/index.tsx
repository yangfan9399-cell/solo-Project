import { component$ } from '@builder.io/qwik';
import { routeLoader$ } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';
import { sectionDao, anomalyDao, sampleBoxDao, versionDao } from '~/server/dao';
import { generateExportSummary } from '~/server/export';
import { SeverityBadge } from '~/components/badges';
import { MichelLevyChart } from '~/components/interference-chart';

export const useDashboardData = routeLoader$(async () => {
  const allSections = await sectionDao.list({ pageSize: 1000 });
  const summary = generateExportSummary(allSections);
  const recentSections = allSections.slice(0, 5);
  const unresolvedAnomalies = (await anomalyDao.listAll(false)).slice(0, 8);
  const boxes = await sampleBoxDao.list();
  const recentVersions = (await versionDao.getDistinctBatches()).slice(0, 3);

  const mineralStats = allSections.reduce((acc, s) => {
    acc[s.mineralName] = (acc[s.mineralName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMinerals = Object.entries(mineralStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return {
    summary,
    recentSections,
    unresolvedAnomalies,
    boxes,
    recentVersions,
    topMinerals,
  };
});

export default component$(() => {
  const data = useDashboardData();

  const statCards = [
    {
      label: '薄片总数',
      value: data.value.summary.totalCount,
      icon: '🔬',
      color: 'from-blue-600 to-blue-800',
    },
    {
      label: '矿物种类',
      value: data.value.summary.mineralTypes.length,
      icon: '💎',
      color: 'from-purple-600 to-purple-800',
    },
    {
      label: '显微照片',
      value: data.value.summary.totalMicrographs,
      icon: '📷',
      color: 'from-green-600 to-green-800',
    },
    {
      label: '待处理异常',
      value: data.value.unresolvedAnomalies.length,
      icon: '⚠️',
      color: data.value.unresolvedAnomalies.length > 0 ? 'from-red-600 to-red-800' : 'from-gray-600 to-gray-800',
    },
    {
      label: '标本盒',
      value: data.value.boxes.length,
      icon: '📦',
      color: 'from-yellow-600 to-yellow-800',
    },
    {
      label: '产地覆盖',
      value: data.value.summary.localities.length,
      icon: '📍',
      color: 'from-cyan-600 to-cyan-800',
    },
  ];

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-mineral-50">工作台概览</h1>
          <p class="text-mineral-400 mt-1">稀有矿物薄片显微观察档案管理系统</p>
        </div>
        <div class="flex gap-3">
          <Link href="/sections/new" class="btn-primary">
            ➕ 新建薄片记录
          </Link>
          <Link href="/sections?export=csv" class="btn-secondary">
            📤 导出数据
          </Link>
        </div>
      </div>

      <div class="grid grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} class="card p-5 hover:border-mineral-500 transition-colors">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-mineral-400 text-sm">{card.label}</p>
                <p class="text-3xl font-bold text-mineral-50 mt-1">{card.value}</p>
              </div>
              <div class={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-6">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-mineral-100">最近更新薄片</h3>
              <Link href="/sections" class="text-sm text-mineral-400 hover:text-mineral-200">
                查看全部 →
              </Link>
            </div>
            <div class="space-y-3">
              {data.value.recentSections.map((section) => (
                <Link
                  key={section.id}
                  href={`/sections/${section.id}`}
                  class="flex items-center justify-between p-3 rounded-lg bg-mineral-800/50 hover:bg-mineral-800 transition-colors"
                >
                  <div class="flex items-center gap-4">
                    {section.micrographCount > 0 ? (
                      <div class="w-12 h-12 rounded-lg bg-mineral-700 flex items-center justify-center text-xl border border-mineral-600">
                        📷
                      </div>
                    ) : (
                      <div class="w-12 h-12 rounded-lg bg-mineral-700 flex items-center justify-center text-xl border border-mineral-600">
                        🔬
                      </div>
                    )}
                    <div>
                      <p class="font-medium text-mineral-100">{section.mineralName}</p>
                      <p class="text-xs text-mineral-400">{section.thinSectionNumber} · {section.locality || '未知产地'}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    {section.anomalyCount > 0 && (
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-700">
                        {section.anomalyCount} 异常
                      </span>
                    )}
                    <span class="text-xs text-mineral-500 font-mono">
                      {new Date(section.updatedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div class="card p-5">
            <h3 class="text-lg font-semibold text-mineral-100 mb-4">矿物分布统计</h3>
            <div class="grid grid-cols-3 gap-3">
              {data.value.topMinerals.map((m) => (
                <div key={m.name} class="p-3 rounded-lg bg-mineral-800/50">
                  <div class="flex items-center justify-between">
                    <span class="text-mineral-200 font-medium">{m.name}</span>
                    <span class="text-mineral-400 font-mono text-sm">{m.count}</span>
                  </div>
                  <div class="mt-2 h-2 bg-mineral-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-mineral-500 to-polar-blue rounded-full transition-all"
                      style={{ width: `${(m.count / data.value.summary.totalCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <MichelLevyChart />
        </div>

        <div class="space-y-6">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-mineral-100">数据异常警报</h3>
              <Link href="/anomalies" class="text-sm text-mineral-400 hover:text-mineral-200">
                全部异常 →
              </Link>
            </div>
            {data.value.unresolvedAnomalies.length === 0 ? (
              <div class="text-center py-8 text-mineral-400">
                <span class="text-4xl block mb-2">✅</span>
                <p>暂无待处理异常</p>
              </div>
            ) : (
              <div class="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {data.value.unresolvedAnomalies.map((anomaly) => (
                  <div key={anomaly.id} class="p-3 rounded-lg bg-mineral-800/50 border-l-2" 
                    style={{ 
                      borderLeftColor: anomaly.severity === 'critical' ? '#ef4444' : 
                                      anomaly.severity === 'high' ? '#f97316' : 
                                      anomaly.severity === 'medium' ? '#eab308' : '#3b82f6' 
                    }}>
                    <div class="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={anomaly.severity} />
                      <span class="text-xs text-mineral-400">#{anomaly.sectionId}</span>
                    </div>
                    <p class="text-sm text-mineral-200 line-clamp-2">{anomaly.description}</p>
                    <p class="text-xs text-mineral-500 mt-1">
                      {new Date(anomaly.detectedAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div class="card p-5">
            <h3 class="text-lg font-semibold text-mineral-100 mb-4">标本盒状态</h3>
            <div class="space-y-3">
              {data.value.boxes.map((box) => (
                <Link
                  key={box.id}
                  href={`/boxes/${box.id}`}
                  class="block p-3 rounded-lg bg-mineral-800/50 hover:bg-mineral-800 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-medium text-mineral-100">{box.name}</p>
                      <p class="text-xs text-mineral-400 font-mono">{box.code}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold text-mineral-100">
                        {/* @ts-ignore */}
                        {box.sectionCount || 0}/{box.rows * box.columns}
                      </p>
                      <p class="text-xs text-mineral-500">已存放</p>
                    </div>
                  </div>
                  <div class="mt-2 h-1.5 bg-mineral-700 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-gradient-to-r from-mineral-500 to-polar-green rounded-full"
                      // @ts-ignore
                      style={{ width: `${((box.sectionCount || 0) / (box.rows * box.columns)) * 100}%` }}
                    ></div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div class="card p-5">
            <h3 class="text-lg font-semibold text-mineral-100 mb-4">最近批次</h3>
            <div class="space-y-3">
              {data.value.recentVersions.map((batch) => (
                <Link
                  key={batch.batchId}
                  href={`/versions?batch=${batch.batchId}`}
                  class="block p-3 rounded-lg bg-mineral-800/50 hover:bg-mineral-800 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-mono text-sm text-mineral-100">{batch.batchId}</p>
                      <p class="text-xs text-mineral-400">{batch.count} 条变更记录</p>
                    </div>
                    <span class="text-xs text-mineral-500">
                      {new Date(batch.latestAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
