import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAllBatches, getDataAlerts, getDashboardStats, getAllRecords } from "~/db/queries.server";
import Layout from "./_layout";

export const loader: LoaderFunction = () => {
  const stats = getDashboardStats();
  const alerts = getDataAlerts();
  const recentBatches = getAllBatches().slice(0, 6);
  const records = getAllRecords().slice(0, 5);
  return json({ stats, alerts, recentBatches, records });
};

function Stars({ count }: { count: number }) {
  return (
    <span className="stars">
      {"★".repeat(count)}
      <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - count)}</span>
    </span>
  );
}

function AlertIcon({ type }: { type: string }) {
  if (type === "error") return <span className="alert-icon">🔴</span>;
  if (type === "warning") return <span className="alert-icon">🟠</span>;
  return <span className="alert-icon">🔵</span>;
}

export default function Dashboard() {
  const { stats, alerts, recentBatches, records } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">工作台</h1>
          <div className="page-subtitle">黑胶清洗批次记录总览 · {new Date().toLocaleDateString("zh-CN")}</div>
        </div>
      </div>

      <div className="content-wrap">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">唱片库</div>
            <div className="stat-value">{stats.totalRecords}</div>
            <div className="stat-sub">张黑胶唱片</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">清洗批次</div>
            <div className="stat-value">{stats.totalBatches}</div>
            <div className="stat-sub">累计处理次数</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">平均裂纹衰减</div>
            <div className="stat-value">{stats.avgReduction}%</div>
            <div className="stat-sub">整体改善效果</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">平均评级</div>
            <div className="stat-value">{stats.avgRating}</div>
            <div className="stat-sub">满分 5.0</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">在用清洗液</div>
            <div className="stat-value">{stats.activeSolutions}</div>
            <div className="stat-sub">种配方</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">数据告警</div>
            <div className="stat-value" style={{ color: alerts.length > 0 ? "var(--error)" : "var(--success)" }}>
              {alerts.length}
            </div>
            <div className="stat-sub">待关注项</div>
          </div>
        </div>

        {alerts.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚠ 异常数据与维护提醒</div>
              <Link to="/maintenance" className="btn btn-sm">查看全部</Link>
            </div>
            <div className="card-body">
              {alerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className={`alert alert-${alert.type}`}>
                  <AlertIcon type={alert.type} />
                  <div className="alert-body">
                    <strong>{alert.message}</strong>
                    {alert.detail && <div className="alert-detail">{alert.detail}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">最近清洗批次</div>
              <Link to="/batches" className="btn btn-sm">批次台账 →</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>批次号</th>
                    <th>唱片</th>
                    <th>清洗方案</th>
                    <th>噪声</th>
                    <th>评级</th>
                    <th>日期</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBatches.map((b: any) => (
                    <tr key={b.id} style={{ cursor: "pointer" }}>
                      <td>
                        <Link to={`/batches/${b.id}`} style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                          {b.batch_code}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{b.artist}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{b.album}</div>
                      </td>
                      <td>
                        <div>{b.solution_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          🖌{b.brush_count}次 · 🧫{b.ultrasonic_minutes}分
                        </div>
                      </td>
                      <td>
                        <div style={{ fontFamily: "var(--font-mono)" }}>
                          <span style={{ color: "var(--error)" }}>{b.pre_noise_level.toFixed(1)}</span>
                          {" → "}
                          <span style={{ color: "var(--success)" }}>{b.post_noise_level.toFixed(1)}</span>
                        </div>
                        <div style={{ fontSize: "11px", color: b.crackle_reduction < 0 ? "var(--error)" : "var(--text-muted)" }}>
                          ▲ {b.crackle_reduction}%
                        </div>
                      </td>
                      <td><Stars count={b.result_rating} /></td>
                      <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {b.cleaned_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">唱片库精选</div>
              <Link to="/records" className="btn btn-sm">全部唱片 →</Link>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {records.map((r: any) => (
                <div key={r.id} style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 3,
                    background: "linear-gradient(135deg, var(--bg-hover) 0%, var(--accent-dark) 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>💿</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.album}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {r.artist} · {r.year}
                    </div>
                  </div>
                  <span className="badge badge-muted">{r.condition}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
