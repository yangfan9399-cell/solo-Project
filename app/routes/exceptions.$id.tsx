import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import Layout from "~/components/Layout";
import { getExceptionById, resolveException, updateException } from "~/services/exceptionService";
import { getAllUsers } from "~/services/userService";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  const exception = getExceptionById(id);
  const users = getAllUsers();

  if (!exception) {
    throw new Response("异常记录不存在", { status: 404 });
  }

  return json({ exception, users });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const id = Number(params.id);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "resolve") {
    const resolution = String(formData.get("resolution"));
    resolveException(id, resolution);
  } else if (intent === "assign") {
    const assignedToId = Number(formData.get("assigned_to_id"));
    const user = (await getAllUsers()).find((u) => u.id === assignedToId);
    if (user) {
      updateException(id, {
        assigned_to_id: assignedToId,
        assigned_to_name: user.name,
        status: "in_progress",
      });
    }
  }

  return redirect(`/exceptions/${id}`);
}

export default function ExceptionDetail() {
  const { exception, users } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  return (
    <Layout title="异常详情">
      <div className="page-header">
        <h1 className="page-title">{exception.title}</h1>
        <div className="page-actions">
          <Link to="/exceptions" className="btn btn-outline">
            ← 返回列表
          </Link>
          {exception.status === "open" && (
            <button className="btn btn-warning" onClick={() => setShowAssignModal(true)}>
              👤 指派处理人
            </button>
          )}
          {(exception.status === "open" || exception.status === "in_progress") && (
            <button className="btn btn-success" onClick={() => setShowResolveModal(true)}>
              ✓ 标记已解决
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div className="card">
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <span className="badge badge-info">
              E-{String(exception.id).padStart(4, "0")}
            </span>
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
          </div>

          <div className="form-group">
            <label className="form-label">异常类型</label>
            <div className="detail-value">{exception.type}</div>
          </div>

          <div className="form-group">
            <label className="form-label">详细描述</label>
            <p>{exception.description}</p>
          </div>

          {exception.resolution && (
            <div className="form-group">
              <label className="form-label">解决方案</label>
              <div
                style={{
                  padding: "16px",
                  background: "#eafaf1",
                  borderRadius: "8px",
                  borderLeft: "4px solid var(--success-color)",
                }}
              >
                {exception.resolution}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="card-title">基本信息</div>
            <div className="detail-item">
              <div className="detail-label">报告人</div>
              <div className="detail-value">{exception.reporter_name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">报告时间</div>
              <div className="detail-value">{exception.created_at}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">处理人</div>
              <div className="detail-value">
                {exception.assigned_to_name || (
                  <span className="badge badge-warning">未指派</span>
                )}
              </div>
            </div>
            {exception.resolved_at && (
              <div className="detail-item">
                <div className="detail-label">解决时间</div>
                <div className="detail-value">{exception.resolved_at}</div>
              </div>
            )}
          </div>

          {(exception.loan_id || exception.exhibit_id) && (
            <div className="card">
              <div className="card-title">关联信息</div>
              {exception.loan_id && (
                <div className="detail-item">
                  <div className="detail-label">关联借展</div>
                  <div className="detail-value">
                    <Link
                      to={`/loans/${exception.loan_id}`}
                      style={{ color: "var(--accent-color)" }}
                    >
                      查看借展 #{exception.loan_id}
                    </Link>
                  </div>
                </div>
              )}
              {exception.exhibit_id && (
                <div className="detail-item">
                  <div className="detail-label">关联展品</div>
                  <div className="detail-value">
                    <Link
                      to={`/exhibits/${exception.exhibit_id}`}
                      style={{ color: "var(--accent-color)" }}
                    >
                      查看展品 #{exception.exhibit_id}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showResolveModal && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">标记异常已解决</div>
              <button
                className="modal-close"
                onClick={() => setShowResolveModal(false)}
              >
                ×
              </button>
            </div>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="resolve" />
              <div className="form-group">
                <label className="form-label">解决方案 *</label>
                <textarea
                  name="resolution"
                  className="form-control"
                  rows={4}
                  required
                  placeholder="请描述解决方案"
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowResolveModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-success">
                  确认解决
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">指派处理人</div>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="assign" />
              <div className="form-group">
                <label className="form-label">选择处理人 *</label>
                <select name="assigned_to_id" className="form-control" required>
                  <option value="">请选择处理人</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAssignModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认指派
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}
    </Layout>
  );
}
