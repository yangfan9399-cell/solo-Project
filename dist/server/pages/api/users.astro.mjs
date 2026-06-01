import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const db = getDb();
  const role = url.searchParams.get("role");
  const department = url.searchParams.get("department");
  let sql = `
    SELECT u.*, 
      (SELECT COUNT(*) FROM appointments WHERE visitee_id = u.id AND status = 'pending') as pending_count
    FROM users u WHERE 1=1
  `;
  const params = [];
  if (role) {
    sql += " AND u.role = ?";
    params.push(role);
  }
  if (department) {
    sql += " AND u.department = ?";
    params.push(department);
  }
  sql += " ORDER BY u.name";
  const users = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(users), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { name, role, department, phone, email } = body;
  if (!name || !role) {
    return new Response(JSON.stringify({ error: "姓名和角色为必填项" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const result = db.prepare("INSERT INTO users (name, role, department, phone, email) VALUES (?, ?, ?, ?, ?)").run(name, role, department || null, phone || null, email || null);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
  return new Response(JSON.stringify(user), {
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
