import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import {
  getProject, listVersions, getCurrentVersion, listSections, listWaterLevels, listRoughnesses,
  listObstacles, listFlowSegments, listUnsuitableZones, listAnomalies,
} from "~/db/queries";
import { seed } from "~/db/seed";
import { computeSummary, generateTextReport, statusLabel, riverTypeLabel, fishTypeLabel, roughnessTypeLabel, obstacleTypeLabel, zoneTypeLabel, suitabilityLabel, anomalyTypeLabel } from "~/utils/report";

export const meta = () => [{ title: "评估报告" }];

export async function loader({ params, request }: LoaderFunctionArgs) {
  seed();
  const id = Number(params.id);
  if (!id) throw new Response("Not Found", { status: 404 });
  const project = getProject(id);
  if (!project) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const vid = Number(url.searchParams.get("vid")) || undefined;
  const versions = listVersions(id);
  const current = vid ? versions.find((v) => v.id === vid) ?? getCurrentVersion(id) : getCurrentVersion(id);
  if (!current) throw new Response("No version", { status: 500 });

  const sections = listSections(id, current.id);
  const sectionIds = sections.map((s) => s.id);
  const waterLevelsBySection: Record<number, any[]> = {};
  const roughnessBySection: Record<number, any[]> = {};
  const obstaclesBySection: Record<number, any[]> = {};
  const segmentsBySection: Record<number, any[]> = {};
  const zonesBySection: Record<number, any[]> = {};
  for (const sid of sectionIds) {
    waterLevelsBySection[sid] = listWaterLevels(sid);
    roughnessBySection[sid] = listRoughnesses(sid);
    obstaclesBySection[sid] = listObstacles(sid);
    segmentsBySection[sid] = listFlowSegments(sid);
    zonesBySection[sid] = listUnsuitableZones(sid);
  }
  const allSegments = sections.flatMap((s) => segmentsBySection[s.id] ?? []);
  const allZones = sections.flatMap((s) => zonesBySection[s.id] ?? []);
  const anomalies = listAnomalies(id, current.id);
  const summary = computeSummary(allSegments, allZones);
  const textReport = generateTextReport({
    project, version: current, sections,
    waterLevelsBySection, roughnessBySection, obstaclesBySection,
    segmentsBySection, zonesBySection, anomalies, summary,
    generated_at: new Date().toISOString(),
  });
  return json({ project, version: current, sections, summary, anomalies, segmentsBySection, zonesBySection, waterLevelsBySection, roughnessBySection, obstaclesBySection, textReport });
}

