import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import AppShell from "~/components/AppShell";
import { buildLedgerSummary } from "~/services/report-generator";
import { listRecords, getDeviationPoints } from "~/db/repositories/records";
import { getShipById } from "~/db/repositories/ships";
import { detectAnomalies } from "~/services/anomaly-detector";
import type { AnomalyReport } from "~/types";

interface AnomalyRow {
  shipName: string;
  shipId: number;
  recordId: number;
  batchCode: string;
  recordDate: string;
  anomalies: AnomalyReport[];
  maxDev: number;
  pointCount: number;
}

export const meta: MetaFunction = () => [
  { title: "异常数据监测中心 - 罗经自差校正台账" },
];

export const loader: LoaderFunction = async () => {
  const summary = await buildLedgerSummary();
  const all = await listRecords({});
  const anomalies: AnomalyRow[] = [];

  for (const r of all) {
    const points = await getDeviationPoints(r.id);
    const anoms = detectAnomalies(r.id, points);
    if (anoms.length > 0) {
      const ship = (await getShipById(r.ship_id))!;
      anomalies.push({
        shipName: ship.name,
        shipId: ship.id,
        recordId: r.id,
        batchCode: r.batch_code,
        recordDate: r.record_date,
        anomalies: anoms,
        maxDev: r.max_deviation || 0,
        pointCount: r.point_count
      });
    }
  }

  const highCount = anomalies.filter((a: AnomalyRow) => a.anomalies.some((x: AnomalyReport) => x.severity === 'high')).length;
  const medCount = anomalies.filter((a: AnomalyRow) => !a.anomalies.some((x: AnomalyReport) => x.severity === 'high') && a.anomalies.some((x: AnomalyReport) => x.severity === 'medium')).length;
  const lowCount = anomalies.length - highCount - medCount;

  return json({ summary, anomalies, highCount, medCount, lowCount });
};

export default function AnomaliesPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <AppShell summary={data.summary} currentPageTitle="异常数据监测中心" currentPageSubtitle="自动检测超差、缺测、跳变等数据质量问题">
      <div className="stats-grid">
        <div className="stat-card stat-red"><div className="stat-label">🚨 高风险异常</div><div className="stat-value">{data.highCount}</div><div className="stat-sub">需立即处理</div></div>
        <div className="stat-card stat-orange"><div className="stat-label">⚠️ 中等异常</div><div className="stat-value">{data.medCount}</div><div className="stat-sub">建议复核</div></div>
        <div className="stat-card"><div className="stat-label">💡 低风险提示</div><div className="stat-value">{data.lowCount}</div><div className="stat-sub">可选择性处理</div></div>
        <div className="stat-card stat-gold"><div className="stat-label">📊 累计异常记录</div><div className="stat-value">{data.anomalies.length}</div><div className="stat-sub">占比 {data.summary.totalRecords > 0 ? ((data.anomalies.length / data.summary.totalRecords) * 100).toFixed(1) : 0}%</div></div>
      </div>

      {data.anomalies.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: 'var(--success)' }}>✅</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '6px' }}>当前无异常数据</div>
            <div className="text-muted">所有校正记录均通过质量检测</div>
          </div>
        </div>
      ) : data.anomalies.map((a: AnomalyRow) => {
        const highest = a.anomalies.reduce((m: AnomalyReport, x: AnomalyReport) => {
          const order: Record<string, number> = { high: 3, medium: 2, low: 1 };
          return order[x.severity] > (order[m.severity] || 0) ? x : m;
        }, a.anomalies[0]);
        const cls = highest.severity === 'high' ? 'row-abnormal' : '';
        return (
          <div key={a.recordId} className="card mb-4">
            <div className="card-header">
              <div>
                <div style={{ fontWeight: 700, color: 'var(--navy-800)', fontSize: '15px' }}>
                  <span className={`severity-dot severity-${highest.severity}`} />
                  ⚓ {a.shipName}
                  <span style={{ marginLeft: '12px', fontFamily: 'monospace', fontSize: '12.5px', color: 'var(--gray-500)' }}>{a.batchCode}</span>
                </div>
                <div className="text-sm text-muted" style={{ marginTop: '3px' }}>
                  校正日期：{a.recordDate}　·　最大自差：{a.maxDev.toFixed(1)}°　·　测点：{a.pointCount}/24
                </div>
              </div>
              <Link to={`/records/${a.recordId}`} className="btn btn-primary">查看详情 →</Link>
            </div>
            <div style={{ padding: '14px 20px', display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              {a.anomalies.map((x: AnomalyReport, i: number) => (
                <div key={i} className={`anomaly-card severity-${x.severity}`}>
                  <div className="anomaly-title">
                    <span className={`severity-dot severity-${x.severity}`} />
                    {x.type === 'deviation_excessive' && '🚨 自差值超限'}
                    {x.type === 'missing_points' && '⚠️ 测点数量不足'}
                    {x.type === 'abnormal_jump' && '📈 异常跳变'}
                    {x.type === 'inconsistent_direction' && '↔️ 方向切换频繁'}
                    {x.type === 'curve_discontinuity' && '〰️ 曲线平滑度'}
                  </div>
                  <div className="anomaly-desc">{x.message}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}
