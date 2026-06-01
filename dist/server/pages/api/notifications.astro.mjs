import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const db = getDb();
  const user_id = url.searchParams.get("user_id");
  const is_read = url.searchParams.get("is_read");
  let sql = "SELECT * FROM notifications WHERE 1=1";
  const params = [];
  if (user_id) {
    sql += " AND user_id = ?";
    params.push(user_id);
  }
  if (is_read !== null && is_read !== void 0) {
    sql += " AND is_read = ?";
    params.push(is_read === "1" ? 1 : 0);
  }
  sql += " ORDER BY created_at DESC LIMIT 50";
  const notifications = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(notifications), {
    headers: { "Content-Type": "application/json" }
  });
};
const PUT = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { id, mark_all, user_id } = body;
  if (mark_all && user_id) {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0").run(user_id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  if (id) {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ error: "请提供通知ID或标记全部已读" }), {
    status: 400,
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
