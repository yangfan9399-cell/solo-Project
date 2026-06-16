import { initDB, readDB, writeDB } from "./db.server";
import {
  createPlayer,
  createSession,
  insertExhibitDef,
  insertLevel,
  completeSession,
  addOperation,
  updateSessionState,
  updateSessionScore,
  getAllLevels,
  getAllPlayers,
  getAllExhibitDefs,
} from "./repo.server";
import type { ExhibitDef, LevelConfig } from "./types";

const exhibits: ExhibitDef[] = [
  {
    id: "paint-mona",
    type: "painting",
    name: "古典油画",
    lightMin: 30,
    lightMax: 60,
    sensitivity: 1.2,
    size: { w: 2, h: 2 },
  },
  {
    id: "sculpt-bust",
    type: "sculpture",
    name: "大理石雕塑",
    lightMin: 40,
    lightMax: 80,
    sensitivity: 0.8,
    size: { w: 2, h: 2 },
  },
  {
    id: "relic-vase",
    type: "relic",
    name: "古代瓷瓶",
    lightMin: 20,
    lightMax: 45,
    sensitivity: 1.5,
    size: { w: 1, h: 2 },
  },
  {
    id: "photo-bw",
    type: "photograph",
    name: "历史照片",
    lightMin: 15,
    lightMax: 35,
    sensitivity: 1.8,
    size: { w: 2, h: 1 },
  },
  {
    id: "paint-water",
    type: "painting",
    name: "水彩画",
    lightMin: 20,
    lightMax: 40,
    sensitivity: 1.6,
    size: { w: 2, h: 2 },
  },
  {
    id: "relic-scroll",
    type: "relic",
    name: "古卷轴",
    lightMin: 10,
    lightMax: 25,
    sensitivity: 2.0,
    size: { w: 3, h: 1 },
  },
];

function makePath1(): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  for (let x = 0; x < 10; x++) path.push({ x, y: 2 });
  for (let y = 2; y < 6; y++) path.push({ x: 9, y });
  for (let x = 9; x >= 0; x--) path.push({ x, y: 6 });
  return path;
}

function makePath2(): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  for (let y = 1; y < 8; y++) path.push({ x: 1, y });
  for (let x = 1; x < 9; x++) path.push({ x, y: 4 });
  for (let y = 4; y < 8; y++) path.push({ x: 8, y });
  return path;
}

function makePath3(): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  for (let x = 0; x < 12; x++) path.push({ x, y: 1 });
  for (let y = 1; y < 5; y++) path.push({ x: 11, y });
  for (let x = 11; x >= 3; x--) path.push({ x, y: 5 });
  for (let y = 5; y < 9; y++) path.push({ x: 3, y });
  for (let x = 3; x < 12; x++) path.push({ x, y: 9 });
  return path;
}

const levels: LevelConfig[] = [
  {
    id: "level-1",
    name: "第一层 · 油画厅",
    description: "新手关卡：布置3件展品，学习基本的灯光控制。目标分数60分。",
    gridW: 10,
    gridH: 8,
    availableExhibits: ["paint-mona", "sculpt-bust", "relic-vase"],
    availableLights: 4,
    targetScore: 60,
    maxLightTotal: 600,
    pathCells: makePath1(),
    entrance: { x: 0, y: 2 },
    exit: { x: 0, y: 6 },
  },
  {
    id: "level-2",
    name: "第二层 · 照片廊",
    description: "进阶关卡：5件展品包括对光敏感的老照片。目标分数70分。",
    gridW: 10,
    gridH: 10,
    availableExhibits: ["paint-mona", "photo-bw", "relic-vase", "paint-water", "sculpt-bust"],
    availableLights: 5,
    targetScore: 70,
    maxLightTotal: 800,
    pathCells: makePath2(),
    entrance: { x: 1, y: 1 },
    exit: { x: 8, y: 7 },
  },
  {
    id: "level-3",
    name: "第三层 · 国宝厅",
    description: "挑战关卡：6件珍贵展品，包含极度敏感的古卷轴。目标分数80分。",
    gridW: 12,
    gridH: 11,
    availableExhibits: [
      "paint-mona",
      "photo-bw",
      "relic-vase",
      "paint-water",
      "sculpt-bust",
      "relic-scroll",
    ],
    availableLights: 7,
    targetScore: 80,
    maxLightTotal: 1000,
    pathCells: makePath3(),
    entrance: { x: 0, y: 1 },
    exit: { x: 11, y: 9 },
  },
];

const samplePlayers = [
  { name: "博物馆馆长" },
  { name: "夜间管理员" },
  { name: "资深策展人" },
];

export function ensureSeedData(): void {
  initDB();
  const existingLevels = getAllLevels();
  const existingDefs = getAllExhibitDefs();
  const existingPlayers = getAllPlayers();

  const hasData =
    existingLevels.length > 0 && Object.keys(existingDefs).length > 0 && existingPlayers.length > 0;

  if (hasData) {
    console.log("Seed data already exists, skipping initialization.");
    return;
  }

  console.log("Initializing seed data...");

  for (const ex of exhibits) {
    insertExhibitDef(ex);
  }
  for (const lv of levels) {
    insertLevel(lv);
  }

  for (const p of samplePlayers) {
    const player = createPlayer(p.name);

    for (const lv of levels) {
      const session = createSession(player.id, lv.id);

      const demoExhibits = lv.availableExhibits.slice(0, 3).map((defId, i) => ({
        id: `demo-ex-${i}-${player.id.slice(0, 4)}`,
        defId,
        x: 2 + i * 2,
        y: 4,
      }));

      const demoLights = [
        { id: `demo-l-1-${player.id.slice(0, 4)}`, x: 3, y: 4, intensity: 50, radius: 4 },
        { id: `demo-l-2-${player.id.slice(0, 4)}`, x: 7, y: 4, intensity: 45, radius: 4 },
      ];

      updateSessionState(session.id, demoExhibits, demoLights);
      addOperation(session.id, "PLACE_EXHIBIT", { exhibit: demoExhibits[0] });
      addOperation(session.id, "PLACE_LIGHT", { light: demoLights[0] });

      const demoScore = 55 + Math.floor(Math.random() * 35);
      updateSessionScore(session.id, demoScore);
      completeSession(session.id, "completed", demoScore);
    }
  }

  console.log(`- ${exhibits.length} exhibit definitions`);
  console.log(`- ${levels.length} levels`);
  console.log(`- ${samplePlayers.length} sample players with completed sessions`);
  console.log("Database initialized successfully.");
}
