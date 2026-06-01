import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { createExhibit } from "~/services/exhibitService";
import { EXHIBIT_CATEGORIES } from "~/types";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  try {
    const id = createExhibit({
      name: String(formData.get("name")),
      code: String(formData.get("code")),
      category: String(formData.get("category")),
      era: formData.get("era") as string | null,
      material: formData.get("material") as string | null,
      dimensions: formData.get("dimensions") as string | null,
      weight: formData.get("weight") as string | null,
      description: formData.get("description") as string | null,
      condition: formData.get("condition") as string | null,
      storage_location: formData.get("storage_location") as string | null,
      value: formData.get("value") as string | null,
      insurance_info: formData.get("insurance_info") as string | null,
      image_url: formData.get("image_url") as string | null,
    });

    return redirect(`/exhibits/${id}`);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "创建失败" });
  }
}

export default function NewExhibit() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="新增展品">
      <div className="page-header">
        <h1 className="page-title">新增展品档案</h1>
        <div className="page-actions">
          <Link to="/exhibits" className="btn btn-outline">
            ← 返回列表
          </Link>
        </div>
      </div>

      <div className="card">
        {actionData?.error && (
          <div className="alert alert-danger">{actionData.error}</div>
        )}

        <Form method="post">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">展品名称 *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                required
                placeholder="请输入展品名称"
              />
            </div>
            <div className="form-group">
              <label className="form-label">展品编号 *</label>
              <input
                type="text"
                name="code"
                className="form-control"
                required
                placeholder="如：EX-001"
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">展品类别 *</label>
              <select name="category" className="form-control" required>
                <option value="">请选择类别</option>
                {EXHIBIT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">年代</label>
              <input
                type="text"
                name="era"
                className="form-control"
                placeholder="如：商代晚期"
              />
            </div>
            <div className="form-group">
              <label className="form-label">材质</label>
              <input
                type="text"
                name="material"
                className="form-control"
                placeholder="如：青铜"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">尺寸</label>
              <input
                type="text"
                name="dimensions"
                className="form-control"
                placeholder="如：高45cm，口径32cm"
              />
            </div>
            <div className="form-group">
              <label className="form-label">重量</label>
              <input
                type="text"
                name="weight"
                className="form-control"
                placeholder="如：约25kg"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">保存状态</label>
              <select name="condition" className="form-control">
                <option value="完好">完好</option>
                <option value="良好">良好</option>
                <option value="有瑕疵">有瑕疵</option>
                <option value="需修复">需修复</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">存放位置</label>
              <input
                type="text"
                name="storage_location"
                className="form-control"
                placeholder="如：A区-3号柜"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">文物等级</label>
              <select name="value" className="form-control">
                <option value="">请选择等级</option>
                <option value="一级文物">一级文物</option>
                <option value="二级文物">二级文物</option>
                <option value="三级文物">三级文物</option>
                <option value="一般文物">一般文物</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">保险信息</label>
              <input
                type="text"
                name="insurance_info"
                className="form-control"
                placeholder="如：保额500万元"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">图片URL</label>
            <input
              type="url"
              name="image_url"
              className="form-control"
              placeholder="请输入图片链接"
            />
          </div>

          <div className="form-group">
            <label className="form-label">展品描述</label>
            <textarea
              name="description"
              className="form-control"
              rows={4}
              placeholder="请详细描述展品的历史背景、特征等信息"
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to="/exhibits" className="btn btn-outline">
              取消
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存展品"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
