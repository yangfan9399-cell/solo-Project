import db from "./index.server";
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
  return db.prepare("SELECT * FROM vinyl_records ORDER BY artist, album").all() as VinylRecord[];
}

export function getRecord(id: number): VinylRecord | undefined {
  return db.prepare("SELECT * FROM vinyl_records WHERE id = ?").get(id) as VinylRecord | undefined;
}

export function createRecord(data: Omit<VinylRecord, "id" | "created_at" | "updated_at">): VinylRecord {
  const stmt = db.prepare(`
    INSERT INTO vinyl_records (catalog_no, artist, album, year, genre, condition, weight, pressing, notes)
    VALUES (@catalog_no, @artist, @album, @year, @genre, @condition, @weight, @pressing, @notes)
  `);
  const result = stmt.run(data);
  return getRecord(result.lastInsertRowid as number)!;
}

export function updateRecord(id: number, data: Partial<VinylRecord>): void {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE vinyl_records SET ${fields}, updated_at = datetime('now') WHERE id = @id`).run({ ...data, id });
}

export function deleteRecord(id: number): void {
  db.prepare("DELETE FROM vinyl_records WHERE id = ?").run(id);
}

export function searchRecords(keyword: string): VinylRecord[] {
  const like = `%${keyword}%`;
  return db.prepare(`
    SELECT * FROM vinyl_records
    WHERE artist LIKE ? OR album LIKE ? OR catalog_no LIKE ? OR genre LIKE ?
    ORDER BY artist, album
  `).all(like, like, like, like) as VinylRecord[];
}

// === Cleaning Solutions ===
export function getAllSolutions(): CleaningSolution[] {
  return db.prepare("SELECT * FROM cleaning_solutions ORDER BY created_at DESC").all() as CleaningSolution[];
}

export function getActiveSolutions(): CleaningSolution[] {
  return db.prepare("SELECT * FROM cleaning_solutions WHERE is_active = 1 ORDER BY name").all() as CleaningSolution[];
}

export function getSolution(id: number): CleaningSolution | undefined {
  return db.prepare("SELECT * FROM cleaning_solutions WHERE id = ?").get(id) as CleaningSolution | undefined;
}

export function createSolution(data: Omit<CleaningSolution, "id" | "created_at">): CleaningSolution {
  const stmt = db.prepare(`
    INSERT INTO cleaning_solutions (name, brand, type, ph, dilution_ratio, volume_ml, opened_date, expiry_date, is_active, notes)
    VALUES (@name, @brand, @type, @ph, @dilution_ratio, @volume_ml, @opened_date, @expiry_date, @is_active, @notes)
  `);
  const result = stmt.run(data);
  return getSolution(result.lastInsertRowid as number)!;
}

export function updateSolution(id: number, data: Partial<CleaningSolution>): void {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE cleaning_solutions SET ${fields} WHERE id = @id`).run({ ...data, id });
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

export function getAllBatches(filters: BatchFilters = {}): (CleaningBatch & { artist: string; album: string; solution_name: string })[] {
  const conditions: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.recordId) {
    conditions.push("b.record_id = @recordId");
    params.recordId = filters.recordId;
  }
  if (filters.solutionId) {
    conditions.push("b.solution_id = @solutionId");
    params.solutionId = filters.solutionId;
  }
  if (filters.resultRating) {
    conditions.push("b.result_rating = @resultRating");
    params.resultRating = filters.resultRating;
  }
  if (filters.dateFrom) {
    conditions.push("b.cleaned_at >= @dateFrom");
    params.dateFrom = filters.dateFrom;
  }
  if (filters.dateTo) {
    conditions.push("b.cleaned_at <= @dateTo");
    params.dateTo = filters.dateTo;
  }
  if (filters.keyword) {
    conditions.push("(b.batch_code LIKE @keyword OR b.anomalies LIKE @keyword OR b.notes LIKE @keyword OR b.operator LIKE @keyword)");
    params.keyword = `%${filters.keyword}%`;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return db.prepare(`
    SELECT b.*, r.artist, r.album, s.name as solution_name
    FROM cleaning_batches b
    JOIN vinyl_records r ON b.record_id = r.id
    JOIN cleaning_solutions s ON b.solution_id = s.id
    ${where}
    ORDER BY b.cleaned_at DESC
  `).all(params) as any[];
}

