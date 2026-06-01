import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const db = getDb();
  const search = url.searchParams.get("search");
  let sql = `
    SELECT b.*, v.name as visitor_name, v.id_number as visitor_id_number, v.phone as visitor_phone,
      u.name as creator_name
    FROM blacklist b
    LEFT JOIN visitors v ON b.visitor_id = v.id
    LEFT JOIN users u ON b.created_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (search) {
    sql += " AND (v.name LIKE ? OR v.id_number LIKE ? OR b.reason LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY b.created_at DESC";
  const entries = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { visitor_id, reason, created_by } = body;
  if (!visitor_id || !reason) {
    return new Response(JSON.stringify({ error: "访客ID和原因为必填" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const existing = db.prepare("SELECT * FROM blacklist WHERE visitor_id = ?").get(visitor_id);
  if (existing) {
    return new Response(JSON.stringify({ error: "该访客已在黑名单中" }), {
      status: 409,
      headers: { "Content-Type": "application/json" }
    });
  }
  const result = db.prepare("INSERT INTO blacklist (visitor_id, reason, created_by) VALUES (?, ?, ?)").run(visitor_id, reason, created_by || null);
  const entry = db.prepare(`
    SELECT b.*, v.name as visitor_name, v.id_number as visitor_id_number,
      u.name as creator_name
    FROM blacklist b
    LEFT JOIN visitors v ON b.visitor_id = v.id
    LEFT JOIN users u ON b.created_by = u.id
    WHERE b.id = ?
  `).get(result.lastInsertRowid);
  return new Response(JSON.stringify(entry), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
};
const DELETE = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return new Response(JSON.stringify({ error: "黑名单ID为必填" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  db.prepare("DELETE FROM blacklist WHERE id = ?").run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
