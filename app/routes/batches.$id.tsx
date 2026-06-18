import { Link, useLoaderData, Form, useActionData, useNavigation } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getBatch, getBatchVersions, updateBatch, getAuditionsByRecord, getAllRecords, getActiveSolutions } from "~/db/queries.server";
import Layout from "./_layout";
import { useState } from "react";

export const loader: LoaderFunction = async ({ params }) => {
  const id = Number(params.id);
  const batch = getBatch(id);
  if (!batch) throw new Response("Not Found", { status: 404 });
  const versions = getBatchVersions(id);
  const auditions = getAuditionsByRecord(batch.record_id).filter((a: any) => a.batch_id === id);
  const records = getAllRecords();
  const solutions = getActiveSolutions();
  return json({ batch, versions, auditions, records, solutions });
};

export const action: ActionFunction = async ({ request, params }) => {
  const id = Number(params.id);
  const formData = await request.formData();
  const data: Record<string, any> = {};
  const numericFields = [
    "brush_count", "ultrasonic_minutes", "ultrasonic_temp_c",
    "rinse_count", "drying_minutes", "pre_noise_level",
    "post_noise_level", "crackle_reduction", "result_rating",
    "record_id", "solution_id",
  ];
  for (const [key, value] of formData.entries()) {
    if (key === "intent") continue;
    if (numericFields.includes(key)) {
      data[key] = Number(value) || 0;
    } else {
      data[key] = value;
    }
  }
  updateBatch(id, data, "operator");
  return redirect(`/batches/${id}`);
};

const fieldLabels: Record<string, string> = {
  brush_type: "刷子类型",
  brush_count: "刷洗次数",
  ultrasonic_minutes: "超声时间(分)",
  ultrasonic_temp_c: "超声温度(°C)",
  rinse_count: "漂洗次数",
  drying_method: "干燥方式",
  drying_minutes: "干燥时间(分)",
  operator: "操作员",
  pre_noise_level: "清洗前噪声",
  post_noise_level: "清洗后噪声",
  crackle_reduction: "裂纹衰减(%)",
  result_rating: "效果评级",
  anomalies: "异常记录",
  notes: "备注",
  record_id: "唱片",
  solution_id: "清洗液",
  cleaned_at: "清洗日期",
};

