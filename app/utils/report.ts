import type {
  Project,
  CrossSection,
  WaterLevel,
  Roughness,
  Obstacle,
  FlowSegment,
  UnsuitableZone,
  Version,
  AnomalyRecord,
} from "~/types";

export interface ProjectSummary {
  total_sections: number;
  total_segments: number;
  safe_segments: number;
  warning_segments: number;
  danger_segments: number;
  unsuitable_zones: number;
  avg_velocity: number;
  max_velocity: number;
  min_velocity: number;
  suitability_rate: number;
}

export function computeSummary(segments: FlowSegment[], zones: UnsuitableZone[]): ProjectSummary {
  const total_segments = segments.length;
  const safe_segments = segments.filter((s) => s.suitability === "safe").length;
  const warning_segments = segments.filter((s) => s.suitability === "warning").length;
  const danger_segments = segments.filter((s) => s.suitability === "danger").length;
  const velocities = segments.map((s) => s.velocity_ms);
  const avg_velocity = velocities.length ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
  const max_velocity = velocities.length ? Math.max(...velocities) : 0;
  const min_velocity = velocities.length ? Math.min(...velocities) : 0;
  const suitability_rate = total_segments ? safe_segments / total_segments : 0;
  return {
    total_segments,
    safe_segments,
    warning_segments,
    danger_segments,
    unsuitable_zones: zones.length,
    avg_velocity,
    max_velocity,
    min_velocity,
    suitability_rate,
    total_sections: new Set(segments.map((s) => s.section_id)).size,
  };
}

export interface ReportPayload {
  project: Project;
  version: Version;
  sections: CrossSection[];
  waterLevelsBySection: Record<number, WaterLevel[]>;
  roughnessBySection: Record<number, Roughness[]>;
  obstaclesBySection: Record<number, Obstacle[]>;
  segmentsBySection: Record<number, FlowSegment[]>;
  zonesBySection: Record<number, UnsuitableZone[]>;
  anomalies: AnomalyRecord[];
  summary: ProjectSummary;
  generated_at: string;
}

