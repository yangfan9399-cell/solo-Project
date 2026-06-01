import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useFetcher } from "@remix-run/react";
import { useState } from "react";
import Layout from "~/components/Layout";
import { getLoanById, transitionLoanStage, getStageTransitions, approveLoan, rejectLoan } from "~/services/loanService";
import { getReviewsByLoanId } from "~/services/conservationService";
import { getTransportsByLoanId } from "~/services/transportService";
import { getInspectionsByLoanId } from "~/services/inspectionService";
import { getReturnsByLoanId } from "~/services/returnService";
import { getExceptionsByLoanId } from "~/services/exceptionService";
import { getDamagesByLoanId } from "~/services/damageService";
import { getAllUsers } from "~/services/userService";
import { STAGES } from "~/types";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  const loan = getLoanById(id);

  if (!loan) {
    throw new Response("借展申请不存在", { status: 404 });
  }

  const reviews = getReviewsByLoanId(id);
  const transports = getTransportsByLoanId(id);
  const inspections = getInspectionsByLoanId(id);
  const returns = getReturnsByLoanId(id);
  const exceptions = getExceptionsByLoanId(id);
  const damages = getDamagesByLoanId(id);
  const transitions = getStageTransitions(id);
  const users = getAllUsers();

  return json({ loan, reviews, transports, inspections, returns, exceptions, damages, transitions, users });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const id = Number(params.id);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "approve") {
    approveLoan(id);
    transitionLoanStage(id, "application", "review", 1, "系统", "申请已批准，进入文保审核阶段");
  } else if (intent === "reject") {
    rejectLoan(id);
  } else if (intent === "transition") {
    const fromStage = String(formData.get("from_stage"));
    const toStage = String(formData.get("to_stage"));
    const operatorId = Number(formData.get("operator_id"));
    const operatorName = String(formData.get("operator_name"));
    const remarks = formData.get("remarks") as string | null;
    transitionLoanStage(id, fromStage, toStage, operatorId, operatorName, remarks);
  }

  return redirect(`/loans/${id}`);
}

