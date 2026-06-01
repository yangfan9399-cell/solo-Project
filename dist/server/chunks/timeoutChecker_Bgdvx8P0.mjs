import { g as getDb } from './index_s38z4wuU.mjs';

function checkAndProcessTimeouts() {
  const db = getDb();
  const timeoutAppointments = db.prepare(`
    SELECT a.id, a.visitor_name, a.visitee_id, a.expected_leave
    FROM appointments a
    WHERE a.status = 'checked_in'
      AND datetime(a.expected_leave) < datetime('now')
  `).all();
  const updatedAppointments = [];
  let notifiedCount = 0;
  for (const apt of timeoutAppointments) {
    db.prepare(`UPDATE appointments SET status = 'timeout', updated_at = datetime('now') WHERE id = ?`).run(apt.id);
    updatedAppointments.push(apt.id);
    const admins = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
    const notifyUserIds = [apt.visitee_id, ...admins.map((a) => a.id)];
    for (const userId of notifyUserIds) {
      const existingNotification = db.prepare(`
        SELECT id FROM notifications
        WHERE appointment_id = ?
          AND user_id = ?
          AND type = 'timeout'
          AND date(created_at) = date('now')
      `).get(apt.id, userId);
      if (!existingNotification) {
        db.prepare(`
          INSERT INTO notifications (appointment_id, user_id, type, title, message)
          VALUES (?, ?, 'timeout', ?, ?)
        `).run(
          apt.id,
          userId,
          "访客超时未离园提醒",
          `${apt.visitor_name} 已超过预计离园时间 ${new Date(apt.expected_leave).toLocaleString("zh-CN")}，请及时联系访客确认安全`
        );
        notifiedCount++;
      }
    }
  }
  return {
    updatedCount: updatedAppointments.length,
    notifiedCount,
    updatedAppointments
  };
}

export { checkAndProcessTimeouts as c };
