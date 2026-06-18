import { loadDb, saveDb, nextId, datetimeNow } from "./index.server";
import type {
  VinylRecord,
  CleaningSolution,
  CleaningBatch,
  BatchVersion,
  AuditionLog,
  MaintenanceReminder,
  DataAlert,
} from "../types";

// === Vinyl Records ===
export function getAllRecords(): VinylRecord[] {
  const db = loadDb();
  return [...db.vinyl_records].sort((a: any, b: any) => {
    if (a.artist === b.artist) return (a.album || "").localeCompare(b.album || "");
    return (a.artist || "").localeCompare(b.artist || "");
  }) as VinylRecord[];
}

export function getRecord(id: number): VinylRecord | undefined {
  return loadDb().vinyl_records.find((r: any) => r.id === id) as VinylRecord | undefined;
}

export function createRecord(data: Omit<VinylRecord, "id" | "created_at" | "updated_at">): VinylRecord {
  const db = loadDb();
  const id = nextId(db.vinyl_records);
  const now = datetimeNow();
  const rec: VinylRecord = { id, created_at: now, updated_at: now, ...data } as VinylRecord;
  db.vinyl_records.push(rec);
  saveDb(db);
  return rec;
}

export function updateRecord(id: number, data: Partial<VinylRecord>): void {
  const db = loadDb();
  const row = db.vinyl_records.find((r: any) => r.id === id);
  if (row) {
    Object.assign(row, data, { updated_at: datetimeNow() });
    saveDb(db);
  }
}

export function deleteRecord(id: number): void {
  const db = loadDb();
  db.vinyl_records = db.vinyl_records.filter((r: any) => r.id !== id);
  db.cleaning_batches = db.cleaning_batches.filter((b: any) => b.record_id !== id);
  db.batch_versions = db.batch_versions.filter((v: any) => {
    const batch = db.cleaning_batches.find((b: any) => b.id === v.batch_id);
    return !!batch;
  });
  db.audition_logs = db.audition_logs.filter((a: any) => a.record_id !== id);
  saveDb(db);
}

export function searchRecords(keyword: string): VinylRecord[] {
  const kw = keyword.toLowerCase();
  return getAllRecords().filter((r: any) =>
    (r.artist || "").toLowerCase().includes(kw) ||
    (r.album || "").toLowerCase().includes(kw) ||
    (r.catalog_no || "").toLowerCase().includes(kw) ||
    (r.genre || "").toLowerCase().includes(kw)
  ) as VinylRecord[];
}

// === Cleaning Solutions ===
export function getAllSolutions(): CleaningSolution[] {
  return [...loadDb().cleaning_solutions].sort((a: any, b: any) =>
    (b.created_at || "").localeCompare(a.created_at || "")
  ) as CleaningSolution[];
}

export function getActiveSolutions(): CleaningSolution[] {
  return getAllSolutions().filter((s: any) => !!s.is_active) as CleaningSolution[];
}

export function getSolution(id: number): CleaningSolution | undefined {
  return loadDb().cleaning_solutions.find((s: any) => s.id === id) as CleaningSolution | undefined;
}

export function createSolution(data: Omit<CleaningSolution, "id" | "created_at">): CleaningSolution {
  const db = loadDb();
  const id = nextId(db.cleaning_solutions);
  const sol: CleaningSolution = { id, created_at: datetimeNow(), ...data } as CleaningSolution;
  db.cleaning_solutions.push(sol);
  saveDb(db);
  return sol;
}

export function updateSolution(id: number, data: Partial<CleaningSolution>): void {
  const db = loadDb();
  const row = db.cleaning_solutions.find((s: any) => s.id === id);
  if (row) {
    Object.assign(row, data);
    saveDb(db);
  }
}

// === Cleaning Batches ===
export interface BatchFilters {
  recordId?: number;
  solutionId?: number;
  resultRating?: number;
  dateFrom?: string;
  dateTo?: string;
  keyword?: string;
}

type BatchJoin = CleaningBatch & { artist: string; album: string; solution_name: string };

export function getAllBatches(filters: BatchFilters = {}): BatchJoin[] {
  const db = loadDb();
  const recordsById = Object.fromEntries(db.vinyl_records.map((r: any) => [r.id, r]));
  const solutionsById = Object.fromEntries(db.cleaning_solutions.map((s: any) => [s.id, s]));

  let result: any[] = db.cleaning_batches.map((b: any) => ({
    ...b,
    artist: recordsById[b.record_id]?.artist || "(已删除)",
    album: recordsById[b.record_id]?.album || "(已删除)",
    solution_name: solutionsById[b.solution_id]?.name || "(已删除)",
  }));

  if (filters.recordId) result = result.filter((b) => b.record_id === filters.recordId);
  if (filters.solutionId) result = result.filter((b) => b.solution_id === filters.solutionId);
  if (filters.resultRating !== undefined) {
    const r = filters.resultRating;
    if (r >= 4) result = result.filter((b) => b.result_rating >= r);
    else if (r <= 2) result = result.filter((b) => b.result_rating <= r);
    else result = result.filter((b) => b.result_rating === r);
  }
  const df = filters.dateFrom;
  const dt = filters.dateTo;
  if (df) result = result.filter((b) => b.cleaned_at >= df);
  if (dt) result = result.filter((b) => b.cleaned_at <= dt + " 23:59:59");
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    result = result.filter((b) =>
      (b.batch_code || "").toLowerCase().includes(kw) ||
      (b.anomalies || "").toLowerCase().includes(kw) ||
      (b.notes || "").toLowerCase().includes(kw) ||
      (b.operator || "").toLowerCase().includes(kw)
    );
  }

  result.sort((a: any, b: any) => (b.cleaned_at || "").localeCompare(a.cleaned_at || ""));
  return result as BatchJoin[];
}

