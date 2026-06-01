import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { initDatabase } from './db.js';
import usersRoute from './routes/users.js';
import locationsRoute from './routes/locations.js';
import repairTeamsRoute from './routes/repairTeams.js';
import waterQualityRoute from './routes/waterQuality.js';
import repairReportsRoute from './routes/repairReports.js';
import workOrdersRoute from './routes/workOrders.js';
import waterStopNoticesRoute from './routes/waterStopNotices.js';
import notificationsRoute from './routes/notifications.js';
import dashboardRoute from './routes/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/api/users', usersRoute);
app.route('/api/locations', locationsRoute);
app.route('/api/repair-teams', repairTeamsRoute);
app.route('/api/water-quality', waterQualityRoute);
app.route('/api/repair-reports', repairReportsRoute);
app.route('/api/work-orders', workOrdersRoute);
app.route('/api/water-stop-notices', waterStopNoticesRoute);
app.route('/api/notifications', notificationsRoute);
app.route('/api/dashboard', dashboardRoute);

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'Water Quality Management System API is running' });
});

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use('/*', serveStatic({ root: clientDist }));
  app.get('*', (c) => {
    return c.body(fs.readFileSync(path.join(clientDist, 'index.html')));
  });
}

const port = parseInt(process.env.PORT || '3000');
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
