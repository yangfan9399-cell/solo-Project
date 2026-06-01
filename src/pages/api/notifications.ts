import type { APIRoute } from 'astro';
import { getDb } from '../../db';

export const GET: APIRoute = async ({ url }) => {
  const db = getDb();
  const user_id = url.searchParams.get('user_id');
  const is_read = url.searchParams.get('is_read');

  let sql = 'SELECT * FROM notifications WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) {
    sql += ' AND user_id = ?';
    params.push(user_id);
  }
  if (is_read !== null && is_read !== undefined) {
    sql += ' AND is_read = ?';
    params.push(is_read === '1' ? 1 : 0);
  }

  sql += ' ORDER BY created_at DESC LIMIT 50';

  const notifications = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(notifications), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { id, mark_all, user_id } = body;

  if (mark_all && user_id) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(user_id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (id) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: '请提供通知ID或标记全部已读' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
