import { Hono } from 'hono';
import { z } from 'zod';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import { generateNo, checkEquipmentAvailability } from '../utils.js';
import type { Reservation, Equipment } from '../types.js';

const reservationRoutes = new Hono<{ Variables: AuthContext }>();

reservationRoutes.use('*', authMiddleware());

const reservationSchema = z.object({
  task_id: z.number().optional(),
  equipment_id: z.number().min(1, '请选择设备'),
  expected_pickup_time: z.string().min(1, '预计领用时间不能为空'),
  expected_return_time: z.string().min(1, '预计归还时间不能为空'),
  purpose: z.string().optional(),
  remark: z.string().optional(),
});

reservationRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { status, equipment_id, requester_id, keyword } = c.req.query();

  let query = 'SELECT r.*, e.code as equipment_code, e.category as equipment_category FROM reservations r JOIN equipments e ON r.equipment_id = e.id WHERE 1=1';
  const params: (string | number)[] = [];

  if (user.role === 'reporter') {
    query += ' AND requester_id = ?';
    params.push(user.id);
  }

  if (requester_id && user.role !== 'reporter') {
    query += ' AND requester_id = ?';
    params.push(parseInt(requester_id, 10));
  }

  if (equipment_id) {
    query += ' AND equipment_id = ?';
    params.push(parseInt(equipment_id, 10));
  }

  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }

  if (keyword) {
    query += ' AND (reservation_no LIKE ? OR equipment_name LIKE ? OR requester_name LIKE ? OR purpose LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search, search);
  }

  query += ' ORDER BY r.created_at DESC';

  const reservations = await all<Reservation>(query, params);
  return c.json({ success: true, data: reservations });
});

reservationRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const reservation = await get(`
    SELECT r.*, e.code as equipment_code, e.category as equipment_category,
           e.brand as equipment_brand, e.model as equipment_model,
           t.title as task_title, t.task_no as task_number
    FROM reservations r
    JOIN equipments e ON r.equipment_id = e.id
    LEFT JOIN shooting_tasks t ON r.task_id = t.id
    WHERE r.id = ?
  `, [id]);

  if (!reservation) {
    return c.json({ success: false, error: '预约不存在' }, 404);
  }

  return c.json({ success: true, data: reservation });
});

reservationRoutes.post('/', roleMiddleware(['reporter', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = reservationSchema.parse(body);

    if (new Date(validated.expected_return_time) <= new Date(validated.expected_pickup_time)) {
      return c.json({ success: false, error: '归还时间必须晚于领用时间' }, 400);
    }

    const equipment = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [validated.equipment_id]);
    if (!equipment) {
      return c.json({ success: false, error: '设备不存在' }, 404);
    }

    if (equipment.status === 'damaged' || equipment.status === 'scrapped') {
      return c.json({ success: false, error: '该设备已损坏或报废，无法预约' }, 400);
    }

    if (equipment.status === 'maintenance') {
      return c.json({ success: false, error: '该设备正在维修中，无法预约' }, 400);
    }

    const isAvailable = await checkEquipmentAvailability(validated.equipment_id, validated.expected_pickup_time, validated.expected_return_time);
    if (!isAvailable) {
      return c.json({ success: false, error: '该设备在此时间段内已被预约' }, 400);
    }

    if (validated.task_id) {
      const task = await get('SELECT * FROM shooting_tasks WHERE id = ?', [validated.task_id]);
      if (!task) {
        return c.json({ success: false, error: '关联任务不存在' }, 404);
      }
    }

    const reservationNo = generateNo('RES');

    const sql = `
      INSERT INTO reservations (reservation_no, task_id, equipment_id, equipment_name, requester_id, requester_name, expected_pickup_time, expected_return_time, status, purpose, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `;

    const result = await run(sql, [
      reservationNo,
      validated.task_id || null,
      validated.equipment_id,
      equipment.name,
      user.id,
      user.name,
      validated.expected_pickup_time,
      validated.expected_return_time,
      validated.purpose || '',
      validated.remark || ''
    ]);

    const reservation = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [result.lastID]);
    return c.json({ success: true, data: reservation, message: '预约创建成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '创建预约失败' }, 500);
  }
});

