import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const db = await getDb();
  const url = new URL(request.url);
  const slotId = url.searchParams.get('slot_id');
  const trayId = url.searchParams.get('tray_id');
  const batchNo = url.searchParams.get('batch_no');
  const taskId = url.searchParams.get('task_id');
  const limit = parseInt(url.searchParams.get('limit') || '100');
  
  let sql = `SELECT th.*, pt.task_no
    FROM tray_history th
    LEFT JOIN print_tasks pt ON th.task_id = pt.id
    WHERE 1=1`;
  const params: any[] = [];
  
  if (slotId) {
    sql += ` AND th.slot_id = ?`;
    params.push(slotId);
  }
  if (trayId) {
    sql += ` AND th.tray_id = ?`;
    params.push(trayId);
  }
  if (batchNo) {
    sql += ` AND th.batch_no = ?`;
    params.push(batchNo);
  }
  if (taskId) {
    sql += ` AND th.task_id = ?`;
    params.push(taskId);
  }
  
  sql += ` ORDER BY th.timestamp DESC LIMIT ?`;
  params.push(limit);
  
  const history = db.prepare(sql).all(...params);
  
  return history;
}
