import { g as getDb } from '../../chunks/index_s38z4wuU.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async () => {
  const db = getDb();
  const totalAppointments = db.prepare("SELECT COUNT(*) as c FROM appointments").get().c;
  const pendingCount = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'pending'").get().c;
  const approvedCount = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'approved'").get().c;
  const checkedInCount = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'checked_in'").get().c;
  const timeoutCount = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'timeout'").get().c;
  const blacklistCount = db.prepare("SELECT COUNT(*) as c FROM blacklist").get().c;
  const todayCount = db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date(created_at) = date('now')").get().c;
  const recentAppointments = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department
    FROM appointments a LEFT JOIN users u ON a.visitee_id = u.id
    ORDER BY a.created_at DESC LIMIT 5
  `).all();
  const timeoutVisitors = db.prepare(`
    SELECT a.*, u.name as visitee_name, u.department as visitee_department,
      c.check_in_time
    FROM appointments a
    LEFT JOIN users u ON a.visitee_id = u.id
    LEFT JOIN checkins c ON c.appointment_id = a.id
    WHERE a.status = 'timeout'
    ORDER BY a.expected_leave ASC
  `).all();
  const unreadNotifications = db.prepare("SELECT COUNT(*) as c FROM notifications WHERE is_read = 0").get().c;
  return new Response(JSON.stringify({
    totalAppointments,
    pendingCount,
    approvedCount,
    checkedInCount,
    timeoutCount,
    blacklistCount,
    todayCount,
    recentAppointments,
    timeoutVisitors,
    unreadNotifications
  }), {
    headers: { "Content-Type": "application/json" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
