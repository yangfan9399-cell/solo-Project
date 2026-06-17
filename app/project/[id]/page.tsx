import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getProject, listVersions, listLayers, listControlPointsByVersion,
  listRepairs, getLatestStat, listAllStats,
} from '@/lib/db';
import type { OffsetStat } from '@/lib/types';
import {
  formatDateTime, STATUS_LABEL, STATUS_CLASS,
  ANOMALY_LABEL, ANOMALY_CLASS, ANOMALY_DOT, cn,
} from '@/lib/utils';
import LayerStack from '@/components/LayerStack';
import LayerTuningPanel from '@/components/LayerTuningPanel';
import ControlPointsTable from '@/components/ControlPointsTable';
import RepairsTimeline from '@/components/RepairsTimeline';
import StatsPanel from '@/components/StatsPanel';
import VersionSelector from '@/components/VersionSelector';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string; tab?: string }>;
}

export default async function ProjectDetailPage(props: PageProps) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const projectId = Number(id);
  if (!projectId) notFound();

  const project = getProject(projectId);
  if (!project) notFound();

  const versions = listVersions(projectId);
  const qsVersion = sp.version ? Number(sp.version) : NaN;
  const currentVersionId = Number.isFinite(qsVersion) && versions.some(v => v.id === qsVersion)
    ? qsVersion
    : (versions[0]?.id ?? 0);
  const currentVersion = versions.find(v => v.id === currentVersionId) || null;

  const layers = currentVersionId ? listLayers(currentVersionId) : [];
  const points = currentVersionId ? listControlPointsByVersion(currentVersionId) : [];
  const repairs = listRepairs(projectId);
  const currentStat = currentVersionId ? getLatestStat(projectId, currentVersionId) : null;
  const allStats = listAllStats(projectId);
  const statsByVersion = new Map<number, OffsetStat>();
  for (const s of allStats) statsByVersion.set(s.version_id, s);
  const dpi = currentVersion?.resolution_dpi || 600;

  const historyChart = versions.slice().reverse().map(v => ({
    version_no: v.version_no,
    stat: statsByVersion.get(v.id) || null,
  }));

  const tab = sp.tab || 'workbench';
  const tabQs = (t: string) => {
    const p = new URLSearchParams();
    if (sp.version) p.set('version', sp.version);
    p.set('tab', t);
    return p.toString() ? `?${p.toString()}` : '';
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-ink mb-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回项目台账
          </Link>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="wood-title text-2xl font-bold">{project.name}</h1>
            <span className={cn('chip', STATUS_CLASS[project.status])}>{STATUS_LABEL[project.status]}</span>
            <span className={cn('chip', ANOMALY_CLASS[project.anomaly_level])}>
              <span className={cn('w-1.5 h-1.5 rounded-full', ANOMALY_DOT[project.anomaly_level])}></span>
              {ANOMALY_LABEL[project.anomaly_level]}异常
            </span>
          </div>
          <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono">{project.code}</span>
            <span>· {project.origin}</span>
            <span>· {project.dynasty}</span>
            <span>· 画师 {project.artist}</span>
            <span>· 创建 {formatDateTime(project.created_at)}</span>
          </div>
          {project.description && (
            <p className="text-sm text-ink/80 mt-2 max-w-3xl leading-relaxed">{project.description}</p>
          )}
          {project.anomaly_notes && (
            <div className="mt-3 inline-flex items-start gap-2 px-3 py-2 rounded-md bg-rose-50/70 border border-rose-200 max-w-xl">
              <span className="text-rose-600 mt-0.5">⚠</span>
              <div className="text-xs text-rose-900/90"><b>异常提示：</b>{project.anomaly_notes}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/api/export?project_id=${projectId}&format=json`} target="_blank" className="btn-secondary text-xs">
            ⬇ JSON
          </Link>
          <Link href={`/api/export?project_id=${projectId}&format=xlsx`} className="btn-primary text-xs">
            ⬇ 导出分析摘要 (Excel)
          </Link>
        </div>
      </div>

      {currentVersion && (
        <div className="paper-card px-4 py-2 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-stone-500">当前分析版本</span>
          <span className="font-mono font-bold text-ink">{currentVersion.version_no}</span>
          <span className="text-stone-400">|</span>
          <span>批次 <b className="font-mono text-stone-700">{currentVersion.batch_no || '-'}</b></span>
          <span className="text-stone-400">|</span>
          <span>扫描 <b>{formatDateTime(currentVersion.scanned_at)}</b></span>
          <span className="text-stone-400">|</span>
          <span>{currentVersion.scanner || '未知设备'} · {currentVersion.resolution_dpi}dpi</span>
          {currentVersion.notes && (
            <>
              <span className="text-stone-400">|</span>
              <span className="text-stone-600 truncate max-w-md">📝 {currentVersion.notes}</span>
            </>
          )}
        </div>
      )}

      <div className="flex border-b border-stone-200 text-sm overflow-x-auto scroll-thin">
        {([
          { k: 'workbench', l: '🎨 套色工作台' },
          { k: 'stats', l: '📊 偏移统计' },
          { k: 'points', l: '📍 控制点' },
          { k: 'repairs', l: '🔧 修版记录' },
        ] as const).map(t => (
          <Link
            key={t.k}
            href={tabQs(t.k)}
            className={cn(
              'px-4 py-2.5 whitespace-nowrap transition border-b-2 -mb-px',
              tab === t.k
                ? 'border-gold text-ink font-medium bg-amber-50/40'
                : 'border-transparent text-stone-500 hover:text-ink hover:bg-stone-50/60'
            )}
          >
            {t.l}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5">
        <div className="flex flex-col gap-5 min-w-0">
          {tab === 'workbench' && (
            <>
              <div className="paper-card p-4">
                <div className="section-title mb-3">图层叠合预览（悬停高亮色版）</div>
                <LayerStack layers={layers} />
              </div>
              <div className="paper-card p-4">
                <div className="section-title mb-3">色版参数微调</div>
                <LayerTuningPanel layers={layers} />
              </div>
              <div className="paper-card p-4">
                <div className="section-title mb-3">当前版本偏移统计</div>
                <StatsPanel current={currentStat} history={historyChart} dpi={dpi} />
              </div>
            </>
          )}
          {tab === 'stats' && (
            <div className="paper-card p-4">
              <div className="section-title mb-3">偏移统计（版本 {currentVersion?.version_no || '-'}）</div>
              <StatsPanel current={currentStat} history={historyChart} dpi={dpi} />
              {currentStat && (
                <div className="mt-6">
                  <div className="section-title mb-3 text-stone-600">各版本明细</div>
                  <div className="overflow-x-auto scroll-thin border border-stone-200 rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-100/70 text-stone-600">
                        <tr>
                          <th className="px-3 py-2 text-left">版本</th>
                          <th className="px-3 py-2 text-right">色版</th>
                          <th className="px-3 py-2 text-right">控制点</th>
                          <th className="px-3 py-2 text-right">平均ΔX</th>
                          <th className="px-3 py-2 text-right">平均ΔY</th>
                          <th className="px-3 py-2 text-right">平均距离</th>
                          <th className="px-3 py-2 text-right">最大距离</th>
                          <th className="px-3 py-2 text-right">标准差</th>
                          <th className="px-3 py-2 text-right">达标率</th>
                          <th className="px-3 py-2 text-left">分析时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {versions.map(v => {
                          const s = statsByVersion.get(v.id);
                          if (!s) return (
                            <tr key={v.id}>
                              <td className="px-3 py-2 font-mono text-stone-500">{v.version_no}</td>
                              <td colSpan={9} className="px-3 py-2 text-stone-400 text-center">暂无分析数据</td>
                            </tr>
                          );
                          const rate = s.point_count ? Math.round(s.aligned_count / s.point_count * 100) : 0;
                          return (
                            <tr key={v.id} className="hover:bg-amber-50/30">
                              <td className="px-3 py-2 font-mono font-bold">{v.version_no}</td>
                              <td className="px-3 py-2 text-right">{s.layer_count}</td>
                              <td className="px-3 py-2 text-right">{s.point_count}</td>
                              <td className="px-3 py-2 text-right font-mono">{s.avg_delta_x.toFixed(3)}</td>
                              <td className="px-3 py-2 text-right font-mono">{s.avg_delta_y.toFixed(3)}</td>
                              <td className={cn('px-3 py-2 text-right font-mono font-semibold', s.avg_distance > 2 ? 'text-rose-700' : 'text-emerald-700')}>
                                {s.avg_distance.toFixed(3)}
                              </td>
                              <td className={cn('px-3 py-2 text-right font-mono', s.max_distance > 3 ? 'text-rose-700' : s.max_distance > 1.5 ? 'text-amber-700' : 'text-stone-700')}>
                                {s.max_distance.toFixed(3)}
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{s.std_distance.toFixed(3)}</td>
                              <td className="px-3 py-2 text-right">
                                <span className={cn('chip', rate >= 90 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : rate >= 70 ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200')}>
                                  {rate}%
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-stone-500 text-[11px]">{formatDateTime(s.analyzed_at)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'points' && (
            <div className="paper-card p-4">
              <div className="section-title mb-3">控制点明细（版本 {currentVersion?.version_no || '-'}）</div>
              <ControlPointsTable
                layers={layers}
                initialPoints={points}
                projectId={projectId}
                versionId={currentVersionId}
              />
            </div>
          )}
          {tab === 'repairs' && (
            <div className="paper-card p-4">
              <div className="section-title mb-3">修版时间线</div>
              <RepairsTimeline
                records={repairs}
                layers={layers}
                versions={versions}
                projectId={projectId}
                defaultVersionId={currentVersionId}
              />
            </div>
          )}
        </div>
        <aside className="flex flex-col gap-4">
          <div className="paper-card p-4">
            <VersionSelector
              versions={versions}
              currentVersionId={currentVersionId}
              projectId={projectId}
              currentStatus={project.status}
              currentAnomaly={project.anomaly_level}
              currentAnomalyNotes={project.anomaly_notes}
              layersInCurrent={layers}
              statsByVersion={statsByVersion}
            />
          </div>
          <div className="paper-card p-4">
            <h3 className="section-title">项目速览</h3>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
              <div>
                <dt className="text-stone-500">扫描版本</dt>
                <dd className="font-mono text-ink font-bold text-base">{project.total_versions}</dd>
              </div>
              <div>
                <dt className="text-stone-500">平均偏移</dt>
                <dd className="font-mono text-ink font-bold text-base">{project.avg_offset_px.toFixed(2)}<span className="text-[11px] text-stone-500 ml-1">px</span></dd>
              </div>
              <div>
                <dt className="text-stone-500">最大偏移</dt>
                <dd className={cn('font-mono font-bold text-base', project.max_offset_px > 3 ? 'text-rose-700' : project.max_offset_px > 1.5 ? 'text-amber-700' : 'text-emerald-700')}>
                  {project.max_offset_px.toFixed(2)}<span className="text-[11px] ml-1 opacity-70">px</span>
                </dd>
              </div>
              <div>
                <dt className="text-stone-500">修版记录</dt>
                <dd className="font-mono text-ink font-bold text-base">{repairs.length}</dd>
              </div>
            </dl>
          </div>
          <div className="paper-card p-4 border-l-4 border-l-gold">
            <h3 className="text-xs font-serif font-bold text-ink mb-2">📖 工艺知识</h3>
            <ul className="text-[11px] text-stone-600 space-y-1 leading-relaxed">
              <li>· 木版水印一般采用 4-7 版分色套印</li>
              <li>· 精细作品控制点需 ≥ 8 处，四角+中心+细部</li>
              <li>· 合格标准 ≤ 1.5px @ 600dpi ≈ 0.06mm</li>
              <li>· 预警阈值 1.5-3px，超限 &gt; 3px</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
