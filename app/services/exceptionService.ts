import { db } from "~/db";
import type { Exception } from "~/types";

export function getAllExceptions(): Exception[] {
  return db.prepare("SELECT * FROM exceptions ORDER BY created_at DESC").all() as Exception[];
}

export function getExceptionsByLoanId(loanId: number): Exception[] {
  return db
    .prepare("SELECT * FROM exceptions WHERE loan_id = ? ORDER BY created_at DESC")
    .all(loanId) as Exception[];
}

export function getExceptionsByStatus(status: string): Exception[] {
  return db
    .prepare("SELECT * FROM exceptions WHERE status = ? ORDER BY created_at DESC")
    .all(status) as Exception[];
}

export function getExceptionById(id: number): Exception | undefined {
  return db.prepare("SELECT * FROM exceptions WHERE id = ?").get(id) as Exception | undefined;
}

export function createException(
  data: Omit<Exception, "id" | "created_at" | "resolved_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO exceptions (loan_id, exhibit_id, reporter_id, reporter_name, type, title, description, severity, status, assigned_to_id, assigned_to_name, resolution) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.loan_id,
    data.exhibit_id,
    data.reporter_id,
    data.reporter_name,
    data.type,
    data.title,
    data.description,
    data.severity,
    data.status,
    data.assigned_to_id,
    data.assigned_to_name,
    data.resolution
  );
  return result.lastInsertRowid as number;
}

export function updateException(
  id: number,
  data: Partial<Omit<Exception, "id" | "created_at">>
): void {
  const setClauses = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(data), id];
  db.prepare(`UPDATE exceptions SET ${setClauses} WHERE id = ?`).run(...values);
}

export function resolveException(id: number, resolution: string): void {
  db
    .prepare(
      "UPDATE exceptions SET status = 'resolved', resolution = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .run(resolution, id);
}
