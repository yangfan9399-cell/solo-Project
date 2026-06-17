import Link from 'next/link';
import { listProjects, listOrigins } from '@/lib/db';
import type { ProjectStatus, AnomalyLevel } from '@/lib/types';
import {
  STATUS_LABEL, STATUS_CLASS, ANOMALY_LABEL, ANOMALY_CLASS, ANOMALY_DOT,
  formatDateTime, cn,
} from '@/lib/utils';
import ProjectFilters from '@/components/ProjectFilters';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS: Array<{ v: ProjectStatus | 'all'; l: string }> = [
  { v: 'all', l: '全部状态' },
  { v: 'draft', l: STATUS_LABEL.draft },
  { v: 'in_progress', l: STATUS_LABEL.in_progress },
  { v: 'review', l: STATUS_LABEL.review },
  { v: 'completed', l: STATUS_LABEL.completed },
];

const ANOMALY_OPTIONS: Array<{ v: AnomalyLevel | 'all'; l: string }> = [
  { v: 'all', l: '全部异常' },
  { v: 'none', l: ANOMALY_LABEL.none },
  { v: 'minor', l: ANOMALY_LABEL.minor },
  { v: 'moderate', l: ANOMALY_LABEL.moderate },
  { v: 'severe', l: ANOMALY_LABEL.severe },
];

interface PageProps {
  searchParams: Promise<{
    status?: string;
    anomaly?: string;
    origin?: string;
    keyword?: string;
    sort?: 'updated_at' | 'avg_offset_px' | 'created_at';
    order?: 'asc' | 'desc';
  }>;
}

