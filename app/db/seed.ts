import { getDb, runInTransaction } from "./schema";
import {
  createProject,
  createSection,
  createWaterLevel,
  createRoughness,
  createObstacle,
  createFlowSegment,
  createUnsuitableZone,
  createAnomaly,
  getProjectByCode,
  createVersion,
  type CreateSectionInput,
} from "./queries";
import { classifyVelocity } from "~/types";
import type { FishType } from "~/types";

interface SampleProject {
  code: string;
  name: string;
  station_name: string;
  river_name: string;
  river_type: "mountain" | "plain" | "transition";
  fish_type: FishType;
  designer: string;
  description: string;
  status: "draft" | "in_progress" | "completed" | "archived";
  sections: Array<{
    station_no: string;
    name: string;
    width: number;
    depth: number;
    slope: number;
    bottom_elevation: number;
    water_level: {
      upstream: number;
      downstream: number;
      water_depth: number;
      flow_rate: number;
      date: string;
    };
    roughness: { n: number; type: any };
    obstacles: Array<{ type: any; pos: number; h: number; w: number; desc: string }>;
    segments: Array<{ i: number; start: number; end: number; v: number; d: number }>;
    remark?: string;
  }>;
  versions: Array<{ tag: string; batch: string; author: string; note: string; current?: boolean }>;
  anomalies: Array<{
    type: any;
    severity: "warning" | "danger";
    field?: string;
    value?: string;
    message: string;
    section_idx?: number;
  }>;
}

