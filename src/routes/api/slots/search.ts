import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const db = await getDb();
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || '';
  const trayId = url.searchParams.get('tray') || '';
  
  let sql = `SELECT ts.*, pt.title as task_title, cb.batch_no as carve_batch
    FROM tray_slots ts
    LEFT JOIN carve_plans cp ON ts.character = cp.character AND cp.status != 'cancelled'
    LEFT JOIN print_tasks pt ON cp.task_id = pt.id
    LEFT JOIN carve_batches cb ON cp.batch_no = cb.batch_no
    WHERE 1=1`;
  const params: any[] = [];
  
  if (q) {
    sql += ` AND ts.character LIKE ?`;
    params.push(`%${q}%`);
  }
  if (status) {
    sql += ` AND ts.status = ?`;
    params.push(status);
  }
  if (trayId) {
    sql += ` AND ts.tray_id = ?`;
    params.push(trayId);
  }
  
  sql += ` ORDER BY ts.tray_id, ts.row, ts.col LIMIT 100`;
  
  const results = db.prepare(sql).all(...params);
  return results;
}
