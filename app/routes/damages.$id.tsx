import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation, useState } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getDamageById, updateDamageRecord } from "~/services/damageService";
import { getExhibitById } from "~/services/exhibitService";
import { getLoanById } from "~/services/loanService";
import { getAllUsers } from "~/services/userService";
import type { DamageRecord } from "~/types";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  const damage = getDamageById(id);

  if (!damage) {
    throw new Response("Not Found", { status: 404 });
  }

  const exhibit = getExhibitById(damage.exhibit_id);
  const loan = damage.loan_id ? getLoanById(damage.loan_id) : null;
  const users = getAllUsers();

  return json({ damage, exhibit, loan, users });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const id = Number(params.id);
  const formData = await request.formData();
  const intent = formData.get("intent");

  try {
    if (intent === "updateStatus") {
      const status = formData.get("status") as DamageRecord["status"];
      updateDamageRecord(id, {
        status,
      });
      return redirect(`/damages/${id}`);
    }

    if (intent === "updateRepair") {
      updateDamageRecord(id, {
        repair_plan: String(formData.get("repair_plan")) || null,
        estimated_cost: String(formData.get("estimated_cost")) || null,
        repair_status: String(formData.get("repair_status")) || null,
      });
      return redirect(`/damages/${id}`);
    }

    return json({ error: "未知操作" });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "操作失败" });
  }
}

export default function DamageDetail() {
  const { damage, exhibit, loan, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case "critical": return "严重";
      case "high": return "高";
      case "medium": return "中";
      default: return "低";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "reported": return "已报告";
      case "investigating": return "调查中";
      case "repairing": return "修复中";
      default: return "已解决";
    }
  };

  return (
    <Layout title="损伤详情">
      <div className="page-header">
        <h1 className="page-title">
          损伤记录详情
          <span
            className={`badge ml-2 ${
              damage.damage_severity === "critical"
                ? "badge-danger"
                : damage.damage_severity === "high"
                ? "badge-warning"
                : "badge-primary"
            }`}
          >
            {getSeverityLabel(damage.damage_severity)}
          </span>
        </h1>
        <div className="page-actions">
          <Link to="/damages" className="btn btn-outline">
            ← 返回列表
          </Link>
          <button
            className="btn btn-secondary"
            onClick={() => setShowStatusModal(true)}
          >
            变更状态
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowRepairModal(true)}
          >
            更新修复信息
          </button>
        </div>
      </div>

      {actionData?.error && (
        <div className="alert alert-danger">{actionData.error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="card-title">基本信息</h3>
          <div className="detail-row">
            <div className="detail-label">记录编号</div>
            <div className="detail-value">D-{String(damage.id).padStart(4, "0")}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">展品</div>
            <div className="detail-value">
              <Link
                to={`/exhibits/${exhibit?.id}`}
                style={{ color: "var(--accent-color)" }}
              >
                {exhibit?.name || "未知展品"}
              </Link>
            </div>
          </div>
          {loan && (
            <div className="detail-row">
              <div className="detail-label">关联借展</div>
              <div className="detail-value">
                <Link
                  to={`/loans/${loan.id}`}
                  style={{ color: "var(--accent-color)" }}
                >
                  {loan.exhibit_name} - {loan.borrowing_institution}
                </Link>
              </div>
            </div>
          )}
          <div className="detail-row">
            <div className="detail-label">损伤类型</div>
            <div className="detail-value">{damage.damage_type || "-"}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">损伤部位</div>
            <div className="detail-value">{damage.damage_location || "-"}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">发现日期</div>
            <div className="detail-value">{damage.discovery_date}</div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">状态信息</h3>
          <div className="detail-row">
            <div className="detail-label">当前状态</div>
            <div className="detail-value">
              <span
                className={`badge ${
                  damage.status === "resolved"
                    ? "badge-success"
                    : damage.status === "repairing"
                    ? "badge-warning"
                    : damage.status === "investigating"
                    ? "badge-info"
                    : "badge-danger"
                }`}
              >
                {getStatusLabel(damage.status)}
              </span>
            </div>
          </div>
          <div className="detail-row">
            <div className="detail-label">报告人</div>
            <div className="detail-value">{damage.reporter_name}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">创建时间</div>
            <div className="detail-value">{damage.created_at}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">更新时间</div>
            <div className="detail-value">{damage.updated_at}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">修复状态</div>
            <div className="detail-value">{damage.repair_status || "未开始"}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">预估费用</div>
            <div className="detail-value">{damage.estimated_cost || "-"}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">损伤描述</h3>
        <p style={{ lineHeight: 1.8 }}>{damage.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <h3 className="card-title">可能原因</h3>
          <p style={{ lineHeight: 1.8 }}>{damage.cause || "暂无记录"}</p>
        </div>
        <div className="card">
          <h3 className="card-title">已采取的紧急措施</h3>
          <p style={{ lineHeight: 1.8 }}>{damage.immediate_actions || "暂无记录"}</p>
        </div>
      </div>

      {damage.repair_plan && (
        <div className="card">
          <h3 className="card-title">修复方案</h3>
          <p style={{ lineHeight: 1.8 }}>{damage.repair_plan}</p>
        </div>
      )}

      {damage.remarks && (
        <div className="card">
          <h3 className="card-title">备注</h3>
          <p style={{ lineHeight: 1.8 }}>{damage.remarks}</p>
        </div>
      )}

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>变更状态</h3>
              <button
                className="modal-close"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            <Form method="post">
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">选择新状态</label>
                  <select name="status" className="form-control" defaultValue={damage.status}>
                    <option value="reported">已报告</option>
                    <option value="investigating">调查中</option>
                    <option value="repairing">修复中</option>
                    <option value="resolved">已解决</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowStatusModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="updateStatus"
                  className="btn btn-primary"
                  disabled={navigation.state === "submitting"}
                >
                  {navigation.state === "submitting" ? "提交中..." : "确认"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {showRepairModal && (
        <div className="modal-overlay" onClick={() => setShowRepairModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>更新修复信息</h3>
              <button
                className="modal-close"
                onClick={() => setShowRepairModal(false)}
              >
                ×
              </button>
            </div>
            <Form method="post">
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">修复方案</label>
                  <textarea
                    name="repair_plan"
                    className="form-control"
                    rows={3}
                    defaultValue={damage.repair_plan || ""}
                    placeholder="请描述修复方案"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">预估费用</label>
                  <input
                    type="text"
                    name="estimated_cost"
                    className="form-control"
                    defaultValue={damage.estimated_cost || ""}
                    placeholder="如：约5000元"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">修复状态</label>
                  <input
                    type="text"
                    name="repair_status"
                    className="form-control"
                    defaultValue={damage.repair_status || ""}
                    placeholder="如：修复中、已完成等"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowRepairModal(false)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="updateRepair"
                  className="btn btn-primary"
                  disabled={navigation.state === "submitting"}
                >
                  {navigation.state === "submitting" ? "提交中..." : "保存"}
                </button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </Layout>
  );
}
