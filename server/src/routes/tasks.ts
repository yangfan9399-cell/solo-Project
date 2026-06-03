import { Hono } from 'hono';
import { z } from 'zod';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import { generateNo } from '../utils.js';
import type { ShootingTask } from '../types.js';

const taskRoutes = new Hono<{ Variables: AuthContext }>();

taskRoutes.use('*', authMiddleware());

const taskSchema = z.object({
  title: z.string().min(1, '任务标题不能为空'),
  description: z.string().optional(),
  shooting_location: z.string().optional(),
  shooting_start_time: z.string().min(1, '拍摄开始时间不能为空'),
  shooting_end_time: z.string().min(1, '拍摄结束时间不能为空'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  remark: z.string().optional(),
});

taskRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { status, reporter_id, keyword } = c.req.query();

  let query = 'SELECT * FROM shooting_tasks WHERE 1=1';
  const params: (string | number)[] = [];

  if (user.role === 'reporter') {
    query += ' AND reporter_id = ?';
    params.push(user.id);
  }

  if (reporter_id && user.role !== 'reporter') {
    query += ' AND reporter_id = ?';
    params.push(parseInt(reporter_id, 10));
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (keyword) {
    query += ' AND (title LIKE ? OR task_no LIKE ? OR description LIKE ?)';
    const search = `%${keyword}%`;
    params.push(search, search, search);
  }

  query += ' ORDER BY created_at DESC';

  const tasks = await all<ShootingTask>(query, params);
  return c.json({ success: true, data: tasks });
});

taskRoutes.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const task = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

  if (!task) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  const reservations = await all(`
    SELECT r.*, e.code as equipment_code, e.category as equipment_category
    FROM reservations r
    JOIN equipments e ON r.equipment_id = e.id
    WHERE r.task_id = ?
    ORDER BY r.created_at DESC
  `, [id]);

  return c.json({
    success: true,
    data: {
      ...task,
      reservations,
    },
  });
});

taskRoutes.post('/', roleMiddleware(['reporter', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const validated = taskSchema.parse(body);

    if (new Date(validated.shooting_end_time) <= new Date(validated.shooting_start_time)) {
      return c.json({ success: false, error: '结束时间必须晚于开始时间' }, 400);
    }

    const taskNo = generateNo('TASK');

    const sql = `
      INSERT INTO shooting_tasks (task_no, title, description, reporter_id, reporter_name, shooting_location, shooting_start_time, shooting_end_time, status, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `;

    const result = await run(sql, [
      taskNo,
      validated.title,
      validated.description || '',
      user.id,
      user.name,
      validated.shooting_location || '',
      validated.shooting_start_time,
      validated.shooting_end_time,
      validated.remark || ''
    ]);

    const task = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [result.lastID]);
    return c.json({ success: true, data: task, message: '任务创建成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '创建任务失败' }, 500);
  }
});

taskRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '任务不存在' }, 404);
    }

    if (user.role === 'reporter' && existing.reporter_id !== user.id) {
      return c.json({ success: false, error: '只能编辑自己创建的任务' }, 403);
    }

    if (existing.status === 'approved' || existing.status === 'in_progress' || existing.status === 'completed') {
      return c.json({ success: false, error: '该状态下的任务无法编辑' }, 400);
    }

    const body = await c.req.json();
    const validated = taskSchema.parse(body);

    if (new Date(validated.shooting_end_time) <= new Date(validated.shooting_start_time)) {
      return c.json({ success: false, error: '结束时间必须晚于开始时间' }, 400);
    }

    const sql = `
      UPDATE shooting_tasks
      SET title = ?, description = ?, shooting_location = ?, shooting_start_time = ?, shooting_end_time = ?, priority = ?, remark = ?
      WHERE id = ?
    `;

    await run(sql, [
      validated.title,
      validated.description || '',
      validated.shooting_location || '',
      validated.shooting_start_time,
      validated.shooting_end_time,
      validated.priority,
      validated.remark || '',
      id
    ]);

    const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '任务更新成功' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ success: false, error: error.errors[0].message }, 400);
    }
    return c.json({ success: false, error: '更新任务失败' }, 500);
  }
});

taskRoutes.post('/:id/submit', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  if (user.role === 'reporter' && existing.reporter_id !== user.id) {
    return c.json({ success: false, error: '只能提交自己创建的任务' }, 403);
  }

  if (existing.status !== 'draft' && existing.status !== 'rejected') {
    return c.json({ success: false, error: '只有草稿或已拒绝状态的任务可以提交审批' }, 400);
  }

  await run('UPDATE shooting_tasks SET status = ? WHERE id = ?', ['pending', id]);
  const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '任务已提交审批' });
});

