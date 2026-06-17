import { component$, useSignal, $ } from '@builder.io/qwik';
import { routeLoader$, useNavigate } from '@builder.io/qwik-city';
import { Link } from '@builder.io/qwik-city';
import { sectionDao, sampleBoxDao } from '~/server/dao';
import { exportToCSV, generateExportSummary } from '~/server/export';
import { AnomalyBadge, VersionBadge } from '~/components/badges';
import type { SectionFilter } from '~/server/dao';

export const useSectionsList = routeLoader$(async (requestEvent) => {
  const url = requestEvent.url;
  const search = url.searchParams.get('search') || undefined;
  const mineralName = url.searchParams.get('mineral') || undefined;
  const locality = url.searchParams.get('locality') || undefined;
  const boxId = url.searchParams.get('boxId') ? parseInt(url.searchParams.get('boxId')!) : undefined;
  const hasAnomalies = url.searchParams.get('hasAnomalies') === 'true';
  const dateFrom = url.searchParams.get('dateFrom') || undefined;
  const dateTo = url.searchParams.get('dateTo') || undefined;
  const crystalSystem = url.searchParams.get('crystalSystem') || undefined;
  const page = parseInt(url.searchParams.get('page') || '1');
  const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
  const exportFormat = url.searchParams.get('export');

  const filter: SectionFilter = {
    search,
    mineralName,
    locality,
    boxId,
    hasAnomalies,
    dateFrom,
    dateTo,
    crystalSystem,
    page,
    pageSize,
  };

  const sections = await sectionDao.list(filter);
  const totalCount = await sectionDao.count(filter);
  const totalPages = Math.ceil(totalCount / pageSize);

  const minerals = await sectionDao.getDistinctMinerals();
  const localities = await sectionDao.getDistinctLocalities();
  const crystalSystems = await sectionDao.getDistinctCrystalSystems();
  const boxes = await sampleBoxDao.list();
  const summary = generateExportSummary(await sectionDao.list({ pageSize: 1000 }));

  if (exportFormat === 'csv') {
    const allData = await sectionDao.list({ ...filter, pageSize: 10000 });
    const csv = exportToCSV(allData);
    throw requestEvent.send(
      new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="mineral-sections-${Date.now()}.csv"`,
        },
      })
    );
  }

  return {
    sections,
    totalCount,
    totalPages,
    currentPage: page,
    pageSize,
    minerals,
    localities,
    crystalSystems,
    boxes,
    summary,
    filter,
  };
});

export default component$(() => {
  const data = useSectionsList();
  const nav = useNavigate();
  const showFilters = useSignal(true);
  const search = useSignal(data.value.filter.search || '');
  const mineral = useSignal(data.value.filter.mineralName || '');
  const locality = useSignal(data.value.filter.locality || '');
  const boxId = useSignal(data.value.filter.boxId?.toString() || '');
  const hasAnomalies = useSignal(data.value.filter.hasAnomalies || false);
  const dateFrom = useSignal(data.value.filter.dateFrom || '');
  const dateTo = useSignal(data.value.filter.dateTo || '');
  const crystalSystem = useSignal(data.value.filter.crystalSystem || '');

  const applyFilters = $(() => {
    const params = new URLSearchParams();
    if (search.value) params.set('search', search.value);
    if (mineral.value) params.set('mineral', mineral.value);
    if (locality.value) params.set('locality', locality.value);
    if (boxId.value) params.set('boxId', boxId.value);
    if (hasAnomalies.value) params.set('hasAnomalies', 'true');
    if (dateFrom.value) params.set('dateFrom', dateFrom.value);
    if (dateTo.value) params.set('dateTo', dateTo.value);
    if (crystalSystem.value) params.set('crystalSystem', crystalSystem.value);
    nav(`/sections?${params.toString()}`);
  });

  const resetFilters = $(() => {
    search.value = '';
    mineral.value = '';
    locality.value = '';
    boxId.value = '';
    hasAnomalies.value = false;
    dateFrom.value = '';
    dateTo.value = '';
    crystalSystem.value = '';
    nav('/sections');
  });

  const exportCSV = $(() => {
    const params = new URLSearchParams();
    if (search.value) params.set('search', search.value);
    if (mineral.value) params.set('mineral', mineral.value);
    if (locality.value) params.set('locality', locality.value);
    if (boxId.value) params.set('boxId', boxId.value);
    if (hasAnomalies.value) params.set('hasAnomalies', 'true');
    params.set('export', 'csv');
    nav(`/sections?${params.toString()}`);
  });

  const hasActiveFilters = [search.value, mineral.value, locality.value, boxId.value, hasAnomalies.value, dateFrom.value, dateTo.value, crystalSystem.value].some(v => 
    v !== '' && v !== false && v !== null && v !== undefined
  );

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-mineral-50">项目台账</h1>
          <p class="text-mineral-400 mt-1">
            共 {data.value.totalCount} 条记录 · 当前显示 {data.value.sections.length} 条
          </p>
        </div>
        <div class="flex gap-3">
          <button onClick$={exportCSV} class="btn-secondary">
            📤 导出 CSV
          </button>
          <Link href="/sections/new" class="btn-primary">
            ➕ 新建薄片
          </Link>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="card p-4">
          <p class="text-mineral-400 text-sm">总薄片数</p>
          <p class="text-2xl font-bold text-mineral-50">{data.value.summary.totalCount}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-400 text-sm">矿物种类</p>
          <p class="text-2xl font-bold text-purple-400">{data.value.summary.mineralTypes.length}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-400 text-sm">待处理异常</p>
          <p class="text-2xl font-bold text-orange-400">{data.value.summary.withAnomalies}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-400 text-sm">平均厚度</p>
          <p class="text-2xl font-bold text-green-400">{data.value.summary.avgThickness} μm</p>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="p-4 border-b border-mineral-700 flex items-center justify-between">
          <button
            onClick$={() => showFilters.value = !showFilters.value}
            class="flex items-center gap-2 text-mineral-300 hover:text-mineral-100 transition-colors"
          >
            <span class="text-lg">{showFilters.value ? '▼' : '▶'}</span>
            <span>高级筛选</span>
            {hasActiveFilters && (
              <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-mineral-600 text-white">
                已启用
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button onClick$={resetFilters} class="text-sm text-mineral-400 hover:text-mineral-200">
              重置筛选
            </button>
          )}
        </div>

        {showFilters.value && (
          <div class="p-4 bg-mineral-800/30 border-b border-mineral-700">
            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="label">全文搜索</label>
                <input
                  type="text"
                  class="input-field"
                  placeholder="编号、名称、产地..."
                  bind:value={search}
                  onKeyUp$={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
              <div>
                <label class="label">矿物名称</label>
                <select class="select-field" bind:value={mineral}>
                  <option value="">全部矿物</option>
                  {data.value.minerals.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="label">产地</label>
                <select class="select-field" bind:value={locality}>
                  <option value="">全部产地</option>
                  {data.value.localities.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="label">晶系</label>
                <select class="select-field" bind:value={crystalSystem}>
                  <option value="">全部晶系</option>
                  {data.value.crystalSystems.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="label">标本盒</label>
                <select class="select-field" bind:value={boxId}>
                  <option value="">全部盒子</option>
                  {data.value.boxes.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label class="label">采集日期（起）</label>
                <input type="date" class="input-field" bind:value={dateFrom} />
              </div>
              <div>
                <label class="label">采集日期（止）</label>
                <input type="date" class="input-field" bind:value={dateTo} />
              </div>
              <div class="flex items-end">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    class="w-4 h-4 rounded bg-mineral-800 border-mineral-600 text-mineral-500 focus:ring-mineral-500"
                    bind:checked={hasAnomalies}
                  />
                  <span class="text-sm text-mineral-300">仅显示有异常记录</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end mt-4 gap-3">
              <button onClick$={resetFilters} class="btn-secondary">重置</button>
              <button onClick$={applyFilters} class="btn-primary">应用筛选</button>
            </div>
          </div>
        )}

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-mineral-700 bg-mineral-800/50">
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">薄片编号</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">矿物名称</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">产地</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">厚度</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">照片</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">伴生矿物</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">异常</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">版本</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">更新时间</th>
                <th class="text-left px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">位置</th>
                <th class="text-right px-4 py-3 text-xs font-medium text-mineral-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-mineral-700/50">
              {data.value.sections.length === 0 ? (
                <tr>
                  <td colSpan={11} class="px-4 py-12 text-center text-mineral-400">
                    <span class="text-4xl block mb-2">🔍</span>
                    <p>没有找到匹配的记录</p>
                    <button onClick$={resetFilters} class="text-mineral-500 hover:text-mineral-300 mt-2 text-sm">
                      清除筛选条件
                    </button>
                  </td>
                </tr>
              ) : (
                data.value.sections.map((section) => (
                  <tr
                    key={section.id}
                    class="hover:bg-mineral-800/30 transition-colors group"
                  >
                    <td class="px-4 py-3">
                      <span class="font-mono text-sm text-mineral-200">{section.thinSectionNumber}</span>
                      <p class="text-xs text-mineral-500">{section.sampleNumber}</p>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        {section.mineralFormula && (
                          <span class="text-xs text-mineral-500 font-mono">{section.mineralFormula}</span>
                        )}
                        <div>
                          <p class="font-medium text-mineral-100">{section.mineralName}</p>
                          {section.crystalSystem && (
                            <p class="text-xs text-mineral-500">{section.crystalSystem}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-mineral-300 text-sm">{section.locality || '-'}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class={`font-mono text-sm ${
                        section.thicknessMicrometers < 15 || section.thicknessMicrometers > 45
                          ? 'text-orange-400'
                          : 'text-mineral-200'
                      }`}>
                        {section.thicknessMicrometers} μm
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-mineral-300 text-sm">{section.micrographCount} 张</span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-mineral-300 text-sm">{section.associationCount} 种</span>
                    </td>
                    <td class="px-4 py-3">
                      <AnomalyBadge count={section.anomalyCount} />
                    </td>
                    <td class="px-4 py-3">
                      <VersionBadge version={section.currentVersion} />
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-mineral-400 text-xs font-mono">
                        {new Date(section.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      {section.boxName ? (
                        <div class="text-sm">
                          <p class="text-mineral-300">{section.boxName}</p>
                          <p class="text-mineral-500 text-xs font-mono">{section.boxPosition}</p>
                        </div>
                      ) : (
                        <span class="text-mineral-500 text-sm">-</span>
                      )}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <Link
                        href={`/sections/${section.id}`}
                        class="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-mineral-300 hover:text-mineral-100 hover:bg-mineral-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        查看详情 →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.value.totalPages > 1 && (
          <div class="p-4 border-t border-mineral-700 flex items-center justify-between">
            <p class="text-sm text-mineral-400">
              显示 {(data.value.currentPage - 1) * data.value.pageSize + 1} - {Math.min(
                data.value.currentPage * data.value.pageSize,
                data.value.totalCount
              )} 条，共 {data.value.totalCount} 条
            </p>
            <div class="flex items-center gap-2">
              <Link
                href={`/sections?page=${Math.max(1, data.value.currentPage - 1)}`}
                class={[
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  data.value.currentPage === 1
                    ? 'text-mineral-600 cursor-not-allowed'
                    : 'text-mineral-300 hover:bg-mineral-700 hover:text-mineral-100'
                ]}
                preventdefault:click={data.value.currentPage === 1}
              >
                ← 上一页
              </Link>
              {Array.from({ length: Math.min(5, data.value.totalPages) }, (_, i) => {
                let pageNum;
                if (data.value.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (data.value.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (data.value.currentPage >= data.value.totalPages - 2) {
                  pageNum = data.value.totalPages - 4 + i;
                } else {
                  pageNum = data.value.currentPage - 2 + i;
                }
                return (
                  <Link
                    key={pageNum}
                    href={`/sections?page=${pageNum}`}
                    class={[
                      'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                      pageNum === data.value.currentPage
                        ? 'bg-mineral-600 text-white'
                        : 'text-mineral-300 hover:bg-mineral-700 hover:text-mineral-100'
                    ]}
                  >
                    {pageNum}
                  </Link>
                );
              })}
              <Link
                href={`/sections?page=${Math.min(data.value.totalPages, data.value.currentPage + 1)}`}
                class={[
                  'px-3 py-1.5 rounded-lg text-sm transition-colors',
                  data.value.currentPage === data.value.totalPages
                    ? 'text-mineral-600 cursor-not-allowed'
                    : 'text-mineral-300 hover:bg-mineral-700 hover:text-mineral-100'
                ]}
                preventdefault:click={data.value.currentPage === data.value.totalPages}
              >
                下一页 →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
