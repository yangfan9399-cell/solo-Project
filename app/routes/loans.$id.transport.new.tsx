import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getLoanById } from "~/services/loanService";
import { createTransportRecord } from "~/services/transportService";

export async function loader({ params }: LoaderFunctionArgs) {
  const loanId = Number(params.id);
  const loan = getLoanById(loanId);

  if (!loan) {
    throw new Response("借展申请不存在", { status: 404 });
  }

  return json({ loan });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const loanId = Number(params.id);
  const formData = await request.formData();

  try {
    createTransportRecord({
      loan_id: loanId,
      transport_type: String(formData.get("transport_type")),
      carrier: formData.get("carrier") as string | null,
      vehicle_number: formData.get("vehicle_number") as string | null,
      driver_name: formData.get("driver_name") as string | null,
      driver_phone: formData.get("driver_phone") as string | null,
      departure_location: formData.get("departure_location") as string | null,
      destination: formData.get("destination") as string | null,
      scheduled_departure: formData.get("scheduled_departure") as string | null,
      scheduled_arrival: formData.get("scheduled_arrival") as string | null,
      actual_departure: null,
      actual_arrival: null,
      escort_name: formData.get("escort_name") as string | null,
      escort_phone: formData.get("escort_phone") as string | null,
      security_measures: formData.get("security_measures") as string | null,
      status: "scheduled",
      remarks: formData.get("remarks") as string | null,
    });

    return redirect(`/loans/${loanId}`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewTransport() {
  const { loan } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="新增运输记录">
      <div className="page-header">
        <h1 className="page-title">运输交接记录</h1>
        <div className="page-actions">
          <Link to={`/loans/${loan.id}`} className="btn btn-outline">
            ← 返回详情
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="alert alert-info">
          <strong>展品：</strong>{loan.exhibit_name} | <strong>目的地：</strong>
          {loan.exhibition_location}
        </div>

        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        <Form method="post">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">运输方式 *</label>
              <select name="transport_type" className="form-control" required>
                <option value="">请选择运输方式</option>
                <option value="专业文物运输">专业文物运输</option>
                <option value="航空运输">航空运输</option>
                <option value="公路运输">公路运输</option>
                <option value="铁路运输">铁路运输</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">承运商</label>
              <input
                type="text"
                name="carrier"
                className="form-control"
                placeholder="请输入承运商名称"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">出发地</label>
              <input
                type="text"
                name="departure_location"
                className="form-control"
                placeholder="如：本馆文物库房"
              />
            </div>
            <div className="form-group">
              <label className="form-label">目的地</label>
              <input
                type="text"
                name="destination"
                className="form-control"
                placeholder={loan.exhibition_location}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">计划出发时间</label>
              <input
                type="datetime-local"
                name="scheduled_departure"
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label className="form-label">计划到达时间</label>
              <input
                type="datetime-local"
                name="scheduled_arrival"
                className="form-control"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">车辆牌号</label>
              <input
                type="text"
                name="vehicle_number"
                className="form-control"
                placeholder="如：京A·88888"
              />
            </div>
            <div className="form-group">
              <label className="form-label">驾驶员姓名</label>
              <input
                type="text"
                name="driver_name"
                className="form-control"
                placeholder="请输入驾驶员姓名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">驾驶员电话</label>
              <input
                type="tel"
                name="driver_phone"
                className="form-control"
                placeholder="请输入驾驶员电话"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">押运人员</label>
              <input
                type="text"
                name="escort_name"
                className="form-control"
                placeholder="请输入押运人员姓名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">押运电话</label>
              <input
                type="tel"
                name="escort_phone"
                className="form-control"
                placeholder="请输入押运人员电话"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">安保措施</label>
            <textarea
              name="security_measures"
              className="form-control"
              rows={2}
              placeholder="请描述运输过程中的安保措施"
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
