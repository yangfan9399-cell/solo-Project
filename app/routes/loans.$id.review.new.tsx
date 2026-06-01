import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getLoanById } from "~/services/loanService";
import { createConservationReview } from "~/services/conservationService";
import { getAllUsers } from "~/services/userService";

export async function loader({ params }: LoaderFunctionArgs) {
  const loanId = Number(params.id);
  const loan = getLoanById(loanId);
  const users = getAllUsers();

  if (!loan) {
    throw new Response("借展申请不存在", { status: 404 });
  }

  return json({ loan, users });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const loanId = Number(params.id);
  const formData = await request.formData();

  try {
    const reviewerId = Number(formData.get("reviewer_id"));
    const reviewer = (await getAllUsers()).find((u) => u.id === reviewerId);

    if (!reviewer) {
      throw new Error("审核人不存在");
    }

    createConservationReview({
      loan_id: loanId,
      reviewer_id: reviewerId,
      reviewer_name: reviewer.name,
      temperature_requirement: formData.get("temperature_requirement") as string | null,
      humidity_requirement: formData.get("humidity_requirement") as string | null,
      light_requirement: formData.get("light_requirement") as string | null,
      packaging_requirement: formData.get("packaging_requirement") as string | null,
      special_requirements: formData.get("special_requirements") as string | null,
      condition_assessment: formData.get("condition_assessment") as string | null,
      risks: formData.get("risks") as string | null,
      recommendations: formData.get("recommendations") as string | null,
      approved: formData.get("approved") === "1",
      review_date: new Date().toISOString(),
      remarks: formData.get("remarks") as string | null,
    });

    return redirect(`/loans/${loanId}`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewReview() {
  const { loan, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="新增文保审核">
      <div className="page-header">
        <h1 className="page-title">文保条件审核</h1>
        <div className="page-actions">
          <Link to={`/loans/${loan.id}`} className="btn btn-outline">
            ← 返回详情
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="alert alert-info">
          <strong>展品：</strong>{loan.exhibit_name} | <strong>借入机构：</strong>
          {loan.borrowing_institution}
        </div>

        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        <Form method="post">
          <div className="form-group">
            <label className="form-label">审核人 *</label>
            <select name="reviewer_id" className="form-control" required>
              <option value="">请选择审核人</option>
              {users
                .filter((u) => u.role === "文保专家")
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="form-row-4">
            <div className="form-group">
              <label className="form-label">温度要求</label>
              <input
                type="text"
                name="temperature_requirement"
                className="form-control"
                placeholder="如：18-22℃"
              />
            </div>
            <div className="form-group">
              <label className="form-label">湿度要求</label>
              <input
                type="text"
                name="humidity_requirement"
                className="form-control"
                placeholder="如：45-55% RH"
              />
            </div>
            <div className="form-group">
              <label className="form-label">光照要求</label>
              <input
                type="text"
                name="light_requirement"
                className="form-control"
                placeholder="如：≤150 lux"
              />
            </div>
            <div className="form-group">
              <label className="form-label">包装要求</label>
              <input
                type="text"
                name="packaging_requirement"
                className="form-control"
                placeholder="如：定制锦盒"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">特殊要求</label>
            <textarea
              name="special_requirements"
              className="form-control"
              rows={2}
              placeholder="请填写其他特殊要求"
            />
          </div>

          <div className="form-group">
            <label className="form-label">展品状况评估</label>
            <textarea
              name="condition_assessment"
              className="form-control"
              rows={3}
              placeholder="请详细描述展品当前状况"
            />
          </div>

          <div className="form-group">
            <label className="form-label">风险评估</label>
            <textarea
              name="risks"
              className="form-control"
              rows={2}
              placeholder="请评估借展过程中的潜在风险"
            />
          </div>

          <div className="form-group">
            <label className="form-label">建议措施</label>
            <textarea
              name="recommendations"
              className="form-control"
              rows={2}
              placeholder="请提供风险防控建议"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">审核结论 *</label>
              <select name="approved" className="form-control" required>
                <option value="1">通过</option>
                <option value="0">不通过</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">备注</label>
              <input
                type="text"
                name="remarks"
                className="form-control"
                placeholder="请填写审核备注"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to={`/loans/${loan.id}`} className="btn btn-outline">
              取消
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "提交审核"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