export function getBatch(id: number): (CleaningBatch & { artist: string; album: string; solution_name: string }) | undefined {
  return db.prepare(`
    SELECT b.*, r.artist, r.album, s.name as solution_name
    FROM cleaning_batches b
    JOIN vinyl_records r ON b.record_id = r.id
    JOIN cleaning_solutions s ON b.solution_id = s.id
    WHERE b.id = ?
  `).get(id) as any;
}

export function getBatchesByRecord(recordId: number): (CleaningBatch & { solution_name: string })[] {
  return db.prepare(`
    SELECT b.*, s.name as solution_name
    FROM cleaning_batches b
    JOIN cleaning_solutions s ON b.solution_id = s.id
    WHERE b.record_id = ?
    ORDER BY b.cleaned_at DESC
  `).all(recordId) as any[];
}

export function createBatch(data: Omit<CleaningBatch, "id" | "created_at" | "version">): CleaningBatch {
  const stmt = db.prepare(`
    INSERT INTO cleaning_batches (
      batch_code, record_id, solution_id, brush_type, brush_count, ultrasonic_minutes,
      ultrasonic_temp_c, rinse_count, drying_method, drying_minutes, operator,
      pre_noise_level, post_noise_level, crackle_reduction, result_rating, anomalies, notes, cleaned_at
    ) VALUES (
      @batch_code, @record_id, @solution_id, @brush_type, @brush_count, @ultrasonic_minutes,
      @ultrasonic_temp_c, @rinse_count, @drying_method, @drying_minutes, @operator,
      @pre_noise_level, @post_noise_level, @crackle_reduction, @result_rating, @anomalies, @notes, @cleaned_at
    )
  `);
  const result = stmt.run(data);
  return db.prepare("SELECT * FROM cleaning_batches WHERE id = ?").get(result.lastInsertRowid) as CleaningBatch;
}

