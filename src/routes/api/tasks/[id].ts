import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  const db = await getDb();
  const taskId = params.id;
  
  const task = db.prepare(`
    SELECT * FROM print_tasks WHERE id = ?
  `).get(taskId);
  
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }
  
  const plans = db.prepare(`
    SELECT cp.*, cb.status as batch_status, cb.version as batch_version
    FROM carve_plans cp
    LEFT JOIN carve_batches cb ON cp.batch_no = cb.batch_no
    WHERE cp.task_id = ?
    ORDER BY cp.priority DESC, cp.created_at
  `).all(taskId);

  const missingAnalysis = analyzeTaskChars(db, task);

  return {
    ...task,
    required_chars: JSON.parse(task.required_chars),
    carve_plans: plans,
    missing_analysis: missingAnalysis
  };
}

function analyzeTaskChars(db: any, task: any) {
  const chars = JSON.parse(task.required_chars);
  const result: Record<string, any> = {};
  
  for (const char of chars) {
    const slots = db.prepare(`
      SELECT * FROM tray_slots 
      WHERE character = ? AND status IN ('normal', 'worn')
      ORDER BY wear_level ASC
    `).all(char);
    
    const missing = slots.length === 0;
    const worn = slots.some((s: any) => s.status === 'worn');
    
    result[char] = {
      available: slots.length,
      missing,
      worn,
      slots: slots.slice(0, 3)
    };
  }
  
  return result;
}

export async function PATCH({ params, request }: APIEvent) {
  const db = await getDb();
  const taskId = params.id;
  const body = await request.json();
  
  const task = db.prepare(`SELECT * FROM print_tasks WHERE id = ?`).get(taskId);
  if (!task) {
    return new Response(JSON.stringify({ error: 'Task not found' }), { status: 404 });
  }

  const oldStatus = task.status;
  const newStatus = body.status || oldStatus;

  db.prepare(`
    UPDATE print_tasks 
    SET status = ?, title = ?, client = ?, deadline = ?, priority = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    body.status || task.status,
    body.title || task.title,
    body.client || task.client,
    body.deadline || task.deadline,
    body.priority || task.priority,
    taskId
  );

  if (oldStatus !== newStatus) {
    if (newStatus === 'confirmed' || newStatus === 'in_production') {
      generateTaskAlerts(db, taskId);
    }
  }

  return { success: true };
}

function generateTaskAlerts(db: any, taskId: number) {
  const task = db.prepare(`SELECT * FROM print_tasks WHERE id = ?`).get(taskId);
  const chars = JSON.parse(task.required_chars);
  
  let missingCount = 0;
  
  for (const char of chars) {
    const count = db.prepare(`
      SELECT COUNT(*) as cnt FROM tray_slots 
      WHERE character = ? AND status = 'normal'
    `).get(char).cnt;
    
    if (count === 0) {
      missingCount++;
      
      const existing = db.prepare(`
        SELECT COUNT(*) as cnt FROM alerts 
        WHERE type = 'missing' AND character = ? AND task_id = ? AND is_read = 0
      `).get(char, taskId).cnt;
      
      if (existing === 0) {
        const slot = db.prepare(`
          SELECT * FROM tray_slots WHERE character = ? LIMIT 1
        `).get(char);
        
        db.prepare(`
          INSERT INTO alerts (type, severity, message, character, task_id)
          VALUES ('missing', 'danger', ?, ?, ?)
        `).run(
          `字「${char}」在任务 "${task.title}" 中缺失，需补刻`,
          char,
          taskId
        );
      }
    }
  }
  
  if (missingCount > 0) {
    db.prepare(`
      INSERT INTO alerts (type, severity, message, task_id)
      VALUES ('shortage', 'danger', ?, ?)
    `).run(
      `任务 ${task.task_no} 缺字 ${missingCount} 个，影响生产进度`,
      taskId
    );
  }
}
