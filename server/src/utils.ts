import { run, get } from './db.js';

export function generateNo(prefix: string, date: Date = new Date()): string {
  const year = date.getFullYear();
  const count = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${year}-${count}`;
}

export async function checkEquipmentAvailability(
  equipmentId: number,
  startTime: string,
  endTime: string,
  excludeReservationId?: number
): Promise<boolean> {
  const query = `
    SELECT COUNT(*) as count
    FROM reservations
    WHERE equipment_id = ?
      AND status IN ('pending', 'approved', 'picked_up', 'overdue')
      AND expected_pickup_time < ?
      AND expected_return_time > ?
      ${excludeReservationId ? 'AND id != ?' : ''}
  `;

  const params = excludeReservationId
    ? [equipmentId, endTime, startTime, excludeReservationId]
    : [equipmentId, endTime, startTime];

  const result = await get<{ count: number }>(query, params);
  return result ? result.count === 0 : true;
}

export async function updateOverdueStatus() {
  const now = new Date().toISOString();

  await run(`
    UPDATE reservations
    SET status = 'overdue'
    WHERE status IN ('approved', 'picked_up')
      AND expected_return_time < ?
  `, [now]);

  await run(`
    INSERT OR IGNORE INTO overdue_reminders (type, related_id, related_no, equipment_name, user_id, user_name, due_time, overdue_days, status)
    SELECT 'reservation', r.id, r.reservation_no, r.equipment_name, r.requester_id, r.requester_name, r.expected_return_time,
           CAST(JULIANDAY(?) - JULIANDAY(r.expected_return_time) AS INTEGER), 'pending'
    FROM reservations r
    WHERE r.status = 'overdue'
      AND NOT EXISTS (
        SELECT 1 FROM overdue_reminders o
        WHERE o.type = 'reservation' AND o.related_id = r.id AND o.status != 'resolved'
      )
  `, [now]);

  await run(`
    INSERT OR IGNORE INTO overdue_reminders (type, related_id, related_no, equipment_name, user_id, user_name, due_time, overdue_days, status)
    SELECT 'media_card', m.id, m.code, m.code || '(' || m.type || ')', m.current_user_id, m.current_user_name, m.expected_return_time,
           CAST(JULIANDAY(?) - JULIANDAY(m.expected_return_time) AS INTEGER), 'pending'
    FROM media_cards m
    WHERE m.status = 'in_use'
      AND m.expected_return_time < ?
      AND NOT EXISTS (
        SELECT 1 FROM overdue_reminders o
        WHERE o.type = 'media_card' AND o.related_id = m.id AND o.status != 'resolved'
      )
  `, [now, now]);

  await run(`
    UPDATE overdue_reminders
    SET overdue_days = CAST(JULIANDAY(?) - JULIANDAY(due_time) AS INTEGER)
    WHERE status != 'resolved'
  `, [now]);
}
