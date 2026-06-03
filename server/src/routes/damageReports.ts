import { Hono } from 'hono';
import { z } from 'zod';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import { generateNo } from '../utils.js';
import type { DamageReport, Equipment } from '../types.js';

const damageReportRoutes = new Hono<{ Variables: AuthContext }>();

damageReportRoutes.use('*', authMiddleware());

const damageReportSchema = z.object({
  equipment_id: z.number().min(1, '请选择设备'),
  damage_type: z.enum(['minor', 'moderate', 'severe']),
  description: z.string().min(1, '损坏描述不能为空'),
  occurred_time: z.string().min(1, '请选择损坏发生时间'),
  location: z.string().optional(),
  remark: z.string().optional(),
});

damageReportRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { status, equipment_id, damage_type, reporter_id, keyword } = c.req.query();

  let query = 'SELECT * FROM damage_reports WHERE 1=1';
  const params: (string | number)[] = [];

  if (user.role === 'reporter') {
    query += ' AND reporter_id = ?';
    params.push(user.id);
  }

  if (reporter_id && user.role !== 'reporter') {
    query += ' AND reporter_id = ?';
    params.push(parseInt(reporter_id, 10));
  }

  if (equipment_id) {
    query += ' AND equipment_id = ?';
    params.push(parseInt(equipment_id, 10));
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (damage_type) {
    query += ' AND damage_type = ?';
    params.push(damage_type);
  }

  if (keyword) {
    query += ' AND (report_no LIKE ? OR equipment_name LIKE ? OR reporter_name LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }

  query += ' ORDER BY created_at DESC';

  const reports = await all<DamageReport>(query, params);
  return c.json({ success: true, data: reports });
});

damageReportRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const report = await get(`
    SELECT dr.*, e.code as equipment_code, e.category as equipment_category,
           e.brand as equipment_brand, e.model as equipment_model
    FROM damage_reports dr
    JOIN equipments e ON dr.equipment_id = e.id
    WHERE dr.id = ?
  `, [id]);

  if (!report) {
    return c.json({ success: false, error: '损坏登记不存在' }, 404);
  }

  return c.json({ success: true, data: report });
});

damageReportRoutes.post('/', roleMiddleware(['reporter', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = damageReportSchema.parse(body);

    const equipment = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [validated.equipment_id]);
    if (!equipment) {
      return c.json({ success: false, error: '设备不存在' }, 404);
    }

    const reportNo = generateNo('DMG');

    const sql = `
      INSERT INTO damage_reports (report_no, equipment_id, equipment_name, reporter_id, reporter_name, damage_type, description, occurred_time, location, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `;

    const result = await run(sql, [
      reportNo,
      validated.equipment_id,
      equipment.name,
      user.id,
      user.name,
      validated.damage_type,
      validated.description,
      validated.occurred_time,
      validated.location || '',
      validated.remark || ''
    ]);

    await run("UPDATE equipments SET status = 'damaged' WHERE id = ?", [validated.equipment_id]);

    const report = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [result.lastID]);
    return c.json({ success: true, data: report, message: '损坏登记成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '登记失败' }, 500);
  }
});

damageReportRoutes.put('/:id', roleMiddleware(['admin']), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const existing = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '损坏登记不存在' }, 404);
    }

    const body = await c.req.json();
    const validated = damageReportSchema.parse(body);

    const equipment = await get<Equipment>('SELECT * FROM equipments WHERE id = ?', [validated.equipment_id]);
    if (!equipment) {
      return c.json({ success: false, error: '设备不存在' }, 404);
    }

    const sql = `
      UPDATE damage_reports
      SET equipment_id = ?, equipment_name = ?, damage_type = ?, description = ?, occurred_time = ?, location = ?, remark = ?
      WHERE id = ?
    `;

    await run(sql, [
      validated.equipment_id,
      equipment.name,
      validated.damage_type,
      validated.description,
      validated.occurred_time,
      validated.location || '',
      validated.remark || '',
      id
    ]);

    if (validated.equipment_id !== existing.equipment_id) {
      await run("UPDATE equipments SET status = 'available' WHERE id = ?", [existing.equipment_id]);
      await run("UPDATE equipments SET status = 'damaged' WHERE id = ?", [validated.equipment_id]);
    }

    const updated = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '损坏登记更新成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '更新失败' }, 500);
  }
});

damageReportRoutes.post('/:id/start-repair', roleMiddleware(['admin']), async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '损坏登记不存在' }, 404);
  }

  if (existing.status !== 'pending') {
    return c.json({ success: false, error: '只有待处理状态可以开始维修' }, 400);
  }

  await run(`
    UPDATE damage_reports
    SET status = 'repairing', handler_id = ?, handler_name = ?
    WHERE id = ?
  `, [user.id, user.name, id]);

  await run("UPDATE equipments SET status = 'maintenance' WHERE id = ?", [existing.equipment_id]);

  const updated = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '已开始维修' });
});

damageReportRoutes.post('/:id/complete', roleMiddleware(['admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { repair_cost, repair_result } = body;

    const existing = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '损坏登记不存在' }, 404);
    }

    if (existing.status !== 'repairing') {
      return c.json({ success: false, error: '只有维修中状态可以完成维修' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE damage_reports
      SET status = 'repaired', handler_id = ?, handler_name = ?, repair_cost = ?, repair_result = ?, resolved_at = ?
      WHERE id = ?
    `, [user.id, user.name, repair_cost || null, repair_result || null, now, id]);

    await run("UPDATE equipments SET status = 'available' WHERE id = ?", [existing.equipment_id]);

    const updated = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '维修已完成' });
  } catch (error) {
    return c.json({ success: false, error: '操作失败' }, 500);
  }
});

damageReportRoutes.post('/:id/scrap', roleMiddleware(['admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { repair_cost, repair_result } = body;

    const existing = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '损坏登记不存在' }, 404);
    }

    if (!['pending', 'repairing'].includes(existing.status)) {
      return c.json({ success: false, error: '该状态下无法报废' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE damage_reports
      SET status = 'scrapped', handler_id = ?, handler_name = ?, repair_cost = ?, repair_result = ?, resolved_at = ?
      WHERE id = ?
    `, [user.id, user.name, repair_cost || null, repair_result || null, now, id]);

    await run("UPDATE equipments SET status = 'scrapped' WHERE id = ?", [existing.equipment_id]);

    const updated = await get<DamageReport>('SELECT * FROM damage_reports WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '设备已报废' });
  } catch (error) {
    return c.json({ success: false, error: '操作失败' }, 500);
  }
});

export default damageReportRoutes;