taskRoutes.post('/:id/approve', roleMiddleware(['producer', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { remark } = body;

    const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '任务不存在' }, 404);
    }

    if (existing.status !== 'pending') {
      return c.json({ success: false, error: '只有待审批状态的任务可以审批' }, 400);
    }

    const now = new Date().toISOString();
    await run(`
      UPDATE shooting_tasks
      SET status = 'approved', producer_id = ?, producer_name = ?, approved_at = ?, remark = COALESCE(?, remark)
      WHERE id = ?
    `, [user.id, user.name, now, remark || null, id]);

    const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '任务已批准' });
  } catch (error) {
    return c.json({ success: false, error: '审批失败' }, 500);
  }
});

taskRoutes.post('/:id/reject', roleMiddleware(['producer', 'admin']), async (c) => {
  try {
    const user = c.get('user');
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();
    const { remark } = body;

    const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

    if (!existing) {
      return c.json({ success: false, error: '任务不存在' }, 404);
    }

    if (existing.status !== 'pending') {
      return c.json({ success: false, error: '只有待审批状态的任务可以审批' }, 400);
    }

    await run(`
      UPDATE shooting_tasks
      SET status = 'rejected', producer_id = ?, producer_name = ?, remark = COALESCE(?, remark)
      WHERE id = ?
    `, [user.id, user.name, remark || null, id]);

    const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
    return c.json({ success: true, data: updated, message: '任务已拒绝' });
  } catch (error) {
    return c.json({ success: false, error: '拒绝失败' }, 500);
  }
});

taskRoutes.post('/:id/start', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  if (existing.status !== 'approved') {
    return c.json({ success: false, error: '只有已批准的任务可以开始拍摄' }, 400);
  }

  if (user.role === 'reporter' && existing.reporter_id !== user.id) {
    return c.json({ success: false, error: '只能开始自己的任务' }, 403);
  }

  await run('UPDATE shooting_tasks SET status = ? WHERE id = ?', ['in_progress', id]);
  const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '任务已开始' });
});

taskRoutes.post('/:id/complete', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  if (existing.status !== 'in_progress') {
    return c.json({ success: false, error: '只有进行中的任务可以完成' }, 400);
  }

  if (user.role === 'reporter' && existing.reporter_id !== user.id) {
    return c.json({ success: false, error: '只能完成自己的任务' }, 403);
  }

  const now = new Date().toISOString();
  await run('UPDATE shooting_tasks SET status = ?, completed_at = ? WHERE id = ?', ['completed', now, id]);
  const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '任务已完成' });
});

taskRoutes.post('/:id/cancel', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  if (existing.status === 'completed' || existing.status === 'cancelled') {
    return c.json({ success: false, error: '该状态下的任务无法取消' }, 400);
  }

  if (user.role === 'reporter' && existing.reporter_id !== user.id) {
    return c.json({ success: false, error: '只能取消自己的任务' }, 403);
  }

  await run('UPDATE shooting_tasks SET status = ? WHERE id = ?', ['cancelled', id]);

  await run(`
    UPDATE reservations SET status = 'cancelled' WHERE task_id = ? AND status IN ('pending', 'approved')
  `, [id]);

  const updated = await get<ShootingTask>('SELECT * FROM shooting_tasks WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '任务已取消' });
});

taskRoutes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get('SELECT * FROM shooting_tasks WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '任务不存在' }, 404);
  }

  if (user.role === 'reporter' && (existing as ShootingTask).reporter_id !== user.id) {
    return c.json({ success: false, error: '只能删除自己的任务' }, 403);
  }

  if ((existing as ShootingTask).status !== 'draft' && (existing as ShootingTask).status !== 'rejected' && (existing as ShootingTask).status !== 'cancelled') {
    return c.json({ success: false, error: '只能删除草稿、已拒绝或已取消的任务' }, 400);
  }

  const hasActiveReservations = await get<{ count: number }>(`
    SELECT COUNT(*) as count FROM reservations WHERE task_id = ? AND status NOT IN ('cancelled', 'returned')
  `, [id]);

  if (hasActiveReservations && hasActiveReservations.count > 0) {
    return c.json({ success: false, error: '该任务存在未完成的预约，无法删除' }, 400);
  }

  await run('DELETE FROM reservations WHERE task_id = ?', [id]);
  await run('DELETE FROM shooting_tasks WHERE id = ?', [id]);
  return c.json({ success: true, message: '任务删除成功' });
});

export default taskRoutes;
