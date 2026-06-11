import { db } from './index';
import { seedDatabase } from './seed';
import { users, customers, orders, proofs, orderHistory } from './schema';

let initialized = false;

export async function initDatabase() {
  if (initialized) return;

  try {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_no TEXT NOT NULL UNIQUE,
        customer_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        paper_type TEXT NOT NULL,
        paper_weight TEXT,
        size TEXT NOT NULL,
        craft TEXT NOT NULL,
        color_mode TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        delivery_date TEXT NOT NULL,
        original_delivery_date TEXT,
        sales_id INTEGER NOT NULL,
        designer_id INTEGER,
        reject_reason TEXT,
        reject_remark TEXT,
        return_reason TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (sales_id) REFERENCES users(id),
        FOREIGN KEY (designer_id) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS proofs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        image_url TEXT NOT NULL,
        remark TEXT,
        uploaded_by INTEGER NOT NULL,
        color_deviation TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS order_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        operator_id INTEGER,
        operator_name TEXT NOT NULL,
        remark TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )
    `);

    await seedDatabase();
    initialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}
