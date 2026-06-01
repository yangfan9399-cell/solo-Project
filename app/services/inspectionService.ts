import { db } from "~/db";
import type { InspectionRecord } from "~/types";

export function getInspectionsByLoanId(loanId: number): InspectionRecord[] {
  return db
    .prepare("SELECT * FROM inspection_records WHERE loan_id = ? ORDER BY inspection_date DESC")
    .all(loanId) as InspectionRecord[];
}

export function getInspectionById(id: number): InspectionRecord | undefined {
  return db.prepare("SELECT * FROM inspection_records WHERE id = ?").get(id) as
    | InspectionRecord
    | undefined;
}

export function createInspectionRecord(
  data: Omit<InspectionRecord, "id" | "created_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO inspection_records (loan_id, inspector_id, inspector_name, inspection_date, temperature, humidity, condition_status, display_check, security_check, environment_check, findings, recommendations, photos) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.loan_id,
    data.inspector_id,
    data.inspector_name,
    data.inspection_date,
    data.temperature,
    data.humidity,
    data.condition_status,
    data.display_check,
    data.security_check,
    data.environment_check,
    data.findings,
    data.recommendations,
    data.photos
  );
  return result.lastInsertRowid as number;
}
