import { json, redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigate, useNavigation, useSubmit, Link } from "@remix-run/react";
import { useState } from "react";
import {
  getProject, listVersions, getCurrentVersion, listSections, listWaterLevels, listRoughnesses,
  listObstacles, listFlowSegments, listUnsuitableZones, listAnomalies,
  updateProject, updateProjectStatus,
  createSection, updateSection, deleteSection,
  createWaterLevel, deleteWaterLevel,
  createRoughness, deleteRoughness,
  createObstacle, deleteObstacle,
  createFlowSegment, clearFlowSegments, createUnsuitableZone, clearUnsuitableZones,
  createVersion, setCurrentVersion,
  createAnomaly, clearAnomalies, resolveAnomaly,
} from "~/db/queries";
import { getDb } from "~/db/schema";
import { seed } from "~/db/seed";
import { classifyVelocity, THRESHOLDS, type FishType } from "~/types";
import {
  statusLabel, riverTypeLabel, fishTypeLabel, roughnessTypeLabel, obstacleTypeLabel,
  suitabilityLabel, zoneTypeLabel, anomalyTypeLabel, computeSummary,
} from "~/utils/report";
import type { ProjectStatus } from "~/types";

export const meta = () => [{ title: "评估工作台" }];

export async function loader({ params, request }: LoaderFunctionArgs) {
  seed();
  const id = Number(params.id);
  if (!id) throw new Response("Not Found", { status: 404 });
  const project = getProject(id);
  if (!project) throw new Response("Not Found", { status: 404 });

  const url = new URL(request.url);
  const vid = Number(url.searchParams.get("vid")) || undefined;
  const versions = listVersions(id);
  const current = vid
    ? versions.find((v) => v.id === vid) ?? getCurrentVersion(id)
    : getCurrentVersion(id);
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

  const versionStats: Record<number, { sections: number; segments: number; zones: number; anomalies: number }> = {};
  const db = getDb();
  for (const v of versions) {
    const vSections = listSections(id, v.id);
    let vSegCount = 0;
    let vZoneCount = 0;
    for (const vs of vSections) {
      vSegCount += (db.prepare("SELECT COUNT(*) as n FROM flow_segments WHERE section_id = ?").get(vs.id) as { n: number }).n;
      vZoneCount += (db.prepare("SELECT COUNT(*) as n FROM unsuitable_zones WHERE section_id = ?").get(vs.id) as { n: number }).n;
    }
    const vAnomalyCount = (db.prepare("SELECT COUNT(*) as n FROM anomaly_records WHERE project_id = ? AND version_id = ? AND resolved = 0").get(id, v.id) as { n: number }).n;
    versionStats[v.id] = { sections: vSections.length, segments: vSegCount, zones: vZoneCount, anomalies: vAnomalyCount };
  }

  return json({
    project, versions, currentVersion: current,
    sections, waterLevelsBySection, roughnessBySection, obstaclesBySection,
    segmentsBySection, zonesBySection, anomalies, summary, versionStats,
  });
}

function regenerateAnomalies(projectId: number, versionId: number, fishType: FishType) {
  const sections = listSections(projectId, versionId);
  const t = THRESHOLDS[fishType];
  for (const s of sections) {
    const segs = listFlowSegments(s.id);
    if (segs.length === 0) {
      createAnomaly({
        project_id: projectId, version_id: versionId, section_id: s.id,
        type: "missing_data", severity: "warning",
        field: "flow_segments", message: `断面 ${s.station_no} 尚未录入分段流速数据`,
      });
    }
    for (const seg of segs) {
      if (seg.velocity_ms > t.maxVelocity) {
        createAnomaly({
          project_id: projectId, version_id: versionId, section_id: s.id,
          type: "out_of_range", severity: "danger", field: "velocity_ms",
          value: String(seg.velocity_ms),
          message: `${s.station_no} 子段#${seg.segment_index} 流速 ${seg.velocity_ms}m/s 超过上限 ${t.maxVelocity}m/s`,
        });
      }
      if (seg.depth_m < t.minDepth) {
        createAnomaly({
          project_id: projectId, version_id: versionId, section_id: s.id,
          type: "out_of_range", severity: "danger", field: "depth_m",
          value: String(seg.depth_m),
          message: `${s.station_no} 子段#${seg.segment_index} 水深 ${seg.depth_m}m 低于下限 ${t.minDepth}m`,
        });
      }
    }
    const wls = listWaterLevels(s.id);
    if (wls.length === 0) {
      createAnomaly({
        project_id: projectId, version_id: versionId, section_id: s.id,
        type: "missing_data", severity: "warning",
        field: "water_level", message: `断面 ${s.station_no} 缺少水位记录`,
      });
    }
    const rs = listRoughnesses(s.id);
    if (rs.length === 0) {
      createAnomaly({
        project_id: projectId, version_id: versionId, section_id: s.id,
        type: "missing_data", severity: "warning",
        field: "roughness", message: `断面 ${s.station_no} 缺少糙率参数`,
      });
    }
  }
  if (sections.length < 3) {
    createAnomaly({
      project_id: projectId, version_id: versionId, section_id: null,
      type: "missing_data", severity: "warning", field: "sections",
      value: String(sections.length),
      message: `当前版本仅 ${sections.length} 个断面，建议不少于 3 个评估断面`,
    });
  }
}

