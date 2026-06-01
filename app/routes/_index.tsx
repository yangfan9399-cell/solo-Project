import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getAllExhibits } from "~/services/exhibitService";
import { getAllLoans, getLoanStats } from "~/services/loanService";
import { getAllExceptions } from "~/services/exceptionService";
import { STAGES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const exhibits = getAllExhibits();
  const loans = getAllLoans();
  const loanStats = getLoanStats();
  const exceptions = getAllExceptions();

  return json({
    totalExhibits: exhibits.length,
    totalLoans: loans.length,
    activeLoans: loans.filter((l) => l.current_stage !== "completed").length,
    activeExceptions: exceptions.filter((e) => e.status !== "resolved" && e.status !== "closed").length,
    loanStats,
    recentLoans: loans.slice(0, 5),
    recentExceptions: exceptions.slice(0, 3),
  });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <Layout title="首页概览">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">🏺</div>
          <div className="stat-value">{data.totalExhibits}</div>
          <div className="stat-label">展品总数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon info">📋</div>
          <div className="stat-value">{data.totalLoans}</div>
          <div className="stat-label">借展申请</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">🚀</div>
          <div className="stat-value">{data.activeLoans}</div>
          <div className="stat-label">进行中</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">⚠️</div>
          <div className="stat-value">{data.activeExceptions}</div>
          <div className="stat-label">待处理异常</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">借展进度分布</div>
        </div>
        <div className="progress-bar">
          {STAGES.map((stage) => (
            <div key={stage.key} className="progress-step">
              <div className="progress-step-icon">{stage.icon}</div>
              <div className="progress-step-label">
                {stage.label}
                <br />
                <strong>{data.loanStats[stage.key] || 0}</strong> 件
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">最近借展申请</div>
          </div>
          {data.recentLoans.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">暂无借展申请</div>
              <p>点击借展申请菜单创建新的申请</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>展品名称</th>
                    <th>借入机构</th>
                    <th>展览名称</th>
                    <th>当前阶段</th>
                    <th>优先级</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLoans.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.exhibit_name}</td>
                      <td>{loan.borrowing_institution}</td>
                      <td>{loan.exhibition_name}</td>
                      <td>
                        <span className="badge badge-info">
                          {STAGES.find((s) => s.key === loan.current_stage)?.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            loan.priority === "high"
                              ? "badge-danger"
                              : loan.priority === "medium"
                              ? "badge-warning"
                              : "badge-primary"
                          }`}
                        >
                          {loan.priority === "high" ? "高" : loan.priority === "normal" ? "中" : "低"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">最近异常</div>
          </div>
          {data.recentExceptions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">暂无异常</div>
              <p>所有流程运行正常</p>
            </div>
          ) : (
            <div>
              {data.recentExceptions.map((exception) => (
                <div
                  key={exception.id}
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <strong>{exception.title}</strong>
                    <span
                      className={`badge ${
                        exception.status === "open"
                          ? "badge-danger"
                          : exception.status === "in_progress"
                          ? "badge-warning"
                          : "badge-success"
                      }`}
                    >
                      {exception.status === "open"
                        ? "待处理"
                        : exception.status === "in_progress"
                        ? "处理中"
                        : "已解决"}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    {exception.description.slice(0, 50)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