const SAMPLES: SampleProject[] = [
  {
    code: "FD-2024-001",
    name: "青龙水电站鱼道流速评估",
    station_name: "青龙水电站",
    river_name: "青龙河",
    river_type: "mountain",
    fish_type: "salmon",
    designer: "张工",
    description: "青龙水电站位于青龙河中游，装机容量12MW，鱼道总长约320m，为竖缝式鱼道结构。本次评估针对丰水期及枯水期两套运行工况开展断面流速检测。",
    status: "in_progress",
    sections: [
      {
        station_no: "CS-0+000",
        name: "进口控制段",
        width: 3.0,
        depth: 1.8,
        slope: 0.02,
        bottom_elevation: 145.2,
        water_level: { upstream: 147.0, downstream: 146.2, water_depth: 1.8, flow_rate: 3.2, date: "2024-06-15" },
        roughness: { n: 0.03, type: "concrete" },
        obstacles: [{ type: "sill", pos: 2.0, h: 0.3, w: 3.0, desc: "进口底槛，用于调节入流均匀度" }],
        segments: [
          { i: 0, start: 0, end: 1, v: 0.8, d: 1.8 },
          { i: 1, start: 1, end: 2, v: 0.95, d: 1.75 },
          { i: 2, start: 2, end: 3, v: 1.2, d: 1.5 },
        ],
        remark: "进口段流速整体适宜，鱼类上溯条件良好。",
      },
      {
        station_no: "CS-0+080",
        name: "标准段I",
        width: 2.5,
        depth: 1.6,
        slope: 0.02,
        bottom_elevation: 143.6,
        water_level: { upstream: 145.4, downstream: 144.6, water_depth: 1.6, flow_rate: 2.8, date: "2024-06-15" },
        roughness: { n: 0.035, type: "mixed" },
        obstacles: [
          { type: "boulder", pos: 0.8, h: 0.6, w: 0.5, desc: "左侧大块抛石导流墩" },
          { type: "boulder", pos: 1.8, h: 0.6, w: 0.5, desc: "右侧大块抛石导流墩" },
        ],
        segments: [
          { i: 0, start: 0, end: 0.6, v: 1.4, d: 1.55 },
          { i: 1, start: 0.6, end: 1.25, v: 2.1, d: 1.2 },
          { i: 2, start: 1.25, end: 1.9, v: 2.3, d: 1.1 },
          { i: 3, start: 1.9, end: 2.5, v: 1.35, d: 1.5 },
        ],
        remark: "中部竖缝流速偏高，存在局部不适宜区。",
      },
      {
        station_no: "CS-0+160",
        name: "标准段II",
        width: 2.5,
        depth: 1.6,
        slope: 0.02,
        bottom_elevation: 142.0,
        water_level: { upstream: 143.8, downstream: 143.0, water_depth: 1.6, flow_rate: 2.6, date: "2024-06-15" },
        roughness: { n: 0.04, type: "stone" },
        obstacles: [{ type: "step", pos: 0, h: 0.2, w: 2.5, desc: "池室间跌水台阶" }],
        segments: [
          { i: 0, start: 0, end: 0.6, v: 1.0, d: 1.6 },
          { i: 1, start: 0.6, end: 1.25, v: 1.5, d: 1.4 },
          { i: 2, start: 1.25, end: 1.9, v: 1.7, d: 1.3 },
          { i: 3, start: 1.9, end: 2.5, v: 0.95, d: 1.55 },
        ],
      },
      {
        station_no: "CS-0+240",
        name: "转弯段",
        width: 3.2,
        depth: 1.5,
        slope: 0.015,
        bottom_elevation: 140.5,
        water_level: { upstream: 142.2, downstream: 141.5, water_depth: 1.5, flow_rate: 3.0, date: "2024-06-15" },
        roughness: { n: 0.035, type: "mixed" },
        obstacles: [
          { type: "pier", pos: 1.5, h: 1.5, w: 0.4, desc: "中心导流墩，存在绕流涡旋" },
        ],
        segments: [
          { i: 0, start: 0, end: 0.8, v: 0.7, d: 1.45 },
          { i: 1, start: 0.8, end: 1.3, v: 2.6, d: 0.9 },
          { i: 2, start: 1.3, end: 1.8, v: 0.3, d: 0.4 },
          { i: 3, start: 1.8, end: 2.4, v: 2.7, d: 0.85 },
          { i: 4, start: 2.4, end: 3.2, v: 0.75, d: 1.4 },
        ],
        remark: "转弯处存在明显死水区和高速区，建议优化导流墩形状。",
      },
      {
        station_no: "CS-0+320",
        name: "出口扩散段",
        width: 4.5,
        depth: 1.8,
        slope: 0.01,
        bottom_elevation: 138.8,
        water_level: { upstream: 140.6, downstream: 139.8, water_depth: 1.8, flow_rate: 3.2, date: "2024-06-15" },
        roughness: { n: 0.03, type: "concrete" },
        obstacles: [],
        segments: [
          { i: 0, start: 0, end: 1.1, v: 0.55, d: 1.8 },
          { i: 1, start: 1.1, end: 2.25, v: 0.75, d: 1.75 },
          { i: 2, start: 2.25, end: 3.4, v: 0.7, d: 1.75 },
          { i: 3, start: 3.4, end: 4.5, v: 0.5, d: 1.8 },
        ],
      },
    ],
    versions: [
      { tag: "v1.0", batch: "BATCH-FD001-20240410", author: "张工", note: "初版数据录入" },
      { tag: "v1.1", batch: "BATCH-FD001-20240522", author: "李工", note: "补充转弯段断面数据，修正糙率取值", current: true },
      { tag: "v2.0", batch: "BATCH-FD001-20240615", author: "张工", note: "丰水期现场复测批次" },
    ],
    anomalies: [
      { type: "out_of_range", severity: "danger", field: "velocity_ms", value: "2.7", message: "CS-0+240转弯段第4子段流速2.7m/s，超出鲑鱼最大耐受值2.5m/s", section_idx: 3 },
      { type: "out_of_range", severity: "danger", field: "depth_m", value: "0.4", message: "CS-0+240转弯段第3子段水深仅0.4m，低于鲑鱼最小需求0.5m", section_idx: 3 },
      { type: "out_of_range", severity: "warning", field: "velocity_ms", value: "2.3", message: "CS-0+080标准段I第3子段流速达到2.3m/s，接近鲑鱼耐受上限", section_idx: 1 },
      { type: "data_inconsistency", severity: "warning", field: "flow_rate", value: "3.0", message: "CS-0+240转弯段流量与上下游断面差值超过10%，需复核", section_idx: 3 },
    ],
  },
  {
    code: "FD-2024-002",
    name: "白鹤滩小型电站附属鱼道评估",
    station_name: "白鹤滩小型电站",
    river_name: "金沙江支流",
    river_type: "mountain",
    fish_type: "carp",
    designer: "王工程师",
    description: "小型附属鱼道，全长180m，为仿自然通道型，用于缓解大坝对鲤科鱼类洄游的阻隔影响。",
    status: "completed",
    sections: [
      {
        station_no: "IN-001",
        name: "鱼道入口段",
        width: 4.0,
        depth: 1.2,
        slope: 0.012,
        bottom_elevation: 620.0,
        water_level: { upstream: 621.5, downstream: 621.0, water_depth: 1.2, flow_rate: 2.5, date: "2024-03-10" },
        roughness: { n: 0.045, type: "stone" },
        obstacles: [],
        segments: [
          { i: 0, start: 0, end: 1.3, v: 0.45, d: 1.2 },
          { i: 1, start: 1.3, end: 2.7, v: 0.6, d: 1.1 },
          { i: 2, start: 2.7, end: 4.0, v: 0.4, d: 1.15 },
        ],
      },
      {
        station_no: "MD-005",
        name: "中段缓流区",
        width: 5.0,
        depth: 1.0,
        slope: 0.008,
        bottom_elevation: 618.5,
        water_level: { upstream: 619.7, downstream: 619.3, water_depth: 1.0, flow_rate: 2.1, date: "2024-03-10" },
        roughness: { n: 0.06, type: "vegetation" },
        obstacles: [
          { type: "boulder", pos: 1.2, h: 0.7, w: 0.8, desc: "仿真生态石头" },
          { type: "boulder", pos: 3.5, h: 0.6, w: 0.7, desc: "仿真生态石头" },
        ],
        segments: [
          { i: 0, start: 0, end: 1, v: 0.3, d: 0.95 },
          { i: 1, start: 1, end: 2.5, v: 0.5, d: 1.0 },
          { i: 2, start: 2.5, end: 4, v: 0.45, d: 0.95 },
          { i: 3, start: 4, end: 5, v: 0.25, d: 0.9 },
        ],
        remark: "植被附着导致局部流速偏低，但在鲤科适宜范围内。",
      },
      {
        station_no: "EX-009",
        name: "鱼道出口段",
        width: 4.5,
        depth: 1.1,
        slope: 0.01,
        bottom_elevation: 617.2,
        water_level: { upstream: 618.4, downstream: 617.9, water_depth: 1.1, flow_rate: 2.3, date: "2024-03-10" },
        roughness: { n: 0.04, type: "stone" },
        obstacles: [],
        segments: [
          { i: 0, start: 0, end: 1.5, v: 0.5, d: 1.05 },
          { i: 1, start: 1.5, end: 3, v: 0.7, d: 1.0 },
          { i: 2, start: 3, end: 4.5, v: 0.48, d: 1.05 },
        ],
      },
    ],
    versions: [
      { tag: "v1.0", batch: "BATCH-FD002-20240301", author: "王工程师", note: "初次数据录入" },
      { tag: "v1.1", batch: "BATCH-FD002-20240315", author: "王工程师", note: "现场复核后修正糙率参数", current: true },
    ],
    anomalies: [],
  },
  {
    code: "FD-2024-003",
    name: "江口平原堰闸鳗鱼道评估",
    station_name: "江口闸坝",
    river_name: "平江",
    river_type: "plain",
    fish_type: "eel",
    designer: "陈设计师",
    description: "平原地区低水头堰闸配套鳗鱼道，结构为孔口式，全长约60m，鳗鱼为降海洄游型，评估重点为下泄流速与低水深通道。",
    status: "draft",
    sections: [
      {
        station_no: "S1",
        name: "上游入水口",
        width: 1.2,
        depth: 0.6,
        slope: 0.005,
        bottom_elevation: 32.0,
        water_level: { upstream: 32.7, downstream: 32.5, water_depth: 0.6, flow_rate: 0.45, date: "2024-07-01" },
        roughness: { n: 0.035, type: "mixed" },
        obstacles: [],
        segments: [
          { i: 0, start: 0, end: 0.4, v: 0.5, d: 0.6 },
          { i: 1, start: 0.4, end: 0.8, v: 0.7, d: 0.55 },
          { i: 2, start: 0.8, end: 1.2, v: 0.45, d: 0.6 },
        ],
      },
      {
        station_no: "S3",
        name: "中部缓流孔",
        width: 1.5,
        depth: 0.55,
        slope: 0.005,
        bottom_elevation: 31.7,
        water_level: { upstream: 32.4, downstream: 32.2, water_depth: 0.55, flow_rate: 0.4, date: "2024-07-01" },
        roughness: { n: 0.038, type: "mixed" },
        obstacles: [{ type: "sill", pos: 0.75, h: 0.1, w: 1.5, desc: "底部细槛" }],
        segments: [
          { i: 0, start: 0, end: 0.5, v: 0.35, d: 0.5 },
          { i: 1, start: 0.5, end: 1.0, v: 0.55, d: 0.45 },
          { i: 2, start: 1.0, end: 1.5, v: 0.3, d: 0.5 },
        ],
        remark: "中部流速略高但仍在鳗鱼适宜范围内，建议关注底栖流速。",
      },
    ],
    versions: [
      { tag: "v0.1", batch: "BATCH-FD003-20240705", author: "陈设计师", note: "草稿，仅录入两个断面，待完善", current: true },
    ],
    anomalies: [
      { type: "missing_data", severity: "warning", field: "section_count", value: "2", message: "鳗鱼道设计全长60m，目前仅录入2个断面，建议加密至至少8个测点" },
    ],
  },
  {
    code: "FD-2024-004",
    name: "红岩溪多鱼种生态鱼道评估",
    station_name: "红岩溪电站",
    river_name: "红岩溪",
    river_type: "transition",
    fish_type: "general",
    designer: "刘技术",
    description: "山区向平原过渡河段，鱼道为仿自然型+竖缝式组合结构，服务多种鱼类，综合流速评估。",
    status: "completed",
    sections: [
      {
        station_no: "A-01",
        name: "仿自然入口",
        width: 5.0,
        depth: 1.4,
        slope: 0.015,
        bottom_elevation: 258.0,
        water_level: { upstream: 259.6, downstream: 259.0, water_depth: 1.4, flow_rate: 4.2, date: "2024-04-20" },
        roughness: { n: 0.05, type: "vegetation" },
        obstacles: [{ type: "boulder", pos: 2.5, h: 0.9, w: 1.0, desc: "中央大型生态石" }],
        segments: [
          { i: 0, start: 0, end: 1.25, v: 0.6, d: 1.35 },
          { i: 1, start: 1.25, end: 2.5, v: 1.1, d: 1.1 },
          { i: 2, start: 2.5, end: 3.75, v: 1.15, d: 1.05 },
          { i: 3, start: 3.75, end: 5.0, v: 0.55, d: 1.3 },
        ],
      },
      {
        station_no: "B-05",
        name: "竖缝过渡段",
        width: 3.0,
        depth: 1.5,
        slope: 0.02,
        bottom_elevation: 255.5,
        water_level: { upstream: 257.2, downstream: 256.4, water_depth: 1.5, flow_rate: 3.8, date: "2024-04-20" },
        roughness: { n: 0.035, type: "mixed" },
        obstacles: [
          { type: "pier", pos: 0.75, h: 1.5, w: 0.3, desc: "左导墙" },
          { type: "pier", pos: 2.25, h: 1.5, w: 0.3, desc: "右导墙" },
        ],
        segments: [
          { i: 0, start: 0, end: 0.75, v: 0.8, d: 1.45 },
          { i: 1, start: 0.75, end: 2.25, v: 1.8, d: 1.1 },
          { i: 2, start: 2.25, end: 3.0, v: 0.75, d: 1.4 },
        ],
      },
    ],
    versions: [
      { tag: "v1.0", batch: "BATCH-FD004-20240430", author: "刘技术", note: "评估完成，已通过专家复核", current: true },
    ],
    anomalies: [
      { type: "out_of_range", severity: "warning", field: "velocity_ms", value: "1.8", message: "B-05竖缝段流速1.8m/s，对缓流型鱼类略有挑战" },
    ],
  },
  {
    code: "FD-2024-005",
    name: "碧溪口高流速鲶鱼鱼道专项",
    station_name: "碧溪口电站",
    river_name: "碧溪河",
    river_type: "mountain",
    fish_type: "catfish",
    designer: "赵主任",
    description: "山区急流河段，鱼道结构为淹没孔口+池室组合，重点评估底层流速与鲶鱼上溯可行性。",
    status: "archived",
    sections: [
      {
        station_no: "P1",
        name: "底层孔口1",
        width: 1.5,
        depth: 2.0,
        slope: 0.03,
        bottom_elevation: 488.0,
        water_level: { upstream: 490.5, downstream: 489.5, water_depth: 2.0, flow_rate: 3.5, date: "2023-11-08" },
        roughness: { n: 0.032, type: "concrete" },
        obstacles: [],
        segments: [
          { i: 0, start: 0, end: 0.5, v: 1.2, d: 1.95 },
          { i: 1, start: 0.5, end: 1.0, v: 1.6, d: 1.75 },
          { i: 2, start: 1.0, end: 1.5, v: 1.15, d: 1.9 },
        ],
      },
    ],
    versions: [
      { tag: "v1.0", batch: "BATCH-FD005-20231115", author: "赵主任", note: "历史归档数据，仅供参考", current: true },
    ],
    anomalies: [],
  },
];