function Stars({ count }: { count: number }) {
  return (
    <span className="stars">
      {"★".repeat(count)}
      <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function BatchDetail() {
  const { batch, versions, auditions, records, solutions } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("overview");
  const navigation = useNavigation();
  const isSaving = navigation.state === "submitting";

  const noiseReduction = batch.pre_noise_level > 0
    ? Math.round(((batch.pre_noise_level - batch.post_noise_level) / batch.pre_noise_level) * 100)
    : 0;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link to="/batches" className="btn btn-sm" style={{ marginRight: 8 }}>← 返回台账</Link>
            <span className="pill">{batch.batch_code}</span>
          </div>
          <h1 className="page-title" style={{ marginTop: 10 }}>
            {batch.artist} — <span style={{ color: "var(--accent)" }}>{batch.album}</span>
          </h1>
          <div className="page-subtitle">
            使用 {batch.solution_name} · 清洗于 {batch.cleaned_at} · 版本 v{batch.version}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          📊 概览
        </button>
        <button className={`tab ${activeTab === "edit" ? "active" : ""}`} onClick={() => setActiveTab("edit")}>
          ✏ 编辑记录
        </button>
        <button className={`tab ${activeTab === "versions" ? "active" : ""}`} onClick={() => setActiveTab("versions")}>
          🕒 版本历史 ({versions.length})
        </button>
        <button className={`tab ${activeTab === "auditions" ? "active" : ""}`} onClick={() => setActiveTab("auditions")}>
          🎧 试听 ({auditions.length})
        </button>
      </div>

      <div className="content-wrap">
        {activeTab === "overview" && (
          <>
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-label">刷洗次数</div>
                <div className="stat-value" style={{ fontSize: 28 }}>{batch.brush_count}</div>
                <div className="stat-sub">{batch.brush_type}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">超声清洗</div>
                <div className="stat-value" style={{ fontSize: 28 }}>{batch.ultrasonic_minutes}<span style={{ fontSize: 16 }}> 分</span></div>
                <div className="stat-sub">{batch.ultrasonic_temp_c}°C</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">漂洗 / 干燥</div>
                <div className="stat-value" style={{ fontSize: 28 }}>{batch.rinse_count} / {batch.drying_minutes}</div>
                <div className="stat-sub">{batch.drying_method}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">噪声衰减</div>
                <div className="stat-value" style={{ fontSize: 28, color: noiseReduction < 0 ? "var(--error)" : "var(--success)" }}>
                  {noiseReduction > 0 ? "▼" : noiseReduction < 0 ? "▲" : "—"} {Math.abs(noiseReduction)}%
                </div>
                <div className="stat-sub">
                  {batch.pre_noise_level.toFixed(1)} → {batch.post_noise_level.toFixed(1)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">效果评级</div>
                <div style={{ marginTop: 12 }}>
                  <Stars count={batch.result_rating} />
                </div>
                <div className="stat-sub" style={{ marginTop: 6 }}>裂纹衰减 {batch.crackle_reduction}%</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">操作员</div>
                <div className="stat-value" style={{ fontSize: 24 }}>{batch.operator || "—"}</div>
                <div className="stat-sub">
                  {noiseReduction < 0 || batch.result_rating <= 2 ? (
                    <span className="badge badge-error">⚠ 存在异常</span>
                  ) : (
                    <span className="badge badge-success">数据正常</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">📈 噪声对比</div></div>
                <div className="card-body">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>清洗前</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--error)" }}>{batch.pre_noise_level.toFixed(1)}/10</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill low" style={{ width: `${batch.pre_noise_level * 10}%` }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>清洗后</span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--success)" }}>{batch.post_noise_level.toFixed(1)}/10</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill high" style={{ width: `${batch.post_noise_level * 10}%` }} />
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>裂纹衰减</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, color: batch.crackle_reduction < 0 ? "var(--error)" : "var(--accent)" }}>
                        {batch.crackle_reduction}%
                      </div>
                    </div>
                    <div className="noise-chart">
                      <div className="noise-bar before" style={{ height: `${Math.min(batch.pre_noise_level * 6, 60)}px` }} />
                      <div className="noise-bar after" style={{ height: `${Math.min(batch.post_noise_level * 6, 60)}px` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">📝 清洗详情</div></div>
                <div className="card-body">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">唱片目录号</span>
                      <span className="detail-value">
                        <Link to={`/records/${batch.record_id}`}>查看唱片 →</Link>
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">清洗液</span>
                      <span className="detail-value">{batch.solution_name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">刷子类型</span>
                      <span className="detail-value">{batch.brush_type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">刷洗次数</span>
                      <span className={`detail-value ${batch.brush_count > 50 ? "" : ""}`}
                        style={batch.brush_count > 50 ? { color: "var(--error)" } : {}}>
                        {batch.brush_count} 次
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">超声时间</span>
                      <span className="detail-value"
                        style={batch.ultrasonic_minutes > 30 ? { color: "var(--error)" } : {}}>
                        {batch.ultrasonic_minutes} 分钟
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">超声温度</span>
                      <span className="detail-value">{batch.ultrasonic_temp_c}°C</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">漂洗</span>
                      <span className="detail-value">{batch.rinse_count} 次</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">干燥方式</span>
                      <span className="detail-value">{batch.drying_method} · {batch.drying_minutes}分钟</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {batch.anomalies && (
              <div className="alert alert-error" style={{ marginTop: 20 }}>
                <span className="alert-icon">⚠</span>
                <div className="alert-body">
                  <strong>异常记录</strong>
                  <div>{batch.anomalies}</div>
                </div>
              </div>
            )}

            {batch.notes && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header"><div className="card-title">📌 备注</div></div>
                <div className="card-body" style={{ whiteSpace: "pre-wrap" }}>{batch.notes}</div>
              </div>
            )}
          </>
        )}

        {activeTab === "edit" && (
          <div className="card">
            <Form method="post" className="card-body">
              <div className="detail-section">
                <div className="section-title">基础信息</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">唱片</label>
                    <select name="record_id" defaultValue={batch.record_id}>
                      {records.map((r: any) => (
                        <option key={r.id} value={r.id}>{r.artist} - {r.album}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">清洗液</label>
                    <select name="solution_id" defaultValue={batch.solution_id}>
                      {solutions.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">操作员</label>
                    <input className="input" name="operator" defaultValue={batch.operator || ""} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">清洗日期</label>
                    <input className="input" type="datetime-local" name="cleaned_at"
                      defaultValue={batch.cleaned_at.replace(" ", "T").slice(0, 16)} />
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="section-title">清洗参数</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">刷子类型</label>
                    <select name="brush_type" defaultValue={batch.brush_type}>
                      <option>Carbon Fiber</option>
                      <option>Goat Hair</option>
                      <option>Microfiber Pad</option>
                      <option>Velvet</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">刷洗次数</label>
                    <input className="input" type="number" name="brush_count" defaultValue={batch.brush_count} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">超声时间 (分钟)</label>
                    <input className="input" type="number" name="ultrasonic_minutes" defaultValue={batch.ultrasonic_minutes} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">超声温度 (°C)</label>
                    <input className="input" type="number" step={0.5} name="ultrasonic_temp_c" defaultValue={batch.ultrasonic_temp_c} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">漂洗次数</label>
                    <input className="input" type="number" name="rinse_count" defaultValue={batch.rinse_count} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">干燥方式</label>
                    <select name="drying_method" defaultValue={batch.drying_method}>
                      <option>Vacuum</option>
                      <option>Air Dry</option>
                      <option>Drying Rack</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">干燥时间 (分钟)</label>
                    <input className="input" type="number" name="drying_minutes" defaultValue={batch.drying_minutes} />
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <div className="section-title">质量评估</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">清洗前噪声 (0-10)</label>
                    <input className="input" type="number" step={0.1} name="pre_noise_level" defaultValue={batch.pre_noise_level} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">清洗后噪声 (0-10)</label>
                    <input className="input" type="number" step={0.1} name="post_noise_level" defaultValue={batch.post_noise_level} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">裂纹衰减 (%)</label>
                    <input className="input" type="number" name="crackle_reduction" defaultValue={batch.crackle_reduction} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">效果评级</label>
                    <select name="result_rating" defaultValue={batch.result_rating}>
                      <option value={1}>1 ★ 极差</option>
                      <option value={2}>2 ★★ 较差</option>
                      <option value={3}>3 ★★★ 一般</option>
                      <option value={4}>4 ★★★★ 良好</option>
                      <option value={5}>5 ★★★★★ 完美</option>
                    </select>
                  </div>
                  <div className="form-group full">
                    <label className="form-label">异常记录</label>
                    <textarea name="anomalies" defaultValue={batch.anomalies || ""}
                      placeholder="噪声上升、爆音增加、外观损坏等..." />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">备注</label>
                    <textarea name="notes" defaultValue={batch.notes || ""} />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <Link to={`/batches/${batch.id}`} className="btn">取消</Link>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "保存中..." : "保存修改"}
                </button>
              </div>
            </Form>
          </div>
        )}

        {activeTab === "versions" && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">版本历史</div>
              <span className="badge badge-info">当前 v{batch.version}</span>
            </div>
            <div className="card-body">
              {versions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🕒</div>
                  <div className="empty-text">暂无修改记录 · 原始版本 v1</div>
                </div>
              ) : (
                <div className="timeline">
                  {versions.map((v: any) => (
                    <div key={v.id} className="timeline-item">
                      <div className="timeline-time">{v.changed_at} · by {v.changed_by}</div>
                      <div className="timeline-title">
                        <span className="badge badge-muted" style={{ marginRight: 8 }}>v{v.version}</span>
                        {fieldLabels[v.field_changed] || v.field_changed} 已修改
                      </div>
                      <div className="timeline-diff">
                        <span className="diff-old">{v.old_value || "(空)"}</span>
                        {" → "}
                        <span className="diff-new">{v.new_value || "(空)"}</span>
                      </div>
                    </div>
                  ))}
                  <div className="timeline-item">
                    <div className="timeline-time">{batch.cleaned_at}</div>
                    <div className="timeline-title">
                      <span className="badge badge-success" style={{ marginRight: 8 }}>v1</span>
                      初始创建
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "auditions" && (
          <div className="card">
            <div className="card-header"><div className="card-title">试听记录</div></div>
            <div className="card-body">
              {auditions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎧</div>
                  <div className="empty-text">此批次暂无试听记录</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>面/曲</th>
                        <th>噪声</th>
                        <th>裂纹</th>
                        <th>爆音</th>
                        <th>失真</th>
                        <th>试听员</th>
                        <th>设备</th>
                        <th>日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditions.map((a: any) => (
                        <tr key={a.id}>
                          <td>
                            <span className="pill">Side {a.side}</span>
                            {a.track_no && <span style={{ marginLeft: 6, fontSize: 12 }}>Track {a.track_no}</span>}
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
                          <td style={{ fontSize: 12 }}>{a.equipment || "-"}</td>
                          <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.auditioned_at.slice(0, 10)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
