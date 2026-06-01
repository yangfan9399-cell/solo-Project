import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'visitor.db');

function seed() {
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee','security','admin')),
      department TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_type TEXT NOT NULL DEFAULT '身份证',
      id_number TEXT NOT NULL,
      company TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_id INTEGER NOT NULL REFERENCES visitors(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visitor_name TEXT NOT NULL,
      visitor_phone TEXT NOT NULL,
      visitor_id_type TEXT NOT NULL DEFAULT '身份证',
      visitor_id_number TEXT NOT NULL,
      visitor_company TEXT,
      visitee_id INTEGER NOT NULL REFERENCES users(id),
      purpose TEXT NOT NULL,
      expected_arrival TEXT NOT NULL,
      expected_leave TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending','approved','rejected','checked_in','checked_out','timeout','cancelled')),
      notes TEXT,
      approved_by INTEGER REFERENCES users(id),
      approved_at TEXT,
      rejected_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER NOT NULL REFERENCES appointments(id),
      check_in_time TEXT,
      check_out_time TEXT,
      verified_by INTEGER REFERENCES users(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER REFERENCES appointments(id),
      user_id INTEGER REFERENCES users(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    CREATE INDEX IF NOT EXISTS idx_appointments_visitee ON appointments(visitee_id);
    CREATE INDEX IF NOT EXISTS idx_blacklist_visitor ON blacklist(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  `);

  const userCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  if (userCount > 0) {
    console.log('Database already seeded, skipping...');
    db.close();
    return;
  }

  const insertUser = db.prepare(
    `INSERT INTO users (name, role, department, phone, email) VALUES (?, ?, ?, ?, ?)`
  );

  const users = [
    insertUser.run('张伟', 'admin', '行政部', '13800000001', 'zhangwei@park.com'),
    insertUser.run('李娜', 'employee', '研发部', '13800000002', 'lina@park.com'),
    insertUser.run('王强', 'employee', '市场部', '13800000003', 'wangqiang@park.com'),
    insertUser.run('赵敏', 'employee', '财务部', '13800000004', 'zhaomin@park.com'),
    insertUser.run('陈浩', 'security', '安保部', '13800000005', 'chenhao@park.com'),
    insertUser.run('刘洋', 'security', '安保部', '13800000006', 'liuyang@park.com'),
    insertUser.run('孙芳', 'employee', '人力资源部', '13800000007', 'sunfang@park.com'),
    insertUser.run('周杰', 'employee', '研发部', '13800000008', 'zhoujie@park.com'),
  ];

  const insertVisitor = db.prepare(
    `INSERT INTO visitors (name, phone, id_type, id_number, company) VALUES (?, ?, ?, ?, ?)`
  );

  const visitors = [
    insertVisitor.run('马超', '13900000001', '身份证', '110101199001011234', '外部科技公司'),
    insertVisitor.run('黄忠', '13900000002', '身份证', '310101198512052345', '供应商联盟'),
    insertVisitor.run('貂蝉', '13900000003', '护照', 'E12345678', '海外咨询公司'),
    insertVisitor.run('吕布', '13900000004', '身份证', '440101199203154567', '独立顾问'),
    insertVisitor.run('曹操', '13900000005', '身份证', '320101198807206789', '竞争对手公司'),
    insertVisitor.run('诸葛亮', '13900000006', '身份证', '510101199505098901', '智慧咨询集团'),
  ];

  const insertBlacklist = db.prepare(
    `INSERT INTO blacklist (visitor_id, reason, created_by) VALUES (?, ?, ?)`
  );

  insertBlacklist.run(visitors[4].lastInsertRowid, '多次违反园区规定，强行闯入', 1);

  const insertAppointment = db.prepare(
    `INSERT INTO appointments (visitor_name, visitor_phone, visitor_id_type, visitor_id_number,
      visitor_company, visitee_id, purpose, expected_arrival, expected_leave, status, notes, approved_by, approved_at, rejected_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  const appointments = [
    insertAppointment.run(
      '马超', '13900000001', '身份证', '110101199001011234', '外部科技公司',
      2, '技术方案交流', `${today}T09:00:00`, `${today}T11:00:00`,
      'checked_out', '携带笔记本电脑', 2, `${today}T08:30:00`, null
    ),
    insertAppointment.run(
      '黄忠', '13900000002', '身份证', '310101198512052345', '供应商联盟',
      3, '供应商年度评审', `${today}T14:00:00`, `${today}T16:00:00`,
      'checked_in', '需要会议室', 3, `${today}T13:50:00`, null
    ),
    insertAppointment.run(
      '貂蝉', '13900000003', '护照', 'E12345678', '海外咨询公司',
      4, '国际合作咨询', `${today}T10:00:00`, `${today}T12:00:00`,
      'approved', '外籍访客，需英文接待', 4, `${today}T09:45:00`, null
    ),
    insertAppointment.run(
      '吕布', '13900000004', '身份证', '440101199203154567', '独立顾问',
      7, '人力资源咨询', `${today}T15:00:00`, `${today}T17:00:00`,
      'pending', null, null, null, null
    ),
    insertAppointment.run(
      '诸葛亮', '13900000006', '身份证', '510101199505098901', '智慧咨询集团',
      8, '技术架构评审', `${today}T09:30:00`, `${today}T11:30:00`,
      'rejected', '已有安排', null, null, '本周技术评审已取消'
    ),
    insertAppointment.run(
      '马超', '13900000001', '身份证', '110101199001011234', '外部科技公司',
      2, '项目进度汇报', `${today}T14:00:00`, `${today}T15:30:00`,
      'timeout', null, 2, `${today}T13:55:00`, null
    ),
  ];

  const insertCheckin = db.prepare(
    `INSERT INTO checkins (appointment_id, check_in_time, check_out_time, verified_by, notes)
    VALUES (?, ?, ?, ?, ?)`
  );

  insertCheckin.run(appointments[0].lastInsertRowid, `${today}T08:55:00`, `${today}T10:45:00`, 5, '证件核实通过');
  insertCheckin.run(appointments[1].lastInsertRowid, `${today}T13:58:00`, null, 6, '已签到，等待离园签退');
  insertCheckin.run(appointments[5].lastInsertRowid, `${today}T13:50:00`, null, 5, '已签到但超时未离园');

  const insertNotification = db.prepare(
    `INSERT INTO notifications (appointment_id, user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?, ?)`
  );

  insertNotification.run(appointments[3].lastInsertRowid, 7, 'approval', '新访客预约待审批', '吕布 申请来访，事由：人力资源咨询', 0);
  insertNotification.run(appointments[5].lastInsertRowid, 2, 'timeout', '访客超时未离园', '马超 已超过预约离园时间，请关注', 0);
  insertNotification.run(appointments[5].lastInsertRowid, 1, 'timeout', '超时未离园提醒', '访客马超（预约单 #6）已超时未离园', 0);

  console.log('✅ Seed data inserted successfully!');
  console.log(`  Users: ${users.length}`);
  console.log(`  Visitors: ${visitors.length}`);
  console.log(`  Appointments: ${appointments.length}`);
  console.log(`  Blacklist entries: 1`);

  db.close();
}

seed();
