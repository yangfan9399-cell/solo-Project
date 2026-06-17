import type { Project, InspectionFrame, Defect, ReviewBatch, Version, Anomaly, ExportRecord } from "./types";
import { storage } from "./storage";

const SEED_VERSION = 3;

export function generateSeedData(): {
  projects: Project[];
  frames: InspectionFrame[];
  defects: Defect[];
  reviews: ReviewBatch[];
  versions: Version[];
  anomalies: Anomaly[];
  exports: ExportRecord[];
} {
  const now = new Date().toISOString();

  const projects: Project[] = [
    { id: "p1", name: "南湖路排水管线检测", pipelineName: "南湖路DN800雨水管", pipelineDiameter: 800, inspectionDate: "2026-05-10", inspectionLength: 2450, robotModel: "CCTV-3000", status: "ongoing", annotator: "张工", createdAt: now, updatedAt: now },
    { id: "p2", name: "中山大道污水管巡检", pipelineName: "中山大道DN600污水管", pipelineDiameter: 600, inspectionDate: "2026-05-15", inspectionLength: 1830, robotModel: "CCTV-3000", status: "completed", annotator: "李工", createdAt: now, updatedAt: now },
    { id: "p3", name: "滨河路综合管廊检测", pipelineName: "滨河路DN1000雨水管", pipelineDiameter: 1000, inspectionDate: "2026-06-01", inspectionLength: 3200, robotModel: "CCTV-5000", status: "pending_review", annotator: "王工", createdAt: now, updatedAt: now },
    { id: "p4", name: "科技园排水管网排查", pipelineName: "科技园DN500雨水管", pipelineDiameter: 500, inspectionDate: "2026-06-05", inspectionLength: 960, robotModel: "CCTV-3000", status: "ongoing", annotator: "赵工", createdAt: now, updatedAt: now },
    { id: "p5", name: "老城区管网改造前检测", pipelineName: "老城区DN700合流管", pipelineDiameter: 700, inspectionDate: "2026-06-10", inspectionLength: 1500, robotModel: "CCTV-5000", status: "pending_review", annotator: "刘工", createdAt: now, updatedAt: now },
  ];

  const frames: InspectionFrame[] = [
    { id: "f1-001", projectId: "p1", frameIndex: 1, mileage: 0.0, timestamp: "00:00:00", imageUrl: "", description: "起点检查井" },
    { id: "f1-050", projectId: "p1", frameIndex: 50, mileage: 120.5, timestamp: "00:08:12", imageUrl: "", description: "管段正常" },
    { id: "f1-120", projectId: "p1", frameIndex: 120, mileage: 358.2, timestamp: "00:22:45", imageUrl: "", description: "发现裂缝" },
    { id: "f1-200", projectId: "p1", frameIndex: 200, mileage: 680.0, timestamp: "00:41:20", imageUrl: "", description: "沉积严重" },
    { id: "f1-310", projectId: "p1", frameIndex: 310, mileage: 1050.3, timestamp: "01:05:33", imageUrl: "", description: "错口位置" },
    { id: "f1-450", projectId: "p1", frameIndex: 450, mileage: 1520.0, timestamp: "01:32:10", imageUrl: "", description: "渗漏点" },
    { id: "f2-001", projectId: "p2", frameIndex: 1, mileage: 0.0, timestamp: "00:00:00", imageUrl: "", description: "起点检查井" },
    { id: "f2-080", projectId: "p2", frameIndex: 80, mileage: 210.5, timestamp: "00:12:30", imageUrl: "", description: "管壁腐蚀" },
    { id: "f2-160", projectId: "p2", frameIndex: 160, mileage: 480.0, timestamp: "00:28:15", imageUrl: "", description: "脱节" },
    { id: "f2-250", projectId: "p2", frameIndex: 250, mileage: 780.3, timestamp: "00:50:22", imageUrl: "", description: "支管暗接" },
    { id: "f3-001", projectId: "p3", frameIndex: 1, mileage: 0.0, timestamp: "00:00:00", imageUrl: "", description: "起点检查井" },
    { id: "f3-100", projectId: "p3", frameIndex: 100, mileage: 320.0, timestamp: "00:18:00", imageUrl: "", description: "变形段" },
    { id: "f3-220", projectId: "p3", frameIndex: 220, mileage: 680.5, timestamp: "00:42:30", imageUrl: "", description: "渗漏" },
    { id: "f3-350", projectId: "p3", frameIndex: 350, mileage: 1120.0, timestamp: "01:10:15", imageUrl: "", description: "沉积" },
    { id: "f4-001", projectId: "p4", frameIndex: 1, mileage: 0.0, timestamp: "00:00:00", imageUrl: "", description: "起点" },
    { id: "f4-060", projectId: "p4", frameIndex: 60, mileage: 150.0, timestamp: "00:09:45", imageUrl: "", description: "裂缝" },
    { id: "f5-001", projectId: "p5", frameIndex: 1, mileage: 0.0, timestamp: "00:00:00", imageUrl: "", description: "起点" },
    { id: "f5-090", projectId: "p5", frameIndex: 90, mileage: 280.0, timestamp: "00:14:20", imageUrl: "", description: "错口" },
    { id: "f5-180", projectId: "p5", frameIndex: 180, mileage: 560.0, timestamp: "00:33:50", imageUrl: "", description: "沉积" },
  ];

  const defects: Defect[] = [
    { id: "d1", frameId: "f1-120", projectId: "p1", type: "crack", severity: 3, position: "管顶 2点钟方向", mileage: 358.2, description: "纵向裂缝长约800mm，宽约2mm", length: 800, width: 2, annotatedBy: "张工", annotatedAt: "2026-05-12T10:30:00Z", reviewStatus: "approved", reviewedBy: "陈审核", reviewedAt: "2026-05-13T09:00:00Z", reviewComment: "确认裂缝等级", versionId: "v1" },
    { id: "d2", frameId: "f1-200", projectId: "p1", type: "deposit", severity: 2, position: "管底", mileage: 680.0, description: "管底沉积约占截面积15%", length: 2000, width: 300, annotatedBy: "张工", annotatedAt: "2026-05-12T14:20:00Z", reviewStatus: "approved", reviewedBy: "陈审核", reviewedAt: "2026-05-13T09:15:00Z", reviewComment: "沉积比例确认", versionId: "v1" },
    { id: "d3", frameId: "f1-310", projectId: "p1", type: "misalign", severity: 3, position: "管接口", mileage: 1050.3, description: "接口错口约15mm", length: 0, width: 15, annotatedBy: "张工", annotatedAt: "2026-05-13T08:45:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v1" },
    { id: "d4", frameId: "f1-450", projectId: "p1", type: "leak", severity: 4, position: "管侧 9点钟方向", mileage: 1520.0, description: "渗漏严重，持续流水", length: 500, width: 0, annotatedBy: "张工", annotatedAt: "2026-05-13T15:10:00Z", reviewStatus: "rejected", reviewedBy: "陈审核", reviewedAt: "2026-05-14T10:00:00Z", reviewComment: "渗漏量描述不够详细，请补充", versionId: "v1" },
    { id: "d5", frameId: "f2-080", projectId: "p2", type: "corrosion", severity: 2, position: "管壁四周", mileage: 210.5, description: "管壁腐蚀剥落，面积约0.3m²", length: 500, width: 600, annotatedBy: "李工", annotatedAt: "2026-05-16T11:00:00Z", reviewStatus: "approved", reviewedBy: "周审核", reviewedAt: "2026-05-17T08:30:00Z", reviewComment: "腐蚀面积确认", versionId: "v2" },
    { id: "d6", frameId: "f2-160", projectId: "p2", type: "disjoint", severity: 3, position: "管接口", mileage: 480.0, description: "管道脱节约20mm", length: 0, width: 20, annotatedBy: "李工", annotatedAt: "2026-05-16T14:30:00Z", reviewStatus: "approved", reviewedBy: "周审核", reviewedAt: "2026-05-17T08:45:00Z", reviewComment: "脱节量确认", versionId: "v2" },
    { id: "d7", frameId: "f2-250", projectId: "p2", type: "branch", severity: 2, position: "管侧 3点钟方向", mileage: 780.3, description: "支管暗接，未记录", length: 200, width: 150, annotatedBy: "李工", annotatedAt: "2026-05-17T09:00:00Z", reviewStatus: "approved", reviewedBy: "周审核", reviewedAt: "2026-05-18T10:00:00Z", reviewComment: "暗接确认", versionId: "v2" },
    { id: "d8", frameId: "f3-100", projectId: "p3", type: "deform", severity: 3, position: "管顶", mileage: 320.0, description: "管顶变形，变形量约8%", length: 1500, width: 0, annotatedBy: "王工", annotatedAt: "2026-06-02T10:00:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v3" },
    { id: "d9", frameId: "f3-220", projectId: "p3", type: "leak", severity: 2, position: "管侧 10点钟方向", mileage: 680.5, description: "轻微渗漏，滴水", length: 200, width: 0, annotatedBy: "王工", annotatedAt: "2026-06-02T15:30:00Z", reviewStatus: "reviewing", reviewedBy: "孙审核", reviewedAt: "", reviewComment: "", versionId: "v3" },
    { id: "d10", frameId: "f3-350", projectId: "p3", type: "deposit", severity: 2, position: "管底", mileage: 1120.0, description: "管底沉积约占截面积10%", length: 1800, width: 200, annotatedBy: "王工", annotatedAt: "2026-06-03T09:20:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v3" },
    { id: "d11", frameId: "f4-060", projectId: "p4", type: "crack", severity: 2, position: "管侧 4点钟方向", mileage: 150.0, description: "环向裂缝长约300mm", length: 300, width: 1, annotatedBy: "赵工", annotatedAt: "2026-06-06T11:00:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v4" },
    { id: "d12", frameId: "f5-090", projectId: "p5", type: "misalign", severity: 2, position: "管接口", mileage: 280.0, description: "接口错口约8mm", length: 0, width: 8, annotatedBy: "刘工", annotatedAt: "2026-06-11T10:00:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v5" },
    { id: "d13", frameId: "f5-180", projectId: "p5", type: "deposit", severity: 1, position: "管底", mileage: 560.0, description: "管底轻微沉积约5%", length: 800, width: 100, annotatedBy: "刘工", annotatedAt: "2026-06-11T14:00:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v5" },
    { id: "d14", frameId: "f1-120", projectId: "p1", type: "crack", severity: 4, position: "管顶 2点钟方向", mileage: 358.2, description: "纵向裂缝长约800mm，宽约2mm，复核后升级", length: 800, width: 2, annotatedBy: "张工", annotatedAt: "2026-05-15T10:00:00Z", reviewStatus: "pending", reviewedBy: "", reviewedAt: "", reviewComment: "", versionId: "v1-2" },
  ];

  const reviews: ReviewBatch[] = [
    { id: "r1", projectId: "p1", batchName: "第一批评审", reviewer: "陈审核", status: "approved", createdAt: "2026-05-13T08:00:00Z", completedAt: "2026-05-14T10:00:00Z", defectIds: ["d1", "d2", "d3", "d4"], comment: "大部分确认，渗漏项退回补充" },
    { id: "r2", projectId: "p2", batchName: "全部评审", reviewer: "周审核", status: "approved", createdAt: "2026-05-17T08:00:00Z", completedAt: "2026-05-18T10:00:00Z", defectIds: ["d5", "d6", "d7"], comment: "全部通过" },
    { id: "r3", projectId: "p3", batchName: "初审批次", reviewer: "孙审核", status: "reviewing", createdAt: "2026-06-04T09:00:00Z", completedAt: "", defectIds: ["d8", "d9", "d10"], comment: "审核中" },
  ];

  const versions: Version[] = [
    { id: "v1", projectId: "p1", versionNumber: "1.0", description: "初版标注", createdBy: "张工", createdAt: "2026-05-12T10:00:00Z", defectCount: 4, snapshotKey: "snap_p1_v1" },
    { id: "v1-2", projectId: "p1", versionNumber: "1.1", description: "渗漏项补充标注", createdBy: "张工", createdAt: "2026-05-15T10:00:00Z", defectCount: 5, snapshotKey: "snap_p1_v1_2" },
    { id: "v2", projectId: "p2", versionNumber: "1.0", description: "初版标注", createdBy: "李工", createdAt: "2026-05-16T10:00:00Z", defectCount: 3, snapshotKey: "snap_p2_v1" },
    { id: "v3", projectId: "p3", versionNumber: "1.0", description: "初版标注", createdBy: "王工", createdAt: "2026-06-02T09:00:00Z", defectCount: 3, snapshotKey: "snap_p3_v1" },
    { id: "v4", projectId: "p4", versionNumber: "1.0", description: "初版标注", createdBy: "赵工", createdAt: "2026-06-06T10:00:00Z", defectCount: 1, snapshotKey: "snap_p4_v1" },
    { id: "v5", projectId: "p5", versionNumber: "1.0", description: "初版标注", createdBy: "刘工", createdAt: "2026-06-11T09:00:00Z", defectCount: 2, snapshotKey: "snap_p5_v1" },
  ];

  const anomalies: Anomaly[] = [
    { id: "a1", projectId: "p1", type: "overlap_mileage", description: "帧 f1-120 与 f1-121 里程重叠（358.2m vs 358.2m）", severity: "warning", resolved: false, createdAt: "2026-05-13T08:00:00Z", resolvedAt: "", relatedDefectId: "d1" },
    { id: "a2", projectId: "p1", type: "unreviewed_overdue", description: "缺陷 d3 已超过5个工作日未复核", severity: "error", resolved: false, createdAt: "2026-05-20T09:00:00Z", resolvedAt: "", relatedDefectId: "d3" },
    { id: "a3", projectId: "p1", type: "duplicate_defect", description: "缺陷 d14 与 d1 里程位置重复（358.2m），可能为重复标注", severity: "warning", resolved: false, createdAt: "2026-05-15T10:05:00Z", resolvedAt: "", relatedDefectId: "d14" },
    { id: "a4", projectId: "p3", type: "missing_frame", description: "里程 900m-1000m 区间帧缺失（帧间距过大）", severity: "error", resolved: false, createdAt: "2026-06-03T08:00:00Z", resolvedAt: "", relatedDefectId: "" },
    { id: "a5", projectId: "p4", type: "unreviewed_overdue", description: "缺陷 d11 已超过3个工作日未复核", severity: "warning", resolved: false, createdAt: "2026-06-09T09:00:00Z", resolvedAt: "", relatedDefectId: "d11" },
  ];

  const exports: ExportRecord[] = [
    { id: "e1", projectId: "p1", exportType: "summary", format: "csv", createdAt: "2026-05-14T10:30:00Z", createdBy: "张工", recordCount: 4, data: "defect_id,type,severity,mileage,position,description\nd1,crack,3,358.2,管顶 2点钟方向,纵向裂缝长约800mm\nd2,deposit,2,680.0,管底,管底沉积约占截面积15%\nd3,misalign,3,1050.3,管接口,接口错口约15mm\nd4,leak,4,1520.0,管侧 9点钟方向,渗漏严重" },
    { id: "e2", projectId: "p2", exportType: "full", format: "json", createdAt: "2026-05-18T11:00:00Z", createdBy: "李工", recordCount: 3, data: '{"project":"中山大道污水管巡检","defects":3}' },
    { id: "e3", projectId: "p1", exportType: "mileage", format: "csv", createdAt: "2026-05-14T14:00:00Z", createdBy: "张工", recordCount: 6, data: "mileage,defect_type,severity\n358.2,crack,3\n680.0,deposit,2\n1050.3,misalign,3\n1520.0,leak,4\n358.2,crack,4" },
    { id: "e4", projectId: "p2", exportType: "review", format: "csv", createdAt: "2026-05-18T14:30:00Z", createdBy: "周审核", recordCount: 3, data: "defect_id,status,reviewer,comment\nd5,approved,周审核,腐蚀面积确认\nd6,approved,周审核,脱节量确认\nd7,approved,周审核,暗接确认" },
  ];

  return { projects, frames, defects, reviews, versions, anomalies, exports };
}