export function getBatch(id: number): BatchJoin | undefined {
  return getAllBatches().find((b: any) => b.id === id);
}

export function getBatchesByRecord(recordId: number): (CleaningBatch & { solution_name: string })[] {
  const db = loadDb();
  const solutionsById = Object.fromEntries(db.cleaning_solutions.map((s: any) => [s.id, s]));
  return db.cleaning_batches
    .filter((b: any) => b.record_id === recordId)
    .map((b: any) => ({ ...b, solution_name: solutionsById[b.solution_id]?.name || "(已删除)" }))
    .sort((a: any, b: any) => (b.cleaned_at || "").localeCompare(a.cleaned_at || ""));
}

export function createBatch(data: Omit<CleaningBatch, "id" | "created_at" | "version">): CleaningBatch {
  const db = loadDb();
  const id = nextId(db.cleaning_batches);
  const now = datetimeNow();
  const batch: CleaningBatch = {
    id,
    created_at: now,
    version: 1,
    ...data,
  } as CleaningBatch;
  db.cleaning_batches.push(batch);
  saveDb(db);
  return batch;
}

export function updateBatch(id: number, data: Partial<CleaningBatch>, changedBy: string = "system"): void {
  const db = loadDb();
  const existing: any = db.cleaning_batches.find((b: any) => b.id === id);
  if (!existing) return;

  let versionIncr = 0;
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && existing[key] !== value) {
      const vid = nextId(db.batch_versions);
      db.batch_versions.push({
        id: vid,
        batch_id: id,
        version: existing.version + 1,
        field_changed: key,
        old_value: String(existing[key] ?? ""),
        new_value: String(value ?? ""),
        changed_at: datetimeNow(),
        changed_by: changedBy,
      } as any);
      existing[key] = value;
      versionIncr++;
    }
  }
  if (versionIncr > 0) {
    existing.version = (existing.version || 1) + 1;
    saveDb(db);
  }
}

export function deleteBatch(id: number): void {
  const db = loadDb();
  db.cleaning_batches = db.cleaning_batches.filter((b: any) => b.id !== id);
  db.batch_versions = db.batch_versions.filter((v: any) => v.batch_id !== id);
  db.audition_logs = db.audition_logs.map((a: any) =>
    a.batch_id === id ? { ...a, batch_id: null } : a
  );
  saveDb(db);
}

