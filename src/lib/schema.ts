import { exec } from './db';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  levels_completed INTEGER NOT NULL DEFAULT 0,
  total_pieces_placed INTEGER NOT NULL DEFAULT 0,
  perfect_repairs INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'master')),
  grid_rows INTEGER NOT NULL,
  grid_cols INTEGER NOT NULL,
  layers INTEGER NOT NULL DEFAULT 1,
  time_limit INTEGER NOT NULL,
  base_score INTEGER NOT NULL,
  era TEXT NOT NULL,
  location TEXT NOT NULL,
  pattern_type TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS puzzle_pieces (
  id TEXT PRIMARY KEY,
  level_id INTEGER NOT NULL,
  row INTEGER NOT NULL,
  col INTEGER NOT NULL,
  layer INTEGER NOT NULL DEFAULT 0,
  group_id TEXT NOT NULL,
  pattern_data TEXT NOT NULL,
  base_rotation INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pieces_level ON puzzle_pieces(level_id);
CREATE INDEX IF NOT EXISTS idx_pieces_group ON puzzle_pieces(group_id);

CREATE TABLE IF NOT EXISTS cracks (
  id TEXT PRIMARY KEY,
  level_id INTEGER NOT NULL,
  piece_id_a TEXT NOT NULL,
  piece_id_b TEXT NOT NULL,
  points TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL CHECK (type IN ('edge', 'corner', 'diagonal')),
  FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE,
  FOREIGN KEY (piece_id_a) REFERENCES puzzle_pieces(id) ON DELETE CASCADE,
  FOREIGN KEY (piece_id_b) REFERENCES puzzle_pieces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cracks_level ON cracks(level_id);

CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'abandoned')),
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  current_score INTEGER NOT NULL DEFAULT 0,
  stability REAL NOT NULL DEFAULT 0,
  pieces_placed INTEGER NOT NULL DEFAULT 0,
  hints_used INTEGER NOT NULL DEFAULT 0,
  undos_used INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (level_id) REFERENCES levels(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_level ON game_sessions(level_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);

CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('place', 'remove', 'rotate', 'group', 'ungroup')),
  piece_id TEXT NOT NULL,
  before_state TEXT NOT NULL,
  after_state TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ops_session ON operations(session_id);
CREATE INDEX IF NOT EXISTS idx_ops_sequence ON operations(session_id, sequence);

CREATE TABLE IF NOT EXISTS score_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  final_score INTEGER NOT NULL,
  accuracy_bonus INTEGER NOT NULL DEFAULT 0,
  speed_bonus INTEGER NOT NULL DEFAULT 0,
  stability_bonus INTEGER NOT NULL DEFAULT 0,
  layer_bonus INTEGER NOT NULL DEFAULT 0,
  deduction INTEGER NOT NULL DEFAULT 0,
  rank TEXT NOT NULL CHECK (rank IN ('S', 'A', 'B', 'C', 'D')),
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (level_id) REFERENCES levels(id)
);

CREATE INDEX IF NOT EXISTS idx_scores_player ON score_records(player_id);
CREATE INDEX IF NOT EXISTS idx_scores_level ON score_records(level_id);
CREATE INDEX IF NOT EXISTS idx_scores_score ON score_records(final_score DESC);

CREATE TABLE IF NOT EXISTS repair_reports (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  level_id INTEGER NOT NULL,
  overall_condition REAL NOT NULL,
  cracks_repaired INTEGER NOT NULL,
  cracks_remaining INTEGER NOT NULL,
  piece_integrity REAL NOT NULL,
  alignment_accuracy REAL NOT NULL,
  stability_index REAL NOT NULL,
  historical_value REAL NOT NULL,
  comment TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY (level_id) REFERENCES levels(id)
);

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
`;

export function initSchema(): void {
  exec(SCHEMA_SQL);
  console.log('Database schema initialized successfully.');
}