export default function ReportPage() {
  const d = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">📄 {d.project.name} — 评估报告</div>
          <div className="page-subtitle">
            {d.project.code} · 版本 {d.version.version_tag} ({d.version.batch_no}) · 生成于 {new Date().toLocaleString("zh-CN")}
          </div>
        </div>
        <div className="section-actions">
          <Link to={`/projects/${d.project.id}`} className="btn btn-secondary">← 返回工作台</Link>
          <Link to={`/projects/${d.project.id}/export.txt`} className="btn btn-secondary">⬇ 下载 TXT</Link>
          <Link to={`/projects/${d.project.id}/export.csv`} className="btn btn-primary">⬇ 导出 CSV 摘要</Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📐</div><div className="stat-value metric-value">{d.summary.total_sections}</div><div className="stat-label">评估断面</div></div>
        <div className="stat-card"><div className="stat-icon">🧭</div><div className="stat-value metric-value">{d.summary.total_segments}</div><div className="stat-label">流速子段</div></div>
        <div className="stat-card success"><div className="stat-icon">✅</div><div className="stat-value metric-value">{(d.summary.suitability_rate * 100).toFixed(1)}%</div><div className="stat-label">流速适宜率</div></div>
        <div className="stat-card danger"><div className="stat-icon">🚫</div><div className="stat-value metric-value">{d.summary.unsuitable_zones}</div><div className="stat-label">不适宜区域</div></div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">📋 一、项目基本信息</div></div>
        <div className="card-body">
          <div className="form-grid">
            <div className="info-row"><span className="info-label">项目编号</span><span className="info-value metric-value">{d.project.code}</span></div>
            <div className="info-row"><span className="info-label">状态</span><span>{statusLabel(d.project.status)}</span></div>
            <div className="info-row"><span className="info-label">所在电站</span><span>{d.project.station_name}</span></div>
            <div className="info-row"><span className="info-label">所属河流</span><span>{d.project.river_name}</span></div>
            <div className="info-row"><span className="info-label">河流类型</span><span>{riverTypeLabel(d.project.river_type)}</span></div>
            <div className="info-row"><span className="info-label">目标鱼种</span><span>{fishTypeLabel(d.project.fish_type)}</span></div>
            <div className="info-row"><span className="info-label">设计人员</span><span>{d.project.designer}</span></div>
            <div className="info-row"><span className="info-label">评估版本</span><span className="metric-value">{d.version.version_tag}</span></div>
            <div className="info-row full"><span className="info-label">项目描述</span><span style={{ textAlign: "right", flex: 1, color: "var(--color-text)" }}>{d.project.description ?? "无"}</span></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">📊 二、总体评估摘要</div></div>
        <div className="card-body">
          <div className="speed-grid">
            <div className="speed-cell safe"><div className="speed-cell-label">适宜子段</div><div className="speed-cell-value metric-value">{d.summary.safe_segments}</div></div>
            <div className="speed-cell warning"><div className="speed-cell-label">临界子段</div><div className="speed-cell-value metric-value">{d.summary.warning_segments}</div></div>
            <div className="speed-cell danger"><div className="speed-cell-label">不适宜子段</div><div className="speed-cell-value metric-value">{d.summary.danger_segments}</div></div>
            <div className="speed-cell"><div className="speed-cell-label">平均流速</div><div className="speed-cell-value metric-value">{d.summary.avg_velocity.toFixed(3)} <small style={{ fontSize: 12, fontWeight: 400 }}>m/s</small></div></div>
            <div className="speed-cell danger"><div className="speed-cell-label">最大流速</div><div className="speed-cell-value metric-value">{d.summary.max_velocity.toFixed(3)} <small style={{ fontSize: 12, fontWeight: 400 }}>m/s</small></div></div>
            <div className="speed-cell"><div className="speed-cell-label">最小流速</div><div className="speed-cell-value metric-value">{d.summary.min_velocity.toFixed(3)} <small style={{ fontSize: 12, fontWeight: 400 }}>m/s</small></div></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">📐 三、断面详细数据</div></div>
        <div className="card-body">
          {d.sections.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📐</div><div className="empty-state-title">暂无断面数据</div></div>
          ) : d.sections.map((s: any) => {
            const segs = (d.segmentsBySection as any)[s.id] ?? [];
            const zones = (d.zonesBySection as any)[s.id] ?? [];
            const wls = (d.waterLevelsBySection as any)[s.id] ?? [];
            const rs = (d.roughnessBySection as any)[s.id] ?? [];
            const obs = (d.obstaclesBySection as any)[s.id] ?? [];
            return (
              <div key={s.id} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: "var(--color-primary)" }}>
                  {s.station_no} — {s.name}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontSize: 12, marginBottom: 12 }}>
                  <div>宽度：<strong>{s.width.toFixed(2)}m</strong></div>
                  <div>水深：<strong>{s.depth.toFixed(2)}m</strong></div>
                  <div>比降：<strong>{s.slope.toFixed(4)}</strong></div>
                  <div>水力半径：<strong>{Number(s.hydraulic_radius).toFixed(3)}m</strong></div>
                </div>
                {segs.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 6 }}>流速分布（m/s）：</div>
                    <div className="flow-track" style={{ height: 44 }}>
                      {segs.map((sg: any, i: number) => (
                        <div key={i} className={`flow-segment ${sg.suitability}`} title={`${sg.start_m}-${sg.end_m}m: ${sg.velocity_ms}m/s, d=${sg.depth_m}m`}>
                          {Number(sg.velocity_ms).toFixed(2)}
                        </div>
                      ))}
                    </div>
                    <div className="legend-row">
                      <div className="legend-item"><span className="legend-color safe"></span>适宜</div>
                      <div className="legend-item"><span className="legend-color warning"></span>临界</div>
                      <div className="legend-item"><span className="legend-color danger"></span>不适宜</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>水位记录 ({wls.length})</div>
                    {wls.length === 0 ? <div style={{ color: "var(--color-text-light)" }}>—</div> :
                      wls.map((w: any) => (
                        <div key={w.id} style={{ padding: "3px 0", borderBottom: "1px dashed var(--color-bg-dark)" }}>
                          {w.measure_date} 上游{Number(w.upstream_level).toFixed(2)}m / 下游{Number(w.downstream_level).toFixed(2)}m / Q={Number(w.flow_rate).toFixed(2)}m³/s
                        </div>
                      ))
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>糙率 / 障碍物</div>
                    {rs.map((r: any) => <div key={r.id} style={{ padding: "2px 0" }}>{roughnessTypeLabel(r.type)} n={Number(r.n_value).toFixed(4)}</div>)}
                    {obs.map((o: any) => <div key={o.id} style={{ padding: "2px 0" }}>{obstacleTypeLabel(o.type)} @{Number(o.position_m).toFixed(2)}m H={Number(o.height_m).toFixed(2)}m</div>)}
                    {rs.length + obs.length === 0 && <div style={{ color: "var(--color-text-light)" }}>—</div>}
                  </div>
                </div>
                {zones.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: "#b91c1c" }}>不适宜区 ({zones.length})</div>
                    {zones.map((z: any) => (
                      <div key={z.id} className="unsuitable-zone">
                        <div className="unsuitable-zone-title">[{zoneTypeLabel(z.zone_type)}] {Number(z.start_m).toFixed(2)}–{Number(z.end_m).toFixed(2)}m</div>
                        <div className="unsuitable-zone-desc">{z.description}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">⚠️ 四、异常数据与说明 ({d.anomalies.length})</div></div>
        <div className="card-body">
          {d.anomalies.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">本版本无异常数据</div></div>
          ) : d.anomalies.map((a: any) => {
            const section = (d.sections as any).find((s: any) => s.id === a.section_id);
            return (
              <div key={a.id} className={"alert " + (a.severity === "danger" ? "alert-danger" : "alert-warning")}
                style={{ opacity: a.resolved ? 0.5 : 1 }}>
                <span className="alert-icon">{a.severity === "danger" ? "🔴" : "🟡"}</span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    <span className="badge" style={{ background: "rgba(0,0,0,0.05)", color: "inherit", marginRight: 6 }}>{anomalyTypeLabel(a.type)}</span>
                    {section && <span style={{ color: "var(--color-primary)", marginRight: 6 }}>[{section.station_no}]</span>}
                    {a.message}
                    {a.resolved && <span className="badge badge-success" style={{ marginLeft: 8 }}><span className="dot"></span>已处理</span>}
                  </div>
                  {(a.field || a.value) && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>字段：{a.field ?? "—"} · 值：{a.value ?? "—"}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📝 五、TXT 报告原文</div></div>
        <div className="card-body">
          <pre style={{
            background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 8,
            fontSize: 12, lineHeight: 1.6, overflow: "auto", maxHeight: 400,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
          }}>{d.textReport}</pre>
        </div>
      </div>
    </div>
  );
}
