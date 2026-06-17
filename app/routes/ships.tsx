import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import AppShell from "~/components/AppShell";
import { buildLedgerSummary } from "~/services/report-generator";
import { getAllShips } from "~/db/repositories/ships";
import { getRecordsByShipId } from "~/db/repositories/records";
import type { Ship, DeviationRecord } from "~/types";

interface LoaderData {
  summary: Awaited<ReturnType<typeof buildLedgerSummary>>;
  ships: Array<Ship & { recordCount: number; lastDate: string | null; latestStatus: string | null }>;
}

export const meta: MetaFunction = () => [
  { title: "船舶档案库 - 罗经自差校正台账" },
];

export const loader: LoaderFunction = async () => {
  const summary = await buildLedgerSummary();
  const ships = await getAllShips();
  const enriched = [];
  for (const s of ships) {
    const recs = await getRecordsByShipId(s.id);
    enriched.push({
      ...s,
      recordCount: recs.length,
      lastDate: recs[0]?.record_date || null,
      latestStatus: recs[0]?.status || null,
    });
  }
  return json({ summary, ships: enriched } satisfies LoaderData);
};

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿', verified: '已复核', approved: '已批准', archived: '已归档'
};

export default function ShipsPage() {
  const data = useLoaderData<LoaderData>();
  return (
    <AppShell summary={data.summary} currentPageTitle="船舶档案库" currentPageSubtitle="管理所有在管船舶的基础信息与罗经配置">
      <div className="card">
        <div className="card-header">
          <div className="card-title">🚢 船舶档案目录（{data.ships.length} 艘）</div>
          <div className="toolbar">
            <button className="btn btn-outline">📥 批量导入</button>
            <button className="btn btn-gold">➕ 新增船舶</button>
          </div>
        </div>
        <div style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>船名</th>
                <th>IMO / 呼号</th>
                <th>船旗 / 船型</th>
                <th>总吨 / 建造</th>
                <th>罗经配置</th>
                <th>校正次数</th>
                <th>最近校正</th>
                <th style={{ width: '100px', textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {data.ships.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--navy-800)', fontSize: '14.5px' }}>⚓ {s.name}</div>
                    <div className="text-sm text-muted">船籍港：{s.home_port || '—'}</div>
                  </td>
                  <td>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.imo_number || '—'}</div>
                    <div className="text-sm text-muted">呼号: {s.call_sign || '—'}</div>
                  </td>
                  <td>
                    <div>🏳️ {s.flag || '—'}</div>
                    <div className="text-sm text-muted">{s.ship_type || '—'}</div>
                  </td>
                  <td>
                    <div>{s.gross_tonnage?.toLocaleString() || '—'} GT</div>
                    <div className="text-sm text-muted">{s.built_year || '—'} 年造</div>
                  </td>
                  <td>
                    <div>{s.compass_type || '—'}</div>
                    <div className="text-sm text-muted">{s.compass_model || '—'}</div>
                  </td>
                  <td style={{ fontWeight: 600, color: s.recordCount === 0 ? 'var(--warning)' : 'var(--navy-700)' }}>
                    {s.recordCount} 次
                  </td>
                  <td>
                    {s.lastDate ? (
                      <>
                        <div>{s.lastDate}</div>
                        <div className="text-sm text-muted">{STATUS_LABEL[s.latestStatus || ''] || ''}</div>
                      </>
                    ) : <span className="text-warning">⚠️ 暂无记录</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/records/new?ship=${s.id}`} className="btn btn-sm btn-primary">新建校正</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
