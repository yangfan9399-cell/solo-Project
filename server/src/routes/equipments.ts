import { Hono } from 'hono';
import { z } from 'zod';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import type { Equipment } from '../types.js';

const equipmentRoutes = new Hono<{ Variables: AuthContext }>();

equipmentRoutes.use('*', authMiddleware());

const equipmentSchema = z.object({
  name: z.string().min(1, '设备名称不能为空'),
  code: z.string().min(1, '设备编号不能为空'),
  category: z.string().min(1, '设备分类不能为空'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  purchase_date: z.string().optional(),
  purchase_price: z.number().optional().default(0),
  stock_quantity: z.number().int().positive().optional().default(1),
  status: z.enum(['available', 'in_use', 'maintenance', 'damaged', 'scrapped']).default('available'),
  location: z.string().optional(),
  specification: z.string().optional(),
  description: z.string().optional(),
  accessories: z.string().optional(),
  remark: z.string().optional(),
});

equipmentRoutes.get('/', async (c) => {
  const { category, status, keyword } = c.req.query();

  let query = 'SELECT * FROM equipments WHERE 1=1';
  const params: (string | number)[] = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (keyword) {
    query += ' AND (name LIKE ? OR code LIKE ? OR brand LIKE ? OR model LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search, search);
  }

  query += ' ORDER BY created_at DESC';

  const equipments = await all<Equipment>(query, params);
  return c.json({ success: true, data: equipments });
});

equipmentRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const equipment = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [id]);

  if (!equipment) {
    return c.json({ success: false, error: '设备不存在' }, 404);
  }

  const reservations = await all(`
    SELECT r.*, t.title as task_title
    FROM reservations r
    LEFT JOIN shooting_tasks t ON r.task_id = t.id
    WHERE r.equipment_id = ?
    ORDER BY r.created_at DESC
    LIMIT 10
  `, [id]);

  const damageReports = await all(`
    SELECT * FROM damage_reports
    WHERE equipment_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `, [id]);

  return c.json({
    success: true,
    data: {
      ...equipment,
      recent_reservations: reservations,
      damage_reports: damageReports,
    },
  });
});

equipmentRoutes.post('/', roleMiddleware(['admin']), async (c) => {
  try {
    const body = await c.req.json();
    const validated = equipmentSchema.parse(body);

    const existing = await get('SELECT id FROM equipments WHERE code = ?', [validated.code]);
    if (existing) {
      return c.json({ success: false, error: '设备编号已存在' }, 400);
    }

    const sql = `
      INSERT INTO equipments (name, code, category, brand, model, serial_number, purchase_date, purchase_price, stock_quantity, status, location, specification, description, accessories, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      validated.name,
      validated.code,
      validated.category,
      validated.brand || '',
      validated.model || '',
      validated.serial_number || '',
      validated.purchase_date || '',
      validated.purchase_price,
      validated.stock_quantity,
      validated.status,
      validated.location || '',
      validated.specification || '',
      validated.description || '',
      validated.accessories || '',
      validated.remark || ''
    ]);

    const equipment = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [result.lastID]);
    return c.json({ success: true, data: equipment, message: '设备创建成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '创建设备失败' }, 500);
  }
});

equipmentRoutes.put('/:id', roleMiddleware(['admin']), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const existing = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '设备不存在' }, 404);
    }

    const body = await c.req.json();
    const validated = equipmentSchema.parse(body);

    if (validated.code !== existing.code) {
      const codeExists = await get('SELECT id FROM equipments WHERE code = ? AND id != ?', [validated.code, id]);
      if (codeExists) {
        return c.json({ success: false, error: '设备编号已存在' }, 400);
      }
    }

    const sql = `
      UPDATE equipments
      SET name = ?, code = ?, category = ?, brand = ?, model = ?, serial_number = ?, purchase_date = ?, purchase_price = ?, stock_quantity = ?, status = ?, location = ?, specification = ?, description = ?, accessories = ?, remark = ?
      WHERE id = ?
    `;

    await run(sql, [
      validated.name,
      validated.code,
      validated.category,
      validated.brand || '',
      validated.model || '',
      validated.serial_number || '',
      validated.purchase_date || '',
      validated.purchase_price,
      validated.stock_quantity,
      validated.status,
      validated.location || '',
      validated.specification || '',
      validated.description || '',
      validated.accessories || '',
      validated.remark || '',
      id
    ]);

    const updated = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '设备更新成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '更新设备失败' }, 500);
  }
});

equipmentRoutes.delete('/:id', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get('SELECT * FROM equipments WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '设备不存在' }, 404);
  }

  const hasActiveReservations = await get<{ count: number }>(`
    SELECT COUNT(*) as count FROM reservations
    WHERE equipment_id = ? AND status IN ('pending', 'approved', 'picked_up', 'overdue')
  `, [id]);

  if (hasActiveReservations && hasActiveReservations.count > 0) {
    return c.json({ success: false, error: '该设备存在未完成的预约，无法删除' }, 400);
  }

  await run('DELETE FROM equipments WHERE id = ?', [id]);
  return c.json({ success: true, message: '设备删除成功' });
});

equipmentRoutes.get('/:id/schedule', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const { start_date, end_date } = c.req.query();

  let query = `
    SELECT r.id, r.reservation_no, r.equipment_id, r.equipment_name,
           r.expected_pickup_time as start_time, r.expected_return_time as end_time,
           r.status, r.requester_name, r.purpose,
           t.title as task_title
    FROM reservations r
    LEFT JOIN shooting_tasks t ON r.task_id = t.id
    WHERE r.equipment_id = ?
      AND r.status IN ('pending', 'approved', 'picked_up', 'overdue')
  `;

  const params: (string | number)[] = [id];

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
  return c.json({ success: true, data: schedule });
});

export default equipmentRoutes;
