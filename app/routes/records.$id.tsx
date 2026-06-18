import { Link, useLoaderData, Form } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getRecord, getBatchesByRecord, getAuditionsByRecord, updateRecord } from "~/db/queries.server";
import Layout from "./_layout";
import { useState } from "react";

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);
  const record = getRecord(id);
  if (!record) throw new Response("Not Found", { status: 404 });
  const batches = getBatchesByRecord(id);
  const auditions = getAuditionsByRecord(id);
  return json({ record, batches, auditions });
};

export const action: ActionFunction = async ({ request, params }) => {
  const id = Number(params.id);
  const formData = await request.formData();
  const data: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key === "intent") continue;
    data[key] = key === "year" || key === "weight" ? Number(value) || 0 : value;
  }
  updateRecord(id, data);
  return redirect(`/records/${id}`);
};

function Stars({ count }: { count: number }) {
  return (
    <span className="stars">
      {"★".repeat(count)}
      <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function RecordDetail() {
  const { record, batches, auditions } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("overview");

  const avgNoise = auditions.length
    ? (auditions.reduce((a: number, b: any) => a + b.noise_level, 0) / auditions.length).toFixed(1)
    : "—";

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div>
            <Link to="/records" className="btn btn-sm" style={{ marginRight: 10 }}>← 返回唱片库</Link>
            <span className="pill">{record.catalog_no}</span>
            {record.weight > 0 && (
              <span style={{ marginLeft: 6 }} className="badge badge-muted">{record.weight}g</span>
            )}
          </div>
          <h1 className="page-title" style={{ marginTop: 10 }}>{record.album}</h1>
          <div className="page-subtitle">
            {record.artist}
            {record.year && ` · ${record.year}`}
            {record.genre && ` · ${record.genre}`}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          📋 概览
        </button>
        <button className={`tab ${activeTab === "batches" ? "active" : ""}`} onClick={() => setActiveTab("batches")}>
          🧪 清洗历史 ({batches.length})
        </button>
        <button className={`tab ${activeTab === "auditions" ? "active" : ""}`} onClick={() => setActiveTab("auditions")}>
          🎧 试听记录 ({auditions.length})
        </button>
        <button className={`tab ${activeTab === "edit" ? "active" : ""}`} onClick={() => setActiveTab("edit")}>
          ✏ 编辑
        </button>
      </div>

      <div className="content-wrap">
        {activeTab === "overview" && (
          <>
            <div className="record-header" style={{ marginBottom: 28 }}>
              <div className="record-art">💿</div>
              <div className="record-meta">
                <div className="record-artist">{record.artist}</div>
                <div className="record-album">{record.album}</div>
                <div className="record-info-row">
                  <span className="pill">{record.condition}</span>
                  {record.pressing && <span style={{ fontFamily: "var(--font-mono)" }}>{record.pressing}</span>}
                  {record.year && <span>{record.year}</span>}
                  {record.genre && <span>· {record.genre}</span>}
                </div>
              </div>
              <div className="stats-grid" style={{ flex: 1, minWidth: 300, marginBottom: 0 }}>
                <div className="stat-card">
                  <div className="stat-label">清洗批次</div>
                  <div className="stat-value" style={{ fontSize: 24 }}>{batches.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">平均噪声</div>
                  <div className="stat-value" style={{ fontSize: 24 }}>{avgNoise}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">最佳评级</div>
                  <div style={{ marginTop: 8 }}>
                    {batches.length > 0
                      ? <Stars count={Math.max(...batches.map((b: any) => b.result_rating))} />
                      : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </div>
                </div>
              </div>
            </div>

            {record.notes && (
              <div className="card">
                <div className="card-header"><div className="card-title">📌 备注</div></div>
                <div className="card-body" style={{ whiteSpace: "pre-wrap" }}>{record.notes}</div>
              </div>
            )}

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><div className="card-title">基础信息</div></div>
              <div className="card-body">
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">目录号</span>
                    <span className="detail-value">{record.catalog_no}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">艺术家</span>
                    <span className="detail-value">{record.artist}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">专辑名</span>
                    <span className="detail-value">{record.album}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">发行年份</span>
                    <span className="detail-value">{record.year || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">风格</span>
                    <span className="detail-value">{record.genre || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">品相</span>
                    <span className="detail-value">{record.condition}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">重量</span>
                    <span className="detail-value">{record.weight ? `${record.weight}g` : "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">压片</span>
                    <span className="detail-value">{record.pressing || "—"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">入库时间</span>
                    <span className="detail-value">{record.created_at}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">最后更新</span>
                    <span className="detail-value">{record.updated_at}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "batches" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">清洗历史</div>
              <Link to="/batches" className="btn btn-sm">批次台账 →</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>批次号</th>
                    <th>清洗液</th>
                    <th>刷洗</th>
                    <th>超声</th>
                    <th>噪声变化</th>
                    <th>评级</th>
                    <th>日期</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty-state">
                          <div className="empty-icon">🧪</div>
                          <div className="empty-text">此唱片暂无清洗记录</div>
                        </div>
                      </td>
                    </tr>
                  ) : batches.map((b: any) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        <Link to={`/batches/${b.id}`}>{b.batch_code}</Link>
                      </td>
                      <td style={{ fontSize: 12 }}>{b.solution_name}</td>
                      <td style={{ textAlign: "center" }}>{b.brush_count}次</td>
                      <td style={{ textAlign: "center" }}>{b.ultrasonic_minutes}分</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        <span style={{ color: "var(--error)" }}>{b.pre_noise_level.toFixed(1)}</span>
                        →<span style={{ color: "var(--success)" }}>{b.post_noise_level.toFixed(1)}</span>
                      </td>
                      <td><Stars count={b.result_rating} /></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.cleaned_at.slice(0, 10)}</td>
                      <td><Link to={`/batches/${b.id}`} className="btn btn-sm btn-link">查看</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "auditions" && (
          <div className="card">
            <div className="card-header"><div className="card-title">试听记录</div></div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>日期</th>
                    <th>关联批次</th>
                    <th>面/曲</th>
                    <th>噪声</th>
                    <th>裂纹</th>
                    <th>爆音</th>
                    <th>失真</th>
                    <th>试听员</th>
                    <th>设备</th>
                  </tr>
                </thead>
                <tbody>
                  {auditions.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <div className="empty-state">
                          <div className="empty-icon">🎧</div>
                          <div className="empty-text">暂无试听记录</div>
                        </div>
                      </td>
                    </tr>
                  ) : auditions.map((a: any) => (
                    <tr key={a.id}>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.auditioned_at.slice(0, 10)}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                        {a.batch_id ? <Link to={`/batches/${a.batch_id}`}>#{a.batch_id}</Link> : "—"}
                      </td>
                      <td>
                        <span className="pill">Side {a.side}</span>
                        {a.track_no ? ` Trk ${a.track_no}` : ""}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{a.noise_level.toFixed(1)}</td>
                      <td>{a.crackles}</td>
                      <td>{a.pops}</td>
                      <td>
                        {a.distortion && <span className="badge badge-error">D</span>}
                        {a.warble && <span className="badge badge-warning">W</span>}
                        {a.inner_groove_distortion && <span className="badge badge-error">IGD</span>}
                        {!a.distortion && !a.warble && !a.inner_groove_distortion && <span className="badge badge-success">正常</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>{a.listener || "-"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.equipment || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "edit" && (
          <div className="card">
            <Form method="post" className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">目录号 *</label>
                  <input className="input" name="catalog_no" defaultValue={record.catalog_no} required />
                </div>
                <div className="form-group">
                  <label className="form-label">艺术家 *</label>
                  <input className="input" name="artist" defaultValue={record.artist} required />
                </div>
                <div className="form-group full">
                  <label className="form-label">专辑 *</label>
                  <input className="input" name="album" defaultValue={record.album} required />
                </div>
                <div className="form-group">
                  <label className="form-label">年份</label>
                  <input className="input" type="number" name="year" defaultValue={record.year || ""} />
                </div>
                <div className="form-group">
                  <label className="form-label">风格</label>
                  <input className="input" name="genre" defaultValue={record.genre || ""} />
                </div>
                <div className="form-group">
                  <label className="form-label">品相</label>
                  <select name="condition" defaultValue={record.condition}>
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
                  <input className="input" type="number" name="weight" defaultValue={record.weight || ""} />
                </div>
                <div className="form-group full">
                  <label className="form-label">压片信息</label>
                  <input className="input" name="pressing" defaultValue={record.pressing || ""} />
                </div>
                <div className="form-group full">
                  <label className="form-label">备注</label>
                  <textarea name="notes" defaultValue={record.notes || ""} />
                </div>
              </div>
              <div className="form-actions">
                <Link to={`/records/${record.id}`} className="btn">取消</Link>
                <button type="submit" className="btn btn-primary">保存修改</button>
              </div>
            </Form>
          </div>
        )}
      </div>
    </Layout>
  );
}
