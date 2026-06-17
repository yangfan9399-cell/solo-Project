import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import AppShell from "~/components/AppShell";
import { StatCard, StatusBadge, SeverityDot } from "~/components/ui";
import { buildLedgerSummary } from "~/services/report-generator";
import { listRecords, getUniqueFlags, getUniqueShipTypes } from "~/db/repositories/records";
import { detectAnomalies, getOverallSeverity } from "~/services/anomaly-detector";
import { getDeviationPoints } from "~/db/repositories/records";
import type { FilterOptions, LedgerSummary } from "~/types";
import clsx from "clsx";

interface RecordRow {
  id: number; ship_id: number; ship_name: string; ship_flag: string | null; ship_type: string | null;
  batch_code: string; record_date: string; location: string | null; status: string;
  point_count: number; max_deviation: number; inspector_name: string | null; version: number;
  severity: 'none' | 'low' | 'medium' | 'high'; anomaly_count: number;
}

interface LoaderData {
  summary: LedgerSummary;
  records: RecordRow[];
  flags: string[];
  shipTypes: string[];
  currentFilter: FilterOptions;
}

export const meta: MetaFunction = () => [
  { title: "船舶罗经自差校正台账 - 工作台" },
  { name: "description", content: "旧船舶磁罗经自差校正台账管理系统工作台" },
];

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const filter: FilterOptions = {
    keyword: url.searchParams.get('q') || undefined,
    status: (url.searchParams.get('status') as FilterOptions['status']) || undefined,
    shipType: url.searchParams.get('type') || undefined,
    flag: url.searchParams.get('flag') || undefined,
    dateFrom: url.searchParams.get('from') || undefined,
    dateTo: url.searchParams.get('to') || undefined,
    hasAnomaly: url.searchParams.get('anomaly') === '1',
  };

  const summary = await buildLedgerSummary();
  const rawRecords = await listRecords(filter);
  const enriched: RecordRow[] = [];
  for (const r of rawRecords) {
    const points = await getDeviationPoints(r.id);
    const reports = detectAnomalies(r.id, points);
    enriched.push({
      id: r.id, ship_id: r.ship_id, ship_name: r.ship_name, ship_flag: r.ship_flag, ship_type: r.ship_type,
      batch_code: r.batch_code, record_date: r.record_date, location: r.location, status: r.status,
      point_count: r.point_count, max_deviation: r.max_deviation || 0, inspector_name: r.inspector_name, version: r.version,
      severity: getOverallSeverity(reports), anomaly_count: reports.length,
    } as RecordRow);
  }

  return {
    summary,
    records: enriched,
    flags: await getUniqueFlags(),
    shipTypes: await getUniqueShipTypes(),
    currentFilter: filter,
  } satisfies LoaderData;
};

