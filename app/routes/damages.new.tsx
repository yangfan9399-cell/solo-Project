import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import Layout from "~/components/Layout";
import { createDamageRecord } from "~/services/damageService";
import { getAllUsers } from "~/services/userService";
import { getAllExhibits } from "~/services/exhibitService";
import { getAllLoans } from "~/services/loanService";
import { DAMAGE_TYPES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const loanId = url.searchParams.get("loanId");
  const exhibitId = url.searchParams.get("exhibitId");
  const description = url.searchParams.get("description");

  const users = getAllUsers();
  const exhibits = getAllExhibits();
  const loans = getAllLoans();

  return json({
    users,
    exhibits,
    loans,
    preselectedLoanId: loanId,
    preselectedExhibitId: exhibitId,
    prefilledDescription: description,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    const reporterId = Number(formData.get("reporter_id"));
    const reporter = (await getAllUsers()).find((u) => u.id === reporterId);

    if (!reporter) {
      throw new Error("报告人不存在");
    }

    createDamageRecord({
      exhibit_id: Number(formData.get("exhibit_id")),
      loan_id: formData.get("loan_id") ? Number(formData.get("loan_id")) : null,
      reporter_id: reporterId,
      reporter_name: reporter.name,
      discovery_date: String(formData.get("discovery_date")),
      damage_location: String(formData.get("damage_location")) || null,
      damage_type: String(formData.get("damage_type")) || null,
      damage_severity: formData.get("damage_severity") as "low" | "medium" | "high" | "critical",
      description: String(formData.get("description")),
      cause: String(formData.get("cause")) || null,
      immediate_actions: String(formData.get("immediate_actions")) || null,
      photos: String(formData.get("photos")) || null,
      status: "reported",
      repair_plan: String(formData.get("repair_plan")) || null,
      estimated_cost: String(formData.get("estimated_cost")) || null,
      repair_status: null,
      remarks: String(formData.get("remarks")) || null,
    });

    return redirect("/damages");
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewDamage() {
  const { users, exhibits, loans, preselectedLoanId, preselectedExhibitId, prefilledDescription } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="记录损伤">
      <div className="page-header">
        <h1 className="page-title">记录损伤</h1>
        <div className="page-actions">
          <Link to="/damages" className="btn btn-outline">
            ← 返回列表
          </Link>
        </div>
      </div>

      <div className="card">
        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        {prefilledDescription && (
          <div className="alert alert-info" style={{ marginBottom: "16px" }}>
            ℹ️ 已根据归还点交差异自动预填损伤描述，请核对后补充完整信息
          </div>
        )}

        <Form method="post">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">展品 *</label>
              <select name="exhibit_id" className="form-control" required defaultValue={preselectedExhibitId || ""}>
                <option value="">请选择展品</option>
                {exhibits.map((exhibit) => (
                  <option key={exhibit.id} value={exhibit.id}>
                    {exhibit.name} ({exhibit.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">关联借展</label>
              <select name="loan_id" className="form-control" defaultValue={preselectedLoanId || ""}>
                <option value="">无</option>
                {loans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.exhibit_name} - {loan.borrowing_institution}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">发现日期 *</label>
              <input
                type="date"
                name="discovery_date"
                className="form-control"
                required
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="form-group">
              <label className="form-label">报告人 *</label>
              <select name="reporter_id" className="form-control" required>
                <option value="">请选择报告人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">损伤类型</label>
              <select name="damage_type" className="form-control">
                <option value="">请选择类型</option>
                {DAMAGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">损伤部位</label>
              <input
                type="text"
                name="damage_location"
                className="form-control"
                placeholder="如：器身左侧、底部边缘等"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">严重程度 *</label>
              <select name="damage_severity" className="form-control" required>
                <option value="low">低 - 轻微磨损，不影响展示</option>
                <option value="medium">中 - 有可见损伤，需关注</option>
                <option value="high">高 - 损伤明显，需修复</option>
                <option value="critical">严重 - 结构损坏，紧急处理</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">损伤描述 *</label>
            <textarea
              name="description"
              className="form-control"
              rows={3}
              required
              defaultValue={prefilledDescription || ""}
              placeholder="请详细描述损伤情况"
            />
          </div>

          <div className="form-group">
            <label className="form-label">可能原因</label>
            <textarea
              name="cause"
              className="form-control"
              rows={2}
              placeholder="推测造成损伤的原因"
            />
          </div>

          <div className="form-group">
            <label className="form-label">已采取的紧急措施</label>
            <textarea
              name="immediate_actions"
              className="form-control"
              rows={2}
              placeholder="发现后已采取的保护措施"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">修复方案建议</label>
              <textarea
                name="repair_plan"
                className="form-control"
                rows={2}
                placeholder="建议的修复方案"
              />
            </div>
            <div className="form-group">
              <label className="form-label">预估费用</label>
              <input
                type="text"
                name="estimated_cost"
                className="form-control"
                placeholder="如：约5000元"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">照片（URL）</label>
            <input
              type="text"
              name="photos"
              className="form-control"
              placeholder="照片链接，多个用逗号分隔"
            />
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              name="remarks"
              className="form-control"
              rows={2}
              placeholder="其他需要说明的信息"
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to="/damages" className="btn btn-outline">
              取消
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交记录"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
