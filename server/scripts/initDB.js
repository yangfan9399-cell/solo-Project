import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

import db from '../config/database.js';

const initTables = () => {
  const migration = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('clerk', 'purchaser', 'manager', 'admin')),
      email TEXT,
      phone TEXT,
      avatar TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      level TEXT DEFAULT 'normal' CHECK(level IN ('normal', 'silver', 'gold', 'platinum')),
      balance REAL DEFAULT 0,
      total_deposit REAL DEFAULT 0,
      address TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      publish_date DATE,
      category TEXT,
      cover_image TEXT,
      description TEXT,
      price REAL NOT NULL,
      preorder_price REAL,
      deposit_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'discontinued')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS preorders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preorder_no TEXT UNIQUE NOT NULL,
      book_id INTEGER NOT NULL,
      member_id INTEGER NOT NULL,
      deposit_amount REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'arrived', 'reserved', 'picked', 'cancelled', 'refunded', 'expired')),
      expected_arrival DATE,
      actual_arrival_date DATETIME,
      pickup_deadline DATE,
      picked_at DATETIME,
      cancelled_at DATETIME,
      refunded_at DATETIME,
      note TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_no TEXT UNIQUE NOT NULL,
      supplier TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'partial', 'received', 'cancelled')),
      expected_date DATE,
      received_date DATETIME,
      note TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity_ordered INTEGER NOT NULL,
      quantity_received INTEGER DEFAULT 0,
      unit_price REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'received', 'cancelled')),
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL,
      location TEXT,
      quantity_available INTEGER DEFAULT 0,
      quantity_reserved INTEGER DEFAULT 0,
      last_restock_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(book_id, location)
    );

    CREATE TABLE IF NOT EXISTS sorting_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      po_item_id INTEGER NOT NULL,
      preorder_id INTEGER,
      book_id INTEGER NOT NULL,
      member_id INTEGER,
      quantity INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sorting', 'sorted', 'delivered', 'cancelled')),
      sorted_by INTEGER,
      sorted_at DATETIME,
      shelf_location TEXT,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (po_item_id) REFERENCES purchase_items(id),
      FOREIGN KEY (preorder_id) REFERENCES preorders(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (sorted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_no TEXT UNIQUE NOT NULL,
      member_id INTEGER NOT NULL,
      preorder_id INTEGER,
      type TEXT NOT NULL CHECK(type IN ('arrival', 'reminder', 'overdue', 'refund', 'system')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      channel TEXT DEFAULT 'sms' CHECK(channel IN ('sms', 'email', 'wechat', 'app')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed', 'read')),
      sent_at DATETIME,
      read_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (preorder_id) REFERENCES preorders(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tx_no TEXT UNIQUE NOT NULL,
      member_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('deposit', 'refund', 'recharge', 'payment', 'transfer', 'withdraw')),
      amount REAL NOT NULL,
      status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
      preorder_id INTEGER,
      payment_method TEXT DEFAULT 'cash' CHECK(payment_method IN ('cash', 'card', 'wechat', 'alipay', 'balance')),
      reference_no TEXT,
      note TEXT,
      processed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (preorder_id) REFERENCES preorders(id),
      FOREIGN KEY (processed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('damage', 'missing', 'wrong_book', 'quality', 'other')),
      preorder_id INTEGER,
      po_item_id INTEGER,
      book_id INTEGER,
      member_id INTEGER,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'open' CHECK(status IN ('open', 'processing', 'resolved', 'closed')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      resolution TEXT,
      reported_by INTEGER NOT NULL,
      handled_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (preorder_id) REFERENCES preorders(id),
      FOREIGN KEY (po_item_id) REFERENCES purchase_items(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (reported_by) REFERENCES users(id),
      FOREIGN KEY (handled_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_preorders_status ON preorders(status);
    CREATE INDEX IF NOT EXISTS idx_preorders_member ON preorders(member_id);
    CREATE INDEX IF NOT EXISTS idx_preorders_book ON preorders(book_id);
    CREATE INDEX IF NOT EXISTS idx_sorting_status ON sorting_tasks(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
    CREATE INDEX IF NOT EXISTS idx_transactions_member ON transactions(member_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
  `;

  db.exec(migration);
  console.log('Database tables initialized successfully.');
};

initTables();
db.close();