const EXPECTED_COUNTS = {
  projects: 5,
  frames: 19,
  defects: 14,
  reviews: 3,
  versions: 6,
  anomalies: 5,
  exports: 4,
};

function checkDataIntegrity(): boolean {
  if (typeof window === "undefined") return false;

  const version = localStorage.getItem("pipeline_seed_version");
  if (version && Number(version) >= SEED_VERSION) {
    const counts = {
      projects: storage.projects.getAll().length,
      frames: storage.frames.getAll().length,
      defects: storage.defects.getAll().length,
      reviews: storage.reviews.getAll().length,
      versions: storage.versions.getAll().length,
      anomalies: storage.anomalies.getAll().length,
      exports: storage.exports.getAll().length,
    };

    const allPresent =
      counts.projects >= EXPECTED_COUNTS.projects &&
      counts.frames >= EXPECTED_COUNTS.frames &&
      counts.defects >= EXPECTED_COUNTS.defects &&
      counts.reviews >= EXPECTED_COUNTS.reviews &&
      counts.versions >= EXPECTED_COUNTS.versions &&
      counts.anomalies >= EXPECTED_COUNTS.anomalies &&
      counts.exports >= EXPECTED_COUNTS.exports;

    if (allPresent) {
      console.log("[Seed] 数据完整性校验通过", counts);
      return true;
    }

    console.warn("[Seed] 数据不完整，需要补写", { counts, expected: EXPECTED_COUNTS });
  }

  return false;
}

