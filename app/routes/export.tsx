import { Link, useLoaderData, useRouteError } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  exportBatchesCSV,
  exportRecordsCSV,
  exportFullReportJSON,
  generateSummaryText,
} from "~/db/export.server";
import Layout from "./_layout";
import { getDashboardStats, getAllBatches, getAllRecords, getAllSolutions } from "~/db/queries.server";

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");

  if (format === "batches.csv") {
    return new Response(exportBatchesCSV(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vinyl_batches_${Date.now()}.csv"`,
      },
    });
  }

  if (format === "records.csv") {
    return new Response(exportRecordsCSV(), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vinyl_records_${Date.now()}.csv"`,
      },
    });
  }

  if (format === "full.json") {
    return new Response(exportFullReportJSON(), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="vinyl_full_report_${Date.now()}.json"`,
      },
    });
  }

  if (format === "summary.txt") {
    return new Response(generateSummaryText(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="vinyl_summary_${Date.now()}.txt"`,
      },
    });
  }

  return json({
    stats: getDashboardStats(),
    previewBatches: getAllBatches().slice(0, 3),
    previewRecords: getAllRecords().slice(0, 3),
    previewSolutions: getAllSolutions().filter((s: any) => s.is_active),
    summary: generateSummaryText(),
  });
};

export function ErrorBoundary() {
  const error = useRouteError();
  console.error(error);
  return (
    <Layout>
      <div className="content-wrap">
        <div className="alert alert-error">
          <span className="alert-icon">⚠</span>
          <div className="alert-body">
            <strong>导出时发生错误</strong>
            <div className="alert-detail">{error instanceof Error ? error.message : String(error)}</div>
          </div>
        </div>
        <Link to="/export" className="btn">返回</Link>
      </div>
    </Layout>
  );
}

export default function ExportPage() {
  const { stats, summary } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">数据导出</h1>
          <div className="page-subtitle">
            共 {stats.totalBatches} 批次 · {stats.totalRecords} 张唱片 · {stats.activeSolutions} 种清洗液
          </div>
        </div>
      </div>

      <div className="content-wrap">
        <div className="detail-section">
          <div className="section-title">📤 导出选项</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <a href="/export?format=summary.txt" className="card" style={{
              display: "block", textDecoration: "none", color: "inherit", cursor: "pointer",
              transition: "all 0.15s",
            }} onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            }} onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}>
              <div className="card-body">
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--font-serif)" }}>文本摘要</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  生成人类可读的中文报告摘要 (.txt)
                </div>
                <div style={{ marginTop: 12 }}>
                  <span className="badge badge-info">推荐</span>
                </div>
              </div>
            </a>

            <a href="/export?format=batches.csv" className="card" style={{
              display: "block", textDecoration: "none", color: "inherit", cursor: "pointer",
              transition: "all 0.15s",
            }} onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            }} onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}>
              <div className="card-body">
                <div style={{ fontSize: 32, marginBottom: 8 }}>🧪</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--font-serif)" }}>清洗批次</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  导出所有清洗批次为 CSV 表格 (.csv)
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  包含：{stats.totalBatches} 条记录
                </div>
              </div>
            </a>

            <a href="/export?format=records.csv" className="card" style={{
              display: "block", textDecoration: "none", color: "inherit", cursor: "pointer",
              transition: "all 0.15s",
            }} onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            }} onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}>
              <div className="card-body">
                <div style={{ fontSize: 32, marginBottom: 8 }}>💿</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--font-serif)" }}>唱片库</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  导出唱片库信息为 CSV 表格 (.csv)
                </div>
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  包含：{stats.totalRecords} 张唱片
                </div>
              </div>
            </a>

            <a href="/export?format=full.json" className="card" style={{
              display: "block", textDecoration: "none", color: "inherit", cursor: "pointer",
              transition: "all 0.15s",
            }} onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)";
            }} onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}>
              <div className="card-body">
                <div style={{ fontSize: 32, marginBottom: 8 }}>🗃</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "var(--font-serif)" }}>完整 JSON 报告</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                  全量数据导出含摘要统计 (.json)
                </div>
                <div style={{ marginTop: 12 }}>
                  <span className="badge badge-warning">结构化</span>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div className="detail-section">
          <div className="section-title">📝 摘要预览</div>
          <div className="card">
            <div className="card-body">
              <pre style={{
                background: "rgba(0,0,0,0.25)",
                padding: 20,
                borderRadius: 6,
                fontSize: 13,
                lineHeight: 1.8,
                overflow: "auto",
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>{summary}</pre>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <div className="section-title">📊 导出数据样例</div>
          <div className="card">
            <div className="card-header" style={{ borderBottom: "1px solid var(--border)", padding: "12px 20px" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>最近清洗批次（样例）</div>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <ExportSampleBatches />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ExportSampleBatches() {
  const { previewBatches } = useLoaderData<typeof loader>();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>批次号</th>
            <th>唱片</th>
            <th>清洗液</th>
            <th>噪声前→后</th>
            <th>评级</th>
            <th>日期</th>
          </tr>
        </thead>
        <tbody>
          {previewBatches.map((b: any) => (
            <tr key={b.id}>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{b.batch_code}</td>
              <td>
                <div style={{ fontWeight: 500 }}>{b.artist}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{b.album}</div>
              </td>
              <td style={{ fontSize: 12 }}>{b.solution_name}</td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {b.pre_noise_level.toFixed(1)} → {b.post_noise_level.toFixed(1)}
              </td>
              <td>
                <span className="stars">
                  {"★".repeat(b.result_rating)}
                  <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - b.result_rating)}</span>
                </span>
              </td>
              <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.cleaned_at.slice(0, 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
