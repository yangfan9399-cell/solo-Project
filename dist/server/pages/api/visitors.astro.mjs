import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const db = getDb();
  const search = url.searchParams.get("search");
  let sql = "SELECT * FROM visitors WHERE 1=1";
  const params = [];
  if (search) {
    sql += " AND (name LIKE ? OR id_number LIKE ? OR phone LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY created_at DESC";
  const visitors = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(visitors), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { name, phone, id_type, id_number, company } = body;
  if (!name || !phone || !id_number) {
    return new Response(JSON.stringify({ error: "姓名、手机号、证件号为必填项" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const existing = db.prepare("SELECT * FROM visitors WHERE id_number = ?").get(id_number);
  if (existing) {
    return new Response(JSON.stringify(existing), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const result = db.prepare("INSERT INTO visitors (name, phone, id_type, id_number, company) VALUES (?, ?, ?, ?, ?)").run(name, phone, id_type || "身份证", id_number, company || null);
  const visitor = db.prepare("SELECT * FROM visitors WHERE id = ?").get(result.lastInsertRowid);
  return new Response(JSON.stringify(visitor), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
