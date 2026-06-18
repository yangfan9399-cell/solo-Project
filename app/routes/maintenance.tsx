import { useLoaderData, Form } from "@remix-run/react";
import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getAllReminders, getDataAlerts, createReminder, updateReminder } from "~/db/queries.server";
import Layout from "./_layout";
import { useState } from "react";

export const loader: LoaderFunction = () => {
  return json({
    reminders: getAllReminders(),
    alerts: getDataAlerts(),
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    createReminder({
      type: formData.get("type") as any,
      target: String(formData.get("target")),
      threshold_count: formData.get("threshold_count") ? Number(formData.get("threshold_count")) : null,
      threshold_date: formData.get("threshold_date") ? String(formData.get("threshold_date")) : null,
      current_count: 0,
      is_triggered: 0,
      last_maintenance: formData.get("last_maintenance") ? String(formData.get("last_maintenance")) : null,
      notes: String(formData.get("notes") || ""),
    });
    return redirect("/maintenance");
  }

  if (intent === "reset") {
    const id = Number(formData.get("id"));
    updateReminder(id, {
      current_count: 0,
      is_triggered: 0,
      last_maintenance: new Date().toISOString().slice(0, 10),
    });
    return redirect("/maintenance");
  }

  if (intent === "dismiss") {
    const id = Number(formData.get("id"));
    updateReminder(id, { is_triggered: 0 });
    return redirect("/maintenance");
  }

  return redirect("/maintenance");
};

const typeLabels: Record<string, { icon: string; name: string }> = {
  brush_replace: { icon: "🖌", name: "刷子更换" },
  solution_refill: { icon: "🧴", name: "清洗液补充" },
  ultrasonic_filter: { icon: "🔬", name: "超声滤网" },
  machine_calibration: { icon: "⚙", name: "设备校准" },
  pad_replace: { icon: "🧽", name: "垫材更换" },
};

export default function MaintenanceIndex() {
  const { reminders, alerts } = useLoaderData<typeof loader>();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">维护提醒</h1>
          <div className="page-subtitle">
            {reminders.filter((r: any) => r.is_triggered).length} 项待处理 · 共 {reminders.length} 条提醒
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ 添加提醒</button>
        </div>
      </div>

      <div className="content-wrap" style={{ paddingTop: 0 }}>
        {alerts.filter((a: any) => a.type !== "info").length > 0 && (
          <div className="detail-section">
            <div className="section-title">⚠ 异常数据告警</div>
            {alerts
              .filter((a: any) => a.type !== "info")
              .map((alert: any) => (
                <div key={alert.id} className={`alert alert-${alert.type}`}>
                  <span className="alert-icon">{alert.type === "error" ? "🔴" : "🟠"}</span>
                  <div className="alert-body">
                    <strong>{alert.message}</strong>
                    {alert.detail && <div className="alert-detail">{alert.detail}</div>}
                  </div>
                </div>
              ))}
          </div>
        )}

        <div className="card">
          <div className="card-header"><div className="card-title">维护提醒列表</div></div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>类型</th>
                  <th>目标设备/耗材</th>
                  <th>使用次数</th>
                  <th>进度</th>
                  <th>阈值/日期</th>
                  <th>上次维护</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {reminders.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-icon">🔔</div>
                        <div className="empty-text">暂无维护提醒 · 添加耗材或设备即可开始追踪</div>
                      </div>
                    </td>
                  </tr>
                ) : reminders.map((r: any) => {
                  const info = typeLabels[r.type] || { icon: "🔔", name: r.type };
                  const pct = r.threshold_count
                    ? Math.min(100, Math.round((r.current_count / r.threshold_count) * 100))
                    : 0;
                  const pctClass = pct >= 90 ? "low" : pct >= 60 ? "mid" : "high";

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{info.icon}</span>
                          <span style={{ fontSize: 13 }}>{info.name}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{r.target}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        {r.current_count}{r.threshold_count ? ` / ${r.threshold_count}` : " 次"}
                      </td>
                      <td style={{ minWidth: 120 }}>
                        {r.threshold_count ? (
                          <div className="progress-bar">
                            <div className={`progress-fill ${pctClass}`} style={{ width: `${pct}%` }} />
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>日期模式</span>
                        )}
                      </td>
                      <td>
                        {r.threshold_count ? (
                          <span style={{ fontSize: 12 }}>{r.threshold_count} 次</span>
                        ) : r.threshold_date ? (
                          <span className={new Date(r.threshold_date) < new Date() ? "badge badge-error" : "badge badge-warning"}>
                            {r.threshold_date}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {r.last_maintenance || "未记录"}
                      </td>
                      <td>
                        {r.is_triggered
                          ? <span className="badge badge-error">需处理</span>
                          : <span className="badge badge-success">正常</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <Form method="post" style={{ display: "inline" }}>
                            <input type="hidden" name="intent" value="reset" />
                            <input type="hidden" name="id" value={r.id} />
                            <button type="submit" className="btn btn-sm">✓ 已维护</button>
                          </Form>
                          {r.is_triggered && (
                            <Form method="post" style={{ display: "inline" }}>
                              <input type="hidden" name="intent" value="dismiss" />
                              <input type="hidden" name="id" value={r.id} />
                              <button type="submit" className="btn btn-sm btn-link">忽略</button>
                            </Form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && <CreateReminderModal onClose={() => setShowCreate(false)} />}
      </div>
    </Layout>
  );
}

function CreateReminderModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Form method="post">
          <div className="modal-header">
            <div className="modal-title">添加维护提醒</div>
            <button type="button" className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <input type="hidden" name="intent" value="create" />
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">提醒类型 *</label>
                <select name="type" required>
                  <option value="brush_replace">刷子更换</option>
                  <option value="solution_refill">清洗液补充</option>
                  <option value="ultrasonic_filter">超声滤网清洁</option>
                  <option value="machine_calibration">设备校准</option>
                  <option value="pad_replace">垫材更换</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">目标 *</label>
                <input className="input" name="target" required placeholder="如 Carbon Brush #1" />
              </div>
              <div className="form-group">
                <label className="form-label">次数阈值</label>
                <input className="input" type="number" name="threshold_count" placeholder="如 100 (留空用日期)" />
              </div>
              <div className="form-group">
                <label className="form-label">提醒日期</label>
                <input className="input" type="date" name="threshold_date" />
              </div>
              <div className="form-group">
                <label className="form-label">上次维护</label>
                <input className="input" type="date" name="last_maintenance" />
              </div>
              <div className="form-group full">
                <label className="form-label">备注</label>
                <textarea name="notes" placeholder="维护说明、联系方式等..." />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn" onClick={onClose}>取消</button>
              <button type="submit" className="btn btn-primary">添加提醒</button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
