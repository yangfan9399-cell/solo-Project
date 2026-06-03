import { Hono } from 'hono';
import { get, all } from '../db.js';
import { authMiddleware, type AuthContext } from '../middleware/auth.js';
import { updateOverdueStatus } from '../utils.js';

const dashboardRoutes = new Hono<{ Variables: AuthContext }>();

dashboardRoutes.use('*', authMiddleware());

dashboardRoutes.get('/stats', async (c) => {
  const user = c.get('user');

  await updateOverdueStatus();

  const equipmentStats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use,
      SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
      SUM(CASE WHEN status = 'damaged' THEN 1 ELSE 0 END) as damaged,
      SUM(CASE WHEN status = 'scrapped' THEN 1 ELSE 0 END) as scrapped
    FROM equipments
  `, []);

  let taskWhere = 'WHERE 1=1';
  const taskParams: (string | number)[] = [];
  if (user.role === 'reporter') {
    taskWhere += ' AND reporter_id = ?';
    taskParams.push(user.id);
  }

  const taskStats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM shooting_tasks
    ${taskWhere}
  `, taskParams);

  let resWhere = 'WHERE 1=1';
  const resParams: (string | number)[] = [];
  if (user.role === 'reporter') {
    resWhere += ' AND requester_id = ?';
    resParams.push(user.id);
  }

  const reservationStats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN status = 'picked_up' THEN 1 ELSE 0 END) as picked_up,
      SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM reservations
    ${resWhere}
  `, resParams);

  const mediaCardStats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'in_use' THEN 1 ELSE 0 END) as in_use,
      SUM(CASE WHEN status = 'damaged' THEN 1 ELSE 0 END) as damaged,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
    FROM media_cards
  `, []);

  let odWhere = 'WHERE 1=1';
  const odParams: (string | number)[] = [];
  if (user.role === 'reporter') {
    odWhere += ' AND user_id = ?';
    odParams.push(user.id);
  }

  const overdueStats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
    FROM overdue_reminders
    ${odWhere}
  `, odParams);

  const damageStats = await get(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'repairing' THEN 1 ELSE 0 END) as repairing,
      SUM(CASE WHEN status = 'repaired' THEN 1 ELSE 0 END) as repaired,
      SUM(CASE WHEN status = 'scrapped' THEN 1 ELSE 0 END) as scrapped
    FROM damage_reports
  `, []);

  const categories = await all(`
    SELECT category, COUNT(*) as count
    FROM equipments
    GROUP BY category
    ORDER BY count DESC
  `, []);

  let recentTasksSql = `
    SELECT id, task_no, title, status, reporter_name, created_at
    FROM shooting_tasks
  `;
  const recentTasksParams: (string | number)[] = [];
  if (user.role === 'reporter') {
    recentTasksSql += ' WHERE reporter_id = ?';
    recentTasksParams.push(user.id);
  }
  recentTasksSql += ' ORDER BY created_at DESC LIMIT 5';

  const recentTasks = await all(recentTasksSql, recentTasksParams);

  const pendingApprovals = user.role !== 'reporter' ? await all(`
    SELECT r.*, t.title as task_title
    FROM reservations r
    LEFT JOIN shooting_tasks t ON r.task_id = t.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
    LIMIT 5
  `, []) : [];

  return c.json({
    success: true,
    data: {
      equipment: equipmentStats,
      tasks: taskStats,
      reservations: reservationStats,
      media_cards: mediaCardStats,
      overdue: overdueStats,
      damage_reports: damageStats,
      categories,
      recent_tasks: recentTasks,
      pending_approvals: pendingApprovals,
    },
  });
});

export default dashboardRoutes;
