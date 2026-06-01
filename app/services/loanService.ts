import { db } from "~/db";
import type { LoanApplication, StageTransition } from "~/types";

export function getAllLoans(): LoanApplication[] {
  return db.prepare("SELECT * FROM loan_applications ORDER BY created_at DESC").all() as LoanApplication[];
}

export function getLoanById(id: number): LoanApplication | undefined {
  return db.prepare("SELECT * FROM loan_applications WHERE id = ?").get(id) as LoanApplication | undefined;
}

export function getLoansByStage(stage: string): LoanApplication[] {
  return db
    .prepare("SELECT * FROM loan_applications WHERE current_stage = ? ORDER BY created_at DESC")
    .all(stage) as LoanApplication[];
}

export function createLoanApplication(
  data: Omit<LoanApplication, "id" | "status" | "current_stage" | "created_at" | "updated_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO loan_applications (exhibit_id, exhibit_name, applicant_id, applicant_name, borrowing_institution, contact_person, contact_phone, contact_email, exhibition_name, exhibition_location, purpose, start_date, end_date, priority) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.exhibit_id,
    data.exhibit_name,
    data.applicant_id,
    data.applicant_name,
    data.borrowing_institution,
    data.contact_person,
    data.contact_phone,
    data.contact_email,
    data.exhibition_name,
    data.exhibition_location,
    data.purpose,
    data.start_date,
    data.end_date,
    data.priority
  );
  return result.lastInsertRowid as number;
}

export function updateLoanApplication(
  id: number,
  data: Partial<Omit<LoanApplication, "id" | "created_at" | "updated_at">>
): void {
  const setClauses = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(data), id];
  db
    .prepare(`UPDATE loan_applications SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);
}

export function transitionLoanStage(
  loanId: number,
  fromStage: string,
  toStage: string,
  operatorId: number,
  operatorName: string,
  remarks?: string
): void {
  db.transaction(() => {
    db
      .prepare(
        "UPDATE loan_applications SET current_stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      )
      .run(toStage, loanId);

    db
      .prepare(
        `INSERT INTO stage_transitions (loan_id, from_stage, to_stage, operator_id, operator_name, remarks) 
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(loanId, fromStage, toStage, operatorId, operatorName, remarks || null);
  })();
}

export function getStageTransitions(loanId: number): StageTransition[] {
  return db
    .prepare("SELECT * FROM stage_transitions WHERE loan_id = ? ORDER BY created_at ASC")
    .all(loanId) as StageTransition[];
}

export function approveLoan(id: number): void {
  db
    .prepare("UPDATE loan_applications SET status = 'approved', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(id);
}

export function rejectLoan(id: number): void {
  db
    .prepare("UPDATE loan_applications SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(id);
}

export function getLoanStats() {
  const stages = ["application", "review", "transport", "exhibition", "return", "completed"];
  const stats: Record<string, number> = {};

  stages.forEach((stage) => {
    const result = db
      .prepare("SELECT COUNT(*) as count FROM loan_applications WHERE current_stage = ?")
      .get(stage) as { count: number };
    stats[stage] = result.count;
  });

  return stats;
}