reservationRoutes.post('/:id/approve', roleMiddleware(['producer', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { remark } = body;

    const existing = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!existing) {
      return c.json({ success: false, error: '预约不存在' }, 404);
    }

    if (existing.status !== 'pending') {
      return c.json({ success: false, error: '只有待审批状态的预约可以审批' }, 400);
    }

    const isAvailable = await checkEquipmentAvailability(existing.equipment_id, existing.expected_pickup_time, existing.expected_return_time, id);
    if (!isAvailable) {
      return c.json({ success: false, error: '该设备在此时间段内已被其他预约占用' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE reservations
      SET status = 'approved', approver_id = ?, approver_name = ?, approved_at = ?, remark = COALESCE(?, remark)
      WHERE id = ?
    `, [user.id, user.name, now, remark || null, id]);

    const updated = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '预约已批准' });
  } catch (error) {
    return c.json({ success: false, error: '审批失败' }, 500);
  }
});

reservationRoutes.post('/:id/reject', roleMiddleware(['producer', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { remark } = body;

    const existing = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!existing) {
      return c.json({ success: false, error: '预约不存在' }, 404);
    }

    if (existing.status !== 'pending') {
      return c.json({ success: false, error: '只有待审批状态的预约可以拒绝' }, 400);
    }

    await run(`
      UPDATE reservations
      SET status = 'rejected', approver_id = ?, approver_name = ?, remark = COALESCE(?, remark)
      WHERE id = ?
    `, [user.id, user.name, remark || null, id]);

    const updated = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '预约已拒绝' });
  } catch (error) {
    return c.json({ success: false, error: '拒绝失败' }, 500);
  }
});

reservationRoutes.post('/:id/pickup', roleMiddleware(['admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);

    const existing = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!existing) {
      return c.json({ success: false, error: '预约不存在' }, 404);
    }

    if (existing.status !== 'approved' && existing.status !== 'overdue') {
      return c.json({ success: false, error: '只有已批准或逾期的预约可以领用' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE reservations
      SET status = 'picked_up', actual_pickup_time = ?, pickup_handler_id = ?, pickup_handler_name = ?
      WHERE id = ?
    `, [now, user.id, user.name, id]);

    await run('UPDATE equipments SET status = ? WHERE id = ?', ['in_use', existing.equipment_id]);

    const updated = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '设备领用成功' });
  } catch (error) {
    return c.json({ success: false, error: '领用失败' }, 500);
  }
});

reservationRoutes.post('/:id/return', roleMiddleware(['admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { return_remark } = body;

    const existing = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    if (!existing) {
      return c.json({ success: false, error: '预约不存在' }, 404);
    }

    if (existing.status !== 'picked_up' && existing.status !== 'overdue') {
      return c.json({ success: false, error: '只有已领用或逾期的预约可以归还' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE reservations
      SET status = 'returned', actual_return_time = ?, return_handler_id = ?, return_handler_name = ?, remark = COALESCE(?, remark)
      WHERE id = ?
    `, [now, user.id, user.name, return_remark || null, id]);

    await run(`
      UPDATE equipments SET status = 'available'
      WHERE id = ? AND status = 'in_use'
    `, [existing.equipment_id]);

    await run(`
      UPDATE overdue_reminders
      SET status = 'resolved', resolved_at = ?
      WHERE type = 'reservation' AND related_id = ?
    `, [now, id]);

    const updated = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '设备归还成功' });
  } catch (error) {
    return c.json({ success: false, error: '归还失败' }, 500);
  }
});

reservationRoutes.post('/:id/cancel', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);

  const existing = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
  if (!existing) {
    return c.json({ success: false, error: '预约不存在' }, 404);
  }

  if (!['pending', 'approved'].includes(existing.status)) {
    return c.json({ success: false, error: '只有待审批或已批准的预约可以取消' }, 400);
  }

  if (user.role === 'reporter' && existing.requester_id !== user.id) {
    return c.json({ success: false, error: '只能取消自己的预约' }, 403);
  }

  await run('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id]);
  const updated = await get<Reservation>('SELECT * FROM reservations WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '预约已取消' });
});

reservationRoutes.get('/calendar/all', async (c) => {
  const { start_date, end_date, category } = c.req.query();

  let query = `
    SELECT r.id, r.reservation_no, r.equipment_id, r.equipment_name,
           e.category, e.code as equipment_code,
           r.expected_pickup_time as start_time, r.expected_return_time as end_time,
           r.status, r.requester_name, r.purpose,
           t.title as task_title
    FROM reservations r
    JOIN equipments e ON r.equipment_id = e.id
    LEFT JOIN shooting_tasks t ON r.task_id = t.id
    WHERE r.status IN ('pending', 'approved', 'picked_up', 'overdue')
  `;

  const params: (string | number)[] = [];

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (start_date) {
    query += ' AND r.expected_return_time >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND r.expected_pickup_time <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY r.expected_pickup_time';

  const schedule = await all(query, params);

  const equipments = await all('SELECT * FROM equipments', []);

  return c.json({
    success: true,
    data: {
      schedule,
      equipments,
    },
  });
});

export default reservationRoutes;
