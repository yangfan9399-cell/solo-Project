import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const status = c.req.query('status');
  const urgency = c.req.query('urgency');
  let sql = 'SELECT * FROM repair_reports ORDER BY created_at DESC';
  let params: any[] = [];
  
  if (status && urgency) {
    sql = 'SELECT * FROM repair_reports WHERE status = ? AND urgency = ? ORDER BY created_at DESC';
    params = [status, urgency];
  } else if (status) {
    sql = 'SELECT * FROM repair_reports WHERE status = ? ORDER BY created_at DESC';
    params = [status];
  } else if (urgency) {
    sql = 'SELECT * FROM repair_reports WHERE urgency = ? ORDER BY created_at DESC';
    params = [urgency];
  }
  
  const reports = db.prepare(sql).all(...params);
  return c.json(reports);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const report = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(id);
  if (!report) return c.json({ error: 'Repair report not found' }, 404);
  
  const workOrders = db.prepare('SELECT * FROM work_orders WHERE repair_report_id = ? ORDER BY created_at DESC').all(id);
  return c.json({ ...report, work_orders: workOrders });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = `rp_${Date.now()}`;
  const reportNo = `BX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO repair_reports (
      id, report_no, type, title, description, location, address, contact_name, contact_phone,
      affected_area, affected_population, urgency, status, reported_by, reporter_name, reporter_role,
      water_stop_needed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, reportNo, body.type, body.title, body.description, body.location, body.address,
    body.contact_name, body.contact_phone, body.affected_area || null, body.affected_population || null,
    body.urgency || 'medium', 'pending', body.reported_by || null, body.reporter_name || null,
    body.reporter_role || null, body.water_stop_needed ? 1 : 0, now, now
  );

  const notifId = `notif_${Date.now()}`;
  db.prepare(`
    INSERT INTO notifications (id, type, title, content, target_roles, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    notifId, 'repair', '新报修单',
    `收到新报修：${body.title}，请及时处理。`,
    'hotline,admin,repair_crew', 0, now
  );
  
  const report = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(id);
  return c.json(report, 201);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE repair_reports SET 
      type = ?, title = ?, description = ?, location = ?, address = ?, contact_name = ?, 
      contact_phone = ?, affected_area = ?, affected_population = ?, urgency = ?, 
      water_stop_needed = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.type, body.title, body.description, body.location, body.address, body.contact_name,
    body.contact_phone, body.affected_area || null, body.affected_population || null,
    body.urgency, body.water_stop_needed ? 1 : 0, now, id
  );
  
  const report = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(id);
  return c.json(report);
});

app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  db.prepare('UPDATE repair_reports SET status = ?, updated_at = ? WHERE id = ?')
    .run(body.status, now, id);
  const report = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(id);
  return c.json(report);
});

app.put('/:id/assign', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE repair_reports SET 
      assigned_to = ?, assignee_name = ?, status = 'assigned', updated_at = ?
    WHERE id = ?
  `).run(body.team_id, body.team_name, now, id);
  
  const team = db.prepare('SELECT * FROM repair_teams WHERE id = ?').get(body.team_id);
  const orderNo = `GD${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const report = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(id);
  
  db.prepare(`
    INSERT INTO work_orders (
      id, order_no, repair_report_id, title, description, location, team_id, team_name,
      team_members, priority, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    `wo_${Date.now()}`, orderNo, id, report.title, report.description, report.location,
    body.team_id, body.team_name, team.members, report.urgency, 'pending', now, now
  );

  db.prepare('UPDATE repair_teams SET status = ? WHERE id = ?').run('busy', body.team_id);
  
  const updatedReport = db.prepare('SELECT * FROM repair_reports WHERE id = ?').get(id);
  return c.json(updatedReport);
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM repair_reports WHERE id = ?').run(id);
  return c.json({ success: true });
});

export default app;
