import { getDb, runInTransaction } from "./schema";
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
  ProjectStatus,
  RiverType,
  FishType,
  RoughnessType,
  ObstacleType,
} from "~/types";

function projectRowToObj(row: any): Project {
  return row as Project;
}

export interface ProjectListFilters {
  search?: string;
  status?: ProjectStatus;
  river_type?: RiverType;
  has_anomaly?: boolean;
  page?: number;
  per_page?: number;
}

export function listProjects(filters: ProjectListFilters = {}) {
  const db = getDb();
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.search) {
    conditions.push("(name LIKE ? OR code LIKE ? OR station_name LIKE ? OR river_name LIKE ?)");
    const s = `%${filters.search}%`;
    params.push(s, s, s, s);
  }
  if (filters.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }
  if (filters.river_type) {
    conditions.push("river_type = ?");
    params.push(filters.river_type);
  }
  if (filters.has_anomaly !== undefined) {
    conditions.push("has_anomaly = ?");
    params.push(filters.has_anomaly ? 1 : 0);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM projects ${where}`).get(...params) as { cnt: number };
  const total = countRow.cnt;

  const page = filters.page ?? 1;
  const perPage = filters.per_page ?? 20;
  const offset = (page - 1) * perPage;

  const rows = db
    .prepare(
      `SELECT * FROM projects ${where} ORDER BY updated_at DESC LIMIT ? OFFSET ?`
    )
    .all(...params, perPage, offset) as Project[];

  return {
    total,
    page,
    per_page: perPage,
    data: rows.map(projectRowToObj),
  };
}

export function getProjectStats() {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as n FROM projects").get() as { n: number }).n;
  const inProgress = (db.prepare("SELECT COUNT(*) as n FROM projects WHERE status = 'in_progress'").get() as { n: number }).n;
  const completed = (db.prepare("SELECT COUNT(*) as n FROM projects WHERE status = 'completed'").get() as { n: number }).n;
  const withAnomaly = (db.prepare("SELECT COUNT(*) as n FROM projects WHERE has_anomaly = 1").get() as { n: number }).n;
  return { total, in_progress: inProgress, completed, with_anomaly: withAnomaly };
}

export function getProject(id: number): Project | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return row ? (row as Project) : null;
}

export function getProjectByCode(code: string): Project | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM projects WHERE code = ?").get(code);
  return row ? (row as Project) : null;
}

export interface CreateProjectInput {
  code: string;
  name: string;
  station_name: string;
  river_name: string;
  river_type: RiverType;
  fish_type: FishType;
  designer: string;
  description?: string | null;
}

export function createProject(input: CreateProjectInput): Project {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO projects (code, name, station_name, river_name, river_type, fish_type, designer, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
    )
    .run(
      input.code,
      input.name,
      input.station_name,
      input.river_name,
      input.river_type,
      input.fish_type,
      input.designer,
      input.description ?? null,
      now,
      now
    );
  const project = getProject(Number(info.lastInsertRowid))!;
  createVersion({
    project_id: project.id,
    version_tag: "v1.0",
    batch_no: `BATCH-${project.code}-001`,
    is_current: true,
    author: input.designer,
    note: "初始版本",
  });
  return getProject(project.id)!;
}

export function updateProjectStatus(id: number, status: ProjectStatus) {
  const db = getDb();
  db.prepare("UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

export function updateProject(id: number, patch: Partial<Pick<Project, "name" | "station_name" | "river_name" | "river_type" | "fish_type" | "designer" | "description" | "status">>) {
  const db = getDb();
  const fields = Object.keys(patch) as (keyof typeof patch)[];
  if (fields.length === 0) return;
  const assignments = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => patch[f]);
  db.prepare(`UPDATE projects SET ${assignments}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
}

export function deleteProject(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
}

export function updateProjectAnomalyFlags(project_id: number) {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as cnt FROM anomaly_records WHERE project_id = ? AND resolved = 0"
    )
    .get(project_id) as { cnt: number };
  db.prepare("UPDATE projects SET has_anomaly = ?, anomaly_count = ?, updated_at = datetime('now') WHERE id = ?").run(
    row.cnt > 0 ? 1 : 0,
    row.cnt,
    project_id
  );
}

