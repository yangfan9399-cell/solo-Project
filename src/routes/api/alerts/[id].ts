import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function PATCH({ params }: APIEvent) {
  const db = await getDb();
  const id = params.id;
  
  db.prepare(`UPDATE alerts SET is_read = 1 WHERE id = ?`).run(id);
  
  return { success: true };
}
