import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getLoanById } from "~/services/loanService";
import { createInspectionRecord } from "~/services/inspectionService";
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
    const inspectorId = Number(formData.get("inspector_id"));
    const inspector = (await getAllUsers()).find((u) => u.id === inspectorId);

    if (!inspector) {
      throw new Error("巡检人不存在");
    }

    createInspectionRecord({
      loan_id: loanId,
      inspector_id: inspectorId,
      inspector_name: inspector.name,
      inspection_date: String(formData.get("inspection_date")),
      temperature: formData.get("temperature") as string | null,
      humidity: formData.get("humidity") as string | null,
      condition_status: formData.get("condition_status") as string | null,
      display_check: formData.get("display_check") as string | null,
      security_check: formData.get("security_check") as string | null,
      environment_check: formData.get("environment_check") as string | null,
      findings: formData.get("findings") as string | null,
      recommendations: formData.get("recommendations") as string | null,
      photos: null,
    });

    return redirect(`/loans/${loanId}`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewInspection() {
  const { loan, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="新增巡检记录">
      <div className="page-header">
        <h1 className="page-title">展期巡检记录</h1>
        <div className="page-actions">
          <Link to={`/loans/${loan.id}`} className="btn btn-outline">
            ← 返回详情
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="alert alert-info">
          <strong>展品：</strong>{loan.exhibit_name} | <strong>展览地点：</strong>
          {loan.exhibition_location}
        </div>

        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        <Form method="post">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">巡检日期 *</label>
              <input
                type="datetime-local"
                name="inspection_date"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">巡检人 *</label>
              <select name="inspector_id" className="form-control" required>
                <option value="">请选择巡检人</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">展厅温度</label>
              <input
                type="text"
                name="temperature"
                className="form-control"
                placeholder="如：20℃"
              />
            </div>
            <div className="form-group">
              <label className="form-label">展厅湿度</label>
              <input
                type="text"
                name="humidity"
                className="form-control"
                placeholder="如：50% RH"
              />
            </div>
            <div className="form-group">
              <label className="form-label">展品状态</label>
              <select name="condition_status" className="form-control">
                <option value="完好">完好</option>
                <option value="良好">良好</option>
                <option value="异常">异常</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">展陈检查</label>
            <textarea
              name="display_check"
              className="form-control"
              rows={2}
              placeholder="检查展柜、标签、说明牌等是否正常"
            />
          </div>

          <div className="form-group">
            <label className="form-label">安保检查</label>
            <textarea
              name="security_check"
              className="form-control"
              rows={2}
              placeholder="检查监控、报警系统、安保人员等"
            />
          </div>

          <div className="form-group">
            <label className="form-label">环境检查</label>
            <textarea
              name="environment_check"
              className="form-control"
              rows={2}
              placeholder="检查温湿度、光照、通风等环境条件"
            />
          </div>

          <div className="form-group">
            <label className="form-label">检查发现</label>
            <textarea
              name="findings"
              className="form-control"
              rows={3}
              placeholder="请详细记录本次巡检发现的问题"
            />
          </div>

          <div className="form-group">
            <label className="form-label">处理建议</label>
            <textarea
              name="recommendations"
              className="form-control"
              rows={2}
              placeholder="请提出改进措施或处理建议"
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to={`/loans/${loan.id}`} className="btn btn-outline">
              取消
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "提交中..." : "保存记录"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