export function listVersions(project_id: number): Version[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM versions WHERE project_id = ? ORDER BY created_at DESC, id DESC")
    .all(project_id) as Version[];
}

export function getVersion(id: number): Version | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM versions WHERE id = ?").get(id);
  return row ? (row as Version) : null;
}

export function getCurrentVersion(project_id: number): Version | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM versions WHERE project_id = ? AND is_current = 1 LIMIT 1").get(project_id);
  return row ? (row as Version) : null;
}

export interface CreateVersionInput {
  project_id: number;
  version_tag: string;
  batch_no: string;
  is_current?: boolean;
  author: string;
  note?: string | null;
}

function snapshotVersionData(db: ReturnType<typeof getDb>, projectId: number, fromVersionId: number, toVersionId: number) {
  const sectionMap = new Map<number, number>();

  const fromSections = db
    .prepare("SELECT * FROM cross_sections WHERE project_id = ? AND version_id = ?")
    .all(projectId, fromVersionId) as CrossSection[];
  for (const s of fromSections) {
    const info = db.prepare(
      `INSERT INTO cross_sections (project_id, version_id, station_no, name, width, depth, slope, area, wetted_perimeter, hydraulic_radius, bottom_elevation, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(projectId, toVersionId, s.station_no, s.name, s.width, s.depth, s.slope, s.area, s.wetted_perimeter, s.hydraulic_radius, s.bottom_elevation, s.remark);
    sectionMap.set(s.id, Number(info.lastInsertRowid));
  }

  const childTables = [
    { table: "water_levels", cols: "project_id, version_id, section_id, upstream_level, downstream_level, water_depth, flow_rate, measure_date, remark" },
    { table: "roughnesses", cols: "project_id, version_id, section_id, n_value, type, description" },
    { table: "obstacles", cols: "project_id, version_id, section_id, type, position_m, height_m, width_m, description" },
    { table: "flow_segments", cols: "project_id, version_id, section_id, segment_index, start_m, end_m, velocity_ms, depth_m, suitability" },
    { table: "unsuitable_zones", cols: "project_id, version_id, section_id, zone_type, start_m, end_m, max_velocity, min_depth, description" },
  ];
  for (const ct of childTables) {
    for (const [oldSid, newSid] of sectionMap) {
      const rows = db
        .prepare(`SELECT * FROM ${ct.table} WHERE section_id = ? AND version_id = ?`)
        .all(oldSid, fromVersionId) as any[];
      for (const r of rows) {
        const colNames = ct.cols.split(", ");
        const vals = colNames.map((c) => {
          if (c === "version_id") return toVersionId;
          if (c === "section_id") return newSid;
          return r[c];
        });
        db.prepare(`INSERT INTO ${ct.table} (${ct.cols}) VALUES (${colNames.map(() => "?").join(", ")})`).run(...vals);
      }
    }
  }

  const anomalies = db
    .prepare("SELECT * FROM anomaly_records WHERE project_id = ? AND version_id = ?")
    .all(projectId, fromVersionId) as AnomalyRecord[];
  for (const a of anomalies) {
    const newSectionId = a.section_id ? (sectionMap.get(a.section_id) ?? null) : null;
    db.prepare(
      `INSERT INTO anomaly_records (project_id, version_id, section_id, type, severity, field, value, message, resolved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(projectId, toVersionId, newSectionId, a.type, a.severity, a.field, a.value, a.message, a.resolved);
  }
}

export function createVersion(input: CreateVersionInput): Version {
  const db = getDb();
  return runInTransaction(db, () => {
    const currentV = getCurrentVersion(input.project_id);
    if (input.is_current) {
      db.prepare("UPDATE versions SET is_current = 0 WHERE project_id = ?").run(input.project_id);
    }
    const info = db
      .prepare(
        `INSERT INTO versions (project_id, version_tag, batch_no, is_current, author, note)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        input.project_id,
        input.version_tag,
        input.batch_no,
        input.is_current ? 1 : 0,
        input.author,
        input.note ?? null
      );
    const v = getVersion(Number(info.lastInsertRowid))!;
    if (currentV) {
      snapshotVersionData(db, input.project_id, currentV.id, v.id);
    }
    if (input.is_current) {
      db.prepare("UPDATE projects SET current_version = ?, updated_at = datetime('now') WHERE id = ?").run(v.version_tag, input.project_id);
    }
    return v;
  });
}

export function setCurrentVersion(project_id: number, version_id: number) {
  const db = getDb();
  runInTransaction(db, () => {
    db.prepare("UPDATE versions SET is_current = 0 WHERE project_id = ?").run(project_id);
    db.prepare("UPDATE versions SET is_current = 1 WHERE id = ? AND project_id = ?").run(version_id, project_id);
    const v = getVersion(version_id);
    if (v) {
      db.prepare("UPDATE projects SET current_version = ?, updated_at = datetime('now') WHERE id = ?").run(v.version_tag, project_id);
    }
  });
}

export function listSections(project_id: number, version_id: number): CrossSection[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM cross_sections WHERE project_id = ? AND version_id = ? ORDER BY station_no, id"
    )
    .all(project_id, version_id) as CrossSection[];
}

export function getSection(id: number): CrossSection | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM cross_sections WHERE id = ?").get(id);
  return row ? (row as CrossSection) : null;
}

export interface CreateSectionInput {
  project_id: number;
  version_id: number;
  station_no: string;
  name: string;
  width: number;
  depth: number;
  slope: number;
  bottom_elevation: number;
  remark?: string | null;
}

export function createSection(input: CreateSectionInput): CrossSection {
  const db = getDb();
  const area = input.width * input.depth;
  const wetted = input.width + 2 * input.depth;
  const hydraulicRadius = wetted > 0 ? area / wetted : 0;
  const info = db
    .prepare(
      `INSERT INTO cross_sections (project_id, version_id, station_no, name, width, depth, slope, area, wetted_perimeter, hydraulic_radius, bottom_elevation, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.project_id,
      input.version_id,
      input.station_no,
      input.name,
      input.width,
      input.depth,
      input.slope,
      area,
      wetted,
      hydraulicRadius,
      input.bottom_elevation,
      input.remark ?? null
    );
  return getSection(Number(info.lastInsertRowid))!;
}

export function updateSection(id: number, patch: Partial<CreateSectionInput>) {
  const db = getDb();
  const current = getSection(id);
  if (!current) return;
  const merged = { ...current, ...patch };
  const area = merged.width * merged.depth;
  const wetted = merged.width + 2 * merged.depth;
  const hydraulicRadius = wetted > 0 ? area / wetted : 0;
  db.prepare(
    `UPDATE cross_sections SET station_no = ?, name = ?, width = ?, depth = ?, slope = ?, area = ?, wetted_perimeter = ?, hydraulic_radius = ?, bottom_elevation = ?, remark = ? WHERE id = ?`
  ).run(
    merged.station_no, merged.name, merged.width, merged.depth, merged.slope,
    area, wetted, hydraulicRadius, merged.bottom_elevation, merged.remark, id
  );
}

export function deleteSection(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM cross_sections WHERE id = ?").run(id);
}

export function listWaterLevels(section_id: number): WaterLevel[] {
  const db = getDb();
  return db.prepare("SELECT * FROM water_levels WHERE section_id = ? ORDER BY measure_date DESC, id DESC").all(section_id) as WaterLevel[];
}

export interface CreateWaterLevelInput {
  project_id: number;
  version_id: number;
  section_id: number;
  upstream_level: number;
  downstream_level: number;
  water_depth: number;
  flow_rate: number;
  measure_date: string;
  remark?: string | null;
}

export function createWaterLevel(input: CreateWaterLevelInput): WaterLevel {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO water_levels (project_id, version_id, section_id, upstream_level, downstream_level, water_depth, flow_rate, measure_date, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.project_id, input.version_id, input.section_id,
      input.upstream_level, input.downstream_level, input.water_depth,
      input.flow_rate, input.measure_date, input.remark ?? null
    );
  return db.prepare("SELECT * FROM water_levels WHERE id = ?").get(info.lastInsertRowid) as WaterLevel;
}

export function deleteWaterLevel(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM water_levels WHERE id = ?").run(id);
}

export function listRoughnesses(section_id: number): Roughness[] {
  const db = getDb();
  return db.prepare("SELECT * FROM roughnesses WHERE section_id = ? ORDER BY id DESC").all(section_id) as Roughness[];
}

export interface CreateRoughnessInput {
  project_id: number;
  version_id: number;
  section_id: number;
  n_value: number;
  type: RoughnessType;
  description?: string | null;
}

export function createRoughness(input: CreateRoughnessInput): Roughness {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO roughnesses (project_id, version_id, section_id, n_value, type, description)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(input.project_id, input.version_id, input.section_id, input.n_value, input.type, input.description ?? null);
  return db.prepare("SELECT * FROM roughnesses WHERE id = ?").get(info.lastInsertRowid) as Roughness;
}

export function deleteRoughness(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM roughnesses WHERE id = ?").run(id);
}

export function listObstacles(section_id: number): Obstacle[] {
  const db = getDb();
  return db.prepare("SELECT * FROM obstacles WHERE section_id = ? ORDER BY position_m, id").all(section_id) as Obstacle[];
}

export interface CreateObstacleInput {
  project_id: number;
  version_id: number;
  section_id: number;
  type: ObstacleType;
  position_m: number;
  height_m: number;
  width_m: number;
  description?: string | null;
}

export function createObstacle(input: CreateObstacleInput): Obstacle {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO obstacles (project_id, version_id, section_id, type, position_m, height_m, width_m, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.project_id, input.version_id, input.section_id, input.type,
      input.position_m, input.height_m, input.width_m, input.description ?? null
    );
  return db.prepare("SELECT * FROM obstacles WHERE id = ?").get(info.lastInsertRowid) as Obstacle;
}

export function deleteObstacle(id: number) {
  const db = getDb();
  db.prepare("DELETE FROM obstacles WHERE id = ?").run(id);
}

export function listFlowSegments(section_id: number): FlowSegment[] {
  const db = getDb();
  return db.prepare("SELECT * FROM flow_segments WHERE section_id = ? ORDER BY segment_index, id").all(section_id) as FlowSegment[];
}

export function listFlowSegmentsByVersion(project_id: number, version_id: number): FlowSegment[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM flow_segments WHERE project_id = ? AND version_id = ? ORDER BY section_id, segment_index")
    .all(project_id, version_id) as FlowSegment[];
}

export interface CreateFlowSegmentInput {
  project_id: number;
  version_id: number;
  section_id: number;
  segment_index: number;
  start_m: number;
  end_m: number;
  velocity_ms: number;
  depth_m: number;
  suitability: "safe" | "warning" | "danger";
}

export function createFlowSegment(input: CreateFlowSegmentInput): FlowSegment {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO flow_segments (project_id, version_id, section_id, segment_index, start_m, end_m, velocity_ms, depth_m, suitability)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.project_id, input.version_id, input.section_id,
      input.segment_index, input.start_m, input.end_m,
      input.velocity_ms, input.depth_m, input.suitability
    );
  return db.prepare("SELECT * FROM flow_segments WHERE id = ?").get(info.lastInsertRowid) as FlowSegment;
}

export function clearFlowSegments(section_id: number) {
  const db = getDb();
  db.prepare("DELETE FROM flow_segments WHERE section_id = ?").run(section_id);
}

export function listUnsuitableZones(section_id: number): UnsuitableZone[] {
  const db = getDb();
  return db.prepare("SELECT * FROM unsuitable_zones WHERE section_id = ? ORDER BY start_m, id").all(section_id) as UnsuitableZone[];
}

export function listUnsuitableZonesByVersion(project_id: number, version_id: number): UnsuitableZone[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM unsuitable_zones WHERE project_id = ? AND version_id = ? ORDER BY section_id, start_m")
    .all(project_id, version_id) as UnsuitableZone[];
}

export interface CreateUnsuitableZoneInput {
  project_id: number;
  version_id: number;
  section_id: number;
  zone_type: "high_velocity" | "low_depth" | "turbulence" | "dead_zone";
  start_m: number;
  end_m: number;
  max_velocity: number;
  min_depth: number;
  description: string;
}

export function createUnsuitableZone(input: CreateUnsuitableZoneInput): UnsuitableZone {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO unsuitable_zones (project_id, version_id, section_id, zone_type, start_m, end_m, max_velocity, min_depth, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.project_id, input.version_id, input.section_id, input.zone_type,
      input.start_m, input.end_m, input.max_velocity, input.min_depth, input.description
    );
  return db.prepare("SELECT * FROM unsuitable_zones WHERE id = ?").get(info.lastInsertRowid) as UnsuitableZone;
}

export function clearUnsuitableZones(section_id: number) {
  const db = getDb();
  db.prepare("DELETE FROM unsuitable_zones WHERE section_id = ?").run(section_id);
}

export function listAnomalies(project_id: number, version_id?: number): AnomalyRecord[] {
  const db = getDb();
  if (version_id !== undefined) {
    return db
      .prepare("SELECT * FROM anomaly_records WHERE project_id = ? AND version_id = ? ORDER BY severity DESC, id DESC")
      .all(project_id, version_id) as AnomalyRecord[];
  }
  return db
    .prepare("SELECT * FROM anomaly_records WHERE project_id = ? ORDER BY severity DESC, id DESC")
    .all(project_id) as AnomalyRecord[];
}

export interface CreateAnomalyInput {
  project_id: number;
  version_id: number;
  section_id?: number | null;
  type: "data_inconsistency" | "out_of_range" | "missing_data" | "calculation_error";
  severity: "warning" | "danger";
  field?: string | null;
  value?: string | null;
  message: string;
}

export function createAnomaly(input: CreateAnomalyInput): AnomalyRecord {
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO anomaly_records (project_id, version_id, section_id, type, severity, field, value, message)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      input.project_id, input.version_id, input.section_id ?? null,
      input.type, input.severity, input.field ?? null, input.value ?? null, input.message
    );
  updateProjectAnomalyFlags(input.project_id);
  return db.prepare("SELECT * FROM anomaly_records WHERE id = ?").get(info.lastInsertRowid) as AnomalyRecord;
}

export function clearAnomalies(project_id: number, version_id: number) {
  const db = getDb();
  db.prepare("DELETE FROM anomaly_records WHERE project_id = ? AND version_id = ?").run(project_id, version_id);
  updateProjectAnomalyFlags(project_id);
}

export function resolveAnomaly(id: number) {
  const db = getDb();
  const row = db.prepare("SELECT project_id FROM anomaly_records WHERE id = ?").get(id) as { project_id: number } | undefined;
  if (!row) return;
  db.prepare("UPDATE anomaly_records SET resolved = 1 WHERE id = ?").run(id);
  updateProjectAnomalyFlags(row.project_id);
}

export function sectionBelongsToVersion(sectionId: number, versionId: number): boolean {
  const db = getDb();
  const row = db.prepare("SELECT id FROM cross_sections WHERE id = ? AND version_id = ?").get(sectionId, versionId);
  return !!row;
}

export function waterLevelBelongsToVersion(id: number, versionId: number): boolean {
  const db = getDb();
  const row = db.prepare("SELECT w.id FROM water_levels w WHERE w.id = ? AND w.version_id = ?").get(id, versionId);
  return !!row;
}

export function roughnessBelongsToVersion(id: number, versionId: number): boolean {
  const db = getDb();
  const row = db.prepare("SELECT r.id FROM roughnesses r WHERE r.id = ? AND r.version_id = ?").get(id, versionId);
  return !!row;
}

export function obstacleBelongsToVersion(id: number, versionId: number): boolean {
  const db = getDb();
  const row = db.prepare("SELECT o.id FROM obstacles o WHERE o.id = ? AND o.version_id = ?").get(id, versionId);
  return !!row;
}

export function anomalyBelongsToVersion(id: number, versionId: number): boolean {
  const db = getDb();
  const row = db.prepare("SELECT a.id FROM anomaly_records a WHERE a.id = ? AND a.version_id = ?").get(id, versionId);
  return !!row;
}