export function ensureSeedData(): boolean {
  if (typeof window === "undefined") return false;

  if (checkDataIntegrity()) {
    return true;
  }

  try {
    storage.reset();

    const { projects, frames, defects, reviews, versions, anomalies, exports } = generateSeedData();

    projects.forEach((p) => storage.projects.create(p));
    frames.forEach((f) => storage.frames.create(f));
    defects.forEach((d) => storage.defects.create(d));
    reviews.forEach((r) => storage.reviews.create(r));
    versions.forEach((v) => storage.versions.create(v));
    anomalies.forEach((a) => storage.anomalies.create(a));
    exports.forEach((e) => storage.exports.create(e));

    storage.markInitialized();
    localStorage.setItem("pipeline_seed_version", String(SEED_VERSION));

    console.log("[Seed] 初始化样例数据完成", {
      projects: projects.length,
      frames: frames.length,
      defects: defects.length,
      reviews: reviews.length,
      versions: versions.length,
      anomalies: anomalies.length,
      exports: exports.length,
    });
    return true;
  } catch (e) {
    console.error("[Seed] 初始化样例数据失败", e);
    return false;
  }
}

export function resetSeedData(): void {
  if (typeof window === "undefined") return;
  storage.reset();
  localStorage.removeItem("pipeline_seed_version");
  ensureSeedData();
}
