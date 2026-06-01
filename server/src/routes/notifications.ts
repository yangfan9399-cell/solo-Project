import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const role = c.req.query('role');
  const unreadOnly = c.req.query('unread');
  
  let sql = 'SELECT * FROM notifications ORDER BY created_at DESC';
  let params: any[] = [];
  
  if (role && unreadOnly === 'true') {
    sql = 'SELECT * FROM notifications WHERE target_roles LIKE ? AND is_read = 0 ORDER BY created_at DESC';
    params = [`%${role}%`];
  } else if (role) {
    sql = 'SELECT * FROM notifications WHERE target_roles LIKE ? ORDER BY created_at DESC';
    params = [`%${role}%`];
  } else if (unreadOnly === 'true') {
    sql = 'SELECT * FROM notifications WHERE is_read = 0 ORDER BY created_at DESC';
  }
  
  const notifications = db.prepare(sql).all(...params);
  return c.json(notifications);
});

app.put('/:id/read', (c) => {
  const id = c.req.param('id');
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
  return c.json(notification);
});

app.put('/read-all', (c) => {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  return c.json({ success: true });
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
  return c.json({ success: true });
});

export default app;
