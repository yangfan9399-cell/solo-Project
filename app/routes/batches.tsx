import { Link, useLoaderData, useSubmit, useSearchParams } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getAllBatches, getAllRecords, getActiveSolutions, generateBatchCode, createBatch, deleteBatch } from "~/db/queries.server";
import Layout from "./_layout";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const filters = {
    recordId: url.searchParams.get("recordId") ? Number(url.searchParams.get("recordId")) : undefined,
    solutionId: url.searchParams.get("solutionId") ? Number(url.searchParams.get("solutionId")) : undefined,
    resultRating: url.searchParams.get("resultRating") ? Number(url.searchParams.get("resultRating")) : undefined,
    dateFrom: url.searchParams.get("dateFrom") || undefined,
    dateTo: url.searchParams.get("dateTo") || undefined,
    keyword: url.searchParams.get("keyword") || undefined,
  };
  const batches = getAllBatches(filters);
  const records = getAllRecords();
  const solutions = getActiveSolutions();
  return json({ batches, records, solutions, filters });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const recordId = Number(formData.get("record_id"));
    const solutionId = Number(formData.get("solution_id"));
    const batch = createBatch({
      batch_code: generateBatchCode(),
      record_id: recordId,
      solution_id: solutionId,
      brush_type: String(formData.get("brush_type") || "Carbon Fiber"),
      brush_count: Number(formData.get("brush_count") || 10),
      ultrasonic_minutes: Number(formData.get("ultrasonic_minutes") || 10),
      ultrasonic_temp_c: Number(formData.get("ultrasonic_temp_c") || 28),
      rinse_count: Number(formData.get("rinse_count") || 2),
      drying_method: String(formData.get("drying_method") || "Vacuum"),
      drying_minutes: Number(formData.get("drying_minutes") || 30),
      operator: String(formData.get("operator") || ""),
      pre_noise_level: Number(formData.get("pre_noise_level") || 0),
      post_noise_level: Number(formData.get("post_noise_level") || 0),
      crackle_reduction: Number(formData.get("crackle_reduction") || 0),
      result_rating: (Number(formData.get("result_rating") || 3)) as 1 | 2 | 3 | 4 | 5,
      anomalies: String(formData.get("anomalies") || ""),
      notes: String(formData.get("notes") || ""),
      cleaned_at: formData.get("cleaned_at") ? String(formData.get("cleaned_at")) : new Date().toISOString().slice(0, 19).replace("T", " "),
    });
    return redirect(`/batches/${batch.id}`);
  }

  if (intent === "delete") {
    const id = Number(formData.get("id"));
    deleteBatch(id);
    return redirect("/batches");
  }

  return redirect("/batches");
};

function Stars({ count }: { count: number }) {
  return (
    <span className="stars">
      {"★".repeat(count)}
      <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - count)}</span>
    </span>
  );
}

