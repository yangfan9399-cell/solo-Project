import { g as getDb } from '../../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ params }) => {
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
    return new Response(JSON.stringify({ error: "预约不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify(appointment), {
    headers: { "Content-Type": "application/json" }
  });
};
const PUT = async ({ params, request }) => {
  const db = getDb();
  const id = params.id;
  const body = await request.json();
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "预约不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  const allowedFields = [
    "visitor_name",
    "visitor_phone",
    "visitor_id_type",
    "visitor_id_number",
    "visitor_company",
    "visitee_id",
    "purpose",
    "expected_arrival",
    "expected_leave",
    "notes",
    "status"
  ];
  const updates = [];
  const values = [];
  for (const field of allowedFields) {
    if (body[field] !== void 0) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }
  if (updates.length === 0) {
    return new Response(JSON.stringify({ error: "没有可更新的字段" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  updates.push("updated_at = datetime('now')");
  values.push(id);
  db.prepare(`UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  const appointment = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department
    FROM appointments a LEFT JOIN users u ON a.visitee_id = u.id
    WHERE a.id = ?
  `).get(id);
  return new Response(JSON.stringify(appointment), {
    headers: { "Content-Type": "application/json" }
  });
};
const DELETE = async ({ params }) => {
  const db = getDb();
  const id = params.id;
  const existing = db.prepare("SELECT * FROM appointments WHERE id = ?").get(id);
  if (!existing) {
    return new Response(JSON.stringify({ error: "预约不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(id);
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
