import type { APIRoute } from 'astro';
import { getDb } from '../../../db';
import { checkAndProcessTimeouts } from '../../../db/timeoutChecker';

export const GET: APIRoute = async ({ params }) => {
  checkAndProcessTimeouts();
  const db = getDb();
  const id = params.id;

  const appointment = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department,
      c.check_in_time, c.check_out_time, c.verified_by, c.notes as checkin_notes
    FROM appointments a
    LEFT JOIN users u ON a.visitee_id = u.id
    LEFT JOIN checkins c ON c.appointment_id = a.id
    WHERE a.id = ?
  `).get(id);

  if (!appointment) {
    return new Response(JSON.stringify({ error: '预约不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(appointment), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const db = getDb();
  const id = params.id;
  const body = await request.json();

  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: '预约不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allowedFields = ['visitor_name', 'visitor_phone', 'visitor_id_type', 'visitor_id_number',
    'visitor_company', 'visitee_id', 'purpose', 'expected_arrival', 'expected_leave', 'notes', 'status'];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: '没有可更新的字段' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  updates.push("updated_at = datetime('now')");
  values.push(id);

  db.prepare(`UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const appointment = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department
    FROM appointments a LEFT JOIN users u ON a.visitee_id = u.id
    WHERE a.id = ?
  `).get(id);

  return new Response(JSON.stringify(appointment), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const db = getDb();
  const id = params.id;

  const existing = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: '预约不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
