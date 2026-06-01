import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  return c.json(users);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(user);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = `user_${Date.now()}`;
  db.prepare(`
    INSERT INTO users (id, name, role, phone, department)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, body.name, body.role, body.phone, body.department);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return c.json(user, 201);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE users SET name = ?, role = ?, phone = ?, department = ?
    WHERE id = ?
  `).run(body.name, body.role, body.phone, body.department, id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return c.json(user);
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return c.json({ success: true });
});

export default app;
