import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || './data/bookstore.db';
const fullDbPath = path.resolve(__dirname, '../../', dbPath);

let db;

try {
  db = new Database(fullDbPath, { verbose: null });
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
} catch (error) {
  console.error('Failed to connect to database:', error.message);
  process.exit(1);
}

export default db;
