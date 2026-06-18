import { useLoaderData, Form } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getAllSolutions, createSolution, updateSolution } from "~/db/queries.server";
import Layout from "./_layout";
import { useState } from "react";

export const loader: LoaderFunction = () => {
  return json({ solutions: getAllSolutions() });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    createSolution({
      name: String(formData.get("name")),
      brand: String(formData.get("brand") || ""),
      type: formData.get("type") as any || "mixed",
      ph: Number(formData.get("ph")) || 7,
      dilution_ratio: String(formData.get("dilution_ratio") || ""),
      volume_ml: Number(formData.get("volume_ml")) || 0,
      opened_date: formData.get("opened_date") ? String(formData.get("opened_date")) : "",
      expiry_date: formData.get("expiry_date") ? String(formData.get("expiry_date")) : "",
      is_active: 1,
      notes: String(formData.get("notes") || ""),
    });
    return redirect("/solutions");
  }

  if (intent === "toggle") {
    const id = Number(formData.get("id"));
    const sol = getAllSolutions().find((s: any) => s.id === id);
    if (sol) updateSolution(id, { is_active: sol.is_active ? 0 : 1 });
    return redirect("/solutions");
  }

  return redirect("/solutions");
};

const typeLabels: Record<string, string> = {
  enzymatic: "酶解",
  alcohol: "醇基",
  distilled: "蒸馏水",
  surfactant: "表面活性剂",
  mixed: "混合配方",
};

export default function SolutionsIndex() {
  const { solutions } = useLoaderData<typeof loader>();
  const [showCreate, setShowCreate] = useState(false);
  const today = new Date();

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">清洗液管理</h1>
          <div className="page-subtitle">
            共 {solutions.length} 种配方 · {solutions.filter((s: any) => s.is_active).length} 种在用
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新增清洗液</button>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>品牌</th>
                <th>类型</th>
                <th>pH</th>
                <th>稀释比</th>
                <th>容量</th>
                <th>开启日期</th>
                <th>有效期</th>
                <th>状态</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {solutions.map((s: any) => {
                const expiring = s.expiry_date && new Date(s.expiry_date) < new Date(today.getTime() + 30 * 86400000);
                const expired = s.expiry_date && new Date(s.expiry_date) < today;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td style={{ fontSize: 12 }}>{s.brand || "-"}</td>
                    <td>
                      <span className="badge badge-info">{typeLabels[s.type] || s.type}</span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>{s.ph ? s.ph.toFixed(1) : "-"}</td>
                    <td style={{ fontSize: 12 }}>{s.dilution_ratio || "-"}</td>
                    <td style={{ fontSize: 12 }}>{s.volume_ml ? `${s.volume_ml}ml` : "-"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.opened_date || "-"}</td>
                    <td>
                      <span style={{ fontSize: 12 }}>{s.expiry_date || "-"}</span>
                      {expired && <div><span className="badge badge-error">已过期</span></div>}
                      {!expired && expiring && <div><span className="badge badge-warning">临期</span></div>}
                    </td>
                    <td>
                      {s.is_active
                        ? <span className="badge badge-success">在用</span>
                        : <span className="badge badge-muted">停用</span>}
                    </td>
                    <td>
                      <Form method="post" style={{ display: "inline" }}>
                        <input type="hidden" name="intent" value="toggle" />
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="btn btn-link btn-sm">
                          {s.is_active ? "停用" : "启用"}
                        </button>
                      </Form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateSolutionModal onClose={() => setShowCreate(false)} />}
    </Layout>
  );
}

function CreateSolutionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Form method="post">
          <div className="modal-header">
            <div className="modal-title">新增清洗液</div>
            <button type="button" className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <input type="hidden" name="intent" value="create" />
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">名称 *</label>
                <input className="input" name="name" required placeholder="如 Vinyl Clear Enzymatic" />
              </div>
              <div className="form-group">
                <label className="form-label">品牌</label>
                <input className="input" name="brand" placeholder="如 Audio Desk" />
              </div>
              <div className="form-group">
                <label className="form-label">类型</label>
                <select name="type" defaultValue="mixed">
                  <option value="enzymatic">酶解</option>
                  <option value="alcohol">醇基</option>
                  <option value="distilled">蒸馏水</option>
                  <option value="surfactant">表面活性剂</option>
                  <option value="mixed">混合配方</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">pH 值</label>
                <input className="input" type="number" step={0.1} name="ph" defaultValue={7} />
              </div>
              <div className="form-group">
                <label className="form-label">稀释比</label>
                <input className="input" name="dilution_ratio" placeholder="如 1:4 / N/A" />
              </div>
              <div className="form-group">
                <label className="form-label">容量 (ml)</label>
                <input className="input" type="number" name="volume_ml" defaultValue={500} />
              </div>
              <div className="form-group">
                <label className="form-label">开启日期</label>
                <input className="input" type="date" name="opened_date" />
              </div>
              <div className="form-group">
                <label className="form-label">有效期</label>
                <input className="input" type="date" name="expiry_date" />
              </div>
              <div className="form-group full">
                <label className="form-label">备注</label>
                <textarea name="notes" placeholder="适用场景、特殊注意事项..." />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose}>取消</button>
              <button type="submit" className="btn btn-primary">添加</button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
