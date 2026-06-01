import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const type = c.req.query('type');
  let sql = 'SELECT * FROM locations ORDER BY created_at DESC';
  let params: any[] = [];
  if (type) {
    sql = 'SELECT * FROM locations WHERE type = ? ORDER BY created_at DESC';
    params = [type];
  }
  const locations = db.prepare(sql).all(...params);
  return c.json(locations);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  if (!location) return c.json({ error: 'Location not found' }, 404);
  return c.json(location);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = `loc_${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO locations (id, name, type, address, area, population, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, body.name, body.type, body.address, body.area, body.population || null, now);
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  return c.json(location, 201);
});

app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  db.prepare(`
    UPDATE locations SET name = ?, type = ?, address = ?, area = ?, population = ?
    WHERE id = ?
  `).run(body.name, body.type, body.address, body.area, body.population || null, id);
  const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
  return c.json(location);
});

app.delete('/:id', (c) => {
  const id = c.req.param('id');
  db.prepare('DELETE FROM locations WHERE id = ?').run(id);
  return c.json({ success: true });
});

export default app;
