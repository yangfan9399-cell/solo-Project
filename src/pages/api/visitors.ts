import type { APIRoute } from 'astro';
import { getDb } from '../../db';

export const GET: APIRoute = async ({ url }) => {
  const db = getDb();
  const search = url.searchParams.get('search');

  let sql = 'SELECT * FROM visitors WHERE 1=1';
  const params: unknown[] = [];

  if (search) {
    sql += ' AND (name LIKE ? OR id_number LIKE ? OR phone LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ' ORDER BY created_at DESC';

  const visitors = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(visitors), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { name, phone, id_type, id_number, company } = body;

  if (!name || !phone || !id_number) {
    return new Response(JSON.stringify({ error: '姓名、手机号、证件号为必填项' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existing = db.prepare('SELECT * FROM visitors WHERE id_number = ?').get(id_number);
  if (existing) {
    return new Response(JSON.stringify(existing), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = db
    .prepare('INSERT INTO visitors (name, phone, id_type, id_number, company) VALUES (?, ?, ?, ?, ?)')
    .run(name, phone, id_type || '身份证', id_number, company || null);

  const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(result.lastInsertRowid);
  return new Response(JSON.stringify(visitor), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
