import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { listProjects, getProjectStats } from "~/db/queries";
import { seed } from "~/db/seed";
import { statusLabel, riverTypeLabel, fishTypeLabel } from "~/utils/report";

export const meta = () => [{ title: "批量报告导出" }];

export async function loader(_: LoaderFunctionArgs) {
  seed();
  const stats = getProjectStats();
  const list = listProjects({ per_page: 100 });
  return json({ stats, list });
}

export default function ReportsPage() {
  const { stats, list } = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📊 批量报告导出</div>
          <div className="page-subtitle">对已完成的评估项目进行摘要、批量 CSV / 单个 TXT 报告下载</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📁</div><div className="stat-value metric-value">{stats.total}</div><div className="stat-label">项目总数</div></div>
        <div className="stat-card success"><div className="stat-icon">✅</div><div className="stat-value metric-value">{stats.completed}</div><div className="stat-label">已完成评估</div></div>
        <div className="stat-card warning"><div className="stat-icon">⚙️</div><div className="stat-value metric-value">{stats.in_progress}</div><div className="stat-label">进行中</div></div>
        <div className="stat-card danger"><div className="stat-icon">⚠️</div><div className="stat-value metric-value">{stats.with_anomaly}</div><div className="stat-label">含异常数据</div></div>
      </div>

      <div className="alert alert-info">
        <span className="alert-icon">ℹ️</span>
        <div>
          <strong>导出说明：</strong>点击"报告预览"可查看完整 HTML 报告并下载 TXT / CSV；
          "CSV 摘要" 仅包含项目级汇总 + 断面子段流速明细，适合批量整理；
          "TXT 报告" 为完整结构化文本报告。
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>项目编号</th>
                  <th>项目名称</th>
                  <th>电站 / 河流</th>
                  <th>鱼种</th>
                  <th>状态</th>
                  <th>版本</th>
                  <th>异常</th>
                  <th style={{ textAlign: "right" }}>导出操作</th>
                </tr>
              </thead>
              <tbody>
                {list.data.map((p: any) => (
                  <tr key={p.id}>
                    <td className="metric-value"><strong>{p.code}</strong></td>
                    <td>
                      <Link to={`/projects/${p.id}`} style={{ color: "var(--color-primary)", textDecoration: "none" }}>{p.name}</Link>
                    </td>
                    <td>
                      <div>{p.station_name}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{p.river_name} ({riverTypeLabel(p.river_type)})</div>
                    </td>
                    <td>{fishTypeLabel(p.fish_type)}</td>
                    <td>{statusLabel(p.status)}</td>
                    <td className="metric-value">{p.current_version ?? "—"}</td>
                    <td>
                      {p.has_anomaly ? <span className="badge badge-danger">{p.anomaly_count}</span> : <span className="badge badge-success">正常</span>}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="action-cell" style={{ justifyContent: "flex-end" }}>
                        <Link to={`/projects/${p.id}/report`} className="link-btn">预览</Link>
                        <Link to={`/projects/${p.id}/export.csv`} className="link-btn">CSV</Link>
                        <Link to={`/projects/${p.id}/export.txt`} className="link-btn">TXT</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
