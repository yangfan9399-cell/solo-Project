import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const status = c.req.query('status');
  const teamId = c.req.query('team_id');
  let sql = 'SELECT * FROM work_orders ORDER BY created_at DESC';
  let params: any[] = [];
  
  if (status && teamId) {
    sql = 'SELECT * FROM work_orders WHERE status = ? AND team_id = ? ORDER BY created_at DESC';
    params = [status, teamId];
  } else if (status) {
    sql = 'SELECT * FROM work_orders WHERE status = ? ORDER BY created_at DESC';
    params = [status];
  } else if (teamId) {
    sql = 'SELECT * FROM work_orders WHERE team_id = ? ORDER BY created_at DESC';
    params = [teamId];
  }
  
  const orders = db.prepare(sql).all(...params);
  return c.json(orders);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
  if (!order) return c.json({ error: 'Work order not found' }, 404);
  
  const report = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(order.repair_report_id);
  return c.json({ ...order, repair_report: report });
});

app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  let updates = { status: body.status, updated_at: now };
  if (body.status === 'in_progress') {
    db.prepare('UPDATE work_orders SET status = ?, actual_start = ?, updated_at = ? WHERE id = ?')
      .run(body.status, now, now, id);
  } else if (body.status === 'completed') {
    db.prepare('UPDATE work_orders SET status = ?, actual_end = ?, work_summary = ?, materials_used = ?, updated_at = ? WHERE id = ?')
      .run(body.status, now, body.work_summary || null, body.materials_used || null, now, id);
    
    const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
    db.prepare('UPDATE repair_reports SET status = ?, updated_at = ? WHERE id = ?')
      .run('completed', now, order.repair_report_id);
    
    const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM work_orders WHERE team_id = ? AND status != ?').get(order.team_id, 'completed');
    if (pendingOrders.count === 0) {
      db.prepare('UPDATE repair_teams SET status = ? WHERE id = ?').run('available', order.team_id);
    }
  } else {
    db.prepare('UPDATE work_orders SET status = ?, updated_at = ? WHERE id = ?')
      .run(body.status, now, id);
  }
  
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
  return c.json(order);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE work_orders SET 
      title = ?, description = ?, estimated_start = ?, estimated_end = ?,
      work_summary = ?, materials_used = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.title, body.description, body.estimated_start || null, body.estimated_end || null,
    body.work_summary || null, body.materials_used || null, now, id
  );
  
  const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
  return c.json(order);
});

export default app;