export default async function ProjectLedger(props: PageProps) {
  const sp = await props.searchParams;
  const status = (sp.status && sp.status !== 'all' ? sp.status as ProjectStatus : undefined);
  const anomaly = (sp.anomaly && sp.anomaly !== 'all' ? sp.anomaly as AnomalyLevel : undefined);
  const origin = (sp.origin && sp.origin !== 'all' ? sp.origin : undefined);
  const keyword = sp.keyword?.trim() || undefined;
  const sort_by = sp.sort || 'updated_at';
  const order = sp.order || 'desc';

  const origins = listOrigins();
  const projects = listProjects({ status, anomaly, origin, keyword, sort_by, order });
  const allProjects = listProjects();

  const agg: Record<string, number> = {
    total: allProjects.length,
    draft: allProjects.filter(p => p.status === 'draft').length,
    in_progress: allProjects.filter(p => p.status === 'in_progress').length,
    review: allProjects.filter(p => p.status === 'review').length,
    completed: allProjects.filter(p => p.status === 'completed').length,
    severe: allProjects.filter(p => p.anomaly_level === 'severe').length,
    moderate: allProjects.filter(p => p.anomaly_level === 'moderate').length,
    minor: allProjects.filter(p => p.anomaly_level === 'minor').length,
    global_avg: allProjects.length ? allProjects.reduce((s, p) => s + p.avg_offset_px, 0) / allProjects.length : 0,
    versions: allProjects.reduce((s, p) => s + p.total_versions, 0),
  };

  const severeProjects = anomaly === undefined && status === undefined && !keyword && !origin
    ? projects.filter(p => p.anomaly_level === 'severe' || p.anomaly_level === 'moderate').slice(0, 3)
    : [];

  const qs = new URLSearchParams();
  if (sp.status) qs.set('status', sp.status);
  if (sp.anomaly) qs.set('anomaly', sp.anomaly);
  if (sp.origin) qs.set('origin', sp.origin);
  if (sp.keyword) qs.set('keyword', sp.keyword);
  const sortQs = (s: string, o?: string) => {
    const q = new URLSearchParams(qs);
    q.set('sort', s);
    if (o) q.set('order', o);
    return q.toString() ? `/?${q.toString()}` : '/';
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="项目总数" value={String(agg.total ?? 0)} accent="text-ink" />
        <StatCard label="草稿" value={String(agg.draft ?? 0)} accent="text-stone-600" />
        <StatCard label="修版中" value={String(agg.in_progress ?? 0)} accent="text-amber-700" />
        <StatCard label="待审核" value={String(agg.review ?? 0)} accent="text-sky-700" />
        <StatCard label="已归档" value={String(agg.completed ?? 0)} accent="text-emerald-700" />
        <StatCard label="扫描版本" value={String(agg.versions ?? 0)} sub={`平均偏移 ${(agg.global_avg ?? 0).toFixed(2)}px`} accent="text-indigo-700" />
      </section>

      {severeProjects.length > 0 && (
        <div className="paper-card border-l-4 border-l-rose-400 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="section-title !border-0 !pb-0 !text-base">⚠ 需要关注的异常项目</h3>
            <Link href="/?anomaly=severe" className="text-xs text-rose-700 hover:underline">查看全部</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {severeProjects.map(p => (
              <Link key={p.id} href={`/project/${p.id}`} className="group flex items-start gap-2 p-2 rounded-md bg-rose-50/60 hover:bg-rose-50 border border-rose-100 transition">
                <span className={cn('w-2.5 h-2.5 mt-2 rounded-full shrink-0', ANOMALY_DOT[p.anomaly_level])}></span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink group-hover:underline truncate">{p.name}</div>
                  <div className="text-xs text-stone-500 truncate">{p.code} · {p.origin}</div>
                  {p.anomaly_notes && <div className="text-xs text-rose-700/90 mt-1 line-clamp-2">{p.anomaly_notes}</div>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ProjectFilters
        statusOptions={STATUS_OPTIONS}
        anomalyOptions={ANOMALY_OPTIONS}
        origins={origins}
        current={sp}
      />

      <section className="paper-card overflow-hidden">
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100/70 text-xs text-stone-600 border-b border-stone-200">
                <Th href={sortQs(sort_by, sort_by === 'updated_at' && order === 'desc' ? 'asc' : 'desc')} sortable>编号</Th>
                <Th href={sortQs('avg_offset_px', sort_by === 'avg_offset_px' && order === 'desc' ? 'asc' : 'desc')} sortable>作品名称</Th>
                <th className="px-4 py-3 text-left font-medium">产地 / 朝代</th>
                <th className="px-4 py-3 text-left font-medium">画师</th>
                <Th href={sortQs(sort_by)} sortable>状态</Th>
                <Th href={sortQs('avg_offset_px', order === 'asc' ? 'desc' : 'asc')} sortable align="right">偏移统计</Th>
                <Th href={sortQs(sort_by)} sortable>异常等级</Th>
                <Th href={sortQs('updated_at', order === 'asc' ? 'desc' : 'asc')} sortable align="right">最近更新</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-stone-400">
                    <div className="text-5xl mb-2">🪵</div>
                    <div>未找到匹配的项目，试试调整筛选条件。</div>
                  </td>
                </tr>
              ) : projects.map((p) => (
                <tr key={p.id} className="group hover:bg-amber-50/40 transition">
                  <td className="px-4 py-3 font-mono text-xs text-stone-600 whitespace-nowrap">
                    <Link href={`/project/${p.id}`} className="hover:text-gold">
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/project/${p.id}`} className="block">
                      <div className="wood-title font-semibold group-hover:text-cinnabar transition">{p.name}</div>
                      {p.description && <div className="text-xs text-stone-500 line-clamp-1 mt-0.5 max-w-xs">{p.description}</div>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-700 whitespace-nowrap">
                    <div className="text-sm">{p.origin}</div>
                    <div className="text-xs text-stone-500">{p.dynasty}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-700">{p.artist}</td>
                  <td className="px-4 py-3">
                    <span className={cn('chip', STATUS_CLASS[p.status])}>
                      {STATUS_LABEL[p.status]}
                      <span className="text-stone-300 ml-0.5">·</span>
                      <span>{p.total_versions}版</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="font-mono text-sm text-ink">
                      平均 <span className="font-semibold">{p.avg_offset_px.toFixed(2)}</span>px
                    </div>
                    <div className={cn(
                      'text-xs font-mono mt-0.5',
                      p.max_offset_px > 4 ? 'text-rose-700' : p.max_offset_px > 2 ? 'text-orange-700' : 'text-stone-500'
                    )}>
                      最大 {p.max_offset_px.toFixed(2)}px
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('chip', ANOMALY_CLASS[p.anomaly_level])}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', ANOMALY_DOT[p.anomaly_level])}></span>
                      {ANOMALY_LABEL[p.anomaly_level]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-stone-500 whitespace-nowrap font-mono">
                    {formatDateTime(p.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-stone-200/60 text-xs text-stone-500 flex items-center justify-between">
          <span>共 {projects.length} 条记录</span>
          <span className="flex items-center gap-3">
            <LegendDot /> 达标 ≤1.5px
            <LegendDot color="bg-amber-500" /> 预警 ≤3px
            <LegendDot color="bg-rose-500" /> 超限 &gt;3px
          </span>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="stat-card">
      <div className="text-xs text-stone-500">{label}</div>
      <div className={cn('text-2xl font-serif font-bold', accent || 'text-ink')}>{value}</div>
      {sub && <div className="text-[11px] text-stone-500">{sub}</div>}
    </div>
  );
}

function Th({ children, href, sortable, align }: { children: React.ReactNode; href?: string; sortable?: boolean; align?: 'right' | 'left' }) {
  const cls = cn(
    'px-4 py-3 font-medium whitespace-nowrap',
    align === 'right' ? 'text-right' : 'text-left',
    sortable ? 'select-none' : ''
  );
  if (!sortable || !href) return <th className={cls}>{children}</th>;
  return (
    <th className={cls}>
      <a href={href} className="inline-flex items-center gap-1 hover:text-gold transition">
        {children}
        <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
      </a>
    </th>
  );
}

function LegendDot({ color }: { color?: string }) {
  return <span className={cn('inline-block w-2 h-2 rounded-full mr-1', color || 'bg-emerald-500')}></span>;
}
