import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import path from 'path';
import fs from 'fs';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

function getDbPath(): string {
  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'bookstore.db');
}

async function initSql(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file)
    });
  }
  return SQL;
}

export async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSql();
    const dbPath = getDbPath();
    
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath);
      db = new SQL.Database(data);
    } else {
      db = new SQL.Database();
      saveDb();
    }
  }
  return db;
}

function saveDb(): void {
  if (!db) return;
  const dbPath = getDbPath();
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export async function initDb(): Promise<void> {
  const database = await getDb();
  
  database.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publish_year INTEGER NOT NULL,
      condition TEXT NOT NULL CHECK(condition IN ('excellent', 'good', 'fair', 'poor')),
      condition_desc TEXT NOT NULL,
      has_inscription INTEGER NOT NULL DEFAULT 0,
      inscription TEXT,
      has_seal INTEGER NOT NULL DEFAULT 0,
      seal_name TEXT,
      seal_owner TEXT,
      is_rare INTEGER NOT NULL DEFAULT 0,
      rarity_level TEXT NOT NULL CHECK(rarity_level IN ('common', 'uncommon', 'rare', 'first_edition', 'out_of_print')),
      rarity_desc TEXT NOT NULL,
      base_price REAL NOT NULL,
      actual_value REAL NOT NULL,
      category TEXT NOT NULL,
      cover_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL,
      preferences TEXT NOT NULL,
      budget_min REAL NOT NULL,
      budget_max REAL NOT NULL,
      personality TEXT NOT NULL CHECK(personality IN ('casual', 'serious', 'collector', 'bargain_hunter')),
      tolerance REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      phase TEXT NOT NULL CHECK(phase IN ('created', 'inventory', 'pricing', 'reveal', 'customer_feedback', 'return_event', 'settled')),
      round_number INTEGER NOT NULL DEFAULT 0,
      total_score INTEGER NOT NULL DEFAULT 0,
      current_money REAL NOT NULL DEFAULT 1000,
      inventory_cost REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS blind_boxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      total_base_price REAL NOT NULL,
      total_actual_value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS blind_box_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      blind_box_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      FOREIGN KEY (blind_box_id) REFERENCES blind_boxes(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS main_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      blind_box_id INTEGER NOT NULL,
      player_price REAL,
      market_suggested_price REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'priced', 'sold', 'overstock', 'returned')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id),
      FOREIGN KEY (blind_box_id) REFERENCES blind_boxes(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS detail_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      condition TEXT NOT NULL,
      condition_desc TEXT NOT NULL,
      condition_weight REAL NOT NULL,
      has_inscription INTEGER NOT NULL,
      inscription_content TEXT,
      clue_revealed INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS history_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      has_seal INTEGER NOT NULL,
      seal_name TEXT,
      seal_owner TEXT,
      seal_provenance TEXT,
      seal_value_multiplier REAL NOT NULL,
      historical_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS result_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      is_rare INTEGER NOT NULL,
      rarity_level TEXT NOT NULL,
      rarity_desc TEXT NOT NULL,
      rarity_multiplier REAL NOT NULL,
      customer_preference TEXT NOT NULL,
      customer_preference_match INTEGER NOT NULL,
      preference_bonus REAL NOT NULL,
      final_value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS pricing_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      reaction TEXT NOT NULL CHECK(reaction IN ('delighted', 'satisfied', 'neutral', 'disappointed', 'angry')),
      feedback TEXT NOT NULL,
      purchased INTEGER NOT NULL,
      price_difference REAL NOT NULL,
      price_difference_percent REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS return_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      refund_amount REAL NOT NULL,
      damage_penalty REAL NOT NULL,
      impact_on_reputation REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS price_curve (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_record_id INTEGER NOT NULL,
      price REAL NOT NULL,
      demand REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_record_id) REFERENCES main_records(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      round_number INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('inventory', 'sale', 'return', 'refund', 'penalty', 'rollback')),
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      reference_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      rolled_back INTEGER NOT NULL DEFAULT 0,
      rollback_id INTEGER,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    );
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS seed_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      scenario_type TEXT NOT NULL,
      session_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  saveDb();
  console.log('Database initialized successfully');
}

export function saveDatabase(): void {
  saveDb();
}

export function closeDb(): void {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}