export async function action({ params, request }: ActionFunctionArgs) {
  const pid = Number(params.id);
  if (!pid) return json({ error: "invalid project" }, { status: 400 });
  const form = await request.formData();
  const _action = String(form.get("_action") || "");
  const versionId = Number(form.get("version_id") || 0);

  switch (_action) {
    case "update_basic":
      updateProject(pid, {
        name: String(form.get("name")),
        station_name: String(form.get("station_name")),
        river_name: String(form.get("river_name")),
        river_type: form.get("river_type") as any,
        fish_type: form.get("fish_type") as any,
        designer: String(form.get("designer")),
        description: String(form.get("description") || "") || null,
        status: form.get("status") as any,
      });
      return json({ ok: true });
    case "set_status":
      updateProjectStatus(pid, form.get("status") as ProjectStatus);
      return json({ ok: true });
    case "add_section":
      createSection({
        project_id: pid, version_id: versionId,
        station_no: String(form.get("station_no")),
        name: String(form.get("name")),
        width: Number(form.get("width")),
        depth: Number(form.get("depth")),
        slope: Number(form.get("slope")),
        bottom_elevation: Number(form.get("bottom_elevation")),
        remark: String(form.get("remark") || "") || null,
      });
      return json({ ok: true });
    case "edit_section":
      updateSection(Number(form.get("id")), {
        project_id: pid, version_id: versionId,
        station_no: String(form.get("station_no")),
        name: String(form.get("name")),
        width: Number(form.get("width")),
        depth: Number(form.get("depth")),
        slope: Number(form.get("slope")),
        bottom_elevation: Number(form.get("bottom_elevation")),
        remark: String(form.get("remark") || "") || null,
      });
      return json({ ok: true });
    case "delete_section":
      deleteSection(Number(form.get("id")));
      return json({ ok: true });
    case "add_water_level":
      createWaterLevel({
        project_id: pid, version_id: versionId,
        section_id: Number(form.get("section_id")),
        upstream_level: Number(form.get("upstream_level")),
        downstream_level: Number(form.get("downstream_level")),
        water_depth: Number(form.get("water_depth")),
        flow_rate: Number(form.get("flow_rate")),
        measure_date: String(form.get("measure_date") || new Date().toISOString().slice(0, 10)),
        remark: String(form.get("remark") || "") || null,
      });
      return json({ ok: true });
    case "delete_water_level": deleteWaterLevel(Number(form.get("id"))); return json({ ok: true });
    case "add_roughness":
      createRoughness({
        project_id: pid, version_id: versionId,
        section_id: Number(form.get("section_id")),
        n_value: Number(form.get("n_value")),
        type: form.get("type") as any,
        description: String(form.get("description") || "") || null,
      });
      return json({ ok: true });
    case "delete_roughness": deleteRoughness(Number(form.get("id"))); return json({ ok: true });
    case "add_obstacle":
      createObstacle({
        project_id: pid, version_id: versionId,
        section_id: Number(form.get("section_id")),
        type: form.get("type") as any,
        position_m: Number(form.get("position_m")),
        height_m: Number(form.get("height_m")),
        width_m: Number(form.get("width_m")),
        description: String(form.get("description") || "") || null,
      });
      return json({ ok: true });
    case "delete_obstacle": deleteObstacle(Number(form.get("id"))); return json({ ok: true });
    case "save_segments": {
      const sectionId = Number(form.get("section_id"));
      clearFlowSegments(sectionId);
      clearUnsuitableZones(sectionId);
      const fishType = (getProject(pid)?.fish_type ?? "general") as FishType;
      const idx = Number(form.get("seg_count") || 0);
      for (let i = 0; i < idx; i++) {
        const start = Number(form.get(`seg_${i}_start`));
        const end = Number(form.get(`seg_${i}_end`));
        const v = Number(form.get(`seg_${i}_v`));
        const d = Number(form.get(`seg_${i}_d`));
        if (Number.isNaN(start + end + v + d)) continue;
        const suitability = classifyVelocity(v, d, fishType);
        createFlowSegment({
          project_id: pid, version_id: versionId, section_id: sectionId,
          segment_index: i, start_m: start, end_m: end, velocity_ms: v, depth_m: d, suitability,
        });
        if (suitability === "danger") {
          const t = THRESHOLDS[fishType];
          const isHigh = v > t.maxVelocity;
          const isLow = d < t.minDepth;
          createUnsuitableZone({
            project_id: pid, version_id: versionId, section_id: sectionId,
            zone_type: isHigh ? "high_velocity" : isLow ? "low_depth" : "turbulence",
            start_m: start, end_m: end, max_velocity: v, min_depth: d,
            description: `子段#${i}: ${isHigh ? "流速超标" : isLow ? "水深不足" : "流态异常"} v=${v}m/s, d=${d}m`,
          });
        }
      }
      clearAnomalies(pid, versionId);
      regenerateAnomalies(pid, versionId, fishType);
      return json({ ok: true });
    }
    case "add_version":
      createVersion({
        project_id: pid,
        version_tag: String(form.get("version_tag")),
        batch_no: String(form.get("batch_no")),
        is_current: form.get("is_current") === "1",
        author: String(form.get("author") || "系统"),
        note: String(form.get("note") || "") || null,
      });
      return json({ ok: true });
    case "use_version":
      setCurrentVersion(pid, Number(form.get("id")));
      return json({ ok: true });
    case "resolve_anomaly":
      resolveAnomaly(Number(form.get("id")));
      return json({ ok: true });
  }
  return json({ ok: false }, { status: 400 });
}

type TabKey = "sections" | "velocity" | "zones" | "versions" | "anomalies";

