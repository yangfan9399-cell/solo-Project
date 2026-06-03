import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { PORT } from './config.js';
import { updateOverdueStatus } from './utils.js';

import authRoutes from './routes/auth.js';
import equipmentRoutes from './routes/equipments.js';
import taskRoutes from './routes/tasks.js';
import reservationRoutes from './routes/reservations.js';
import mediaCardRoutes from './routes/mediaCards.js';
import damageReportRoutes from './routes/damageReports.js';
import overdueReminderRoutes from './routes/overdueReminders.js';
import userRoutes from './routes/users.js';
import dashboardRoutes from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.get('/api/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  });
});

app.route('/api/auth', authRoutes);
app.route('/api/equipments', equipmentRoutes);
app.route('/api/tasks', taskRoutes);
app.route('/api/reservations', reservationRoutes);
app.route('/api/media-cards', mediaCardRoutes);
app.route('/api/damage-reports', damageReportRoutes);
app.route('/api/overdue-reminders', overdueReminderRoutes);
app.route('/api/users', userRoutes);
app.route('/api/dashboard', dashboardRoutes);

app.notFound((c) => {
  return c.json({ success: false, error: '接口不存在' }, 404);
});

app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ success: false, error: '服务器内部错误' }, 500);
});

async function startServer() {
  console.log('Initializing database...');
  await initDatabase();
  console.log('Database initialized');
  
  console.log('Updating overdue status...');
  await updateOverdueStatus();
  console.log('Overdue status updated');

  setInterval(async () => {
    await updateOverdueStatus();
  }, 60 * 60 * 1000);

  console.log(`Server is running on http://localhost:${PORT}`);
  serve({
    fetch: app.fetch,
    port: PORT,
  });
}

startServer();

export default app;
