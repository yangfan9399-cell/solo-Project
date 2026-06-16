import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'data', 'game.db');

const levels = [
  {
    id: 'level-1',
    title: '初遇',
    description: '男女主角在咖啡馆门口第一次相遇的经典场景',
    difficulty: 1,
    target_text: '在这个城市，每天都有无数次错过。\n而今天，我们相遇了。',
    scene_description: '咖啡馆门口，雨中，两人擦肩而过又同时停下脚步',
    duration: 6000,
    target_timing_start: 1500,
    target_timing_end: 5000,
    target_font_style: 'serif',
    target_font_size: 42,
    min_score: 50
  },
  {
    id: 'level-2',
    title: '追逐',
    description: '男主角在火车站台追赶即将离去的列车',
    difficulty: 2,
    target_text: '等等！\n我有话对你说……',
    scene_description: '火车站台，蒸汽弥漫，列车缓缓启动',
    duration: 5000,
    target_timing_start: 800,
    target_timing_end: 4200,
    target_font_style: 'serif-bold',
    target_font_size: 52,
    min_score: 60
  },
  {
    id: 'level-3',
    title: '告白',
    description: '月光下的深情告白场景',
    difficulty: 3,
    target_text: '从遇见你的那一刻起，\n我的世界就有了光。',
    scene_description: '月光下的花园，两人并肩而立，剪影唯美',
    duration: 7000,
    target_timing_start: 2000,
    target_timing_end: 5500,
    target_font_style: 'serif-italic',
    target_font_size: 46,
    min_score: 65
  },
  {
    id: 'level-4',
    title: '离别',
    description: '码头边的伤感离别场景',
    difficulty: 2,
    target_text: '我会等你回来的。\n不管多久。',
    scene_description: '码头，海风吹拂，汽笛声中两人挥手告别',
    duration: 6500,
    target_timing_start: 1800,
    target_timing_end: 5200,
    target_font_style: 'serif',
    target_font_size: 40,
    min_score: 60
  },
  {
    id: 'level-5',
    title: '重逢',
    description: '多年后在老地方意外重逢',
    difficulty: 3,
    target_text: '是你……\n真的是你吗？',
    scene_description: '老书店门口，阳光洒落，两人四目相对',
    duration: 7500,
    target_timing_start: 2500,
    target_timing_end: 6000,
    target_font_style: 'serif',
    target_font_size: 44,
    min_score: 70
  }
];

async function main() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  db.run('BEGIN TRANSACTION');

  for (const level of levels) {
    db.run(
      `INSERT OR REPLACE INTO levels 
       (id, title, description, difficulty, target_text, scene_description, duration, 
        target_timing_start, target_timing_end, target_font_style, target_font_size, min_score)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        level.id,
        level.title,
        level.description,
        level.difficulty,
        level.target_text,
        level.scene_description,
        level.duration,
        level.target_timing_start,
        level.target_timing_end,
        level.target_font_style,
        level.target_font_size,
        level.min_score
      ]
    );
  }
  console.log(`Inserted ${levels.length} levels`);

  db.run(
    'INSERT OR IGNORE INTO players (id, name, total_score, levels_completed) VALUES (?, ?, ?, ?)',
    ['player-local', '默剧大师', 0, 0]
  );
  console.log('Inserted default player');

  db.run('COMMIT');

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('Database seeded successfully');
  db.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