export default function BatchesIndex() {
  const { batches, records, solutions, filters } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);

  const handleFilterChange = (field: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(field, value);
    } else {
      params.delete(field);
    }
    submit(params, { method: "get" });
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">清洗批次台账</h1>
          <div className="page-subtitle">共 {batches.length} 条清洗记录</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 新建批次</button>
        </div>
      </div>

      <div className="card">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">搜索</span>
            <input
              type="text"
              className="input"
              placeholder="批次号/备注/操作员..."
              defaultValue={filters.keyword}
              onChange={(e) => handleFilterChange("keyword", e.target.value)}
              style={{ minWidth: 220 }}
            />
          </div>
          <div className="filter-group">
            <span className="filter-label">唱片</span>
            <select
              defaultValue={filters.recordId}
              onChange={(e) => handleFilterChange("recordId", e.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="">全部唱片</option>
              {records.map((r: any) => (
                <option key={r.id} value={r.id}>{r.artist} - {r.album}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">清洗液</span>
            <select
              defaultValue={filters.solutionId}
              onChange={(e) => handleFilterChange("solutionId", e.target.value)}
            >
              <option value="">全部</option>
              {solutions.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">评级</span>
            <select
              defaultValue={filters.resultRating}
              onChange={(e) => handleFilterChange("resultRating", e.target.value)}
            >
              <option value="">全部</option>
              <option value="5">★★★★★ 仅五星</option>
              <option value="4">★★★★ 四星以上</option>
              <option value="3">★★★ 三星以上</option>
              <option value="2">★★ 二星及以下</option>
              <option value="1">★ 仅一星</option>
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">日期</span>
            <input
              type="date"
              className="input"
              defaultValue={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
            <span style={{ color: "var(--text-muted)" }}>~</span>
            <input
              type="date"
              className="input"
              defaultValue={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
          <div className="filter-group" style={{ marginLeft: "auto" }}>
            <Link to="/export" className="btn btn-sm">📥 导出</Link>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>批次号</th>
                <th>唱片</th>
                <th>清洗液</th>
                <th>刷洗</th>
                <th>超声</th>
                <th>噪声变化</th>
                <th>评级</th>
                <th>操作员</th>
                <th>日期</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <div className="empty-icon">🧪</div>
                      <div className="empty-text">暂无符合条件的清洗批次</div>
                    </div>
                  </td>
                </tr>
              ) : batches.map((b: any) => {
                const hasAnomaly = b.anomalies || b.result_rating <= 2 || b.post_noise_level > b.pre_noise_level;
                return (
                  <tr key={b.id}>
                    <td>
                      <Link to={`/batches/${b.id}`} style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        {b.batch_code}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{b.artist}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{b.album}</div>
                    </td>
                    <td style={{ fontSize: "12px" }}>
                      {b.solution_name}
                      {b.rinse_count > 0 && <div style={{ color: "var(--text-muted)" }}>漂洗{b.rinse_count}次</div>}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={b.brush_count > 50 ? "badge badge-error" : "badge badge-info"}>
                        {b.brush_count}次
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={b.ultrasonic_minutes > 30 ? "badge badge-warning" : "badge badge-info"}>
                        {b.ultrasonic_minutes}分
                      </span>
                    </td>
                    <td>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>
                        <span style={{ color: "var(--error)" }}>{b.pre_noise_level.toFixed(1)}</span>
                        {" → "}
                        <span style={{ color: "var(--success)" }}>{b.post_noise_level.toFixed(1)}</span>
                      </div>
                      <div style={{ fontSize: "11px", color: b.crackle_reduction < 0 ? "var(--error)" : "var(--text-muted)" }}>
                        ▲ {b.crackle_reduction}%
                      </div>
                    </td>
                    <td>
                      <Stars count={b.result_rating} />
                      {hasAnomaly && (
                        <div>
                          <span className="badge badge-warning" style={{ marginTop: 4 }}>⚠</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "12px" }}>{b.operator || "-"}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {b.cleaned_at.slice(0, 10)}
                    </td>
                    <td>
                      <form method="post" style={{ display: "inline" }} onSubmit={(e) => {
                        if (!confirm("确定删除此批次记录？")) e.preventDefault();
                      }}>
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={b.id} />
                        <button type="submit" className="btn btn-link btn-sm">删除</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateBatchModal
          records={records as any[]}
          solutions={solutions as any[]}
          onClose={() => setShowCreate(false)}
        />
      )}
    </Layout>
  );
}

function CreateBatchModal({ records, solutions, onClose }: { records: any[]; solutions: any[]; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form method="post">
          <div className="modal-header">
            <div className="modal-title">新建清洗批次</div>
            <button type="button" className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <input type="hidden" name="intent" value="create" />

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">唱片 *</label>
                <select name="record_id" required>
                  <option value="">选择唱片...</option>
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>{r.artist} - {r.album} ({r.catalog_no})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">清洗液 *</label>
                <select name="solution_id" required>
                  <option value="">选择清洗液...</option>
                  {solutions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">刷子类型</label>
                <select name="brush_type">
                  <option>Carbon Fiber</option>
                  <option>Goat Hair</option>
                  <option>Microfiber Pad</option>
                  <option>Velvet</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">刷洗次数</label>
                <input type="number" name="brush_count" defaultValue={10} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">超声时间 (分钟)</label>
                <input type="number" name="ultrasonic_minutes" defaultValue={10} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">超声温度 (°C)</label>
                <input type="number" name="ultrasonic_temp_c" defaultValue={28} step={0.5} />
              </div>
              <div className="form-group">
                <label className="form-label">漂洗次数</label>
                <input type="number" name="rinse_count" defaultValue={2} min={0} />
              </div>
              <div className="form-group">
                <label className="form-label">干燥方式</label>
                <select name="drying_method">
                  <option>Vacuum</option>
                  <option>Air Dry</option>
                  <option>Drying Rack</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">干燥时间 (分钟)</label>
                <input type="number" name="drying_minutes" defaultValue={30} />
              </div>
              <div className="form-group">
                <label className="form-label">操作员</label>
                <input type="text" name="operator" placeholder="如 LF/AY" />
              </div>
              <div className="form-group">
                <label className="form-label">清洗前噪声 (0-10)</label>
                <input type="number" name="pre_noise_level" step={0.1} min={0} max={10} />
              </div>
              <div className="form-group">
                <label className="form-label">清洗后噪声 (0-10)</label>
                <input type="number" name="post_noise_level" step={0.1} min={0} max={10} />
              </div>
              <div className="form-group">
                <label className="form-label">裂纹衰减 (%)</label>
                <input type="number" name="crackle_reduction" defaultValue={0} />
              </div>
              <div className="form-group">
                <label className="form-label">效果评级</label>
                <select name="result_rating" defaultValue={3}>
                  <option value={1}>1 - 极差</option>
                  <option value={2}>2 - 较差</option>
                  <option value={3}>3 - 一般</option>
                  <option value={4}>4 - 良好</option>
                  <option value={5}>5 - 完美</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">清洗日期</label>
                <input type="datetime-local" name="cleaned_at" defaultValue={new Date().toISOString().slice(0, 16)} />
              </div>
              <div className="form-group full">
                <label className="form-label">异常记录</label>
                <textarea name="anomalies" placeholder="噪声上升、爆音增加、外观损坏等..." />
              </div>
              <div className="form-group full">
                <label className="form-label">备注</label>
                <textarea name="notes" placeholder="操作备注..." />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose}>取消</button>
              <button type="submit" className="btn btn-primary">创建批次</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
