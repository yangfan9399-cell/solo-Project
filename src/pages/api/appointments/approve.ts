import type { APIRoute } from 'astro';
import { getDb } from '../../../db';

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { appointment_id, action, approved_by, rejected_reason } = body;

  if (!appointment_id || !action) {
    return new Response(JSON.stringify({ error: '预约ID和操作类型为必填' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointment_id);
  if (!appointment) {
    return new Response(JSON.stringify({ error: '预约不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if ((appointment as { status: string }).status !== 'pending') {
    return new Response(JSON.stringify({ error: '该预约不在待审批状态' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'approve') {
    db.prepare(`UPDATE appointments SET status = 'approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .run(approved_by || null, appointment_id);

    db.prepare(`INSERT INTO notifications (appointment_id, user_id, type, title, message) VALUES (?, ?, 'approved', ?, ?)`)
      .run(appointment_id, null, '访客预约已审批', `预约 #${appointment_id} 已通过审批`);
  } else if (action === 'reject') {
    db.prepare(`UPDATE appointments SET status = 'rejected', approved_by = ?, rejected_reason = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(approved_by || null, rejected_reason || '未提供原因', appointment_id);

    db.prepare(`INSERT INTO notifications (appointment_id, user_id, type, title, message) VALUES (?, ?, 'rejected', ?, ?)`)
      .run(appointment_id, null, '访客预约已驳回', `预约 #${appointment_id} 已被驳回：${rejected_reason || '未提供原因'}`);
  } else {
    return new Response(JSON.stringify({ error: '无效操作，仅支持 approve/reject' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const updated = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department
    FROM appointments a LEFT JOIN users u ON a.visitee_id = u.id
    WHERE a.id = ?
  `).get(appointment_id);

  return new Response(JSON.stringify(updated), {
    headers: { 'Content-Type': 'application/json' },
  });
};