export function formatDate(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function generateTextReport(p: ReportPayload): string {
  const lines: string[] = [];
  lines.push("=".repeat(72));
  lines.push("  小型水电站鱼道流速评估报告");
  lines.push("=".repeat(72));
  lines.push(`生成时间: ${formatDate(p.generated_at)}`);
  lines.push("");
  lines.push("【一、项目基本信息】");
  lines.push(`  项目编号: ${p.project.code}`);
  lines.push(`  项目名称: ${p.project.name}`);
  lines.push(`  所在电站: ${p.project.station_name}`);
  lines.push(`  所属河流: ${p.project.river_name}`);
  lines.push(`  河流类型: ${riverTypeLabel(p.project.river_type)}`);
  lines.push(`  目标鱼种: ${fishTypeLabel(p.project.fish_type)}`);
  lines.push(`  设计人员: ${p.project.designer}`);
  lines.push(`  项目状态: ${statusLabel(p.project.status)}`);
  lines.push(`  当前版本: ${p.version.version_tag} (批次号: ${p.version.batch_no})`);
  lines.push(`  版本作者: ${p.version.author}`);
  lines.push(`  版本说明: ${p.version.note ?? "无"}`);
  lines.push(`  创建时间: ${formatDate(p.project.created_at)}`);
  if (p.project.description) lines.push(`  项目描述: ${p.project.description}`);
  lines.push("");
  lines.push("【二、总体评估摘要】");
  lines.push(`  断面数量: ${p.summary.total_sections}`);
  lines.push(`  流速子段总数: ${p.summary.total_segments}`);
  lines.push(`  适宜子段: ${p.summary.safe_segments}`);
  lines.push(`  临界子段: ${p.summary.warning_segments}`);
  lines.push(`  不适宜子段: ${p.summary.danger_segments}`);
  lines.push(`  不适宜区域: ${p.summary.unsuitable_zones} 处`);
  lines.push(`  平均流速: ${p.summary.avg_velocity.toFixed(3)} m/s`);
  lines.push(`  最大流速: ${p.summary.max_velocity.toFixed(3)} m/s`);
  lines.push(`  最小流速: ${p.summary.min_velocity.toFixed(3)} m/s`);
  lines.push(`  流速适宜率: ${(p.summary.suitability_rate * 100).toFixed(1)}%`);
  lines.push("");
  lines.push("【三、断面详细数据】");
  for (const sect of p.sections) {
    lines.push(`  ── 断面 ${sect.station_no} (${sect.name}) ──`);
    lines.push(`    宽度: ${sect.width.toFixed(2)} m | 水深: ${sect.depth.toFixed(2)} m | 比降: ${sect.slope.toFixed(4)}`);
    lines.push(`    过水面积: ${sect.area.toFixed(3)} m² | 湿周: ${sect.wetted_perimeter.toFixed(2)} m | 水力半径: ${sect.hydraulic_radius.toFixed(3)} m`);
    lines.push(`    底部高程: ${sect.bottom_elevation.toFixed(2)} m`);
    const wl = p.waterLevelsBySection[sect.id] ?? [];
    if (wl.length) {
      lines.push(`    水位记录(共${wl.length}条):`);
      for (const w of wl) {
        lines.push(`      · ${w.measure_date}  上游:${w.upstream_level.toFixed(2)} m  下游:${w.downstream_level.toFixed(2)} m  水深:${w.water_depth.toFixed(2)} m  流量:${w.flow_rate.toFixed(2)} m³/s`);
      }
    }
    const rs = p.roughnessBySection[sect.id] ?? [];
    if (rs.length) lines.push(`    糙率: n=${rs[0].n_value} (${roughnessTypeLabel(rs[0].type)})`);
    const obs = p.obstaclesBySection[sect.id] ?? [];
    if (obs.length) {
      lines.push(`    障碍物(共${obs.length}处):`);
      for (const o of obs) {
        lines.push(`      · ${obstacleTypeLabel(o.type)} @ ${o.position_m}m  H=${o.height_m}m  W=${o.width_m}m  ${o.description ?? ""}`);
      }
    }
    const segs = p.segmentsBySection[sect.id] ?? [];
    if (segs.length) {
      lines.push(`    分段流速:`);
      for (const s of segs) {
        lines.push(`      · 段${s.segment_index} [${s.start_m}-${s.end_m}m]  v=${s.velocity_ms.toFixed(3)} m/s  d=${s.depth_m.toFixed(2)} m  [${suitabilityLabel(s.suitability)}]`);
      }
    }
    const zs = p.zonesBySection[sect.id] ?? [];
    if (zs.length) {
      lines.push(`    不适宜区(共${zs.length}处):`);
      for (const z of zs) {
        lines.push(`      · [${zoneTypeLabel(z.zone_type)}] ${z.start_m}-${z.end_m}m  v_max=${z.max_velocity.toFixed(3)}m/s  d_min=${z.min_depth.toFixed(2)}m`);
        lines.push(`        ${z.description}`);
      }
    }
    if (sect.remark) lines.push(`    备注: ${sect.remark}`);
    lines.push("");
  }
  lines.push("【四、异常数据记录】");
  if (p.anomalies.length === 0) {
    lines.push("  本版本未发现异常数据。");
  } else {
    for (const a of p.anomalies) {
      const sev = a.severity === "danger" ? "严重" : "警告";
      lines.push(`  [${sev}] ${a.message}`);
      if (a.field) lines.push(`    字段: ${a.field}  值: ${a.value ?? "N/A"}`);
    }
  }
  lines.push("");
  lines.push("=".repeat(72));
  lines.push("  报告结束");
  lines.push("=".repeat(72));
  return lines.join("\n");
}

export function generateSummaryCsv(p: ReportPayload): string {
  const rows: string[][] = [];
  rows.push(["项目编号", "项目名称", "版本号", "批次号", "断面数", "子段数", "适宜", "临界", "不适宜", "不适宜区", "平均流速", "最大流速", "最小流速", "适宜率", "生成时间"]);
  rows.push([
    p.project.code,
    p.project.name,
    p.version.version_tag,
    p.version.batch_no,
    String(p.summary.total_sections),
    String(p.summary.total_segments),
    String(p.summary.safe_segments),
    String(p.summary.warning_segments),
    String(p.summary.danger_segments),
    String(p.summary.unsuitable_zones),
    p.summary.avg_velocity.toFixed(3),
    p.summary.max_velocity.toFixed(3),
    p.summary.min_velocity.toFixed(3),
    `${(p.summary.suitability_rate * 100).toFixed(1)}%`,
    formatDate(p.generated_at),
  ]);
  rows.push([]);
  rows.push(["断面编号", "断面名称", "子段索引", "区间(m)", "流速(m/s)", "水深(m)", "适宜性"]);
  for (const sect of p.sections) {
    const segs = p.segmentsBySection[sect.id] ?? [];
    for (const s of segs) {
      rows.push([
        sect.station_no,
        sect.name,
        String(s.segment_index),
        `${s.start_m}-${s.end_m}`,
        s.velocity_ms.toFixed(3),
        s.depth_m.toFixed(2),
        suitabilityLabel(s.suitability),
      ]);
    }
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function statusLabel(s: string): string {
  return ({ draft: "草稿", in_progress: "进行中", completed: "已完成", archived: "已归档" } as Record<string, string>)[s] ?? s;
}
export function riverTypeLabel(s: string): string {
  return ({ mountain: "山区河流", plain: "平原河流", transition: "过渡段河流" } as Record<string, string>)[s] ?? s;
}
export function fishTypeLabel(s: string): string {
  return ({ salmon: "鲑科（激流型）", carp: "鲤科（缓流型）", eel: "鳗鲡（降海型）", catfish: "鲶形目（底栖型）", general: "综合多鱼种" } as Record<string, string>)[s] ?? s;
}
export function roughnessTypeLabel(s: string): string {
  return ({ concrete: "混凝土", stone: "浆砌石/块石", earth: "土质", vegetation: "植被附着", mixed: "混合材质" } as Record<string, string>)[s] ?? s;
}
export function obstacleTypeLabel(s: string): string {
  return ({ boulder: "抛石/块石", pier: "墩柱", sill: "底槛", step: "台阶", other: "其他" } as Record<string, string>)[s] ?? s;
}
export function suitabilityLabel(s: string): string {
  return ({ safe: "适宜", warning: "临界", danger: "不适宜" } as Record<string, string>)[s] ?? s;
}
export function zoneTypeLabel(s: string): string {
  return ({ high_velocity: "高速区", low_depth: "浅水区", turbulence: "紊流区", dead_zone: "死水区" } as Record<string, string>)[s] ?? s;
}
export function anomalyTypeLabel(s: string): string {
  return ({ data_inconsistency: "数据不一致", out_of_range: "超出范围", missing_data: "数据缺失", calculation_error: "计算错误" } as Record<string, string>)[s] ?? s;
}
