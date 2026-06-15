import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ request }: APIEvent) {
  const db = await getDb();
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const format = url.searchParams.get('format') || 'json';
  
  let data: any;
  
  if (type === 'all' || type === 'trays') {
    const trays = db.prepare(`SELECT * FROM tray_slots ORDER BY tray_id, row, col`).all();
    data = { ...data, trays };
  }
  
  if (type === 'all' || type === 'tasks') {
    const tasks = db.prepare(`SELECT * FROM print_tasks ORDER BY created_at DESC`).all();
    data = { ...data, tasks: tasks.map(t => ({ ...t, required_chars: JSON.parse(t.required_chars) })) };
  }
  
  if (type === 'all' || type === 'batches') {
    const batches = db.prepare(`SELECT * FROM carve_batches ORDER BY created_at DESC`).all();
    const plans = db.prepare(`SELECT * FROM carve_plans ORDER BY batch_no, id`).all();
    data = { ...data, batches, carve_plans: plans };
  }
  
  if (type === 'all' || type === 'history') {
    const history = db.prepare(`SELECT * FROM tray_history ORDER BY timestamp DESC`).all();
    data = { ...data, history };
  }
  
  const exportData = {
    export_time: new Date().toISOString(),
    export_type: type,
    version: '1.0.0',
    ...data
  };
  
  if (format === 'csv') {
    return new Response(generateCSV(exportData), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="woodtype-export-${Date.now()}.csv"`
      }
    });
  }
  
  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="woodtype-export-${Date.now()}.json"`
    }
  });
}

function generateCSV(data: any): string {
  const lines: string[] = [];
  
  if (data.trays) {
    lines.push('=== 字盘格位 ===');
    lines.push('tray_id,row,col,character,status,wear_level,version,created_at');
    for (const t of data.trays) {
      lines.push(`${t.tray_id},${t.row},${t.col},${t.character || ''},${t.status},${t.wear_level},${t.version},${t.created_at}`);
    }
    lines.push('');
  }
  
  if (data.tasks) {
    lines.push('=== 印刷任务 ===');
    lines.push('task_no,title,client,status,priority,deadline,required_chars');
    for (const t of data.tasks) {
      lines.push(`${t.task_no},${t.title},${t.client},${t.status},${t.priority},${t.deadline},"${t.required_chars.join('|')}"`);
    }
    lines.push('');
  }
  
  if (data.batches) {
    lines.push('=== 补刻批次 ===');
    lines.push('batch_no,total_chars,completed_chars,status,version,parent_batch,created_at');
    for (const b of data.batches) {
      lines.push(`${b.batch_no},${b.total_chars},${b.completed_chars},${b.status},${b.version},${b.parent_batch || ''},${b.created_at}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
