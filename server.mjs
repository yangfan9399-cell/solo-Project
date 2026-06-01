import { handler } from './dist/server/entry.mjs';
import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'visitor.db');

function getDb() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function checkAndProcessTimeouts() {
  const db = getDb();

  const timeoutAppointments = db.prepare(`
    SELECT a.id, a.visitor_name, a.visitee_id, a.expected_leave
    FROM appointments a
    WHERE a.status = 'checked_in'
      AND datetime(a.expected_leave) < datetime('now')
  `).all();

  let updatedCount = 0;
  let notifiedCount = 0;

  for (const apt of timeoutAppointments) {
    db.prepare(`UPDATE appointments SET status = 'timeout', updated_at = datetime('now') WHERE id = ?`)
      .run(apt.id);
    updatedCount++;

    const admins = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
    const notifyUserIds = [apt.visitee_id, ...admins.map(a => a.id)];

    for (const userId of notifyUserIds) {
      const existing = db.prepare(`
        SELECT id FROM notifications
        WHERE appointment_id = ?
          AND user_id = ?
          AND type = 'timeout'
          AND date(created_at) = date('now')
      `).get(apt.id, userId);

      if (!existing) {
        db.prepare(`
          INSERT INTO notifications (appointment_id, user_id, type, title, message)
          VALUES (?, ?, 'timeout', ?, ?)
        `).run(
          apt.id,
          userId,
          '访客超时未离园提醒',
          `${apt.visitor_name} 已超过预计离园时间 ${new Date(apt.expected_leave).toLocaleString('zh-CN')}，请及时联系访客确认安全`
        );
        notifiedCount++;
      }
    }
  }

  if (updatedCount > 0) {
    console.log(`[Timeout Checker] Processed ${updatedCount} timeout appointments, sent ${notifiedCount} notifications at ${new Date().toLocaleString('zh-CN')}`);
  }

  return { updatedCount, notifiedCount };
}

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(handler);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`[Timeout Checker] Scheduled to run every 60 seconds`);
});

setInterval(() => {
  try {
    checkAndProcessTimeouts();
  } catch (err) {
    console.error('[Timeout Checker] Error:', err);
  }
}, 60 * 1000);

checkAndProcessTimeouts();
