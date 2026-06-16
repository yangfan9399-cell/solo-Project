import initSqlJs, { Database } from "sql.js";
import path from "path";
import fs from "fs";

let dbInstance: Database | null = null;
let dbFilePath: string = "";
let saveTimeoutId: ReturnType<typeof setTimeout> | null = null;

function resolveWasmPath(): string {
  return path.join(process.cwd(), "node_modules", "sql.js", "dist", "sql-wasm.wasm");
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dataDir = path.join(process.cwd(), "data");
  dbFilePath = path.join(dataDir, "game.db");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const isNewDb = !fs.existsSync(dbFilePath);

  const wasmPath = resolveWasmPath();
  const wasmBuffer = fs.readFileSync(wasmPath);
  const wasmArrayBuffer = wasmBuffer.buffer.slice(
    wasmBuffer.byteOffset,
    wasmBuffer.byteOffset + wasmBuffer.byteLength
  );
  const SQL = await initSqlJs({ wasmBinary: wasmArrayBuffer });

  if (!isNewDb) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch {
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  dbInstance.run("PRAGMA journal_mode = WAL");
  dbInstance.run("PRAGMA foreign_keys = ON");

  if (isNewDb) {
    initializeSchema(dbInstance);
    seedData(dbInstance);
    saveDatabase();
  }

  return dbInstance;
}

function saveDatabase() {
  if (!dbInstance || !dbFilePath) return;

  if (saveTimeoutId) {
    clearTimeout(saveTimeoutId);
  }

  saveTimeoutId = setTimeout(() => {
    try {
      const data = dbInstance!.export();
      fs.writeFileSync(dbFilePath, Buffer.from(data));
    } catch (e) {
      console.error("Failed to save database:", e);
    }
  }, 100);
}

export function runQuery(sql: string, params: unknown[] = []): unknown[] {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }

  const results = dbInstance.exec(sql, params as never);
  if (results.length === 0) return [];

  const result = results[0];
  const columns = result.columns;
  const rows = result.values;

  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

export function runInsert(sql: string, params: unknown[] = []): number {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }

  dbInstance.run(sql, params as never);
  saveDatabase();

  const result = dbInstance.exec("SELECT last_insert_rowid() as id");
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number;
  }
  return 0;
}

export function runUpdate(sql: string, params: unknown[] = []): void {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }

  dbInstance.run(sql, params as never);
  saveDatabase();
}

