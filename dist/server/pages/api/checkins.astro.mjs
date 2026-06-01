import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const db = getDb();
  const appointment_id = url.searchParams.get("appointment_id");
  if (appointment_id) {
    const checkins2 = db.prepare(`
      SELECT c.*, u.name as verifier_name
      FROM checkins c LEFT JOIN users u ON c.verified_by = u.id
      WHERE c.appointment_id = ?
      ORDER BY c.created_at DESC
    `).all(appointment_id);
    return new Response(JSON.stringify(checkins2), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const checkins = db.prepare(`
    SELECT c.*, a.visitor_name, a.status as appointment_status,
      u.name as verifier_name
    FROM checkins c
    LEFT JOIN appointments a ON c.appointment_id = a.id
    LEFT JOIN users u ON c.verified_by = u.id
    ORDER BY c.created_at DESC
  `).all();
  return new Response(JSON.stringify(checkins), {
    headers: { "Content-Type": "application/json" }
  });
};
const POST = async ({ request }) => {
  const db = getDb();
  const body = await request.json();
  const { appointment_id, action, verified_by, notes } = body;
  if (!appointment_id || !action) {
    return new Response(JSON.stringify({ error: "预约ID和操作类型为必填" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const appointment = db.prepare("SELECT * FROM appointments WHERE id = ?").get(appointment_id);
  if (!appointment) {
    return new Response(JSON.stringify({ error: "预约不存在" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (action === "check_in") {
    if (appointment.status !== "approved") {
      return new Response(JSON.stringify({ error: "该预约未审批通过，无法签到" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const blacklistCheck = db.prepare(`
      SELECT b.id FROM blacklist bl
      JOIN visitors v ON bl.visitor_id = v.id
      JOIN appointments a ON a.visitor_id_number = v.id_number
      WHERE a.id = ?
    `).get(appointment_id);
    if (blacklistCheck) {
      return new Response(JSON.stringify({ error: "该访客在黑名单中，禁止入园！", blacklisted: true }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    db.prepare(`UPDATE appointments SET status = 'checked_in', updated_at = datetime('now') WHERE id = ?`).run(appointment_id);
    const result = db.prepare(
      `INSERT INTO checkins (appointment_id, check_in_time, verified_by, notes) VALUES (?, datetime('now'), ?, ?)`
    ).run(appointment_id, verified_by || null, notes || null);
    db.prepare(`INSERT INTO notifications (appointment_id, user_id, type, title, message) VALUES (?, ?, 'check_in', ?, ?)`).run(appointment_id, appointment.visitee_id, "访客已签到入园", `${appointment.visitor_name} 已签到入园`);
    const checkin = db.prepare("SELECT * FROM checkins WHERE id = ?").get(result.lastInsertRowid);
    return new Response(JSON.stringify(checkin), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (action === "check_out") {
    if (appointment.status !== "checked_in" && appointment.status !== "timeout") {
      return new Response(JSON.stringify({ error: "该预约未签到，无法签退" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    db.prepare(`UPDATE appointments SET status = 'checked_out', updated_at = datetime('now') WHERE id = ?`).run(appointment_id);
    db.prepare(`UPDATE checkins SET check_out_time = datetime('now'), notes = ? WHERE appointment_id = ? AND check_out_time IS NULL`).run(notes || "正常签退", appointment_id);
    db.prepare(`INSERT INTO notifications (appointment_id, user_id, type, title, message) VALUES (?, ?, 'check_out', ?, ?)`).run(appointment_id, appointment.visitee_id, "访客已签退离园", `${appointment.visitor_name} 已签退离园`);
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ error: "无效操作，仅支持 check_in/check_out" }), {
    status: 400,
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
