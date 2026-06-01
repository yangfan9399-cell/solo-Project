import { db } from "~/db";
import type { DamageRecord } from "~/types";

export function getAllDamages(): DamageRecord[] {
  return db.prepare("SELECT * FROM damage_records ORDER BY created_at DESC").all() as DamageRecord[];
}

export function getDamagesByExhibitId(exhibitId: number): DamageRecord[] {
  return db
    .prepare("SELECT * FROM damage_records WHERE exhibit_id = ? ORDER BY created_at DESC")
    .all(exhibitId) as DamageRecord[];
}

export function getDamagesByLoanId(loanId: number): DamageRecord[] {
  return db
    .prepare("SELECT * FROM damage_records WHERE loan_id = ? ORDER BY created_at DESC")
    .all(loanId) as DamageRecord[];
}

export function getDamageById(id: number): DamageRecord | undefined {
  return db.prepare("SELECT * FROM damage_records WHERE id = ?").get(id) as
    | DamageRecord
    | undefined;
}

export function createDamageRecord(
  data: Omit<DamageRecord, "id" | "created_at" | "updated_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO damage_records (exhibit_id, loan_id, reporter_id, reporter_name, discovery_date, damage_location, damage_type, damage_severity, description, cause, immediate_actions, photos, status, repair_plan, estimated_cost, repair_status, remarks) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.exhibit_id,
    data.loan_id,
    data.reporter_id,
    data.reporter_name,
    data.discovery_date,
    data.damage_location,
    data.damage_type,
    data.damage_severity,
    data.description,
    data.cause,
    data.immediate_actions,
    data.photos,
    data.status,
    data.repair_plan,
    data.estimated_cost,
    data.repair_status,
    data.remarks
  );
  return result.lastInsertRowid as number;
}

export function updateDamageRecord(
  id: number,
  data: Partial<Omit<DamageRecord, "id" | "created_at" | "updated_at">>
): void {
  const setClauses = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(data), id];
  db
    .prepare(`UPDATE damage_records SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);
}