export function updateBatch(id: number, data: Partial<CleaningBatch>, changedBy: string = "system"): void {
  const existing = db.prepare("SELECT * FROM cleaning_batches WHERE id = ?").get(id) as CleaningBatch;
  if (!existing) return;

  const fields: string[] = [];
  const params: Record<string, unknown> = { id };

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && (existing as any)[key] !== value) {
      fields.push(`${key} = @${key}`);
      params[key] = value;
      db.prepare(`
        INSERT INTO batch_versions (batch_id, version, field_changed, old_value, new_value, changed_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        existing.version + 1,
        key,
        String((existing as any)[key] ?? ""),
        String(value ?? ""),
        changedBy
      );
    }
  }

  if (fields.length > 0) {
    db.prepare(`UPDATE cleaning_batches SET ${fields.join(", ")}, version = version + 1 WHERE id = @id`).run(params);
  }
}

export function deleteBatch(id: number): void {
  db.prepare("DELETE FROM cleaning_batches WHERE id = ?").run(id);
}

export function generateBatchCode(): string {
  const now = new Date();
  const prefix = `VC${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const last = db.prepare("SELECT batch_code FROM cleaning_batches WHERE batch_code LIKE ? ORDER BY batch_code DESC LIMIT 1").get(`${prefix}%`) as { batch_code: string } | undefined;
  const seq = last ? parseInt(last.batch_code.slice(-3)) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, "0")}`;
}

// === Batch Versions / History ===
export function getBatchVersions(batchId: number): BatchVersion[] {
  return db.prepare(`
    SELECT * FROM batch_versions WHERE batch_id = ? ORDER BY changed_at DESC, id DESC
  `).all(batchId) as BatchVersion[];
}

// === Audition Logs ===
export function getAuditionsByRecord(recordId: number): AuditionLog[] {
  return db.prepare(`
    SELECT * FROM audition_logs WHERE record_id = ? ORDER BY auditioned_at DESC
  `).all(recordId) as AuditionLog[];
}

export function createAudition(data: Omit<AuditionLog, "id">): AuditionLog {
  const stmt = db.prepare(`
    INSERT INTO audition_logs (
      record_id, batch_id, side, track_no, noise_level, crackles, pops, surface_noise,
      distortion, warble, inner_groove_distortion, listener, equipment, notes, auditioned_at
    ) VALUES (
      @record_id, @batch_id, @side, @track_no, @noise_level, @crackles, @pops, @surface_noise,
      @distortion, @warble, @inner_groove_distortion, @listener, @equipment, @notes, @auditioned_at
    )
  `);
  const result = stmt.run(data);
  return db.prepare("SELECT * FROM audition_logs WHERE id = ?").get(result.lastInsertRowid) as AuditionLog;
}

// === Maintenance Reminders ===
export function getAllReminders(): MaintenanceReminder[] {
  return db.prepare("SELECT * FROM maintenance_reminders ORDER BY is_triggered DESC, created_at DESC").all() as MaintenanceReminder[];
}

export function getTriggeredReminders(): MaintenanceReminder[] {
  return db.prepare("SELECT * FROM maintenance_reminders WHERE is_triggered = 1 ORDER BY created_at DESC").all() as MaintenanceReminder[];
}

export function createReminder(data: Omit<MaintenanceReminder, "id" | "created_at">): MaintenanceReminder {
  const stmt = db.prepare(`
    INSERT INTO maintenance_reminders (type, target, threshold_count, threshold_date, current_count, is_triggered, last_maintenance, notes)
    VALUES (@type, @target, @threshold_count, @threshold_date, @current_count, @is_triggered, @last_maintenance, @notes)
  `);
  const result = stmt.run(data);
  return db.prepare("SELECT * FROM maintenance_reminders WHERE id = ?").get(result.lastInsertRowid) as MaintenanceReminder;
}

export function updateReminder(id: number, data: Partial<MaintenanceReminder>): void {
  const fields = Object.keys(data).map((k) => `${k} = @${k}`).join(", ");
  db.prepare(`UPDATE maintenance_reminders SET ${fields} WHERE id = @id`).run({ ...data, id });
}

export function incrementReminderCount(type: string): void {
  const reminders = db.prepare("SELECT * FROM maintenance_reminders WHERE type = ?").all(type) as MaintenanceReminder[];
  for (const r of reminders) {
    const newCount = r.current_count + 1;
    const isTriggered = r.threshold_count ? newCount >= r.threshold_count : r.is_triggered;
    db.prepare("UPDATE maintenance_reminders SET current_count = ?, is_triggered = ? WHERE id = ?").run(newCount, isTriggered ? 1 : 0, r.id);
  }
}

// === Data Alerts ===
export function getDataAlerts(): DataAlert[] {
  const alerts: DataAlert[] = [];
  const now = new Date();

  const solutions = getAllSolutions();
  for (const s of solutions) {
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
  for (const r of reminders) {
    alerts.push({
      id: `maint-${r.id}`,
      type: "warning",
      message: getMaintenanceMessage(r),
      detail: `当前次数: ${r.current_count}${r.threshold_count ? ` / 阈值: ${r.threshold_count}` : ""}`,
    });
  }

  const batches = getAllBatches();
  for (const b of batches) {
    if (b.post_noise_level > b.pre_noise_level) {
      alerts.push({
        id: `noise-reg-${b.id}`,
        type: "warning",
        message: `批次 ${b.batch_code} 清洗后噪声不降反升`,
        detail: `${b.artist} - ${b.album} (${b.pre_noise_level.toFixed(1)} → ${b.post_noise_level.toFixed(1)})`,
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
    const order = { error: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });
}

function getMaintenanceMessage(r: MaintenanceReminder): string {
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
  const totalRecords = (db.prepare("SELECT COUNT(*) as c FROM vinyl_records").get() as { c: number }).c;
  const totalBatches = (db.prepare("SELECT COUNT(*) as c FROM cleaning_batches").get() as { c: number }).c;
  const avgReduction = (db.prepare("SELECT AVG(crackle_reduction) as c FROM cleaning_batches").get() as { c: number }).c || 0;
  const avgRating = (db.prepare("SELECT AVG(result_rating) as c FROM cleaning_batches").get() as { c: number }).c || 0;
  const activeSolutions = (db.prepare("SELECT COUNT(*) as c FROM cleaning_solutions WHERE is_active = 1").get() as { c: number }).c;
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
