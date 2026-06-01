import { db } from "~/db";
import type { ReturnRecord } from "~/types";

export function getReturnsByLoanId(loanId: number): ReturnRecord[] {
  return db
    .prepare("SELECT * FROM return_records WHERE loan_id = ? ORDER BY created_at DESC")
    .all(loanId) as ReturnRecord[];
}

export function getReturnById(id: number): ReturnRecord | undefined {
  return db.prepare("SELECT * FROM return_records WHERE id = ?").get(id) as
    | ReturnRecord
    | undefined;
}

export function createReturnRecord(
  data: Omit<ReturnRecord, "id" | "created_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO return_records (loan_id, handler_id, handler_name, return_date, return_location, receiver_name, receiver_phone, package_condition, overall_condition, items_checked, discrepancies, signatures, photos, remarks) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.loan_id,
    data.handler_id,
    data.handler_name,
    data.return_date,
    data.return_location,
    data.receiver_name,
    data.receiver_phone,
    data.package_condition,
    data.overall_condition,
    data.items_checked,
    data.discrepancies,
    data.signatures,
    data.photos,
    data.remarks
  );
  return result.lastInsertRowid as number;
}
