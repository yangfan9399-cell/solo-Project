import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData, useNavigation } from "@remix-run/react";
import Layout from "~/components/Layout";
import { getExhibitById, updateExhibit } from "~/services/exhibitService";
import { EXHIBIT_CATEGORIES } from "~/types";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = Number(params.id);
  const exhibit = getExhibitById(id);

  if (!exhibit) {
    throw new Response("展品不存在", { status: 404 });
  }

  return json({ exhibit });
}

export async function action({ params, request }: ActionFunctionArgs) {
  const id = Number(params.id);
  const formData = await request.formData();

  try {
    updateExhibit(id, {
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
    return json({ error: error instanceof Error ? error.message : "更新失败" });
  }
}

export default function EditExhibit() {
  const { exhibit } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <Layout title="编辑展品">
      <div className="page-header">
        <h1 className="page-title">编辑展品档案</h1>
        <div className="page-actions">
          <Link to={`/exhibits/${exhibit.id}`} className="btn btn-outline">
            ← 返回详情
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
                defaultValue={exhibit.name}
              />
            </div>
            <div className="form-group">
              <label className="form-label">展品编号 *</label>
              <input
                type="text"
                name="code"
                className="form-control"
                required
                defaultValue={exhibit.code}
              />
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">展品类别 *</label>
              <select name="category" className="form-control" required defaultValue={exhibit.category}>
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
                defaultValue={exhibit.era || ""}
              />
            </div>
            <div className="form-group">
              <label className="form-label">材质</label>
              <input
                type="text"
                name="material"
                className="form-control"
                defaultValue={exhibit.material || ""}
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
                defaultValue={exhibit.dimensions || ""}
              />
            </div>
            <div className="form-group">
              <label className="form-label">重量</label>
              <input
                type="text"
                name="weight"
                className="form-control"
                defaultValue={exhibit.weight || ""}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">保存状态</label>
              <select name="condition" className="form-control" defaultValue={exhibit.condition || ""}>
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
                defaultValue={exhibit.storage_location || ""}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">文物等级</label>
              <select name="value" className="form-control" defaultValue={exhibit.value || ""}>
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
                defaultValue={exhibit.insurance_info || ""}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">图片URL</label>
            <input
              type="url"
              name="image_url"
              className="form-control"
              defaultValue={exhibit.image_url || ""}
            />
          </div>

          <div className="form-group">
            <label className="form-label">展品描述</label>
            <textarea
              name="description"
              className="form-control"
              rows={4}
              defaultValue={exhibit.description || ""}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Link to={`/exhibits/${exhibit.id}`} className="btn btn-outline">
              取消
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存修改"}
            </button>
          </div>
        </Form>
      </div>
    </Layout>
  );
}
