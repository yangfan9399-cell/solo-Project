import type { APIRoute } from 'astro';
import { getDb } from '../../db';

export const GET: APIRoute = async () => {
  const db = getDb();

  const totalAppointments = (db.prepare('SELECT COUNT(*) as c FROM appointments').get() as { c: number }).c;
  const pendingCount = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'pending'").get() as { c: number }).c;
  const approvedCount = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'approved'").get() as { c: number }).c;
  const checkedInCount = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'checked_in'").get() as { c: number }).c;
  const timeoutCount = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE status = 'timeout'").get() as { c: number }).c;
  const blacklistCount = (db.prepare('SELECT COUNT(*) as c FROM blacklist').get() as { c: number }).c;
  const todayCount = (db.prepare("SELECT COUNT(*) as c FROM appointments WHERE date(created_at) = date('now')").get() as { c: number }).c;

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

  const unreadNotifications = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE is_read = 0').get() as { c: number }).c;

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
    unreadNotifications,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
