import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getLoanById } from "~/services/loanService";
import { createReturnRecord } from "~/services/returnService";
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
    const handlerId = Number(formData.get("handler_id"));
    const handler = (await getAllUsers()).find((u) => u.id === handlerId);

    if (!handler) {
      throw new Error("处理人不存在");
    }

    createReturnRecord({
      loan_id: loanId,
      handler_id: handlerId,
      handler_name: handler.name,
      return_date: String(formData.get("return_date")),
      return_location: String(formData.get("return_location")),
      receiver_name: String(formData.get("receiver_name")),
      receiver_phone: String(formData.get("receiver_phone")),
      package_condition: formData.get("package_condition") as string | null,
      overall_condition: formData.get("overall_condition") as string | null,
      items_checked: formData.get("items_checked") as string | null,
      discrepancies: formData.get("discrepancies") as string | null,
      signatures: null,
      photos: null,
      remarks: formData.get("remarks") as string | null,
    });

    return redirect(`/loans/${loanId}`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewReturn() {
  const { loan, users } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="新增归还记录">
      <div className="page-header">
        <h1 className="page-title">归还点交记录</h1>
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">归还日期 *</label>
              <input
                type="datetime-local"
                name="return_date"
                className="form-control"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">处理人 *</label>
              <select name="handler_id" className="form-control" required>
                <option value="">请选择处理人</option>
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
              <label className="form-label">归还地点 *</label>
              <input
                type="text"
                name="return_location"
                className="form-control"
                required
                placeholder="如：本馆文物库房"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">接收人姓名 *</label>
              <input
                type="text"
                name="receiver_name"
                className="form-control"
                required
                placeholder="请输入接收人姓名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">接收人电话 *</label>
              <input
                type="tel"
                name="receiver_phone"
                className="form-control"
                required
                placeholder="请输入接收人电话"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">包装状况</label>
              <select name="package_condition" className="form-control">
                <option value="完好">完好</option>
                <option value="轻微破损">轻微破损</option>
                <option value="严重破损">严重破损</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">展品整体状况</label>
              <select name="overall_condition" className="form-control">
                <option value="完好">完好</option>
                <option value="良好">良好</option>
                <option value="有异常">有异常</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">核对项目</label>
            <textarea
              name="items_checked"
              className="form-control"
              rows={3}
              placeholder="请列出已核对的物品清单"
            />
          </div>

          <div className="form-group">
            <label className="form-label">差异说明</label>
            <textarea
              name="discrepancies"
              className="form-control"
              rows={3}
              placeholder="如有差异，请详细说明"
            />
          </div>

          <div className="form-group">
            <label className="form-label">备注</label>
            <textarea
              name="remarks"
              className="form-control"
              rows={2}
              placeholder="请填写其他备注信息"
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
