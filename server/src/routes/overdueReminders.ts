import { Hono } from 'hono';
import { run, get, all } from '../db.js';
import { authMiddleware, roleMiddleware, type AuthContext } from '../middleware/auth.js';
import { updateOverdueStatus } from '../utils.js';

const overdueReminderRoutes = new Hono<{ Variables: AuthContext }>();

overdueReminderRoutes.use('*', authMiddleware());

overdueReminderRoutes.get('/', async (c) => {
  const user = c.get('user');
  const { status, type } = c.req.query();

  await updateOverdueStatus();

  let query = 'SELECT * FROM overdue_reminders WHERE 1=1';
  const params: (string | number)[] = [];

  if (user.role === 'reporter') {
    query += ' AND user_id = ?';
    params.push(user.id);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC';

  const reminders = await all(query, params);
  return c.json({ success: true, data: reminders });
});

overdueReminderRoutes.post('/refresh', roleMiddleware(['admin']), async (c) => {
  await updateOverdueStatus();
  return c.json({ success: true, message: '逾期状态已更新' });
});

overdueReminderRoutes.post('/:id/notify', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get('SELECT * FROM overdue_reminders WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '逾期提醒不存在' }, 404);
  }

  const now = new Date().toISOString();
  await run(`
    UPDATE overdue_reminders
    SET status = 'notified', notified_at = ?
    WHERE id = ?
  `, [now, id]);

  const updated = await get('SELECT * FROM overdue_reminders WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '已标记为已通知' });
});

overdueReminderRoutes.post('/:id/resolve', roleMiddleware(['admin']), async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const existing = await get('SELECT * FROM overdue_reminders WHERE id = ?', [id]);

  if (!existing) {
    return c.json({ success: false, error: '逾期提醒不存在' }, 404);
  }

  const now = new Date().toISOString();
  await run(`
    UPDATE overdue_reminders
    SET status = 'resolved', resolved_at = ?
    WHERE id = ?
  `, [now, id]);

  const updated = await get('SELECT * FROM overdue_reminders WHERE id = ?', [id]);
  return c.json({ success: true, data: updated, message: '已标记为已解决' });
});

overdueReminderRoutes.post('/batch-notify', roleMiddleware(['admin']), async (c) => {
  try {
    const body = await c.req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json({ success: false, error: '请选择要标记的记录' }, 400);
    }

    const now = new Date().toISOString();
    const placeholders = ids.map(() => '?').join(',');
    
    await run(`
      UPDATE overdue_reminders
      SET status = 'notified', notified_at = ?
      WHERE id IN (${placeholders}) AND status = 'pending'
    `, [now, ...ids]);

    return c.json({ success: true, message: `已标记 ${ids.length} 条记录为已通知` });
  } catch (error) {
    return c.json({ success: false, error: '操作失败' }, 500);
  }
});

overdueReminderRoutes.get('/stats/count', async (c) => {
  const user = c.get('user');

  await updateOverdueStatus();

  let whereClause = 'WHERE 1=1';
  const params: (string | number)[] = [];

  if (user.role === 'reporter') {
    whereClause += ' AND user_id = ?';
    params.push(user.id);
  }

  const stats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'notified' THEN 1 ELSE 0 END) as notified,
      SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved
    FROM overdue_reminders
    ${whereClause}
  `, params);

  return c.json({ success: true, data: stats });
});

export default overdueReminderRoutes;
