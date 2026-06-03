import { Hono } from 'hono';
import { z } from 'zod';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import { generateNo } from '../utils.js';
import type { MediaCard } from '../types.js';

const mediaCardRoutes = new Hono<{ Variables: AuthContext }>();

mediaCardRoutes.use('*', authMiddleware());

const mediaCardSchema = z.object({
  code: z.string().min(1, '素材卡编号不能为空'),
  type: z.string().min(1, '素材卡类型不能为空'),
  capacity: z.string().min(1, '容量不能为空'),
  brand: z.string().optional(),
  equipment_id: z.number().optional(),
  status: z.enum(['available', 'in_use', 'damaged', 'lost']).default('available'),
  description: z.string().optional(),
  remark: z.string().optional(),
});

mediaCardRoutes.get('/', async (c) => {
  const { status, type, keyword } = c.req.query();

  let query = 'SELECT * FROM media_cards WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  if (keyword) {
    query += ' AND (code LIKE ? OR type LIKE ? OR capacity LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }

  query += ' ORDER BY created_at DESC';

  const cards = await all<MediaCard>(query, params);
  return c.json({ success: true, data: cards });
});

mediaCardRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const card = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);

  if (!card) {
    return c.json({ success: false, error: '素材卡不存在' }, 404);
  }

  const history = await all(`
    SELECT * FROM (
      SELECT id, 'borrow' as action, borrow_time as action_time, current_user_name as user_name, '借出' as action_name
      FROM media_cards WHERE id = ? AND borrow_time IS NOT NULL
    )
    ORDER BY action_time DESC
  `, [id]);

  return c.json({
    success: true,
    data: {
      ...card,
      history,
    },
  });
});

mediaCardRoutes.post('/', roleMiddleware(['admin']), async (c) => {
  try {
    const body = await c.req.json();
    const validated = mediaCardSchema.parse(body);

    const existing = await get('SELECT id FROM media_cards WHERE code = ?', [validated.code]);
    if (existing) {
      return c.json({ success: false, error: '素材卡编号已存在' }, 400);
    }

    let equipmentName: string | null = null;
    if (validated.equipment_id) {
      const equipment = await get<{ name: string }>('SELECT name FROM equipments WHERE id = ?', [validated.equipment_id]);
      equipmentName = equipment?.name || null;
    }

    const sql = `
      INSERT INTO media_cards (code, type, capacity, brand, equipment_id, equipment_name, status, description, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await run(sql, [
      validated.code,
      validated.type,
      validated.capacity,
      validated.brand || '',
      validated.equipment_id || null,
      equipmentName,
      validated.status,
      validated.description || '',
      validated.remark || ''
    ]);

    const card = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [result.lastID]);
    return c.json({ success: true, data: card, message: '素材卡创建成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '创建素材卡失败' }, 500);
  }
});

mediaCardRoutes.put('/:id', roleMiddleware(['admin']), async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const existing = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '素材卡不存在' }, 404);
    }

    const body = await c.req.json();
    const validated = mediaCardSchema.parse(body);

    if (validated.code !== existing.code) {
      const codeExists = await get('SELECT id FROM media_cards WHERE code = ? AND id != ?', [validated.code, id]);
      if (codeExists) {
        return c.json({ success: false, error: '素材卡编号已存在' }, 400);
      }
    }

    let equipmentName: string | null = existing.equipment_name;
    if (validated.equipment_id && validated.equipment_id !== existing.equipment_id) {
      const equipment = await get<{ name: string }>('SELECT name FROM equipments WHERE id = ?', [validated.equipment_id]);
      equipmentName = equipment?.name || null;
    }

    const sql = `
      UPDATE media_cards
      SET code = ?, type = ?, capacity = ?, brand = ?, equipment_id = ?, equipment_name = ?, status = ?, description = ?, remark = ?
      WHERE id = ?
    `;

    await run(sql, [
      validated.code,
      validated.type,
      validated.capacity,
      validated.brand || '',
      validated.equipment_id || null,
      equipmentName,
      validated.status,
      validated.description || '',
      validated.remark || '',
      id
    ]);

    const updated = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '素材卡更新成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '更新素材卡失败' }, 500);
  }
});

mediaCardRoutes.post('/:id/borrow', roleMiddleware(['admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { user_id, user_name, expected_return_time } = body;

    const existing = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);
    if (!existing) {
      return c.json({ success: false, error: '素材卡不存在' }, 404);
    }

    if (existing.status !== 'available') {
      return c.json({ success: false, error: '该素材卡不可用' }, 400);
    }

    if (!user_id || !user_name) {
      return c.json({ success: false, error: '请指定借用人' }, 400);
    }

    if (!expected_return_time) {
      return c.json({ success: false, error: '请指定预计归还时间' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE media_cards
      SET status = 'in_use', current_user_id = ?, current_user_name = ?, borrow_time = ?, expected_return_time = ?
      WHERE id = ?
    `, [user_id, user_name, now, expected_return_time, id]);

    const updated = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '素材卡借出成功' });
  } catch (error) {
    return c.json({ success: false, error: '借出失败' }, 500);
  }
});

mediaCardRoutes.post('/:id/return', roleMiddleware(['admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { return_remark, return_status, damage_description } = body;

    const existing = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);
    if (!existing) {
      return c.json({ success: false, error: '素材卡不存在' }, 404);
    }

    if (existing.status !== 'in_use') {
      return c.json({ success: false, error: '该素材卡未被借出' }, 400);
    }

    const now = new Date().toISOString();
    const status = return_status === 'damaged' ? 'damaged' : 'available';

    await run(`
      UPDATE media_cards
      SET status = ?, current_user_id = NULL, current_user_name = NULL, borrow_time = NULL, expected_return_time = NULL, remark = COALESCE(?, remark)
      WHERE id = ?
    `, [status, return_remark || null, id]);

    await run(`
      UPDATE overdue_reminders
      SET status = 'resolved', resolved_at = ?
      WHERE type = 'media_card' AND related_id = ?
    `, [now, id]);

    let damageReportId: number | null = null;
    if (return_status === 'damaged' && damage_description) {
      const reportNo = generateNo('DR');
      const damageType = damage_description.length > 50 ? 'moderate' : 'minor';

      const dmgSql = `
        INSERT INTO damage_reports (report_no, equipment_id, equipment_name, reporter_id, reporter_name, damage_type, description, occurred_time, location, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await run(dmgSql, [
        reportNo,
        existing.equipment_id || 0,
        existing.equipment_name || `${existing.type}素材卡`,
        user.id,
        user.name,
        damageType,
        damage_description,
        now,
        '归还时发现',
        'pending'
      ]);
      damageReportId = result.lastID;
    }

    const updated = await get<MediaCard>('SELECT * FROM media_cards WHERE id = ?', [id]);
    return c.json({
      success: true,
      data: updated,
      damage_report_id: damageReportId,
      message: return_status === 'damaged' ? '素材卡已归还并创建损坏报告' : '素材卡归还成功',
    });
  } catch (error) {
    return c.json({ success: false, error: '归还失败' }, 500);
  }
});

mediaCardRoutes.delete('/:id', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get('SELECT * FROM media_cards WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '素材卡不存在' }, 404);
  }

  if ((existing as MediaCard).status === 'in_use') {
    return c.json({ success: false, error: '该素材卡正在使用中，无法删除' }, 400);
  }

  await run('DELETE FROM media_cards WHERE id = ?', [id]);
  return c.json({ success: true, message: '素材卡删除成功' });
});

export default mediaCardRoutes;
