import { db } from "~/db";
import type { Exhibit } from "~/types";

export function getAllExhibits(): Exhibit[] {
  return db.prepare("SELECT * FROM exhibits ORDER BY created_at DESC").all() as Exhibit[];
}

export function getExhibitById(id: number): Exhibit | undefined {
  return db.prepare("SELECT * FROM exhibits WHERE id = ?").get(id) as Exhibit | undefined;
}

export function searchExhibits(query: string): Exhibit[] {
  const searchQuery = `%${query}%`;
  return db
    .prepare(
      "SELECT * FROM exhibits WHERE name LIKE ? OR code LIKE ? OR category LIKE ? OR era LIKE ? ORDER BY created_at DESC"
    )
    .all(searchQuery, searchQuery, searchQuery, searchQuery) as Exhibit[];
}

export function createExhibit(data: Omit<Exhibit, "id" | "created_at" | "updated_at">): number {
  const stmt = db.prepare(
    `INSERT INTO exhibits (name, code, category, era, material, dimensions, weight, description, condition, storage_location, value, insurance_info, image_url) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.name,
    data.code,
    data.category,
    data.era,
    data.material,
    data.dimensions,
    data.weight,
    data.description,
    data.condition,
    data.storage_location,
    data.value,
    data.insurance_info,
    data.image_url
  );
  return result.lastInsertRowid as number;
}

export function updateExhibit(
  id: number,
  data: Partial<Omit<Exhibit, "id" | "created_at" | "updated_at">>
): void {
  const setClauses = Object.keys(data)
    .map((key) => `${key} = ?`)
    .join(", ");
  const values = [...Object.values(data), id];
  db.prepare(`UPDATE exhibits SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(
    ...values
  );
}

export function deleteExhibit(id: number): void {
  db.prepare("DELETE FROM exhibits WHERE id = ?").run(id);
}

export function getAvailableExhibits(): Exhibit[] {
  return db
    .prepare(
      `SELECT e.* FROM exhibits e 
       WHERE e.id NOT IN (
         SELECT exhibit_id FROM loan_applications 
         WHERE status IN ('pending', 'approved') AND current_stage != 'completed'
       )
       ORDER BY e.created_at DESC`
    )
    .all() as Exhibit[];
}
