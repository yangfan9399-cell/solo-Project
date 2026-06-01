import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const status = c.req.query('status');
  let sql = 'SELECT * FROM repair_teams ORDER BY created_at DESC';
  let params: any[] = [];
  if (status) {
    sql = 'SELECT * FROM repair_teams WHERE status = ? ORDER BY created_at DESC';
    params = [status];
  }
  const teams = db.prepare(sql).all(...params);
  return c.json(teams);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const team = db.prepare('SELECT * FROM repair_teams WHERE id = ?').get(id);
  if (!team) return c.json({ error: 'Team not found' }, 404);
  
  const orders = db.prepare('SELECT * FROM work_orders WHERE team_id = ? ORDER BY created_at DESC').all(id);
  return c.json({ ...team, work_orders: orders });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = `team_${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO repair_teams (id, name, leader, leader_phone, members, area, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.name, body.leader, body.leader_phone, body.members, body.area, 'available', now);
  const team = db.prepare('SELECT * FROM repair_teams WHERE id = ?').get(id);
  return c.json(team, 201);
});

app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare('UPDATE repair_teams SET status = ? WHERE id = ?').run(body.status, id);
  const team = db.prepare('SELECT * FROM repair_teams WHERE id = ?').get(id);
  return c.json(team);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE repair_teams SET name = ?, leader = ?, leader_phone = ?, members = ?, area = ?
    WHERE id = ?
  `).run(body.name, body.leader, body.leader_phone, body.members, body.area, id);
  const team = db.prepare('SELECT * FROM repair_teams WHERE id = ?').get(id);
  return c.json(team);
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM repair_teams WHERE id = ?').run(id);
  return c.json({ success: true });
});

export default app;