export default function ProjectWorkbench() {
  const data = useLoaderData<typeof loader>();
  const nav = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  const [tab, setTab] = useState<TabKey>("sections");
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(
    data.sections[0]?.id ?? null
  );
  const [showBasicEdit, setShowBasicEdit] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showRoughnessModal, setShowRoughnessModal] = useState(false);
  const [showObstacleModal, setShowObstacleModal] = useState(false);

  const selectedSection = data.sections.find((s) => s.id === selectedSectionId);
  const segments = selectedSection ? (data.segmentsBySection as any)[selectedSection.id] ?? [] : [];
  const zones = selectedSection ? (data.zonesBySection as any)[selectedSection.id] ?? [] : [];
  const wls = selectedSection ? (data.waterLevelsBySection as any)[selectedSection.id] ?? [] : [];
  const rss = selectedSection ? (data.roughnessBySection as any)[selectedSection.id] ?? [] : [];
  const obs = selectedSection ? (data.obstaclesBySection as any)[selectedSection.id] ?? [] : [];
  const busy = nav.state !== "idle";

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">🔬 {data.project.name}</div>
          <div className="page-subtitle">
            {data.project.code} · {data.project.station_name} · {data.project.river_name}
            {"  · 当前版本 "}
            <strong style={{ color: "var(--color-primary)" }}>{data.currentVersion.version_tag}</strong>
            {" ("}{data.currentVersion.batch_no}{")"}
          </div>
        </div>
        <div className="section-actions">
          {data.project.has_anomaly ? (
            <span className="badge badge-danger"><span className="dot"></span>异常 {data.project.anomaly_count} 项</span>
          ) : (
            <span className="badge badge-success"><span className="dot"></span>数据正常</span>
          )}
          <select
            className="form-input"
            style={{ width: 220 }}
            value={data.currentVersion.id}
            onChange={(e) => navigate(`/projects/${data.project.id}?vid=${e.target.value}`)}
          >
            {data.versions.map((v: any) => (
              <option key={v.id} value={v.id}>
                {v.version_tag} {v.is_current ? "(当前)" : ""} — {v.batch_no}
              </option>
            ))}
          </select>
          <Link to={`/projects/${data.project.id}/report`} className="btn btn-secondary">📄 导出报告</Link>
          <Form method="post" style={{ display: "inline" }}>
            <input type="hidden" name="_action" value="set_status" />
            <input type="hidden" name="status" value={data.project.status === "completed" ? "in_progress" : "completed"} />
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {data.project.status === "completed" ? "↻ 恢复编辑" : "✓ 标记完成"}
            </button>
          </Form>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon">📐</div><div className="stat-value metric-value">{data.summary.total_sections}</div><div className="stat-label">评估断面</div></div>
        <div className="stat-card"><div className="stat-icon">🧭</div><div className="stat-value metric-value">{data.summary.total_segments}</div><div className="stat-label">流速子段</div></div>
        <div className="stat-card success"><div className="stat-icon">✅</div><div className="stat-value metric-value">{(data.summary.suitability_rate * 100).toFixed(1)}%</div><div className="stat-label">流速适宜率</div></div>
        <div className="stat-card danger"><div className="stat-icon">🚫</div><div className="stat-value metric-value">{data.summary.unsuitable_zones}</div><div className="stat-label">不适宜区域</div></div>
      </div>

      <div className="workbench">
        <aside className="workbench-side">
          <div className="card">
            <div className="card-header">
              <div className="card-title">ℹ️ 项目信息</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBasicEdit(true)}>编辑</button>
            </div>
            <div className="card-body">
              <div className="info-row"><span className="info-label">项目编号</span><span className="info-value metric-value">{data.project.code}</span></div>
              <div className="info-row"><span className="info-label">状态</span><span>{statusLabel(data.project.status)}</span></div>
              <div className="info-row"><span className="info-label">电站</span><span>{data.project.station_name}</span></div>
              <div className="info-row"><span className="info-label">河流</span><span>{data.project.river_name}</span></div>
              <div className="info-row"><span className="info-label">河流类型</span><span>{riverTypeLabel(data.project.river_type)}</span></div>
              <div className="info-row"><span className="info-label">目标鱼种</span><span>{fishTypeLabel(data.project.fish_type)}</span></div>
              <div className="info-row"><span className="info-label">设计人</span><span>{data.project.designer}</span></div>
              <div className="info-row"><span className="info-label">创建时间</span><span style={{ fontSize: 12 }}>{data.project.created_at.slice(0, 16).replace("T", " ")}</span></div>
              {data.project.description && (
                <div style={{ marginTop: 10, padding: 10, background: "var(--color-bg)", borderRadius: 6, fontSize: 12, color: "var(--color-text-muted)" }}>
                  {data.project.description}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">📐 断面列表</div></div>
            <div className="card-body" style={{ padding: 12 }}>
              {data.sections.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 12px" }}>
                  <div className="empty-state-icon">📐</div>
                  <div className="empty-state-title">暂无断面</div>
                  <div className="empty-state-desc">请先添加评估断面</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {data.sections.map((s: any) => (
                    <button key={s.id} className="btn btn-ghost"
                      style={{
                        justifyContent: "flex-start",
                        background: selectedSectionId === s.id ? "rgba(26, 95, 122, 0.08)" : "transparent",
                        border: selectedSectionId === s.id ? "1px solid var(--color-primary)" : "1px solid transparent",
                        color: selectedSectionId === s.id ? "var(--color-primary)" : "var(--color-text)",
                      }}
                      onClick={() => setSelectedSectionId(s.id)}>
                      <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{s.station_no}</span>
                      <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 8 }}>{s.name}</span>
                      <span style={{ marginLeft: "auto", fontSize: 11, opacity: 0.6 }}>{s.width}×{s.depth}m</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">🐟 流速标准</div></div>
            <div className="card-body" style={{ fontSize: 12 }}>
              <div className="info-row"><span className="info-label">目标鱼种</span><span>{fishTypeLabel(data.project.fish_type)}</span></div>
              <div className="info-row"><span className="info-label">适宜流速</span><span className="metric-value">{THRESHOLDS[data.project.fish_type as FishType].optimalMin}–{THRESHOLDS[data.project.fish_type as FishType].optimalMax} m/s</span></div>
              <div className="info-row"><span className="info-label">耐受范围</span><span className="metric-value">{THRESHOLDS[data.project.fish_type as FishType].minVelocity}–{THRESHOLDS[data.project.fish_type as FishType].maxVelocity} m/s</span></div>
              <div className="info-row"><span className="info-label">最小水深</span><span className="metric-value">{THRESHOLDS[data.project.fish_type as FishType].minDepth} m</span></div>
            </div>
          </div>
        </aside>

        <section className="workbench-main">
          <div className="tabs">
            <button className={"tab" + (tab === "sections" ? " active" : "")} onClick={() => setTab("sections")}>📐 断面与水力参数</button>
            <button className={"tab" + (tab === "velocity" ? " active" : "")} onClick={() => setTab("velocity")}>🧭 分段流速</button>
            <button className={"tab" + (tab === "zones" ? " active" : "")} onClick={() => setTab("zones")}>🚫 不适宜区</button>
            <button className={"tab" + (tab === "versions" ? " active" : "")} onClick={() => setTab("versions")}>🕘 版本历史</button>
            <button className={"tab" + (tab === "anomalies" ? " active" : "")} onClick={() => setTab("anomalies")}>
              ⚠️ 异常数据
              {data.anomalies.filter((a: any) => !a.resolved).length > 0 && (
                <span className="badge badge-danger" style={{ marginLeft: 6 }}>{data.anomalies.filter((a: any) => !a.resolved).length}</span>
              )}
            </button>
          </div>

          {tab === "sections" && (
            <SectionsPanel
              data={data} selectedSection={selectedSection} segments={segments}
              wls={wls} rss={rss} obs={obs} busy={busy}
              submit={submit} currentVersionId={data.currentVersion.id}
              editingSection={editingSection} setEditingSection={setEditingSection}
              showAdd={showAddSection} setShowAdd={setShowAddSection}
              setSelected={setSelectedSectionId}
              showWater={showWaterModal} setShowWater={setShowWaterModal}
              showRough={showRoughnessModal} setShowRough={setShowRoughnessModal}
              showObst={showObstacleModal} setShowObst={setShowObstacleModal}
            />
          )}
          {tab === "velocity" && (
            <VelocityPanel data={data} selectedSection={selectedSection} busy={busy} submit={submit} currentVersionId={data.currentVersion.id} />
          )}
          {tab === "zones" && (
            <ZonesPanel selectedSection={selectedSection} zones={zones} zonesBySection={data.zonesBySection as any} sections={data.sections as any} />
          )}
          {tab === "versions" && (
            <VersionsPanel data={data} busy={busy} submit={submit} onSwitch={(vid: number) => navigate(`/projects/${data.project.id}?vid=${vid}`)} showAdd={showAddVersion} setShowAdd={setShowAddVersion} />
          )}
          {tab === "anomalies" && (
            <AnomaliesPanel anomalies={data.anomalies as any} sections={data.sections as any} busy={busy} submit={submit} />
          )}
        </section>
      </div>

      {showBasicEdit && <BasicEditModal project={data.project as any} onClose={() => setShowBasicEdit(false)} submit={submit} busy={busy} />}
      {showAddSection && (
        <SectionModal title="添加新断面" versionId={data.currentVersion.id} onClose={() => setShowAddSection(false)} submit={submit} busy={busy} />
      )}
      {editingSection && (
        <SectionModal title="编辑断面" initial={editingSection} versionId={data.currentVersion.id} onClose={() => setEditingSection(null)} submit={submit} busy={busy} />
      )}
      {showWaterModal && selectedSection && (
        <WaterLevelModal sectionId={selectedSection.id} versionId={data.currentVersion.id} onClose={() => setShowWaterModal(false)} submit={submit} busy={busy} />
      )}
      {showRoughnessModal && selectedSection && (
        <RoughnessModal sectionId={selectedSection.id} versionId={data.currentVersion.id} onClose={() => setShowRoughnessModal(false)} submit={submit} busy={busy} />
      )}
      {showObstacleModal && selectedSection && (
        <ObstacleModal sectionId={selectedSection.id} versionId={data.currentVersion.id} onClose={() => setShowObstacleModal(false)} submit={submit} busy={busy} />
      )}
      {showAddVersion && (
        <VersionModal project={data.project} onClose={() => setShowAddVersion(false)} submit={submit} busy={busy} />
      )}
    </div>
  );
}

function SectionsPanel(props: any) {
  const { data, selectedSection, segments, wls, rss, obs, busy, submit, currentVersionId, editingSection, setEditingSection, showAdd, setShowAdd, setSelected, showWater, setShowWater, showRough, setShowRough, showObst, setShowObst } = props;
  const [tab, setTab] = useState<"basic" | "water" | "roughness" | "obstacles">("basic");
  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title">📐 {selectedSection ? `${selectedSection.station_no} ${selectedSection.name}` : "断面与水力参数"}</div>
          <div className="section-actions">
            <button className="btn btn-sm btn-secondary" onClick={() => setEditingSection(selectedSection)} disabled={!selectedSection}>✏️ 编辑</button>
            <button className="btn btn-sm btn-primary" onClick={() => setShowAdd(true)}>➕ 添加断面</button>
          </div>
        </div>
        <div className="card-body">
          {!selectedSection ? (
            <div className="empty-state">
              <div className="empty-state-icon">📐</div>
              <div className="empty-state-title">未选择断面</div>
              <div className="empty-state-desc">请在左侧选择或新建一个评估断面</div>
            </div>
          ) : (
            <>
              <div className="tabs" style={{ marginBottom: 16 }}>
                <button className={"tab" + (tab === "basic" ? " active" : "")} onClick={() => setTab("basic")}>基本参数</button>
                <button className={"tab" + (tab === "water" ? " active" : "")} onClick={() => setTab("water")}>💧 水位/流量</button>
                <button className={"tab" + (tab === "roughness" ? " active" : "")} onClick={() => setTab("roughness")}>🧱 糙率参数</button>
                <button className={"tab" + (tab === "obstacles" ? " active" : "")} onClick={() => setTab("obstacles")}>🪨 障碍物</button>
              </div>
              {tab === "basic" && (
                <div>
                  <div className="flow-diagram">
                    <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10 }}>断面流速分布可视化（按子段颜色展示适宜性）</div>
                    {segments.length > 0 ? (
                      <>
                        <div className="flow-track">
                          {segments.map((s: any, i: number) => (
                            <div key={i} className={`flow-segment ${s.suitability}`} title={`${s.start_m}-${s.end_m}m: ${s.velocity_ms}m/s, d=${s.depth_m}m`}>
                              {Number(s.velocity_ms).toFixed(2)}
                            </div>
                          ))}
                        </div>
                        <div className="legend-row">
                          <div className="legend-item"><span className="legend-color safe"></span>适宜</div>
                          <div className="legend-item"><span className="legend-color warning"></span>临界</div>
                          <div className="legend-item"><span className="legend-color danger"></span>不适宜</div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)", fontSize: 13 }}>暂无流速子段数据，请在"分段流速"面板录入</div>
                    )}
                  </div>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">断面桩号</label><input className="form-input" value={selectedSection.station_no} readOnly /></div>
                    <div className="form-group"><label className="form-label">断面名称</label><input className="form-input" value={selectedSection.name} readOnly /></div>
                    <div className="form-group"><label className="form-label">水面宽度 (m)</label><input className="form-input metric-value" value={selectedSection.width} readOnly /></div>
                    <div className="form-group"><label className="form-label">断面水深 (m)</label><input className="form-input metric-value" value={selectedSection.depth} readOnly /></div>
                    <div className="form-group"><label className="form-label">比降 (%)</label><input className="form-input metric-value" value={selectedSection.slope} readOnly /></div>
                    <div className="form-group"><label className="form-label">底部高程 (m)</label><input className="form-input metric-value" value={selectedSection.bottom_elevation} readOnly /></div>
                    <div className="form-group"><label className="form-label">过水面积 (m²)</label><input className="form-input metric-value" value={Number(selectedSection.area).toFixed(3)} readOnly /></div>
                    <div className="form-group"><label className="form-label">湿周 (m)</label><input className="form-input metric-value" value={Number(selectedSection.wetted_perimeter).toFixed(2)} readOnly /></div>
                    <div className="form-group"><label className="form-label">水力半径 (m)</label><input className="form-input metric-value" value={Number(selectedSection.hydraulic_radius).toFixed(3)} readOnly /></div>
                    <div className="form-group full"><label className="form-label">备注</label><textarea className="form-textarea" value={selectedSection.remark ?? ""} readOnly /></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                    <Form method="post" onSubmit={(e) => { if (!confirm(`确定删除断面 ${selectedSection.station_no}？`)) e.preventDefault(); }}>
                      <input type="hidden" name="_action" value="delete_section" />
                      <input type="hidden" name="id" value={selectedSection.id} />
                      <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>🗑️ 删除断面</button>
                    </Form>
                  </div>
                </div>
              )}
              {tab === "water" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>共 {wls.length} 条水位流量记录</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowWater(true)}>➕ 新增记录</button>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>测量日期</th><th>上游(m)</th><th>下游(m)</th><th>水深(m)</th><th>流量(m³/s)</th><th>备注</th><th></th></tr></thead>
                      <tbody>
                        {wls.length === 0 ? (
                          <tr><td colSpan={7}><div className="empty-state" style={{ padding: "24px 12px" }}><div className="empty-state-icon">💧</div><div className="empty-state-title">暂无水位记录</div></div></td></tr>
                        ) : wls.map((w: any) => (
                          <tr key={w.id}>
                            <td>{w.measure_date}</td>
                            <td className="metric-value">{Number(w.upstream_level).toFixed(2)}</td>
                            <td className="metric-value">{Number(w.downstream_level).toFixed(2)}</td>
                            <td className="metric-value">{Number(w.water_depth).toFixed(2)}</td>
                            <td className="metric-value">{Number(w.flow_rate).toFixed(2)}</td>
                            <td style={{ color: "var(--color-text-muted)" }}>{w.remark ?? "—"}</td>
                            <td>
                              <Form method="post"><input type="hidden" name="_action" value="delete_water_level" /><input type="hidden" name="id" value={w.id} />
                                <button type="submit" className="link-btn danger" disabled={busy}>删除</button>
                              </Form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {tab === "roughness" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>糙率参数用于曼宁公式计算流速</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowRough(true)} disabled={rss.length > 0}>➕ 录入糙率</button>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>类型</th><th>糙率 n 值</th><th>说明</th><th></th></tr></thead>
                      <tbody>
                        {rss.length === 0 ? (
                          <tr><td colSpan={4}><div className="empty-state" style={{ padding: "24px 12px" }}><div className="empty-state-icon">🧱</div><div className="empty-state-title">未录入糙率</div></div></td></tr>
                        ) : rss.map((r: any) => (
                          <tr key={r.id}>
                            <td>{roughnessTypeLabel(r.type)}</td>
                            <td className="metric-value" style={{ fontWeight: 600, color: "var(--color-primary)" }}>{Number(r.n_value).toFixed(4)}</td>
                            <td style={{ color: "var(--color-text-muted)" }}>{r.description ?? "—"}</td>
                            <td>
                              <Form method="post"><input type="hidden" name="_action" value="delete_roughness" /><input type="hidden" name="id" value={r.id} />
                                <button type="submit" className="link-btn danger" disabled={busy}>删除</button>
                              </Form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {tab === "obstacles" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div style={{ fontSize: 13, color: "var(--color-text-muted)" }}>抛石、墩柱、底槛等障碍物影响局部流速分布</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowObst(true)}>➕ 添加障碍物</button>
                  </div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>类型</th><th>位置(m)</th><th>高度(m)</th><th>宽度(m)</th><th>描述</th><th></th></tr></thead>
                      <tbody>
                        {obs.length === 0 ? (
                          <tr><td colSpan={6}><div className="empty-state" style={{ padding: "24px 12px" }}><div className="empty-state-icon">🪨</div><div className="empty-state-title">未记录障碍物</div></div></td></tr>
                        ) : obs.map((o: any) => (
                          <tr key={o.id}>
                            <td>{obstacleTypeLabel(o.type)}</td>
                            <td className="metric-value">{Number(o.position_m).toFixed(2)}</td>
                            <td className="metric-value">{Number(o.height_m).toFixed(2)}</td>
                            <td className="metric-value">{Number(o.width_m).toFixed(2)}</td>
                            <td style={{ color: "var(--color-text-muted)" }}>{o.description ?? "—"}</td>
                            <td>
                              <Form method="post"><input type="hidden" name="_action" value="delete_obstacle" /><input type="hidden" name="id" value={o.id} />
                                <button type="submit" className="link-btn danger" disabled={busy}>删除</button>
                              </Form>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function VelocityPanel({ data, selectedSection, busy, submit, currentVersionId }: any) {
  const project = data.project;
  const segmentsInit: any[] = (selectedSection ? (data.segmentsBySection as any)[selectedSection.id] ?? [] : []).map((s: any) => ({ ...s }));
  const [segs, setSegs] = useState<any[]>(segmentsInit.length ? segmentsInit : [{ start_m: 0, end_m: 1, velocity_ms: 0.5, depth_m: 1.0 }]);
  const fishType = project.fish_type as FishType;
  const t = THRESHOLDS[fishType];
  function addSeg() {
    const last = segs[segs.length - 1] ?? { end_m: 0 };
    setSegs([...segs, { start_m: Number(last.end_m) || 0, end_m: (Number(last.end_m) || 0) + 1, velocity_ms: 0.5, depth_m: 1.0 }]);
  }
  function removeSeg(i: number) { setSegs(segs.filter((_, idx) => idx !== i)); }
  function updateSeg(i: number, patch: any) { const next = segs.slice(); next[i] = { ...next[i], ...patch }; setSegs(next); }

  if (!selectedSection) {
    return (
      <div className="card"><div className="card-body">
        <div className="empty-state"><div className="empty-state-icon">🧭</div><div className="empty-state-title">请先选择一个断面</div></div>
      </div></div>
    );
  }
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🧭 分段流速 — {selectedSection.station_no} {selectedSection.name}</div>
        <div className="section-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => setSegs(segmentsInit.slice())}>↺ 重置</button>
          <button className="btn btn-sm btn-secondary" onClick={addSeg}>➕ 增加子段</button>
        </div>
      </div>
      <div className="card-body">
        <div className="alert alert-info">
          <span className="alert-icon">ℹ️</span>
          <div>
            <strong>适宜性判定</strong>：本鱼道目标鱼种为 <strong>{fishTypeLabel(fishType)}</strong>。
            流速 {t.optimalMin}–{t.optimalMax} m/s 为 <span className="badge badge-success">适宜</span>，
            超出 {t.minVelocity}–{t.maxVelocity} m/s 或水深＜{t.minDepth}m 为 <span className="badge badge-danger">不适宜</span>。
          </div>
        </div>
        <div className="flow-diagram">
          <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 10 }}>实时预览</div>
          {segs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "var(--color-text-muted)" }}>请添加流速子段</div>
          ) : (
            <>
              <div className="flow-track">
                {segs.map((s, i) => {
                  const suit = classifyVelocity(Number(s.velocity_ms), Number(s.depth_m), fishType);
                  return <div key={i} className={`flow-segment ${suit}`}>{Number(s.velocity_ms).toFixed(2)}</div>;
                })}
              </div>
              <div className="legend-row">
                <div className="legend-item"><span className="legend-color safe"></span>适宜</div>
                <div className="legend-item"><span className="legend-color warning"></span>临界</div>
                <div className="legend-item"><span className="legend-color danger"></span>不适宜</div>
              </div>
            </>
          )}
        </div>
        <Form method="post" id="seg-form">
          <input type="hidden" name="_action" value="save_segments" />
          <input type="hidden" name="section_id" value={selectedSection.id} />
          <input type="hidden" name="version_id" value={currentVersionId} />
          <input type="hidden" name="seg_count" value={segs.length} />
          {segs.map((s, i) => {
            const suit = classifyVelocity(Number(s.velocity_ms), Number(s.depth_m), fishType);
            const borderColor = suit === "danger" ? "rgba(239,68,68,0.4)" : suit === "warning" ? "rgba(245,158,11,0.4)" : "var(--color-border)";
            const bgColor = suit === "danger" ? "rgba(239,68,68,0.04)" : suit === "warning" ? "rgba(245,158,11,0.04)" : "transparent";
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 1fr 1fr 40px", gap: 10, alignItems: "center", marginBottom: 8, padding: 10, border: `1px solid ${borderColor}`, borderRadius: 8, background: bgColor }}>
                <span style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>#{i}</span>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">起点(m)</label>
                  <input className="form-input metric-value" type="number" step="0.01" name={`seg_${i}_start`} value={s.start_m} onChange={(e) => updateSeg(i, { start_m: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">终点(m)</label>
                  <input className="form-input metric-value" type="number" step="0.01" name={`seg_${i}_end`} value={s.end_m} onChange={(e) => updateSeg(i, { end_m: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">流速(m/s)</label>
                  <input className="form-input metric-value" type="number" step="0.01" name={`seg_${i}_v`} value={s.velocity_ms} onChange={(e) => updateSeg(i, { velocity_ms: e.target.value })} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">水深(m)</label>
                  <input className="form-input metric-value" type="number" step="0.01" name={`seg_${i}_d`} value={s.depth_m} onChange={(e) => updateSeg(i, { depth_m: e.target.value })} />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeSeg(i)} style={{ padding: "6px 8px" }}>🗑️</button>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={addSeg}>➕ 增加子段</button>
            <button type="submit" form="seg-form" className="btn btn-primary" disabled={busy}>💾 保存并重新评估</button>
          </div>
        </Form>
      </div>
    </div>
  );
}

function ZonesPanel({ selectedSection, zones, zonesBySection, sections }: any) {
  if (selectedSection) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">🚫 不适宜区 — {selectedSection.station_no} {selectedSection.name}</div>
          <span className="badge badge-danger">共 {zones.length} 处</span>
        </div>
        <div className="card-body">
          {zones.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">该断面未发现不适宜区</div></div>
          ) : zones.map((z: any) => (
            <div className="unsuitable-zone" key={z.id}>
              <div className="unsuitable-zone-title">[{zoneTypeLabel(z.zone_type)}] {Number(z.start_m).toFixed(2)} – {Number(z.end_m).toFixed(2)} m</div>
              <div className="unsuitable-zone-desc">{z.description}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>
                最大流速 {Number(z.max_velocity).toFixed(3)} m/s · 最小水深 {Number(z.min_depth).toFixed(2)} m
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  const list = sections.map((s: any) => ({ section: s, zones: zonesBySection[s.id] ?? [] }));
  const totalZones = list.reduce((acc: number, x: any) => acc + x.zones.length, 0);
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🚫 全项目不适宜区汇总</div>
        <span className="badge badge-danger">共 {totalZones} 处</span>
      </div>
      <div className="card-body">
        {totalZones === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">本版本无不适宜区</div></div>
        ) : list.filter((x: any) => x.zones.length > 0).map((x: any) => (
          <div key={x.section.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "var(--color-primary)" }}>
              {x.section.station_no} {x.section.name} <span className="badge badge-danger">{x.zones.length} 处</span>
            </div>
            {x.zones.map((z: any) => (
              <div className="unsuitable-zone" key={z.id}>
                <div className="unsuitable-zone-title">[{zoneTypeLabel(z.zone_type)}] {Number(z.start_m).toFixed(2)} – {Number(z.end_m).toFixed(2)} m</div>
                <div className="unsuitable-zone-desc">{z.description}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function VersionsPanel({ data, busy, submit, onSwitch, showAdd, setShowAdd }: any) {
  const stats = data.versionStats as Record<number, { sections: number; segments: number; zones: number; anomalies: number }>;
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">🕘 版本 / 批次历史</div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>➕ 新建版本</button>
      </div>
      <div className="card-body">
        <div className="version-timeline">
          {data.versions.map((v: any) => {
            const s = stats?.[v.id] ?? { sections: 0, segments: 0, zones: 0, anomalies: 0 };
            return (
            <div key={v.id} className={"version-item" + (v.is_current ? " current" : "")}>
              <div>
                <span className="version-tag-badge">{v.version_tag}</span>
                <strong>{v.batch_no}</strong>
                {v.is_current && <span className="badge badge-success" style={{ marginLeft: 8 }}><span className="dot"></span>当前使用</span>}
              </div>
              <div className="version-meta">{v.author} · {v.created_at.slice(0, 16).replace("T", " ")}</div>
              {v.note && <div className="version-note">{v.note}</div>}
              <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-muted)" }}>
                📐 {s.sections} 断面 · 🌊 {s.segments} 子段 · ⚠️ {s.zones} 不适宜区 · 🔴 {s.anomalies} 异常
              </div>
              <div style={{ marginTop: 8 }}>
                {!v.is_current && (
                  <Form method="post" style={{ display: "inline" }}>
                    <input type="hidden" name="_action" value="use_version" />
                    <input type="hidden" name="id" value={v.id} />
                    <button type="submit" className="btn btn-secondary btn-sm" disabled={busy}>切换到此版本</button>
                  </Form>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => onSwitch(v.id)} style={{ marginLeft: 8 }}>仅预览</button>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AnomaliesPanel({ anomalies, sections, busy, submit }: any) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">⚠️ 异常数据与提示</div>
        <span className={"badge " + (anomalies.filter((a: any) => !a.resolved).length ? "badge-danger" : "badge-success")}>
          {anomalies.filter((a: any) => !a.resolved).length} 项未处理
        </span>
      </div>
      <div className="card-body">
        {anomalies.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-title">本版本无异常数据</div></div>
        ) : anomalies.map((a: any) => {
          const section = sections.find((s: any) => s.id === a.section_id);
          return (
            <div key={a.id} className={"alert " + (a.severity === "danger" ? "alert-danger" : "alert-warning")}
              style={{ opacity: a.resolved ? 0.5 : 1, textDecoration: a.resolved ? "line-through" : "none" }}>
              <span className="alert-icon">{a.severity === "danger" ? "🔴" : "🟡"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>
                  <span className="badge" style={{ background: "rgba(0,0,0,0.05)", color: "inherit", marginRight: 6 }}>{anomalyTypeLabel(a.type)}</span>
                  {section && <span style={{ color: "var(--color-primary)", marginRight: 6 }}>[{section.station_no}]</span>}
                  {a.message}
                </div>
                {(a.field || a.value) && <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>字段：{a.field ?? "—"} · 当前值：{a.value ?? "—"}</div>}
                <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>记录于 {a.created_at.slice(0, 16).replace("T", " ")}</div>
              </div>
              {!a.resolved ? (
                <Form method="post"><input type="hidden" name="_action" value="resolve_anomaly" /><input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="btn btn-sm btn-secondary" disabled={busy}>标记已处理</button>
                </Form>
              ) : <span className="badge badge-success"><span className="dot"></span>已处理</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: any) {
  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function BasicEditModal({ project, onClose, submit, busy }: any) {
  return (
    <Modal title="编辑项目基本信息" onClose={onClose}>
      <Form method="post" onSubmit={(e) => { submit(e.currentTarget); onClose(); e.preventDefault(); }}>
        <input type="hidden" name="_action" value="update_basic" />
        <div className="form-grid">
          <div className="form-group full"><label className="form-label">项目名称</label><input className="form-input" name="name" defaultValue={project.name} /></div>
          <div className="form-group"><label className="form-label">电站名称</label><input className="form-input" name="station_name" defaultValue={project.station_name} /></div>
          <div className="form-group"><label className="form-label">河流名称</label><input className="form-input" name="river_name" defaultValue={project.river_name} /></div>
          <div className="form-group"><label className="form-label">河流类型</label>
            <select className="form-select" name="river_type" defaultValue={project.river_type}>
              <option value="mountain">山区河流</option><option value="plain">平原河流</option><option value="transition">过渡段河流</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">目标鱼种</label>
            <select className="form-select" name="fish_type" defaultValue={project.fish_type}>
              <option value="general">综合多鱼种</option>
              <option value="salmon">鲑科（激流型）</option>
              <option value="carp">鲤科（缓流型）</option>
              <option value="eel">鳗鲡（降海型）</option>
              <option value="catfish">鲶形目（底栖型）</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">设计人</label><input className="form-input" name="designer" defaultValue={project.designer} /></div>
          <div className="form-group"><label className="form-label">状态</label>
            <select className="form-select" name="status" defaultValue={project.status}>
              <option value="draft">草稿</option><option value="in_progress">进行中</option><option value="completed">已完成</option><option value="archived">已归档</option>
            </select>
          </div>
          <div className="form-group full"><label className="form-label">项目描述</label>
            <textarea className="form-textarea" name="description" defaultValue={project.description ?? ""}></textarea>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>保存</button>
        </div>
      </Form>
    </Modal>
  );
}

function SectionModal({ title, initial, versionId, onClose, submit, busy }: any) {
  return (
    <Modal title={title} onClose={onClose}>
      <Form method="post" onSubmit={(e) => { submit(e.currentTarget); onClose(); e.preventDefault(); }}>
        <input type="hidden" name="_action" value={initial ? "edit_section" : "add_section"} />
        {initial && <input type="hidden" name="id" value={initial.id} />}
        <input type="hidden" name="version_id" value={versionId} />
        <div className="form-grid">
          <div className="form-group"><label className="form-label">断面桩号<span className="required">*</span></label>
            <input className="form-input" name="station_no" defaultValue={initial?.station_no ?? "CS-0+000"} /></div>
          <div className="form-group"><label className="form-label">断面名称<span className="required">*</span></label>
            <input className="form-input" name="name" defaultValue={initial?.name ?? ""} /></div>
          <div className="form-group"><label className="form-label">水面宽度(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="width" defaultValue={initial?.width ?? 3.0} /></div>
          <div className="form-group"><label className="form-label">断面水深(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="depth" defaultValue={initial?.depth ?? 1.5} /></div>
          <div className="form-group"><label className="form-label">比降(%)</label>
            <input className="form-input metric-value" type="number" step="0.001" name="slope" defaultValue={initial?.slope ?? 0.02} /></div>
          <div className="form-group"><label className="form-label">底部高程(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="bottom_elevation" defaultValue={initial?.bottom_elevation ?? 0} /></div>
          <div className="form-group full"><label className="form-label">备注</label>
            <textarea className="form-textarea" name="remark" defaultValue={initial?.remark ?? ""}></textarea></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>{initial ? "保存修改" : "添加断面"}</button>
        </div>
      </Form>
    </Modal>
  );
}

function WaterLevelModal({ sectionId, versionId, onClose, submit, busy }: any) {
  return (
    <Modal title="新增水位/流量记录" onClose={onClose}>
      <Form method="post" onSubmit={(e) => { submit(e.currentTarget); onClose(); e.preventDefault(); }}>
        <input type="hidden" name="_action" value="add_water_level" />
        <input type="hidden" name="section_id" value={sectionId} />
        <input type="hidden" name="version_id" value={versionId} />
        <div className="form-grid">
          <div className="form-group"><label className="form-label">测量日期</label>
            <input className="form-input" type="date" name="measure_date" defaultValue={new Date().toISOString().slice(0, 10)} /></div>
          <div className="form-group"><label className="form-label">上游水位(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="upstream_level" defaultValue="0" /></div>
          <div className="form-group"><label className="form-label">下游水位(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="downstream_level" defaultValue="0" /></div>
          <div className="form-group"><label className="form-label">断面水深(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="water_depth" defaultValue="0" /></div>
          <div className="form-group full"><label className="form-label">流量(m³/s)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="flow_rate" defaultValue="0" /></div>
          <div className="form-group full"><label className="form-label">备注</label>
            <textarea className="form-textarea" name="remark"></textarea></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>保存记录</button>
        </div>
      </Form>
    </Modal>
  );
}

function RoughnessModal({ sectionId, versionId, onClose, submit, busy }: any) {
  return (
    <Modal title="录入糙率参数" onClose={onClose}>
      <Form method="post" onSubmit={(e) => { submit(e.currentTarget); onClose(); e.preventDefault(); }}>
        <input type="hidden" name="_action" value="add_roughness" />
        <input type="hidden" name="section_id" value={sectionId} />
        <input type="hidden" name="version_id" value={versionId} />
        <div className="form-grid">
          <div className="form-group"><label className="form-label">材质类型</label>
            <select className="form-select" name="type" defaultValue="mixed">
              <option value="concrete">混凝土</option>
              <option value="stone">浆砌石/块石</option>
              <option value="earth">土质</option>
              <option value="vegetation">植被附着</option>
              <option value="mixed">混合材质</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">糙率 n 值</label>
            <input className="form-input metric-value" type="number" step="0.001" name="n_value" defaultValue="0.035" />
          </div>
          <div className="form-group full"><label className="form-label">描述</label>
            <textarea className="form-textarea" name="description"></textarea>
          </div>
        </div>
        <div className="alert alert-info" style={{ marginTop: 16 }}>
          <span className="alert-icon">ℹ️</span>
          <div style={{ fontSize: 12 }}>参考取值：混凝土 0.012–0.018；块石 0.03–0.05；土质 0.022–0.035；植被 0.05–0.15。</div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>保存</button>
        </div>
      </Form>
    </Modal>
  );
}

function ObstacleModal({ sectionId, versionId, onClose, submit, busy }: any) {
  return (
    <Modal title="添加障碍物" onClose={onClose}>
      <Form method="post" onSubmit={(e) => { submit(e.currentTarget); onClose(); e.preventDefault(); }}>
        <input type="hidden" name="_action" value="add_obstacle" />
        <input type="hidden" name="section_id" value={sectionId} />
        <input type="hidden" name="version_id" value={versionId} />
        <div className="form-grid">
          <div className="form-group"><label className="form-label">类型</label>
            <select className="form-select" name="type" defaultValue="boulder">
              <option value="boulder">抛石/块石</option>
              <option value="pier">墩柱</option>
              <option value="sill">底槛</option>
              <option value="step">台阶</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div className="form-group"><label className="form-label">位置(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="position_m" defaultValue="0" /></div>
          <div className="form-group"><label className="form-label">高度(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="height_m" defaultValue="0" /></div>
          <div className="form-group"><label className="form-label">宽度(m)</label>
            <input className="form-input metric-value" type="number" step="0.01" name="width_m" defaultValue="0" /></div>
          <div className="form-group full"><label className="form-label">描述</label>
            <textarea className="form-textarea" name="description"></textarea></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>保存</button>
        </div>
      </Form>
    </Modal>
  );
}

function VersionModal({ project, onClose, submit, busy }: any) {
  return (
    <Modal title="新建版本/批次" onClose={onClose}>
      <Form method="post" onSubmit={(e) => { submit(e.currentTarget); onClose(); e.preventDefault(); }}>
        <input type="hidden" name="_action" value="add_version" />
        <div className="form-grid">
          <div className="form-group"><label className="form-label">版本号<span className="required">*</span></label>
            <input className="form-input" name="version_tag" defaultValue="v1.0" placeholder="如 v1.2" /></div>
          <div className="form-group"><label className="form-label">批次号<span className="required">*</span></label>
            <input className="form-input" name="batch_no" defaultValue={`BATCH-${project.code}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`} /></div>
          <div className="form-group"><label className="form-label">作者</label>
            <input className="form-input" name="author" defaultValue={project.designer} /></div>
          <div className="form-group">
            <label className="form-label">设为当前版本</label>
            <div style={{ padding: "6px 0" }}>
              <label style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                <input type="radio" name="is_current" value="1" defaultChecked /> 是
              </label>
              <label style={{ display: "inline-flex", gap: 6, alignItems: "center", marginLeft: 16 }}>
                <input type="radio" name="is_current" value="0" /> 否
              </label>
            </div>
          </div>
          <div className="form-group full"><label className="form-label">版本说明</label>
            <textarea className="form-textarea" name="note" placeholder="描述本版本主要变更，如：补充XX断面数据、修正糙率..."></textarea></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>创建版本</button>
        </div>
      </Form>
    </Modal>
  );
}

