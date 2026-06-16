import { getDb, saveDb, closeDb, getAll, getOne } from "./db";
import type { Level, GroundTruthDefect } from "./db";

const LEVELS: Omit<Level, "id">[] = [
  {
    name: "初检训练 — 单一缺陷识别",
    description: "学习识别晶圆表面最基本的缺陷类型。仅包含一种缺陷，适合新手入门。",
    difficulty: 1,
    wafer_image_config: JSON.stringify({ gridCols: 6, gridRows: 6, cellSize: 80 }),
    defect_types: JSON.stringify(["scratch"]),
    target_precision: 0.6,
    target_recall: 0.5,
    time_limit_seconds: 120,
    order_index: 1,
  },
  {
    name: "颗粒探测 — 显微颗粒判定",
    description: "在晶圆显微图中识别散布的微小颗粒缺陷，需要细致观察力。",
    difficulty: 2,
    wafer_image_config: JSON.stringify({ gridCols: 8, gridRows: 8, cellSize: 60 }),
    defect_types: JSON.stringify(["particle"]),
    target_precision: 0.6,
    target_recall: 0.5,
    time_limit_seconds: 120,
    order_index: 2,
  },
  {
    name: "边缘守卫 — 边缘缺陷检测",
    description: "检测晶圆边缘区域的裂纹和缺口，边缘缺陷是良率杀手。",
    difficulty: 2,
    wafer_image_config: JSON.stringify({ gridCols: 8, gridRows: 8, cellSize: 60 }),
    defect_types: JSON.stringify(["edge"]),
    target_precision: 0.6,
    target_recall: 0.5,
    time_limit_seconds: 120,
    order_index: 3,
  },
  {
    name: "混合判读 — 双缺陷叠加",
    description: "两种缺陷类型同时出现，需要准确区分划伤与颗粒。",
    difficulty: 3,
    wafer_image_config: JSON.stringify({ gridCols: 10, gridRows: 10, cellSize: 50 }),
    defect_types: JSON.stringify(["scratch", "particle"]),
    target_precision: 0.65,
    target_recall: 0.55,
    time_limit_seconds: 150,
    order_index: 4,
  },
  {
    name: "全面扫描 — 三类缺陷混战",
    description: "划伤、颗粒、边缘缺陷三合一，这是真正的晶圆工程师考验。",
    difficulty: 4,
    wafer_image_config: JSON.stringify({ gridCols: 10, gridRows: 10, cellSize: 50 }),
    defect_types: JSON.stringify(["scratch", "particle", "edge"]),
    target_precision: 0.7,
    target_recall: 0.6,
    time_limit_seconds: 180,
    order_index: 5,
  },
  {
    name: "良率保卫战 — 高密度缺陷",
    description: "高密度缺陷图像，在众多缺陷中精准标注每一处，误判代价极高。",
    difficulty: 5,
    wafer_image_config: JSON.stringify({ gridCols: 12, gridRows: 12, cellSize: 45 }),
    defect_types: JSON.stringify(["scratch", "particle", "edge"]),
    target_precision: 0.75,
    target_recall: 0.65,
    time_limit_seconds: 180,
    order_index: 6,
  },
  {
    name: "专家认证 — 极限精度挑战",
    description: "最终认证关卡，要求同时达到高精度和高召回率，成为顶级扫描工程师。",
    difficulty: 6,
    wafer_image_config: JSON.stringify({ gridCols: 12, gridRows: 12, cellSize: 45 }),
    defect_types: JSON.stringify(["scratch", "particle", "edge"]),
    target_precision: 0.8,
    target_recall: 0.7,
    time_limit_seconds: 210,
    order_index: 7,
  },
];

function seedRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateDefectsForLevel(level: Level, imageIndex: number): GroundTruthDefect[] {
  const defectTypes: string[] = JSON.parse(level.defect_types);
  const config = JSON.parse(level.wafer_image_config);
  const defects: GroundTruthDefect[] = [];
  const rng = seedRandom(level.id * 1000 + imageIndex);

  const defectCount = 3 + Math.floor(rng() * (level.difficulty * 2));
  for (let i = 0; i < defectCount; i++) {
    const type = defectTypes[Math.floor(rng() * defectTypes.length)] as "scratch" | "particle" | "edge";
    const cellX = Math.floor(rng() * config.gridCols);
    const cellY = Math.floor(rng() * config.gridRows);
    const baseSize = config.cellSize;

    let w: number, h: number;
    if (type === "scratch") {
      w = baseSize * (0.8 + rng() * 1.2);
      h = baseSize * (0.15 + rng() * 0.2);
    } else if (type === "particle") {
      const size = baseSize * (0.2 + rng() * 0.3);
      w = size;
      h = size;
    } else {
      w = baseSize * (0.3 + rng() * 0.5);
      h = baseSize * (0.5 + rng() * 0.8);
    }

    const labels: Record<string, string[]> = {
      scratch: ["线状划伤", "弧形划伤", "深划伤", "浅划伤", "交叉划伤"],
      particle: ["球形颗粒", "不规则颗粒", "金属颗粒", "有机颗粒", "微尘"],
      edge: ["边缘裂纹", "边缘缺口", "边缘剥落", "边缘毛刺", "边缘污染"],
    };

    defects.push({
      type,
      x: cellX * baseSize + rng() * (baseSize - w),
      y: cellY * baseSize + rng() * (baseSize - h),
      width: Math.max(10, w),
      height: Math.max(5, h),
      label: labels[type][Math.floor(rng() * labels[type].length)],
    });
  }

  return defects;
}

async function initDatabase() {
  const db = await getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      total_score INTEGER NOT NULL DEFAULT 0,
      levels_completed INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      difficulty INTEGER NOT NULL,
      wafer_image_config TEXT NOT NULL,
      defect_types TEXT NOT NULL,
      target_precision REAL NOT NULL,
      target_recall REAL NOT NULL,
      time_limit_seconds INTEGER NOT NULL,
      order_index INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS wafer_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level_id INTEGER NOT NULL REFERENCES levels(id),
      image_data TEXT NOT NULL,
      defects_json TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id),
      level_id INTEGER NOT NULL REFERENCES levels(id),
      status TEXT NOT NULL CHECK(status IN ('in_progress', 'completed', 'failed')),
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      score INTEGER,
      annotations_json TEXT NOT NULL DEFAULT '[]',
      confusion_matrix_json TEXT,
      training_set_json TEXT,
      elapsed_seconds INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS operation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES game_sessions(id),
      operation_type TEXT NOT NULL CHECK(operation_type IN ('add', 'remove', 'modify')),
      annotation_before_json TEXT,
      annotation_after_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  saveDb(db);

  const existingLevels = getOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM levels");
  if (!existingLevels || existingLevels.count === 0) {
    for (const level of LEVELS) {
      const config = JSON.parse(level.wafer_image_config);
      db.run(
        `INSERT INTO levels (name, description, difficulty, wafer_image_config, defect_types, target_precision, target_recall, time_limit_seconds, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [level.name, level.description, level.difficulty, level.wafer_image_config, level.defect_types, level.target_precision, level.target_recall, level.time_limit_seconds, level.order_index]
      );

      const row = getOne<{ id: number }>(db, "SELECT last_insert_rowid() as id");
      const levelId = row?.id ?? 1;

      const imageCount = 3 + level.difficulty;
      for (let i = 0; i < imageCount; i++) {
        const defects = generateDefectsForLevel({ ...level, id: levelId } as Level, i);
        const width = config.gridCols * config.cellSize;
        const height = config.gridRows * config.cellSize;

        const gridCells: string[] = [];
        for (let r = 0; r < config.gridRows; r++) {
          for (let c = 0; c < config.gridCols; c++) {
            gridCells.push(`${c},${r}`);
          }
        }

        db.run(
          `INSERT INTO wafer_images (level_id, image_data, defects_json, width, height) VALUES (?, ?, ?, ?, ?)`,
          [levelId, JSON.stringify({ gridCols: config.gridCols, gridRows: config.gridRows, cellSize: config.cellSize, gridCells }), JSON.stringify(defects), width, height]
        );
      }

      saveDb(db);
    }

    db.run(`INSERT OR IGNORE INTO players (name) VALUES ('默认工程师')`);
    saveDb(db);
    console.log("Database initialized with levels and wafer images.");
  } else {
    console.log("Database already initialized, skipping seed.");
  }

  closeDb();
}

initDatabase().catch(console.error);
