import { getDb } from "~/lib/db";
import type { APIEvent } from "@solidjs/start/server";

export async function GET({ params }: APIEvent) {
  const db = await getDb();
  const batchNo = params.no;
  
  const batch = db.prepare(`
    SELECT * FROM carve_batches WHERE batch_no = ?
  `).get(batchNo);
  
  if (!batch) {
    return new Response(JSON.stringify({ error: 'Batch not found' }), { status: 404 });
  }
  
  const plans = db.prepare(`
    SELECT cp.*, pt.task_no, pt.title as task_title
    FROM carve_plans cp
    LEFT JOIN print_tasks pt ON cp.task_id = pt.id
    WHERE cp.batch_no = ?
    ORDER BY cp.priority DESC, cp.id
  `).all(batchNo);

  const history = db.prepare(`
    SELECT * FROM tray_history 
    WHERE batch_no = ?
    ORDER BY timestamp DESC
  `).all(batchNo);

  const previousVersions = db.prepare(`
    SELECT * FROM carve_batches 
    WHERE batch_no = ? OR parent_batch = ?
    ORDER BY version
  `).all(batchNo, batchNo);

  return {
    ...batch,
    plans,
    history,
    previous_versions: previousVersions
  };
}

export async function PATCH({ params, request }: APIEvent) {
  const db = await getDb();
  const batchNo = params.no;
  const body = await request.json();
  
  const batch = db.prepare(`SELECT * FROM carve_batches WHERE batch_no = ?`).get(batchNo);
  if (!batch) {
    return new Response(JSON.stringify({ error: 'Batch not found' }), { status: 404 });
  }

  const oldStatus = batch.status;
  const newStatus = body.status || oldStatus;

  db.prepare(`
    UPDATE carve_batches 
    SET status = ?, updated_at = datetime('now')
    WHERE batch_no = ?
  `).run(newStatus, batchNo);

  if (newStatus === 'in_production' && oldStatus !== 'in_production') {
    db.prepare(`
      UPDATE carve_batches 
      SET started_at = datetime('now')
      WHERE batch_no = ?
    `).run(batchNo);
    
    const plans = db.prepare(`SELECT * FROM carve_plans WHERE batch_no = ?`).all(batchNo);
    for (const plan of plans) {
      db.prepare(`
        UPDATE carve_plans 
        SET status = 'in_progress', updated_at = datetime('now')
        WHERE id = ?
      `).run(plan.id);
      
      db.prepare(`
        UPDATE tray_slots 
        SET status = 'reserved', version = version + 1, updated_at = datetime('now')
        WHERE character = ? AND status = 'missing'
        LIMIT 1
      `).run(plan.character);
      
      const slot = db.prepare(`
        SELECT * FROM tray_slots WHERE character = ? AND status = 'reserved' ORDER BY id DESC LIMIT 1
      `).get(plan.character);
      
      if (slot) {
        db.prepare(`
          INSERT INTO tray_history 
          (tray_id, slot_id, character, old_status, new_status, action_type, batch_no, task_id, notes)
          VALUES (?, ?, ?, 'missing', 'reserved', 'carve_assign', ?, ?, '批次分配补刻')
        `).run(slot.tray_id, slot.id, plan.character, batchNo, plan.task_id);
      }
    }
  }

  if (newStatus === 'completed' && oldStatus !== 'completed') {
    db.prepare(`
      UPDATE carve_batches 
      SET completed_at = datetime('now'), completed_chars = total_chars
      WHERE batch_no = ?
    `).run(batchNo);
    
    db.prepare(`
      UPDATE carve_plans 
      SET status = 'completed', completed_date = date('now'), updated_at = datetime('now')
      WHERE batch_no = ?
    `).run(batchNo);
    
    const plans = db.prepare(`SELECT * FROM carve_plans WHERE batch_no = ?`).all(batchNo);
    for (const plan of plans) {
      db.prepare(`
        UPDATE tray_slots 
        SET status = 'normal', wear_level = 0, version = version + 1, updated_at = datetime('now')
        WHERE character = ? AND status = 'reserved'
        LIMIT ?
      `).run(plan.character, plan.quantity);
      
      const slots = db.prepare(`
        SELECT * FROM tray_slots WHERE character = ? AND status = 'normal' ORDER BY id DESC LIMIT ?
      `).all(plan.character, plan.quantity);
      
      for (const slot of slots) {
        db.prepare(`
          INSERT INTO tray_history 
          (tray_id, slot_id, character, old_status, new_status, action_type, batch_no, task_id, notes)
          VALUES (?, ?, ?, 'reserved', 'normal', 'carve_complete', ?, ?, '补刻完成入库')
        `).run(slot.tray_id, slot.id, plan.character, batchNo, plan.task_id);
      }
    }
  }

  return { success: true };
}

export async function POST({ params, request }: APIEvent) {
  const db = await getDb();
  const batchNo = params.no;
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  
  if (action === 'rollback') {
    return rollbackBatch(db, batchNo);
  }
  
  return { success: false, error: 'Unknown action' };
}

function rollbackBatch(db: any, batchNo: string) {
  const batch = db.prepare(`SELECT * FROM carve_batches WHERE batch_no = ?`).get(batchNo);
  if (!batch) {
    return new Response(JSON.stringify({ error: 'Batch not found' }), { status: 404 });
  }
  
  const newBatchNo = `${batchNo}R${batch.version + 1}`;
  
  db.prepare(`
    INSERT INTO carve_batches 
    (batch_no, total_chars, completed_chars, status, version, parent_batch, created_at, updated_at)
    SELECT ?, total_chars, 0, 'rolled_back', version + 1, ?, datetime('now'), datetime('now')
    FROM carve_batches WHERE batch_no = ?
  `).run(newBatchNo, batchNo, batchNo);
  
  const plans = db.prepare(`SELECT * FROM carve_plans WHERE batch_no = ?`).all(batchNo);
  const insertPlan = db.prepare(`
    INSERT INTO carve_plans 
    (batch_no, character, quantity, priority, status, task_id, estimated_date, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  for (const plan of plans) {
    insertPlan.run(
      newBatchNo,
      plan.character,
      plan.quantity,
      plan.priority,
      plan.task_id,
      plan.estimated_date,
      `回滚自 ${batchNo}: ${plan.notes || '质量不合格重刻'}`
    );
    
    db.prepare(`
      UPDATE tray_slots 
      SET status = 'missing', version = version + 1, updated_at = datetime('now')
      WHERE character = ? AND status = 'normal' AND wear_level = 0
      LIMIT ?
    `).run(plan.character, plan.quantity);
    
    const slots = db.prepare(`
      SELECT * FROM tray_slots WHERE character = ? AND status = 'missing' ORDER BY id DESC LIMIT ?
    `).all(plan.character, plan.quantity);
    
    for (const slot of slots) {
      db.prepare(`
        INSERT INTO tray_history 
        (tray_id, slot_id, character, old_status, new_status, action_type, batch_no, task_id, notes)
        VALUES (?, ?, ?, 'normal', 'missing', 'rollback', ?, ?, '批次回滚-质量不合格')
      `).run(slot.tray_id, slot.id, plan.character, newBatchNo, plan.task_id);
    }
  }
  
  db.prepare(`
    INSERT INTO alerts (type, severity, message, batch_no)
    VALUES ('shortage', 'warning', ?, ?)
  `).run(
    `批次 ${batchNo} 已回滚，新版本 ${newBatchNo} 已创建`,
    batchNo
  );
  
  return { success: true, new_batch_no: newBatchNo };
}