export function seed() {
  const db = getDb();
  runInTransaction(db, () => {
    for (const s of SAMPLES) {
      if (getProjectByCode(s.code)) continue;
      const project = createProject({
        code: s.code,
        name: s.name,
        station_name: s.station_name,
        river_name: s.river_name,
        river_type: s.river_type,
        fish_type: s.fish_type,
        designer: s.designer,
        description: s.description,
      });
      const projectId = project.id;
      const baseVersionId = (
        db.prepare("SELECT id FROM versions WHERE project_id = ? AND version_tag = 'v1.0'").get(projectId) as { id: number }
      ).id;

      for (const v of s.versions) {
        if (v.tag === "v1.0") continue;
        createVersion({
          project_id: projectId,
          version_tag: v.tag,
          batch_no: v.batch,
          is_current: !!v.current,
          author: v.author,
          note: v.note,
        });
      }

      const versionRow = db.prepare(
        "SELECT id FROM versions WHERE project_id = ? AND is_current = 1 LIMIT 1"
      ).get(projectId) as { id: number };
      const currentVid = versionRow ? versionRow.id : baseVersionId;

      const sectionIds: number[] = [];
      for (const sect of s.sections) {
        const input: CreateSectionInput = {
          project_id: projectId,
          version_id: currentVid,
          station_no: sect.station_no,
          name: sect.name,
          width: sect.width,
          depth: sect.depth,
          slope: sect.slope,
          bottom_elevation: sect.bottom_elevation,
          remark: sect.remark,
        };
        const created = createSection(input);
        sectionIds.push(created.id);

        createWaterLevel({
          project_id: projectId,
          version_id: currentVid,
          section_id: created.id,
          upstream_level: sect.water_level.upstream,
          downstream_level: sect.water_level.downstream,
          water_depth: sect.water_level.water_depth,
          flow_rate: sect.water_level.flow_rate,
          measure_date: sect.water_level.date,
        });

        createRoughness({
          project_id: projectId,
          version_id: currentVid,
          section_id: created.id,
          n_value: sect.roughness.n,
          type: sect.roughness.type,
          description: `典型${sect.roughness.type}材质`,
        });

        for (const obs of sect.obstacles) {
          createObstacle({
            project_id: projectId,
            version_id: currentVid,
            section_id: created.id,
            type: obs.type,
            position_m: obs.pos,
            height_m: obs.h,
            width_m: obs.w,
            description: obs.desc,
          });
        }

        for (const seg of sect.segments) {
          const suitability = classifyVelocity(seg.v, seg.d, s.fish_type);
          createFlowSegment({
            project_id: projectId,
            version_id: currentVid,
            section_id: created.id,
            segment_index: seg.i,
            start_m: seg.start,
            end_m: seg.end,
            velocity_ms: seg.v,
            depth_m: seg.d,
            suitability,
          });

          if (suitability === "danger") {
            const isHighVelocity = seg.v > 2.0;
            const isLowDepth = seg.d < 0.5;
            createUnsuitableZone({
              project_id: projectId,
              version_id: currentVid,
              section_id: created.id,
              zone_type: isHighVelocity ? "high_velocity" : isLowDepth ? "low_depth" : "turbulence",
              start_m: seg.start,
              end_m: seg.end,
              max_velocity: seg.v,
              min_depth: seg.d,
              description: `${sect.name} (${seg.start}-${seg.end}m): ${isHighVelocity ? "流速过高" : isLowDepth ? "水深不足" : "流态异常"}，v=${seg.v}m/s, d=${seg.d}m`,
            });
          } else if (suitability === "warning" && seg.v > 1.5) {
            createUnsuitableZone({
              project_id: projectId,
              version_id: currentVid,
              section_id: created.id,
              zone_type: "high_velocity",
              start_m: seg.start,
              end_m: seg.end,
              max_velocity: seg.v,
              min_depth: seg.d,
              description: `${sect.name} (${seg.start}-${seg.end}m): 流速偏高接近上限，v=${seg.v}m/s`,
            });
          }
        }
      }

      for (const a of s.anomalies) {
        createAnomaly({
          project_id: projectId,
          version_id: currentVid,
          section_id: a.section_idx !== undefined ? sectionIds[a.section_idx] : null,
          type: a.type,
          severity: a.severity,
          field: a.field,
          value: a.value,
          message: a.message,
        });
      }

      if (s.status !== "draft") {
        db.prepare("UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?").run(s.status, projectId);
      }
    }
  });
  console.log(`Seed completed: ${SAMPLES.length} sample projects loaded.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
