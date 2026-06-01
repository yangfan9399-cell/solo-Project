import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import Layout from "~/components/Layout";
import { createException } from "~/services/exceptionService";
import { getAllUsers } from "~/services/userService";
import { getAllLoans } from "~/services/loanService";
import { EXCEPTION_TYPES } from "~/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const loanId = url.searchParams.get("loanId");
  const exhibitId = url.searchParams.get("exhibitId");
  const title = url.searchParams.get("title");
  const description = url.searchParams.get("description");
  const type = url.searchParams.get("type");
  const severity = url.searchParams.get("severity");

  const users = getAllUsers();
  const loans = getAllLoans();

  return json({
    users,
    loans,
    preselectedLoanId: loanId,
    preselectedExhibitId: exhibitId,
    prefilledTitle: title,
    prefilledDescription: description,
    preselectedType: type,
    preselectedSeverity: severity,
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

    const assignedToId = formData.get("assigned_to_id")
      ? Number(formData.get("assigned_to_id"))
      : null;
    const assignedTo = assignedToId
      ? (await getAllUsers()).find((u) => u.id === assignedToId)
      : null;

    createException({
      loan_id: formData.get("loan_id")
        ? Number(formData.get("loan_id"))
        : null,
      exhibit_id: formData.get("exhibit_id")
        ? Number(formData.get("exhibit_id"))
        : null,
      reporter_id: reporterId,
      reporter_name: reporter.name,
      type: String(formData.get("type")),
      title: String(formData.get("title")),
      description: String(formData.get("description")),
      severity: formData.get("severity") as "low" | "medium" | "high" | "critical",
      status: "open",
      assigned_to_id: assignedToId,
      assigned_to_name: assignedTo?.name || null,
      resolution: null,
    });

    return redirect("/exceptions");
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewException() {
  const {
    users,
    loans,
    preselectedLoanId,
    preselectedExhibitId,
    prefilledTitle,
    prefilledDescription,
    preselectedType,
    preselectedSeverity,
  } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="记录异常">
      <div className="page-header">
        <h1 className="page-title">记录异常</h1>
        <div className="page-actions">
          <Link to="/exceptions" className="btn btn-outline">
            ← 返回列表
          </Link>
        </div>
      </div>

      <div className="card">
        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        {(prefilledTitle || prefilledDescription) && (
          <div className="alert alert-info" style={{ marginBottom: "16px" }}>
            ℹ️ 已根据归还点交差异自动预填部分信息，请核对后提交
          </div>
        )}

        <Form method="post">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">异常类型 *</label>
              <select name="type" className="form-control" required defaultValue={preselectedType || ""}>
                <option value="">请选择类型</option>
                {EXCEPTION_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">严重程度 *</label>
              <select name="severity" className="form-control" required defaultValue={preselectedSeverity || "medium"}>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="critical">严重</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">异常标题 *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              required
              defaultValue={prefilledTitle || ""}
              placeholder="请简要描述异常"
            />
          </div>

          <div className="form-group">
            <label className="form-label">详细描述 *</label>
            <textarea
              name="description"
              className="form-control"
              rows={4}
              required
              defaultValue={prefilledDescription || ""}
              placeholder="请详细描述异常情况"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">关联借展申请</label>
              <select name="loan_id" className="form-control" defaultValue={preselectedLoanId || ""}>
                <option value="">无</option>
                {loans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.exhibit_name} - {loan.borrowing_institution}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">关联展品ID</label>
              <input
                type="number"
                name="exhibit_id"
                className="form-control"
                defaultValue={preselectedExhibitId || ""}
                placeholder="可选"
              />
            </div>
          </div>

          <div className="form-row">
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
            <div className="form-group">
              <label className="form-label">指派处理人</label>
              <select name="assigned_to_id" className="form-control">
                <option value="">暂不指派</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to="/exceptions" className="btn btn-outline">
              取消
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交异常"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
