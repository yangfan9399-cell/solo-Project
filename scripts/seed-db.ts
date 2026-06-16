import { initDb, closeDb } from '../src/lib/db';
import {
  getAllPlayers,
  createPlayer,
  getAllLevels,
  getPlayerByName,
} from '../src/lib/repositories';
import type { Player, Level } from '../src/types/game';

async function main() {
  console.log('正在填充种子数据...');

  await initDb();

  const seedPlayers: Omit<Player, 'id' | 'created_at' | 'updated_at'>[] = [
    { name: '指挥官_星辰', avatar: '👨‍🚀', total_score: 15800, games_played: 42, games_won: 35 },
    { name: '工程师_露娜', avatar: '👩‍🚀', total_score: 12400, games_played: 31, games_won: 24 },
    { name: '飞行员_火星', avatar: '🧑‍🚀', total_score: 9800, games_played: 25, games_won: 17 },
    { name: '导航员_银河', avatar: '👨‍🔬', total_score: 7200, games_played: 19, games_won: 11 },
  ];

  const existingPlayers = await getAllPlayers();
  if (existingPlayers.length === 0) {
    for (const p of seedPlayers) {
      await createPlayer(p.name, p.avatar);
    }
    console.log(`已插入 ${seedPlayers.length} 个玩家数据`);
  } else {
    console.log(`玩家表已有数据 (${existingPlayers.length})，跳过`);
  }

  const seedLevels: Omit<Level, 'id' | 'created_at'>[] = [
    {
      name: '第一关：近地轨道训练',
      description: '新手训练关卡，熟悉基本操作。将电梯平稳送到第10层。',
      difficulty: 1,
      target_floor: 10,
      initial_energy: 150,
      max_energy: 150,
      balance_threshold: 30.0,
      time_limit: 300,
      base_score: 1000,
    },
    {
      name: '第二关：同步轨道运输',
      description: '中等难度，能量窗口缩短。将电梯送到第25层。',
      difficulty: 2,
      target_floor: 25,
      initial_energy: 200,
      max_energy: 200,
      balance_threshold: 20.0,
      time_limit: 240,
      base_score: 2500,
    },
    {
      name: '第三关：月球基地补给',
      description: '困难模式，平衡要求严格。将电梯送到第50层。',
      difficulty: 3,
      target_floor: 50,
      initial_energy: 250,
      max_energy: 250,
      balance_threshold: 15.0,
      time_limit: 180,
      base_score: 5000,
    },
    {
      name: '第四关：火星殖民先锋',
      description: '专家级挑战，多重限制。将电梯送到第100层。',
      difficulty: 4,
      target_floor: 100,
      initial_energy: 300,
      max_energy: 300,
      balance_threshold: 10.0,
      time_limit: 120,
      base_score: 10000,
    },
  ];

  const existingLevels = await getAllLevels();
  if (existingLevels.length === 0) {
    const db = await initDb();
    const insertLevel = db.prepare(`
      INSERT INTO levels (name, description, difficulty, target_floor, initial_energy, max_energy, balance_threshold, time_limit, base_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of seedLevels) {
      insertLevel.run([
        l.name,
        l.description,
        l.difficulty,
        l.target_floor,
        l.initial_energy,
        l.max_energy,
        l.balance_threshold,
        l.time_limit,
        l.base_score,
      ]);
    }
    const { persistDb } = await import('../src/lib/db');
    persistDb();
    console.log(`已插入 ${seedLevels.length} 个关卡数据`);
  } else {
    console.log(`关卡表已有数据 (${existingLevels.length})，跳过`);
  }

  closeDb();
  console.log('种子数据填充完成!');
}

main().catch(console.error);