export default function LoanDetail() {
  const { loan, reviews, transports, inspections, returns, exceptions, damages, transitions, users } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [activeTab, setActiveTab] = useState("info");
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [expandedInspection, setExpandedInspection] = useState<number | null>(null);

  const currentStageIndex = STAGES.findIndex((s) => s.key === loan.current_stage);
  const nextStage = STAGES[currentStageIndex + 1];

  return (
    <Layout title="借展详情">
      <div className="page-header">
        <h1 className="page-title">{loan.exhibit_name}</h1>
        <div className="page-actions">
          <Link to="/loans" className="btn btn-outline">
            ← 返回列表
          </Link>
          {loan.status === "pending" && (
            <>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="approve" />
                <button type="submit" className="btn btn-success">
                  ✓ 批准申请
                </button>
              </fetcher.Form>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="reject" />
                <button type="submit" className="btn btn-danger">
                  ✗ 拒绝申请
                </button>
              </fetcher.Form>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <span className="badge badge-info">
              L-{String(loan.id).padStart(4, "0")}
            </span>
            <span style={{ marginLeft: "8px" }}>
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
            </span>
          </div>
          {loan.status === "approved" && nextStage && (
            <button
              className="btn btn-primary"
              onClick={() => setShowTransitionModal(true)}
            >
              推进到下一阶段: {nextStage.label}
            </button>
          )}
        </div>

        <div className="progress-bar">
          {STAGES.map((stage, index) => (
            <div
              key={stage.key}
              className={`progress-step ${
                index < currentStageIndex
                  ? "completed"
                  : index === currentStageIndex
                  ? "active"
                  : ""
              }`}
            >
              <div className="progress-step-icon">{stage.icon}</div>
              <div className="progress-step-label">{stage.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "info" ? "active" : ""}`}
          onClick={() => setActiveTab("info")}
        >
          基本信息
        </button>
        <button
          className={`tab ${activeTab === "review" ? "active" : ""}`}
          onClick={() => setActiveTab("review")}
        >
          文保审核 ({reviews.length})
        </button>
        <button
          className={`tab ${activeTab === "transport" ? "active" : ""}`}
          onClick={() => setActiveTab("transport")}
        >
          运输交接 ({transports.length})
        </button>
        <button
          className={`tab ${activeTab === "inspection" ? "active" : ""}`}
          onClick={() => setActiveTab("inspection")}
        >
          展期巡检 ({inspections.length})
        </button>
        <button
          className={`tab ${activeTab === "return" ? "active" : ""}`}
          onClick={() => setActiveTab("return")}
        >
          归还点交 ({returns.length})
        </button>
        <button
          className={`tab ${activeTab === "exceptions" ? "active" : ""}`}
          onClick={() => setActiveTab("exceptions")}
        >
          异常记录 ({exceptions.length})
        </button>
        <button
          className={`tab ${activeTab === "timeline" ? "active" : ""}`}
          onClick={() => setActiveTab("timeline")}
        >
          进度追踪
        </button>
      </div>

      {activeTab === "info" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">基本信息</div>
          </div>
          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">展品名称</div>
              <div className="detail-value">{loan.exhibit_name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">申请人</div>
              <div className="detail-value">{loan.applicant_name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">借入机构</div>
              <div className="detail-value">{loan.borrowing_institution}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">展览名称</div>
              <div className="detail-value">{loan.exhibition_name}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">展览地点</div>
              <div className="detail-value">{loan.exhibition_location}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">联系人</div>
              <div className="detail-value">{loan.contact_person}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">联系电话</div>
              <div className="detail-value">{loan.contact_phone}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">电子邮箱</div>
              <div className="detail-value">{loan.contact_email}</div>
            </div>
            <div className="detail-item">
              <div className="detail-label">借展时间</div>
              <div className="detail-value">
                {loan.start_date} ~ {loan.end_date}
              </div>
            </div>
            <div className="detail-item">
              <div className="detail-label">优先级</div>
              <div className="detail-value">
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
              </div>
            </div>
          </div>
          <div className="detail-item">
            <div className="detail-label">借展目的</div>
            <p>{loan.purpose || "暂无描述"}</p>
          </div>
        </div>
      )}

      {activeTab === "review" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">文保审核记录</div>
            <Link
              to={`/loans/${loan.id}/review/new`}
              className="btn btn-sm btn-primary"
            >
              ➕ 新增审核
            </Link>
          </div>
          {reviews.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">暂无审核记录</div>
            </div>
          ) : (
            <div>
              {reviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    padding: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <strong>审核人: {review.reviewer_name}</strong>
                    <span
                      className={`badge ${
                        review.approved ? "badge-success" : "badge-danger"
                      }`}
                    >
                      {review.approved ? "通过" : "不通过"}
                    </span>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">温度要求</div>
                      <div className="detail-value">{review.temperature_requirement || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">湿度要求</div>
                      <div className="detail-value">{review.humidity_requirement || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">光照要求</div>
                      <div className="detail-value">{review.light_requirement || "-"}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">包装要求</div>
                      <div className="detail-value">{review.packaging_requirement || "-"}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">状况评估</div>
                    <p>{review.condition_assessment || "-"}</p>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">风险评估</div>
                    <p>{review.risks || "-"}</p>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">建议</div>
                    <p>{review.recommendations || "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "transport" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">运输交接记录</div>
            <Link
              to={`/loans/${loan.id}/transport/new`}
              className="btn btn-sm btn-primary"
            >
              ➕ 新增运输
            </Link>
          </div>
          {transports.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-icon">🚚</div>
              <div className="empty-state-title">暂无运输记录</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>运输方式</th>
                    <th>承运商</th>
                    <th>出发地</th>
                    <th>目的地</th>
                    <th>计划出发</th>
                    <th>实际出发</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {transports.map((transport) => (
                    <tr key={transport.id}>
                      <td>{transport.transport_type}</td>
                      <td>{transport.carrier || "-"}</td>
                      <td>{transport.departure_location || "-"}</td>
                      <td>{transport.destination || "-"}</td>
                      <td>{transport.scheduled_departure?.slice(0, 10) || "-"}</td>
                      <td>{transport.actual_departure?.slice(0, 10) || "-"}</td>
                      <td>
                        <span
                          className={`badge ${
                            transport.status === "completed"
                              ? "badge-success"
                              : transport.status === "in_transit"
                              ? "badge-warning"
                              : transport.status === "delayed"
                              ? "badge-danger"
                              : "badge-primary"
                          }`}
                        >
                          {transport.status === "scheduled"
                            ? "已计划"
                            : transport.status === "in_transit"
                            ? "运输中"
                            : transport.status === "completed"
                            ? "已完成"
                            : "已延误"}
                        </span>
                      </td>
                      <td>
                        <span className="btn btn-sm btn-secondary" style={{ opacity: 0.6, cursor: "default" }}>
                          详情见下方
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: "16px" }}>
                {transports.map((transport) => (
                  <div
                    key={transport.id}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <strong>{transport.transport_type} - {transport.carrier || "未指定承运商"}</strong>
                      <span
                        className={`badge ${
                          transport.status === "completed"
                            ? "badge-success"
                            : transport.status === "in_transit"
                            ? "badge-warning"
                            : transport.status === "delayed"
                            ? "badge-danger"
                            : "badge-primary"
                        }`}
                      >
                        {transport.status === "scheduled"
                          ? "已计划"
                          : transport.status === "in_transit"
                          ? "运输中"
                          : transport.status === "completed"
                          ? "已完成"
                          : "已延误"}
                      </span>
                    </div>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <div className="detail-label">车辆编号</div>
                        <div className="detail-value">{transport.vehicle_number || "-"}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">司机</div>
                        <div className="detail-value">{transport.driver_name || "-"} {transport.driver_phone || ""}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">出发地</div>
                        <div className="detail-value">{transport.departure_location || "-"}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">目的地</div>
                        <div className="detail-value">{transport.destination || "-"}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">计划时间</div>
                        <div className="detail-value">{transport.scheduled_departure?.slice(0, 16) || "-"} ~ {transport.scheduled_arrival?.slice(0, 16) || "-"}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">实际时间</div>
                        <div className="detail-value">{transport.actual_departure?.slice(0, 16) || "-"} ~ {transport.actual_arrival?.slice(0, 16) || "-"}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">押运人</div>
                        <div className="detail-value">{transport.escort_name || "-"} {transport.escort_phone || ""}</div>
                      </div>
                    </div>
                    {transport.security_measures && (
                      <div className="detail-item" style={{ marginTop: "8px" }}>
                        <div className="detail-label">安保措施</div>
                        <p>{transport.security_measures}</p>
                      </div>
                    )}
                    {transport.remarks && (
                      <div className="detail-item" style={{ marginTop: "4px" }}>
                        <div className="detail-label">备注</div>
                        <p>{transport.remarks}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "inspection" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">展期巡检记录</div>
            <Link
              to={`/loans/${loan.id}/inspection/new`}
              className="btn btn-sm btn-primary"
            >
              ➕ 新增巡检
            </Link>
          </div>
          {inspections.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-icon">🖼️</div>
              <div className="empty-state-title">暂无巡检记录</div>
            </div>
          ) : (
            <div>
              {inspections.map((inspection) => {
                const isExpanded = expandedInspection === inspection.id;
                const hasAbnormality = inspection.condition_status && inspection.condition_status !== "完好";

                return (
                  <div
                    key={inspection.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        background: hasAbnormality ? "#fff8f0" : "#fafafa",
                        cursor: "pointer",
                      }}
                      onClick={() => setExpandedInspection(isExpanded ? null : inspection.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          className={`badge ${
                            inspection.condition_status === "完好"
                              ? "badge-success"
                              : "badge-warning"
                          }`}
                        >
                          {inspection.condition_status || "未知"}
                        </span>
                        <strong>{inspection.inspection_date.slice(0, 10)}</strong>
                        <span style={{ color: "var(--text-secondary)" }}>
                          巡检人: {inspection.inspector_name}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {inspection.temperature || "-"} / {inspection.humidity || "-"}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {isExpanded ? "▲ 收起" : "▼ 展开"}
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: "16px", borderTop: "1px solid var(--border)" }}>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <div className="detail-label">环境检查</div>
                            <div className="detail-value">{inspection.environment_check || "无异常"}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">展陈检查</div>
                            <div className="detail-value">{inspection.display_check || "无异常"}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">安保检查</div>
                            <div className="detail-value">{inspection.security_check || "无异常"}</div>
                          </div>
                          <div className="detail-item">
                            <div className="detail-label">展品状态</div>
                            <div className="detail-value">
                              <span
                                className={`badge ${
                                  inspection.condition_status === "完好"
                                    ? "badge-success"
                                    : "badge-warning"
                                }`}
                              >
                                {inspection.condition_status || "未知"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {inspection.findings && (
                          <div className="detail-item" style={{ marginTop: "12px" }}>
                            <div className="detail-label">发现问题</div>
                            <p style={{
                              padding: "8px 12px",
                              background: inspection.condition_status === "完好" ? "#f9f9f9" : "#fff3e0",
                              borderRadius: "6px",
                              borderLeft: inspection.condition_status === "完好" ? "3px solid var(--border)" : "3px solid var(--warning-color)",
                            }}>
                              {inspection.findings}
                            </p>
                          </div>
                        )}

                        {inspection.recommendations && (
                          <div className="detail-item" style={{ marginTop: "8px" }}>
                            <div className="detail-label">建议</div>
                            <p style={{
                              padding: "8px 12px",
                              background: "#f0f7ff",
                              borderRadius: "6px",
                              borderLeft: "3px solid var(--accent-color)",
                            }}>
                              {inspection.recommendations}
                            </p>
                          </div>
                        )}

                        {hasAbnormality && (
                          <div style={{
                            marginTop: "16px",
                            padding: "12px",
                            background: "#fff8f0",
                            borderRadius: "8px",
                            border: "1px dashed var(--warning-color)",
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}>
                            <span style={{ fontWeight: 500, color: "var(--warning-color)" }}>
                              ⚠️ 本次巡检发现异常，可快速操作：
                            </span>
                            <Link
                              to={`/exceptions/new?loanId=${loan.id}&exhibitId=${loan.exhibit_id}`}
                              className="btn btn-sm btn-warning"
                            >
                              📋 记录异常
                            </Link>
                            <Link
                              to={`/damages/new?loanId=${loan.id}&exhibitId=${loan.exhibit_id}`}
                              className="btn btn-sm btn-danger"
                            >
                              🔧 记录损伤
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "return" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">归还点交记录</div>
            <Link
              to={`/loans/${loan.id}/return/new`}
              className="btn btn-sm btn-primary"
            >
              ➕ 新增归还
            </Link>
          </div>
          {returns.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">暂无归还记录</div>
            </div>
          ) : (
            <div>
              {returns.map((ret) => (
                <div
                  key={ret.id}
                  style={{
                    padding: "16px",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <strong>归还日期: {ret.return_date.slice(0, 10)}</strong>
                    <span className="badge badge-success">已归还</span>
                  </div>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <div className="detail-label">处理人</div>
                      <div className="detail-value">{ret.handler_name}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">归还地点</div>
                      <div className="detail-value">{ret.return_location}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">接收人</div>
                      <div className="detail-value">{ret.receiver_name}</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-label">包装状况</div>
                      <div className="detail-value">{ret.package_condition || "-"}</div>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">整体状况</div>
                    <div className="detail-value">{ret.overall_condition || "-"}</div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-label">核对项目</div>
                    <div className="detail-value">{ret.items_checked || "-"}</div>
                  </div>
                  {ret.discrepancies && (
                    <div className="detail-item">
                      <div className="detail-label">差异说明</div>
                      <p style={{ color: "var(--danger-color)" }}>{ret.discrepancies}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "exceptions" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">异常记录</div>
            <Link
              to={`/exceptions/new?loanId=${loan.id}`}
              className="btn btn-sm btn-primary"
            >
              ➕ 记录异常
            </Link>
          </div>
          {exceptions.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px" }}>
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-title">暂无异常记录</div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>异常类型</th>
                    <th>标题</th>
                    <th>严重程度</th>
                    <th>状态</th>
                    <th>报告人</th>
                    <th>报告时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {exceptions.map((exception) => (
                    <tr key={exception.id}>
                      <td>{exception.type}</td>
                      <td>{exception.title}</td>
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
                      <td>{exception.created_at.slice(0, 10)}</td>
                      <td>
                        <Link to={`/exceptions/${exception.id}`} className="btn btn-sm btn-secondary">
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
      )}

      {activeTab === "timeline" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">进度追踪</div>
          </div>
          <div className="timeline">
            {transitions.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px" }}>
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">暂无进度记录</div>
              </div>
            ) : (
              transitions.map((transition) => (
                <div key={transition.id} className="timeline-item">
                  <div className="timeline-date">{transition.created_at}</div>
                  <div className="timeline-title">
                    {
                      STAGES.find((s) => s.key === transition.from_stage)
                        ?.label
                    }{" "}
                    →{" "}
                    {
                      STAGES.find((s) => s.key === transition.to_stage)
                        ?.label
                    }
                  </div>
                  <div className="timeline-desc">
                    操作人: {transition.operator_name}
                    {transition.remarks && ` | 备注: ${transition.remarks}`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showTransitionModal && nextStage && (
        <div className="modal-overlay" onClick={() => setShowTransitionModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">推进到下一阶段</div>
              <button
                className="modal-close"
                onClick={() => setShowTransitionModal(false)}
              >
                ×
              </button>
            </div>
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="transition" />
              <input type="hidden" name="from_stage" value={loan.current_stage} />
              <input type="hidden" name="to_stage" value={nextStage.key} />
              <input type="hidden" name="operator_id" value="1" />
              <input type="hidden" name="operator_name" value="张明" />

              <div className="form-group">
                <label className="form-label">
                  确认将此申请从 "
                  {STAGES.find((s) => s.key === loan.current_stage)?.label}" 推进到 "
                  {nextStage.label}" 阶段吗？
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">备注</label>
                <textarea
                  name="remarks"
                  className="form-control"
                  rows={3}
                  placeholder="可输入阶段推进的备注信息"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowTransitionModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  确认推进
                </button>
              </div>
            </fetcher.Form>
          </div>
        </div>
      )}
    </Layout>
  );
}
