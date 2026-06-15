import { getDb } from "~/lib/db";

export async function GET() {
  const db = await getDb();
  
  const tasks = db.prepare(`
    SELECT 
      pt.*,
      COUNT(cp.id) as carve_plan_count,
      GROUP_CONCAT(DISTINCT cb.batch_no) as related_batches
    FROM print_tasks pt
    LEFT JOIN carve_plans cp ON cp.task_id = pt.id
    LEFT JOIN carve_batches cb ON cp.batch_no = cb.batch_no
    GROUP BY pt.id
    ORDER BY pt.created_at DESC
  `).all();

  return tasks.map(t => ({
    ...t,
    required_chars: JSON.parse(t.required_chars),
    related_batches: t.related_batches ? t.related_batches.split(',') : []
  }));
}

export async function POST({ request }: { request: Request }) {
  const db = await getDb();
  const body = await request.json();
  
  const taskNo = `TASK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  
  const info = db.prepare(`
    INSERT INTO print_tasks (task_no, title, client, required_chars, status, priority, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    taskNo,
    body.title,
    body.client,
    JSON.stringify(body.required_chars || []),
    body.status || 'draft',
    body.priority || 'normal',
    body.deadline
  );

  return { id: info.lastInsertRowid, task_no: taskNo };
}
