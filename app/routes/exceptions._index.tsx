import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getAllExceptions } from "~/services/exceptionService";
import { EXCEPTION_TYPES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const type = url.searchParams.get("type") || "";

  let exceptions = getAllExceptions();

  if (status) {
    exceptions = exceptions.filter((e) => e.status === status);
  }
  if (type) {
    exceptions = exceptions.filter((e) => e.type === type);
  }

  return json({ exceptions, status, type });
}

export default function ExceptionsIndex() {
  const { exceptions, status, type } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Layout title="异常反馈">
      <div className="page-header">
        <h1 className="page-title">异常反馈管理</h1>
        <div className="page-actions">
          <Link to="/exceptions/new" className="btn btn-primary">
            ➕ 记录异常
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-item">
            <label>状态：</label>
            <select
              value={status}
              onChange={(e) =>
                setSearchParams({ status: e.target.value, type })
              }
            >
              <option value="">全部状态</option>
              <option value="open">待处理</option>
              <option value="in_progress">处理中</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </div>

          <div className="filter-item">
            <label>类型：</label>
            <select
              value={type}
              onChange={(e) =>
                setSearchParams({ status, type: e.target.value })
              }
            >
              <option value="">全部类型</option>
              {EXCEPTION_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {exceptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">暂无异常记录</div>
            <p>所有流程运行正常</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>类型</th>
                  <th>标题</th>
                  <th>严重程度</th>
                  <th>状态</th>
                  <th>报告人</th>
                  <th>负责人</th>
                  <th>报告时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exception) => (
                  <tr key={exception.id}>
                    <td>
                      <span className="badge badge-info">
                        E-{String(exception.id).padStart(4, "0")}
                      </span>
                    </td>
                    <td>{exception.type}</td>
                    <td>
                      <Link
                        to={`/exceptions/${exception.id}`}
                        style={{
                          color: "var(--accent-color)",
                          textDecoration: "none",
                        }}
                      >
                        {exception.title}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          exception.severity === "critical"
                            ? "badge-danger"
                            : exception.severity === "high"
                            ? "badge-warning"
                            : "badge-primary"
                        }`}
                      >
                        {exception.severity === "critical"
                          ? "严重"
                          : exception.severity === "high"
                          ? "高"
                          : exception.severity === "medium"
                          ? "中"
                          : "低"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          exception.status === "resolved"
                            ? "badge-success"
                            : exception.status === "in_progress"
                            ? "badge-warning"
                            : exception.status === "closed"
                            ? "badge-info"
                            : "badge-danger"
                        }`}
                      >
                        {exception.status === "open"
                          ? "待处理"
                          : exception.status === "in_progress"
                          ? "处理中"
                          : exception.status === "resolved"
                          ? "已解决"
                          : "已关闭"}
                      </span>
                    </td>
                    <td>{exception.reporter_name}</td>
                    <td>{exception.assigned_to_name || "-"}</td>
                    <td>{exception.created_at.slice(0, 10)}</td>
                    <td>
                      <Link
                        to={`/exceptions/${exception.id}`}
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
