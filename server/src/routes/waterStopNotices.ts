import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const published = c.req.query('published');
  let sql = 'SELECT * FROM water_stop_notices ORDER BY created_at DESC';
  let params: any[] = [];
  
  if (published !== undefined) {
    sql = 'SELECT * FROM water_stop_notices WHERE published = ? ORDER BY created_at DESC';
    params = [published === 'true' ? 1 : 0];
  }
  
  const notices = db.prepare(sql).all(...params);
  return c.json(notices);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const notice = db.prepare('SELECT * FROM water_stop_notices WHERE id = ?').get(id);
  if (!notice) return c.json({ error: 'Notice not found' }, 404);
  return c.json(notice);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = `wsn_${Date.now()}`;
  const noticeNo = `TS${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO water_stop_notices (
      id, notice_no, title, content, affected_area, affected_population, start_time, end_time,
      reason, status, published, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, noticeNo, body.title, body.content, body.affected_area, body.affected_population || null,
    body.start_time, body.end_time, body.reason, 'scheduled', 0, body.created_by, now, now
  );
  
  const notice = db.prepare('SELECT * FROM water_stop_notices WHERE id = ?').get(id);
  return c.json(notice, 201);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE water_stop_notices SET 
      title = ?, content = ?, affected_area = ?, affected_population = ?, start_time = ?, 
      end_time = ?, reason = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(
    body.title, body.content, body.affected_area, body.affected_population || null,
    body.start_time, body.end_time, body.reason, body.status, now, id
  );
  
  const notice = db.prepare('SELECT * FROM water_stop_notices WHERE id = ?').get(id);
  return c.json(notice);
});

app.put('/:id/publish', async (c) => {
  const id = c.req.param('id');
  const now = new Date().toISOString();
  
  db.prepare(`
    UPDATE water_stop_notices SET published = 1, published_at = ?, status = 'active', updated_at = ?
    WHERE id = ?
  `).run(now, now, id);

  const notice = db.prepare('SELECT * FROM water_stop_notices WHERE id = ?').get(id);
  const notifId = `notif_${Date.now()}`;
  db.prepare(`
    INSERT INTO notifications (id, type, title, content, target_roles, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    notifId, 'water_stop', '停水公告发布',
    `停水公告已发布：${notice.title}`,
    'hotline,admin,chemist,repair_crew', 0, now
  );
  
  const updatedNotice = db.prepare('SELECT * FROM water_stop_notices WHERE id = ?').get(id);
  return c.json(updatedNotice);
});

app.put('/:id/end', async (c) => {
  const id = c.req.param('id');
  const now = new Date().toISOString();
  db.prepare('UPDATE water_stop_notices SET status = ?, updated_at = ? WHERE id = ?')
    .run('ended', now, id);
  const notice = db.prepare('SELECT * FROM water_stop_notices WHERE id = ?').get(id);

  const notifId = `notif_${Date.now()}`;
  db.prepare(`
    INSERT INTO notifications (id, type, title, content, target_roles, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    notifId, 'water_stop', '恢复供水通知',
    `【恢复供水：${notice.affected_area} 区域已恢复正常供水。停水原因为：${notice.reason}。`,
    'hotline,admin,chemist,repair_crew', 0, now
  );

  return c.json(notice);
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM water_stop_notices WHERE id = ?').run(id);
  return c.json({ success: true });
});

export default app;
