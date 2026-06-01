import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const status = c.req.query('status');
  let sql = 'SELECT * FROM water_quality_tests ORDER BY test_date DESC, created_at DESC';
  let params: any[] = [];
  if (status) {
    sql = 'SELECT * FROM water_quality_tests WHERE status = ? ORDER BY test_date DESC, created_at DESC';
    params = [status];
  }
  const tests = db.prepare(sql).all(...params);
  return c.json(tests);
});

app.get('/:id', (c) => {
  const id = c.req.param('id');
  const test = db.prepare('SELECT * FROM water_quality_tests WHERE id = ?').get(id);
  if (!test) return c.json({ error: 'Test record not found' }, 404);
  
  const rechecks = db.prepare('SELECT * FROM recheck_records WHERE water_quality_test_id = ? ORDER BY recheck_date DESC').all(id);
  return c.json({ ...test, rechecks });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = `wq_${Date.now()}`;
  const now = new Date().toISOString();
  
  const isAbnormal = body.ph < 6.5 || body.ph > 8.5 || 
                     body.turbidity > 1.0 || 
                     body.residual_chlorine < 0.3 || body.residual_chlorine > 4.0 ||
                     body.coliform > 0;
  const status = isAbnormal ? 'abnormal' : 'normal';
  
  db.prepare(`
    INSERT INTO water_quality_tests (
      id, test_date, location_id, location_name, ph, turbidity, residual_chlorine, coliform,
      status, tested_by, tester_name, remark, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.test_date, body.location_id, body.location_name,
    body.ph, body.turbidity, body.residual_chlorine, body.coliform,
    status, body.tested_by, body.tester_name, body.remark || null, now, now
  );

  if (isAbnormal) {
    const notifId = `notif_${Date.now()}`;
    db.prepare(`
      INSERT INTO notifications (id, type, title, content, target_roles, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      notifId, 'quality', '水质异常警报',
      `${body.location_name}检测发现水质异常，请立即关注。`,
      'chemist,admin', 0, now
    );
  }
  
  const test = db.prepare('SELECT * FROM water_quality_tests WHERE id = ?').get(id);
  return c.json(test, 201);
});

app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date().toISOString();
  db.prepare('UPDATE water_quality_tests SET status = ?, updated_at = ? WHERE id = ?')
    .run(body.status, now, id);
  const test = db.prepare('SELECT * FROM water_quality_tests WHERE id = ?').get(id);
  return c.json(test);
});

app.post('/:id/recheck', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const recheckId = `rc_${Date.now()}`;
  const now = new Date().toISOString();
  
  const isPass = body.ph >= 6.5 && body.ph <= 8.5 && 
                 body.turbidity <= 1.0 && 
                 body.residual_chlorine >= 0.3 && body.residual_chlorine <= 4.0 &&
                 body.coliform === 0;
  
  db.prepare(`
    INSERT INTO recheck_records (
      id, water_quality_test_id, recheck_date, ph, turbidity, residual_chlorine, coliform,
      result, rechecked_by, rechecker_name, remark, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    recheckId, id, body.recheck_date, body.ph, body.turbidity, body.residual_chlorine, body.coliform,
    isPass ? 'pass' : 'fail', body.rechecked_by, body.rechecker_name, body.remark || null, now
  );

  const newStatus = isPass ? 'resolved' : 'processing';
  db.prepare('UPDATE water_quality_tests SET status = ?, updated_at = ? WHERE id = ?')
    .run(newStatus, now, id);
  
  if (isPass) {
    const originalTest = db.prepare('SELECT * FROM water_quality_tests WHERE id = ?').get(id);
    const notifId = `notif_${Date.now()}`;
    db.prepare(`
      INSERT INTO notifications (id, type, title, content, target_roles, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      notifId, 'water_stop', '恢复供水通知',
      `【恢复供水】${originalTest.location_name} 区域水质复测合格，已恢复正常供水。`,
      'chemist,admin,hotline,repair_crew', 0, now
    );
  }
  
  const recheck = db.prepare('SELECT * FROM recheck_records WHERE id = ?').get(recheckId);
  return c.json(recheck, 201);
});

export default app;
