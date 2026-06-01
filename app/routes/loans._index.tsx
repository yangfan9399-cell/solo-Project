import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getAllLoans } from "~/services/loanService";
import { STAGES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const stage = url.searchParams.get("stage") || "";
  const status = url.searchParams.get("status") || "";

  let loans = getAllLoans();

  if (stage) {
    loans = loans.filter((l) => l.current_stage === stage);
  }
  if (status) {
    loans = loans.filter((l) => l.status === status);
  }

  return json({ loans, stage, status });
}

export default function LoansIndex() {
  const { loans, stage, status } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Layout title="借展申请">
      <div className="page-header">
        <h1 className="page-title">借展申请管理</h1>
        <div className="page-actions">
          <Link to="/loans/new" className="btn btn-primary">
            ➕ 新建申请
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>阶段：</label>
            <select
              value={stage}
              onChange={(e) =>
                setSearchParams({ stage: e.target.value, status })
              }
            >
              <option value="">全部阶段</option>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label>状态：</label>
            <select
              value={status}
              onChange={(e) =>
                setSearchParams({ stage, status: e.target.value })
              }
            >
              <option value="">全部状态</option>
              <option value="pending">待审批</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>

        {loans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">暂无借展申请</div>
            <p>点击"新建申请"按钮创建第一个借展申请</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>申请编号</th>
                  <th>展品名称</th>
                  <th>借入机构</th>
                  <th>展览名称</th>
                  <th>当前阶段</th>
                  <th>审批状态</th>
                  <th>优先级</th>
                  <th>借展时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <span className="badge badge-info">
                        L-{String(loan.id).padStart(4, "0")}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/loans/${loan.id}`}
                        style={{
                          color: "var(--accent-color)",
                          textDecoration: "none",
                        }}
                      >
                        {loan.exhibit_name}
                      </Link>
                    </td>
                    <td>{loan.borrowing_institution}</td>
                    <td>{loan.exhibition_name}</td>
                    <td>
                      <span className="badge badge-primary">
                        {STAGES.find((s) => s.key === loan.current_stage)?.label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          loan.status === "approved"
                            ? "badge-success"
                            : loan.status === "rejected"
                            ? "badge-danger"
                            : "badge-warning"
                        }`}
                      >
                        {loan.status === "approved"
                          ? "已批准"
                          : loan.status === "rejected"
                          ? "已拒绝"
                          : "待审批"}
                      </span>
                    </td>
                    <td>
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
                          ? "高"
                          : loan.priority === "normal"
                          ? "中"
                          : "低"}
                      </span>
                    </td>
                    <td>
                      <small>
                        {loan.start_date} ~ {loan.end_date}
                      </small>
                    </td>
                    <td>
                      <Link
                        to={`/loans/${loan.id}`}
                        className="btn btn-sm btn-secondary"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
