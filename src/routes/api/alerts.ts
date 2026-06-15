import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const db = await getDb();
  const url = new URL(request.url);
  const all = url.searchParams.get('all') === '1';
  
  let sql = `SELECT a.*, pt.task_no, pt.title as task_title
    FROM alerts a
    LEFT JOIN print_tasks pt ON a.task_id = pt.id`;
  
  if (!all) {
    sql += ` WHERE a.is_read = 0`;
  }
  
  sql += ` ORDER BY 
    CASE a.severity 
      WHEN 'danger' THEN 1 
      WHEN 'warning' THEN 2 
      ELSE 3 
    END, 
    a.created_at DESC
    LIMIT 50`;
  
  const alerts = db.prepare(sql).all();
  
  const counts = db.prepare(`
    SELECT 
      SUM(CASE WHEN is_read = 0 AND severity = 'danger' THEN 1 ELSE 0 END) as danger_unread,
      SUM(CASE WHEN is_read = 0 AND severity = 'warning' THEN 1 ELSE 0 END) as warning_unread,
      SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as total_unread
    FROM alerts
  `).get();

  return { alerts, counts };
}

export async function POST({ request }: { request: Request }) {
  const db = await getDb();
  const body = await request.json();
  
  const info = db.prepare(`
    INSERT INTO alerts (type, severity, message, character, task_id, batch_no)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    body.type,
    body.severity,
    body.message,
    body.character || null,
    body.task_id || null,
    body.batch_no || null
  );

  return { id: info.lastInsertRowid };
}
