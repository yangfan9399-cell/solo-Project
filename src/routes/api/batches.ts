import { getDb } from "~/lib/db";

export async function GET() {
  const db = await getDb();
  
  const batches = db.prepare(`
    SELECT 
      cb.*,
      COUNT(cp.id) as plan_count,
      SUM(CASE WHEN cp.status = 'completed' THEN 1 ELSE 0 END) as completed_plans
    FROM carve_batches cb
    LEFT JOIN carve_plans cp ON cp.batch_no = cb.batch_no
    GROUP BY cb.id
    ORDER BY cb.created_at DESC
  `).all();

  return batches;
}

export async function POST({ request }: { request: Request }) {
  const db = await getDb();
  const body = await request.json();
  
  const batchNo = `BATCH-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`;
  
  const info = db.prepare(`
    INSERT INTO carve_batches (batch_no, total_chars, status, version, parent_batch)
    VALUES (?, ?, 'draft', 1, ?)
  `).run(batchNo, body.chars?.length || 0, body.parent_batch || null);

  if (body.chars && body.chars.length > 0) {
    const insertPlan = db.prepare(`
      INSERT INTO carve_plans (batch_no, character, quantity, priority, status, task_id, notes)
      VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `);
    
    for (const charItem of body.chars) {
      insertPlan.run(
        batchNo,
        charItem.character,
        charItem.quantity || 1,
        charItem.priority || 'medium',
        charItem.task_id || null,
        charItem.notes || null
      );
    }
  }

  return { id: info.lastInsertRowid, batch_no: batchNo };
}
