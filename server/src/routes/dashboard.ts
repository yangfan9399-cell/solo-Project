import { Hono } from 'hono';
import db from '../db.js';

const app = new Hono();

app.get('/', (c) => {
  const stats = {
    waterQuality: {
      total: db.prepare('SELECT COUNT(*) as count FROM water_quality_tests').get().count,
      abnormal: db.prepare('SELECT COUNT(*) as count FROM water_quality_tests WHERE status = ?').get('abnormal').count,
      processing: db.prepare('SELECT COUNT(*) as count FROM water_quality_tests WHERE status = ?').get('processing').count,
      resolved: db.prepare('SELECT COUNT(*) as count FROM water_quality_tests WHERE status = ?').get('resolved').count,
    },
    repairReports: {
      total: db.prepare('SELECT COUNT(*) as count FROM repair_reports').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM repair_reports WHERE status = ?').get('pending').count,
      inProgress: db.prepare('SELECT COUNT(*) as count FROM repair_reports WHERE status IN (?, ?)').get('assigned', 'in_progress').count,
      completed: db.prepare('SELECT COUNT(*) as count FROM repair_reports WHERE status = ?').get('completed').count,
    },
    workOrders: {
      total: db.prepare('SELECT COUNT(*) as count FROM work_orders').get().count,
      pending: db.prepare('SELECT COUNT(*) as count FROM work_orders WHERE status = ?').get('pending').count,
      inProgress: db.prepare('SELECT COUNT(*) as count FROM work_orders WHERE status = ?').get('in_progress').count,
      completed: db.prepare('SELECT COUNT(*) as count FROM work_orders WHERE status = ?').get('completed').count,
    },
    teams: {
      total: db.prepare('SELECT COUNT(*) as count FROM repair_teams').get().count,
      available: db.prepare('SELECT COUNT(*) as count FROM repair_teams WHERE status = ?').get('available').count,
      busy: db.prepare('SELECT COUNT(*) as count FROM repair_teams WHERE status = ?').get('busy').count,
    },
    waterStops: {
      active: db.prepare('SELECT COUNT(*) as count FROM water_stop_notices WHERE status = ? AND published = 1').get('active').count,
    },
  };

  const recentReports = db.prepare(`
    SELECT * FROM repair_reports 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  const activeWaterStops = db.prepare(`
    SELECT * FROM water_stop_notices 
    WHERE status = 'active' AND published = 1
    ORDER BY created_at DESC
  `).all();

  const abnormalTests = db.prepare(`
    SELECT * FROM water_quality_tests 
    WHERE status IN ('abnormal', 'processing', 'rechecking')
    ORDER BY test_date DESC
  `).all();

  const teamWorkloads = db.prepare(`
    SELECT 
      t.id,
      t.name,
      t.status,
      COUNT(CASE WHEN w.status != 'completed' THEN 1 END) as active_orders
    FROM repair_teams t
    LEFT JOIN work_orders w ON t.id = w.team_id
    GROUP BY t.id, t.name, t.status
  `).all();

  return c.json({
    stats,
    recentReports,
    activeWaterStops,
    abnormalTests,
    teamWorkloads,
  });
});

export default app;
