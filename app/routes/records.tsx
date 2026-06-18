import { Link, useLoaderData, useSubmit, useSearchParams, Form } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getAllRecords, searchRecords, createRecord, deleteRecord, getBatchesByRecord } from "~/db/queries.server";
import Layout from "./_layout";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("q") || "";
  const records = keyword ? searchRecords(keyword) : getAllRecords();
  const enriched = records.map((r: any) => ({
    ...r,
    batchCount: getBatchesByRecord(r.id).length,
  }));
  return json({ records: enriched, keyword });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    createRecord({
      catalog_no: String(formData.get("catalog_no")),
      artist: String(formData.get("artist")),
      album: String(formData.get("album")),
      year: Number(formData.get("year")) || 0,
      genre: String(formData.get("genre") || ""),
      condition: formData.get("condition") as any || "VG+",
      weight: Number(formData.get("weight")) || 0,
      pressing: String(formData.get("pressing") || ""),
      notes: String(formData.get("notes") || ""),
    });
    return redirect("/records");
  }

  if (intent === "delete") {
    deleteRecord(Number(formData.get("id")));
    return redirect("/records");
  }

  return redirect("/records");
};

export default function RecordsIndex() {
  const { records, keyword } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) params.set("q", e.target.value);
    else params.delete("q");
    setSearchParams(params);
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">唱片库</h1>
          <div className="page-subtitle">共 {records.length} 张黑胶唱片</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 添加唱片</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-group" style={{ flex: 1, minWidth: 260 }}>
            <span className="filter-label">搜索</span>
            <input
              type="text"
              className="input"
              placeholder="搜索艺术家、专辑、目录号、风格..."
              value={keyword}
              onChange={handleSearch}
              style={{ flex: 1 }}
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>目录号</th>
                <th>艺术家</th>
                <th>专辑</th>
                <th>年份</th>
                <th>风格</th>
                <th>品相</th>
                <th>压片</th>
                <th>清洗次数</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <div className="empty-icon">💿</div>
                      <div className="empty-text">暂无唱片记录</div>
                    </div>
                  </td>
                </tr>
              ) : records.map((r: any) => (
                <tr key={r.id}>
                  <td style={{ width: 40 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 3,
                      background: "linear-gradient(135deg, var(--bg-hover) 0%, var(--accent-dark) 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14,
                    }}>💿</div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                    <Link to={`/records/${r.id}`}>{r.catalog_no}</Link>
                  </td>
                  <td style={{ fontWeight: 500 }}>{r.artist}</td>
                  <td>
                    <Link to={`/records/${r.id}`} style={{ color: "var(--text-primary)" }}>
                      <strong>{r.album}</strong>
                    </Link>
                    {r.weight > 0 && (
                      <span style={{ fontSize: 10, marginLeft: 6 }} className="badge badge-muted">
                        {r.weight}g
                      </span>
                    )}
                  </td>
                  <td>{r.year || "-"}</td>
                  <td style={{ fontSize: 12 }}>{r.genre || "-"}</td>
                  <td>
                    <span className={`badge ${
                      r.condition === "M" || r.condition === "NM" ? "badge-success" :
                      r.condition === "VG+" || r.condition === "VG" ? "badge-warning" :
                      "badge-error"
                    }`}>{r.condition}</span>
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.pressing || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={r.batchCount > 0 ? "badge badge-info" : "badge badge-muted"}>
                      {r.batchCount}
                    </span>
                  </td>
                  <td>
                    <Form method="post" style={{ display: "inline" }} onSubmit={(e) => {
                      if (!confirm("删除唱片将同时删除其全部清洗批次、版本历史和试听记录，确认？")) e.preventDefault();
                    }}>
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="id" value={r.id} />
                      <button type="submit" className="btn btn-link btn-sm">删除</button>
                    </Form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateRecordModal onClose={() => setShowCreate(false)} />
      )}
    </Layout>
  );
}

function CreateRecordModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Form method="post">
          <div className="modal-header">
            <div className="modal-title">添加唱片</div>
            <button type="button" className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <input type="hidden" name="intent" value="create" />
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">目录号 *</label>
                <input className="input" name="catalog_no" required placeholder="如 APP-010" />
              </div>
              <div className="form-group">
                <label className="form-label">艺术家 *</label>
                <input className="input" name="artist" required placeholder="如 Pink Floyd" />
              </div>
              <div className="form-group full">
                <label className="form-label">专辑 *</label>
                <input className="input" name="album" required placeholder="如 The Dark Side of the Moon" />
              </div>
              <div className="form-group">
                <label className="form-label">年份</label>
                <input className="input" type="number" name="year" placeholder="1973" />
              </div>
              <div className="form-group">
                <label className="form-label">风格</label>
                <input className="input" name="genre" placeholder="Rock / Jazz / Classical..." />
              </div>
              <div className="form-group">
                <label className="form-label">品相</label>
                <select name="condition" defaultValue="VG+">
                  <option value="M">M - 完美</option>
                  <option value="NM">NM - 近全新</option>
                  <option value="VG+">VG+ - 非常好</option>
                  <option value="VG">VG - 好</option>
                  <option value="G+">G+ - 良</option>
                  <option value="G">G - 一般</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">重量 (g)</label>
                <input className="input" type="number" name="weight" placeholder="180" />
              </div>
              <div className="form-group full">
                <label className="form-label">压片信息</label>
                <input className="input" name="pressing" placeholder="如 Harvest UK 1st Press" />
              </div>
              <div className="form-group full">
                <label className="form-label">备注</label>
                <textarea name="notes" placeholder="外盒状态、是否带侧标、历史来源等..." />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose}>取消</button>
              <button type="submit" className="btn btn-primary">添加唱片</button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