export default function LedgerIndex() {
  const data = useLoaderData<LoaderData>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  const setFilter = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    });
    submit(next, { method: 'get' });
  };

  const STATUS_OPTIONS: Array<{ key: string; label: string; icon: string }> = [
    { key: '', label: '全部状态', icon: '📋' },
    { key: 'draft', label: '草稿', icon: '📝' },
    { key: 'verified', label: '已复核', icon: '🔍' },
    { key: 'approved', label: '已批准', icon: '✅' },
    { key: 'archived', label: '已归档', icon: '📦' },
  ];

  const activeFilters = Object.entries(data.currentFilter).filter(([, v]) => v !== undefined && v !== '');

  return (
    <AppShell
      summary={data.summary}
      currentPageTitle="自差台账工作台"
      currentPageSubtitle={`管理 ${data.summary.totalShips} 艘船舶的磁罗经自差校正记录，依据 SOLAS Ch.V Reg.19 / IMO A.382(X)`}
    >
      <div className="stats-grid">
        <StatCard label="在管船舶总数" value={data.summary.totalShips} icon="⚓" sub={`${data.shipTypes.length} 种船型，${data.flags.length} 国船旗`} />
        <StatCard label="校正记录总数" value={data.summary.totalRecords} variant="gold" icon="📋" sub={`其中已批准 ${data.summary.verifiedRecords} 份`} />
        <StatCard label="待处理草稿" value={data.summary.pendingRecords} variant="orange" icon="📝" sub={`需要继续完善数据`} />
        <StatCard label="异常数据记录" value={data.summary.abnormalRecords} variant="red" icon="⚠️" sub={`超差/缺测/跳变等 ${data.records.filter(r => r.anomaly_count > 0).length} 份异常`} />
        <StatCard label="已归档历史" value={data.summary.archivedRecords} variant="green" icon="📦" sub={`过期或已替换的记录`} />
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <div className="card-title">🔍 筛选与检索</div>
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="input" placeholder="搜索船名/IMO/批次号/地点..."
                defaultValue={data.currentFilter.keyword || ''}
                onChange={e => setFilter({ q: e.target.value })} />
            </div>
            <Link to="/records/new" className="btn btn-gold">➕ 新建校正记录</Link>
          </div>
        </div>
        <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px solid var(--gray-200)' }}>
          <div className="filter-group">
            <span style={{ fontSize: '12.5px', color: 'var(--gray-500)', fontWeight: 600, marginRight: '6px' }}>状态：</span>
            {STATUS_OPTIONS.map(opt => {
              const active = (data.currentFilter.status || '') === opt.key;
              return (
                <button key={opt.key} className={clsx('filter-chip', active && 'active')}
                  onClick={() => setFilter({ status: opt.key || null })}>
                  {opt.icon} {opt.label}
                </button>
              );
            })}
            <span style={{ margin: '0 8px', color: 'var(--gray-300)' }}>|</span>
            <button className={clsx('filter-chip danger', data.currentFilter.hasAnomaly && 'active')}
              onClick={() => setFilter({ anomaly: data.currentFilter.hasAnomaly ? null : '1' })}>
              ⚠️ 仅显示异常
            </button>
          </div>

          <div className="filter-group">
            <span style={{ fontSize: '12.5px', color: 'var(--gray-500)', fontWeight: 600, marginRight: '6px' }}>船型：</span>
            <select className="select" style={{ minWidth: '140px' }} value={data.currentFilter.shipType || ''}
              onChange={e => setFilter({ type: e.target.value })}>
              <option value="">全部船型</option>
              {data.shipTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ fontSize: '12.5px', color: 'var(--gray-500)', fontWeight: 600, marginRight: '6px', marginLeft: '10px' }}>船旗国：</span>
            <select className="select" style={{ minWidth: '140px' }} value={data.currentFilter.flag || ''}
              onChange={e => setFilter({ flag: e.target.value })}>
              <option value="">全部船旗</option>
              {data.flags.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <span style={{ fontSize: '12.5px', color: 'var(--gray-500)', fontWeight: 600, marginRight: '6px', marginLeft: '10px' }}>日期：</span>
            <input type="date" className="input" style={{ width: '150px' }} value={data.currentFilter.dateFrom || ''}
              onChange={e => setFilter({ from: e.target.value })} />
            <span style={{ color: 'var(--gray-500)' }}>至</span>
            <input type="date" className="input" style={{ width: '150px' }} value={data.currentFilter.dateTo || ''}
              onChange={e => setFilter({ to: e.target.value })} />
          </div>

          {activeFilters.length > 0 && (
            <div className="filter-group" style={{ paddingTop: '8px', borderTop: '1px dashed var(--gray-200)' }}>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>当前筛选条件：</span>
              {activeFilters.map(([k, v]) => (
                <span key={k} className="filter-chip active" style={{ cursor: 'pointer' }} onClick={() => setFilter({ [k]: null })}>
                  {k}: {String(v).slice(0, 30)} ✕
                </span>
              ))}
              <button className="btn btn-sm btn-outline" onClick={() => {
                submit(new URLSearchParams(), { method: 'get' });
              }}>清除全部</button>
            </div>
          )}
        </div>

        <div className="card-body">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>船舶 / 船旗</th>
                  <th>批次编号 / 版本</th>
                  <th>校正日期</th>
                  <th>校正地点</th>
                  <th>测点 / 最大自差</th>
                  <th>验船师 / 机构</th>
                  <th>状态</th>
                  <th>异常</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {data.records.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><div className="empty-state-icon">📭</div>未找到匹配的校正记录</div></td></tr>
                ) : data.records.map(r => (
                  <tr key={r.id} className={clsx(r.severity === 'high' && 'row-abnormal')}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--navy-800)' }}>
                        ⚓ {r.ship_name}
                        <span className="text-sm text-muted" style={{ marginLeft: '6px' }}>{r.ship_type}</span>
                      </div>
                      <div className="text-sm text-muted">🏳️ {r.ship_flag || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--navy-700)', fontWeight: 600 }}>{r.batch_code}</div>
                      <div className="text-sm text-muted">版本号：V{r.version}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{r.record_date}</div>
                    </td>
                    <td>
                      <div>📍 {r.location || '—'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: r.max_deviation > 10 ? 'var(--danger)' : 'var(--gray-700)' }}>
                        {r.max_deviation.toFixed(1)}°
                        {r.max_deviation > 10 && <span className="text-danger" style={{ marginLeft: '4px', fontSize: '11px' }}>⚠超差</span>}
                      </div>
                      <div className="text-sm text-muted">{r.point_count}/24 测点</div>
                    </td>
                    <td>
                      <div>{r.inspector_name || '—'}</div>
                    </td>
                    <td><StatusBadge status={r.status as 'draft' | 'verified' | 'approved' | 'archived'} /></td>
                    <td>
                      {r.anomaly_count > 0 ? (
                        <div style={{ fontSize: '12.5px' }}>
                          <SeverityDot severity={r.severity} />
                          <span style={{ color: r.severity === 'high' ? 'var(--danger)' : r.severity === 'medium' ? 'var(--warning)' : 'var(--gray-600)', fontWeight: 600 }}>
                            {r.anomaly_count} 项
                          </span>
                        </div>
                      ) : <span className="text-success text-sm">✅ 正常</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/records/${r.id}`} className="btn btn-sm btn-primary">查看</Link>
                        <Link to={`/records/${r.id}/export`} className="btn btn-sm btn-outline">导出</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <div>显示 <b style={{ color: 'var(--navy-700)' }}>{data.records.length}</b> 条校正记录</div>
            <div className="text-sm text-muted">依据 SOLAS 公约要求，磁罗经自差校正每 12 个月至少进行一次</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
