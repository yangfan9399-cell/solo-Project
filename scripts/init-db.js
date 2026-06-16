import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dbDir, 'game.db');

async function main() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  let db;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_score INTEGER DEFAULT 0,
      levels_completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS levels (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      difficulty INTEGER DEFAULT 1,
      target_text TEXT NOT NULL,
      scene_description TEXT,
      duration INTEGER DEFAULT 5000,
      target_timing_start INTEGER DEFAULT 1000,
      target_timing_end INTEGER DEFAULT 4000,
      target_font_style TEXT DEFAULT 'serif',
      target_font_size INTEGER DEFAULT 48,
      min_score INTEGER DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      level_id TEXT NOT NULL,
      status TEXT DEFAULT 'in_progress',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      final_score INTEGER,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (level_id) REFERENCES levels(id)
    );

    CREATE TABLE IF NOT EXISTS action_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      action_data TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS works (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      level_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      subtitle_text TEXT NOT NULL,
      font_style TEXT,
      font_size INTEGER,
      timing_start INTEGER,
      timing_end INTEGER,
      score INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (level_id) REFERENCES levels(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);
    CREATE INDEX IF NOT EXISTS idx_works_player ON works(player_id);
    CREATE INDEX IF NOT EXISTS idx_action_history_session ON action_history(session_id);
  `);

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('Database schema created successfully at', dbPath);
  db.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
