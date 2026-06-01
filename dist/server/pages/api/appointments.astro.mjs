import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const db = getDb();
  const status = url.searchParams.get("status");
  const visitee_id = url.searchParams.get("visitee_id");
  const search = url.searchParams.get("search");
  let sql = `
    SELECT a.*, u.name as visitee_name, u.department as visitee_department
    FROM appointments a
    LEFT JOIN users u ON a.visitee_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += " AND a.status = ?";
    params.push(status);
  }
  if (visitee_id) {
    sql += " AND a.visitee_id = ?";
    params.push(visitee_id);
  }
  if (search) {
    sql += " AND (a.visitor_name LIKE ? OR a.visitor_phone LIKE ? OR a.visitor_id_number LIKE ? OR a.purpose LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY a.created_at DESC";
  const appointments = db.prepare(sql).all(...params);
  return new Response(JSON.stringify(appointments), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const {
    visitor_name,
    visitor_phone,
    visitor_id_type,
    visitor_id_number,
    visitor_company,
    visitee_id,
    purpose,
    expected_arrival,
    expected_leave,
    notes
  } = body;
  if (!visitor_name || !visitor_phone || !visitor_id_number || !visitee_id || !purpose || !expected_arrival || !expected_leave) {
    return new Response(JSON.stringify({ error: "必填字段缺失" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const dbInstance = getDb();
  const blacklistEntry = dbInstance.prepare(`SELECT b.*, v.name as visitor_name FROM blacklist b JOIN visitors v ON b.visitor_id = v.id WHERE v.id_number = ?`).get(visitor_id_number);
  if (blacklistEntry) {
    return new Response(JSON.stringify({
      error: `该访客已被加入黑名单，原因：${blacklistEntry.reason}`,
      blacklisted: true
    }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  const result = db.prepare(`INSERT INTO appointments
      (visitor_name, visitor_phone, visitor_id_type, visitor_id_number, visitor_company,
       visitee_id, purpose, expected_arrival, expected_leave, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`).run(
    visitor_name,
    visitor_phone,
    visitor_id_type || "身份证",
    visitor_id_number,
    visitor_company || null,
    visitee_id,
    purpose,
    expected_arrival,
    expected_leave,
    notes || null
  );
  const appointment = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department
    FROM appointments a LEFT JOIN users u ON a.visitee_id = u.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);
  db.prepare(`INSERT INTO notifications (appointment_id, user_id, type, title, message) VALUES (?, ?, 'approval', ?, ?)`).run(result.lastInsertRowid, visitee_id, "新访客预约待审批", `${visitor_name} 申请来访，事由：${purpose}`);
  return new Response(JSON.stringify(appointment), {
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
