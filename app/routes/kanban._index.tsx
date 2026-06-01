import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getLoansByStage } from "~/services/loanService";
import { STAGES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const loansByStage: Record<string, any[]> = {};

  for (const stage of STAGES) {
    loansByStage[stage.key] = getLoansByStage(stage.key);
  }

  return json({ loansByStage });
}

export default function Kanban() {
  const { loansByStage } = useLoaderData<typeof loader>();

  return (
    <Layout title="借展进度看板">
      <div className="page-header">
        <h1 className="page-title">借展进度看板</h1>
        <div className="page-actions">
          <Link to="/loans/new" className="btn btn-primary">
            ➕ 新建申请
          </Link>
        </div>
      </div>

      <div className="kanban-board">
        {STAGES.map((stage) => (
          <div key={stage.key} className="kanban-column">
            <div className="kanban-column-header">
              <div className="kanban-column-title">
                <span>{stage.icon}</span>
                <span>{stage.label}</span>
              </div>
              <div className="kanban-count">
                {loansByStage[stage.key]?.length || 0}
              </div>
            </div>
            <div className="kanban-column-body">
              {loansByStage[stage.key]?.length === 0 ? (
                <div
                  className="empty-state"
                  style={{ padding: "24px", fontSize: "14px" }}
                >
                  <div className="empty-state-icon" style={{ fontSize: "32px" }}>
                    📭
                  </div>
                  <p style={{ fontSize: "12px" }}>暂无记录</p>
                </div>
              ) : (
                loansByStage[stage.key]?.map((loan) => (
                  <Link
                    key={loan.id}
                    to={`/loans/${loan.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="kanban-card">
                      <div className="kanban-card-title">{loan.exhibit_name}</div>
                      <div className="kanban-card-meta">
                        <span className="badge badge-info">
                          L-{String(loan.id).padStart(4, "0")}
                        </span>
                        <span
                          className={`badge ${
                            loan.priority === "high"
                              ? "badge-danger"
                              : loan.priority === "normal"
                              ? "badge-warning"
                              : "badge-primary"
                          }`}
                        >
                          {loan.priority === "high"
                            ? "高优先级"
                            : loan.priority === "normal"
                            ? "中优先级"
                            : "低优先级"}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginTop: "8px",
                        }}
                      >
                        {loan.borrowing_institution}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "var(--text-secondary)",
                          marginTop: "4px",
                        }}
                      >
                        {loan.start_date} ~ {loan.end_date}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
