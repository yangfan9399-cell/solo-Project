import { db } from "~/db";
import type { ConservationReview } from "~/types";

export function getReviewsByLoanId(loanId: number): ConservationReview[] {
  return db
    .prepare("SELECT * FROM conservation_reviews WHERE loan_id = ? ORDER BY created_at DESC")
    .all(loanId) as ConservationReview[];
}

export function getReviewById(id: number): ConservationReview | undefined {
  return db.prepare("SELECT * FROM conservation_reviews WHERE id = ?").get(id) as
    | ConservationReview
    | undefined;
}

export function createConservationReview(
  data: Omit<ConservationReview, "id" | "created_at">
): number {
  const stmt = db.prepare(
    `INSERT INTO conservation_reviews (loan_id, reviewer_id, reviewer_name, temperature_requirement, humidity_requirement, light_requirement, packaging_requirement, special_requirements, condition_assessment, risks, recommendations, approved, review_date, remarks) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.loan_id,
    data.reviewer_id,
    data.reviewer_name,
    data.temperature_requirement,
    data.humidity_requirement,
    data.light_requirement,
    data.packaging_requirement,
    data.special_requirements,
    data.condition_assessment,
    data.risks,
    data.recommendations,
    data.approved,
    data.review_date,
    data.remarks
  );
  return result.lastInsertRowid as number;
}
