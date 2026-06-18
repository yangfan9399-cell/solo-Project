import { component$, useVisibleTask$, useSignal, useStore, $ } from '@builder.io/qwik';
import { Link } from '@builder.io/qwik-city';
import type { Project, Sample, RegionStat } from '~/types';
import { getAllProjects, getAllSamples, getRegionStats } from '~/utils/storage';
import { PageHeader } from '~/components/header/header';
import { ToneChart } from '~/components/tone-chart/tone-chart';

const DEFAULT_COLORS = ['#4a6cf7', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#fb923c', '#2dd4bf'];

export default component$(() => {
  const search = useSignal('');
  const dialectFilter = useSignal('');
  const selectedRegions = useSignal<Set<string>>(new Set());

  const state = useStore<{
    projects: Project[];
    samples: Sample[];
    regionStats: RegionStat[];
  }>({
    projects: [],
    samples: [],
    regionStats: [],
  });

  const loadData = $(() => {
    state.projects = getAllProjects();
    state.samples = getAllSamples();
    state.regionStats = getRegionStats();
  });

  useVisibleTask$(() => {
    loadData();
  });

  const dialects = useSignal<string[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.regionStats.length);
    const unique = [...new Set(state.regionStats.map((r) => r.dialect))];
    dialects.value = unique;
  });

  const filteredStats = useSignal<RegionStat[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => state.regionStats.length);
    track(() => search.value);
    track(() => dialectFilter.value);

    let result = state.regionStats;

    if (dialectFilter.value) {
      result = result.filter((r) => r.dialect === dialectFilter.value);
    }

    if (search.value.trim()) {
      const q = search.value.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.region.toLowerCase().includes(q) ||
          r.dialect.toLowerCase().includes(q)
      );
    }

    filteredStats.value = result;
  });

  const toggleRegion = $((region: string) => {
    const next = new Set(selectedRegions.value);
    if (next.has(region)) {
      next.delete(region);
    } else {
      next.add(region);
    }
    selectedRegions.value = next;
  });

  const comparisonData = useSignal<{ category: string; cells: { region: string; value: string }[] }[]>([]);

  useVisibleTask$(({ track }) => {
    track(() => selectedRegions.value);
    track(() => state.regionStats.length);

    const selectedSet = selectedRegions.value;
    const selectedArr = Array.from(selectedSet);
    if (selectedArr.length < 2) {
      comparisonData.value = [];
      return;
    }

    const selectedStats = state.regionStats.filter((r) => selectedSet.has(r.region));

    const allCategories = new Set<string>();
    for (const stat of selectedStats) {
      Object.keys(stat.toneCategories).forEach((cat) => allCategories.add(cat));
    }

    const rows: { category: string; cells: { region: string; value: string }[] }[] = [];
    for (const cat of Array.from(allCategories).sort()) {
      const cells = selectedArr.map((region) => {
        const stat = selectedStats.find((s) => s.region === region);
        const entry = stat?.toneCategories[cat];
        return { region, value: entry?.value ?? '-' };
      });
      rows.push({ category: cat, cells });
    }

    comparisonData.value = rows;
  });

  const statsSummary = useStore({
    totalRegions: 0,
    totalDialects: 0,
    mostSampled: '',
    avgSamples: 0,
  });

  useVisibleTask$(({ track }) => {
    track(() => state.regionStats.length);

    const regions = state.regionStats;
    statsSummary.totalRegions = regions.length;
    statsSummary.totalDialects = new Set(regions.map((r) => r.dialect)).size;

    if (regions.length > 0) {
      const sorted = [...regions].sort((a, b) => b.sampleCount - a.sampleCount);
      statsSummary.mostSampled = sorted[0].region;
      statsSummary.avgSamples = Math.round(regions.reduce((sum, r) => sum + r.sampleCount, 0) / regions.length);
    } else {
      statsSummary.mostSampled = '-';
      statsSummary.avgSamples = 0;
    }
  });

  return (
    <>
      <PageHeader title="地区样本库" subtitle="Regional Sample Database" />

      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-label">覆盖地区</div>
          <div class="stat-value">{statsSummary.totalRegions}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">方言总数</div>
          <div class="stat-value">{statsSummary.totalDialects}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">样本最多地区</div>
          <div class="stat-value">{statsSummary.mostSampled}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">地区平均样本</div>
          <div class="stat-value">{statsSummary.avgSamples}</div>
        </div>
      </div>

      <div class="card mt-24" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="搜索地区或方言..."
          style={{ width: '280px', flexShrink: 0 }}
          value={search.value}
          onInput$={(e) => {
            search.value = (e.target as HTMLInputElement).value;
          }}
        />
        <div class="chip-group">
          <span
            class={`chip ${dialectFilter.value === '' ? 'selected' : ''}`}
            onClick$={() => {
              dialectFilter.value = '';
            }}
          >
            全部方言
          </span>
          {dialects.value.map((d) => (
            <span
              key={d}
              class={`chip ${dialectFilter.value === d ? 'selected' : ''}`}
              onClick$={() => {
                dialectFilter.value = dialectFilter.value === d ? '' : d;
              }}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      <div class="grid grid-3 mt-24">
        {filteredStats.value.map((stat) => {
          const regionSamples = state.samples.filter((s) => {
            const project = state.projects.find((p) => p.id === s.projectId);
            return project?.region === stat.region;
          });
          const annotated = regionSamples.filter((s) => s.status === 'annotated' || s.status === 'verified').length;
          const total = regionSamples.length;
          const progress = total > 0 ? Math.round((annotated / total) * 100) : 0;
          const isSelected = selectedRegions.value.has(stat.region);

          const toneCats = Object.entries(stat.toneCategories).map(([cat, data], idx) => ({
            category: cat,
            value: data.value,
            color: DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          }));

          const regionProjects = state.projects.filter((p) => p.region === stat.region);

          return (
            <div
              key={`${stat.region}-${stat.dialect}`}
              class="card"
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--primary)' : undefined,
              }}
              onClick$={() => toggleRegion(stat.region)}
            >
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>{stat.region}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>{stat.dialect}</p>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '13px' }}>
                <span>
                  项目 <strong>{stat.projectCount}</strong>
                </span>
                <span>
                  样本 <strong>{stat.sampleCount}</strong>
                </span>
              </div>

              {toneCats.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <ToneChart toneCategories={toneCats} width={300} height={200} />
                </div>
              )}

              <div style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span>标注进度</span>
                  <span>{progress}%</span>
                </div>
                <div class="progress-bar">
                  <div class="fill" style={{ width: `${progress}%`, background: 'var(--primary)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {regionProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/project/${p.id}`}
                    style={{ fontSize: '12px', textDecoration: 'none' }}
                    onClick$={(e) => e.stopPropagation()}
                  >
                    <span class="badge badge-active">{p.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {comparisonData.value.length > 0 && (
        <div class="card mt-24" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>跨地区对比</h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>调类</th>
                {Array.from(selectedRegions.value).map((region) => (
                  <th key={region}>{region}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.value.map((row) => {
                const values = row.cells.map((c) => c.value);
                const hasDiff = new Set(values.filter((v) => v !== '-')).size > 1;

                return (
                  <tr key={row.category}>
                    <td>{row.category}</td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.region}
                        style={hasDiff && cell.value !== '-' ? { color: 'var(--warning)', fontWeight: 600 } : undefined}
                      >
                        {cell.value}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
});