function initializeSchema(database: Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      total_score INTEGER DEFAULT 0,
      levels_completed INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      span INTEGER NOT NULL,
      max_paper_length INTEGER NOT NULL,
      paper_width INTEGER NOT NULL,
      paper_thickness REAL NOT NULL,
      paper_strength REAL NOT NULL,
      target_weight INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      left_anchor_x INTEGER NOT NULL,
      left_anchor_y INTEGER NOT NULL,
      right_anchor_x INTEGER NOT NULL,
      right_anchor_y INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      level_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      bridge_data TEXT,
      max_weight_held INTEGER DEFAULT 0,
      break_point_x INTEGER,
      break_point_y INTEGER,
      break_segment_id TEXT,
      score INTEGER DEFAULT 0,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      operation_history TEXT,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (level_id) REFERENCES levels(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      level_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      max_weight INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id)
    );

    CREATE TABLE IF NOT EXISTS shared_bridges (
      id TEXT PRIMARY KEY,
      bridge_data TEXT NOT NULL,
      level_id INTEGER NOT NULL,
      max_weight INTEGER NOT NULL,
      score INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (level_id) REFERENCES levels(id)
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_level ON game_sessions(level_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_level ON leaderboard(level_id);
    CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
  `);
}

function seedData(database: Database) {
  const levels = [
    {
      id: 1,
      name: "初试身手",
      description: "用一张A4纸，跨越15厘米的距离，看看能承载多少硬币。",
      span: 150,
      maxPaperLength: 297,
      paperWidth: 21,
      paperThickness: 0.1,
      paperStrength: 15,
      targetWeight: 50,
      difficulty: "easy",
      leftAnchor: { x: 50, y: 200 },
      rightAnchor: { x: 200, y: 200 },
    },
    {
      id: 2,
      name: "峡谷之桥",
      description: "更宽的峡谷，需要更巧妙的折法。试试瓦楞纸结构？",
      span: 220,
      maxPaperLength: 297,
      paperWidth: 21,
      paperThickness: 0.1,
      paperStrength: 15,
      targetWeight: 80,
      difficulty: "medium",
      leftAnchor: { x: 40, y: 200 },
      rightAnchor: { x: 260, y: 200 },
    },
    {
      id: 3,
      name: "天堑通途",
      description: "终极挑战！25厘米的跨度，目标是150克的承重。",
      span: 250,
      maxPaperLength: 297,
      paperWidth: 21,
      paperThickness: 0.1,
      paperStrength: 15,
      targetWeight: 150,
      difficulty: "hard",
      leftAnchor: { x: 30, y: 200 },
      rightAnchor: { x: 280, y: 200 },
    },
    {
      id: 4,
      name: "材料受限",
      description: "只有半张纸，但跨度不大。精打细算每一寸纸！",
      span: 120,
      maxPaperLength: 150,
      paperWidth: 21,
      paperThickness: 0.1,
      paperStrength: 15,
      targetWeight: 60,
      difficulty: "medium",
      leftAnchor: { x: 70, y: 200 },
      rightAnchor: { x: 190, y: 200 },
    },
    {
      id: 5,
      name: "拱桥之美",
      description: "尝试建造一座拱桥，利用拱形分散重量。",
      span: 200,
      maxPaperLength: 297,
      paperWidth: 21,
      paperThickness: 0.1,
      paperStrength: 18,
      targetWeight: 120,
      difficulty: "hard",
      leftAnchor: { x: 50, y: 220 },
      rightAnchor: { x: 250, y: 220 },
    },
  ];

  const insertLevel = database.prepare(
    `INSERT OR IGNORE INTO levels
     (id, name, description, span, max_paper_length, paper_width, paper_thickness, paper_strength,
      target_weight, difficulty, left_anchor_x, left_anchor_y, right_anchor_x, right_anchor_y)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const lvl of levels) {
    insertLevel.run([
      lvl.id,
      lvl.name,
      lvl.description,
      lvl.span,
      lvl.maxPaperLength,
      lvl.paperWidth,
      lvl.paperThickness,
      lvl.paperStrength,
      lvl.targetWeight,
      lvl.difficulty,
      lvl.leftAnchor.x,
      lvl.leftAnchor.y,
      lvl.rightAnchor.x,
      lvl.rightAnchor.y,
    ]);
  }

  database.run(
    `INSERT OR IGNORE INTO players (id, name, total_score, levels_completed, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    ["local-player", "折纸大师", 0, 0, Date.now()]
  );

  const insertLeaderboard = database.prepare(
    `INSERT INTO leaderboard (player_name, level_id, score, max_weight, created_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  const entries = [
    { name: "桥梁大师", levelId: 1, score: 950, weight: 95 },
    { name: "纸艺达人", levelId: 1, score: 780, weight: 78 },
    { name: "结构工程师", levelId: 1, score: 620, weight: 62 },
    { name: "桥梁大师", levelId: 2, score: 1200, weight: 120 },
    { name: "折纸高手", levelId: 2, score: 980, weight: 98 },
    { name: "纸艺达人", levelId: 3, score: 1800, weight: 180 },
  ];

  for (const e of entries) {
    insertLeaderboard.run([
      e.name,
      e.levelId,
      e.score,
      e.weight,
      Date.now() - Math.random() * 86400000,
    ]);
  }
}

export async function resetDb() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  if (fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
  }
}