export function generateBatchCode(): string {
  const now = new Date();
  const prefix = `VC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const existing = loadDb().cleaning_batches
    .filter((b: any) => (b.batch_code || "").startsWith(prefix))
    .map((b: any) => parseInt(b.batch_code.slice(-3)) || 0);
  const seq = existing.length > 0 ? Math.max(...existing) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// === Batch Versions ===
export function getBatchVersions(batchId: number): BatchVersion[] {
  return loadDb().batch_versions
    .filter((v: any) => v.batch_id === batchId)
    .sort((a: any, b: any) => {
      if (b.changed_at === a.changed_at) return (b.id || 0) - (a.id || 0);
      return (b.changed_at || "").localeCompare(a.changed_at || "");
    }) as BatchVersion[];
}

// === Audition Logs ===
export function getAuditionsByRecord(recordId: number): AuditionLog[] {
  return loadDb().audition_logs
    .filter((a: any) => a.record_id === recordId)
    .sort((a: any, b: any) => (b.auditioned_at || "").localeCompare(a.auditioned_at || "")) as AuditionLog[];
}

export function createAudition(data: Omit<AuditionLog, "id">): AuditionLog {
  const db = loadDb();
  const id = nextId(db.audition_logs);
  const audition: AuditionLog = { id, ...data } as AuditionLog;
  db.audition_logs.push(audition);
  saveDb(db);
  return audition;
}

// === Maintenance Reminders ===
export function getAllReminders(): MaintenanceReminder[] {
  return [...loadDb().maintenance_reminders].sort((a: any, b: any) => {
    if (a.is_triggered !== b.is_triggered) return b.is_triggered - a.is_triggered;
    return (b.created_at || "").localeCompare(a.created_at || "");
  }) as MaintenanceReminder[];
}

export function getTriggeredReminders(): MaintenanceReminder[] {
  return getAllReminders().filter((r: any) => !!r.is_triggered);
}

export function createReminder(data: Omit<MaintenanceReminder, "id" | "created_at">): MaintenanceReminder {
  const db = loadDb();
  const id = nextId(db.maintenance_reminders);
  const reminder: MaintenanceReminder = { id, created_at: datetimeNow(), ...data } as MaintenanceReminder;
  db.maintenance_reminders.push(reminder);
  saveDb(db);
  return reminder;
}

export function updateReminder(id: number, data: Partial<MaintenanceReminder>): void {
  const db = loadDb();
  const row = db.maintenance_reminders.find((r: any) => r.id === id);
  if (row) {
    Object.assign(row, data);
    saveDb(db);
  }
}

export function incrementReminderCount(type: string): void {
  const db = loadDb();
  let changed = false;
  for (const r of db.maintenance_reminders) {
    if ((r as any).type === type) {
      (r as any).current_count = ((r as any).current_count || 0) + 1;
      if ((r as any).threshold_count) {
        (r as any).is_triggered = (r as any).current_count >= (r as any).threshold_count ? 1 : 0;
      }
      changed = true;
    }
  }
  if (changed) saveDb(db);
}

// === Data Alerts ===
export function getDataAlerts(): DataAlert[] {
  const alerts: DataAlert[] = [];
  const now = new Date();

  const solutions = getAllSolutions();
  for (const s of solutions as any[]) {
    if (s.expiry_date) {
      const expiry = new Date(s.expiry_date);
      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 30 && s.is_active) {
        alerts.push({
          id: `sol-expiry-${s.id}`,
          type: daysLeft <= 7 ? "error" : "warning",
          message: `清洗液「${s.name}」将在 ${daysLeft} 天后过期`,
          detail: `有效期至: ${s.expiry_date}`,
        });
      }
    }
  }

  const reminders = getTriggeredReminders();
  for (const r of reminders as any[]) {
    alerts.push({
      id: `maint-${r.id}`,
      type: "warning",
      message: getMaintenanceMessage(r),
      detail: `当前次数: ${r.current_count}${r.threshold_count ? ` / 阈值: ${r.threshold_count}` : ""}`,
    });
  }

  const batches = getAllBatches();
  for (const b of batches as any[]) {
    if (b.post_noise_level > b.pre_noise_level) {
      alerts.push({
        id: `noise-reg-${b.id}`,
        type: "warning",
        message: `批次 ${b.batch_code} 清洗后噪声不降反升`,
        detail: `${b.artist} - ${b.album} (${Number(b.pre_noise_level).toFixed(1)} → ${Number(b.post_noise_level).toFixed(1)})`,
        related_batch_id: b.id,
      });
    }
    if (b.result_rating <= 2) {
      alerts.push({
        id: `bad-result-${b.id}`,
        type: "error",
        message: `批次 ${b.batch_code} 清洗效果评级为 ${b.result_rating} 星`,
        detail: b.anomalies || `${b.artist} - ${b.album}`,
        related_batch_id: b.id,
      });
    }
    if (b.brush_count > 50) {
      alerts.push({
        id: `brush-abuse-${b.id}`,
        type: "warning",
        message: `批次 ${b.batch_code} 刷洗次数 ${b.brush_count} 异常偏高`,
        detail: `建议范围: 5-20 次`,
        related_batch_id: b.id,
      });
    }
    if (b.ultrasonic_minutes > 30) {
      alerts.push({
        id: `ultra-long-${b.id}`,
        type: "warning",
        message: `批次 ${b.batch_code} 超声时间 ${b.ultrasonic_minutes} 分钟过长`,
        detail: `建议范围: 5-15 分钟`,
        related_batch_id: b.id,
      });
    }
  }

  return alerts.sort((a, b) => {
    const order: Record<string, number> = { error: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });
}

function getMaintenanceMessage(r: any): string {
  const map: Record<string, string> = {
    brush_replace: "刷子需要更换",
    solution_refill: "清洗液需要补充/更换",
    ultrasonic_filter: "超声波机滤网需要清洁/更换",
    machine_calibration: "设备需要校准",
    pad_replace: "垫材需要更换",
  };
  return `${r.target}: ${map[r.type] || r.type}`;
}

// === Stats ===
export function getDashboardStats() {
  const db = loadDb();
  const totalRecords = db.vinyl_records.length;
  const totalBatches = db.cleaning_batches.length;
  const batchesArr = db.cleaning_batches as any[];
  const avgReduction = batchesArr.length
    ? batchesArr.reduce((a, b) => a + (Number(b.crackle_reduction) || 0), 0) / batchesArr.length
    : 0;
  const avgRating = batchesArr.length
    ? batchesArr.reduce((a, b) => a + (Number(b.result_rating) || 0), 0) / batchesArr.length
    : 0;
  const activeSolutions = db.cleaning_solutions.filter((s: any) => !!s.is_active).length;
  const alertsCount = getDataAlerts().length;

  return {
    totalRecords,
    totalBatches,
    avgReduction: Number(avgReduction.toFixed(1)),
    avgRating: Number(avgRating.toFixed(1)),
    activeSolutions,
    alertsCount,
  };
}
