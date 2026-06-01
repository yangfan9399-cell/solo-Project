import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getAvailableExhibits } from "~/services/exhibitService";
import { createLoanApplication } from "~/services/loanService";
import { getAllUsers } from "~/services/userService";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const exhibitId = url.searchParams.get("exhibitId");

  const exhibits = getAvailableExhibits();
  const users = getAllUsers();

  return json({ exhibits, users, selectedExhibitId: exhibitId });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    const exhibitId = Number(formData.get("exhibit_id"));
    const exhibit = (await getAvailableExhibits()).find((e) => e.id === exhibitId);
    const applicantId = Number(formData.get("applicant_id"));
    const applicant = (await getAllUsers()).find((u) => u.id === applicantId);

    if (!exhibit || !applicant) {
      throw new Error("展品或申请人不存在");
    }

    const id = createLoanApplication({
      exhibit_id: exhibitId,
      exhibit_name: exhibit.name,
      applicant_id: applicantId,
      applicant_name: applicant.name,
      borrowing_institution: String(formData.get("borrowing_institution")),
      contact_person: String(formData.get("contact_person")),
      contact_phone: String(formData.get("contact_phone")),
      contact_email: String(formData.get("contact_email")),
      exhibition_name: String(formData.get("exhibition_name")),
      exhibition_location: String(formData.get("exhibition_location")),
      purpose: formData.get("purpose") as string | null,
      start_date: String(formData.get("start_date")),
      end_date: String(formData.get("end_date")),
      priority: formData.get("priority") as "low" | "normal" | "high",
    });

    return redirect(`/loans/${id}`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewLoan() {
  const { exhibits, users, selectedExhibitId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="新建借展申请">
      <div className="page-header">
        <h1 className="page-title">新建借展申请</h1>
        <div className="page-actions">
          <Link to="/loans" className="btn btn-outline">
            ← 返回列表
          </Link>
        </div>
      </div>

      <div className="card">
        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        {exhibits.length === 0 ? (
          <div className="alert alert-warning">
            当前没有可借展的展品，请先在展品档案中添加展品。
          </div>
        ) : (
          <Form method="post">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">选择展品 *</label>
                <select
                  name="exhibit_id"
                  className="form-control"
                  required
                  defaultValue={selectedExhibitId || ""}
                >
                  <option value="">请选择展品</option>
                  {exhibits.map((exhibit) => (
                    <option key={exhibit.id} value={exhibit.id}>
                      {exhibit.name} ({exhibit.code}) - {exhibit.category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">申请人 *</label>
                <select name="applicant_id" className="form-control" required>
                  <option value="">请选择申请人</option>
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
                <label className="form-label">借入机构 *</label>
                <input
                  type="text"
                  name="borrowing_institution"
                  className="form-control"
                  required
                  placeholder="如：国家博物馆"
                />
              </div>
              <div className="form-group">
                <label className="form-label">展览名称 *</label>
                <input
                  type="text"
                  name="exhibition_name"
                  className="form-control"
                  required
                  placeholder="请输入展览名称"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">展览地点 *</label>
              <input
                type="text"
                name="exhibition_location"
                className="form-control"
                required
                placeholder="请输入展览地点"
              />
            </div>

            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">联系人 *</label>
                <input
                  type="text"
                  name="contact_person"
                  className="form-control"
                  required
                  placeholder="请输入联系人姓名"
                />
              </div>
              <div className="form-group">
                <label className="form-label">联系电话 *</label>
                <input
                  type="tel"
                  name="contact_phone"
                  className="form-control"
                  required
                  placeholder="请输入联系电话"
                />
              </div>
              <div className="form-group">
                <label className="form-label">电子邮箱 *</label>
                <input
                  type="email"
                  name="contact_email"
                  className="form-control"
                  required
                  placeholder="请输入电子邮箱"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">借展开始日期 *</label>
                <input
                  type="date"
                  name="start_date"
                  className="form-control"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">借展结束日期 *</label>
                <input
                  type="date"
                  name="end_date"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">优先级</label>
              <select name="priority" className="form-control" defaultValue="normal">
                <option value="low">低</option>
                <option value="normal">中</option>
                <option value="high">高</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">借展目的</label>
              <textarea
                name="purpose"
                className="form-control"
                rows={3}
                placeholder="请描述借展目的和意义"
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <Link to="/loans" className="btn btn-outline">
                取消
              </Link>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "提交中..." : "提交申请"}
              </button>
            </div>
          </Form>
        )}
      </div>
    </Layout>
  );
}
