import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function now() {
  return new Date().toISOString();
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
}

function generateSvgTerrain(width, height, seed) {
  const rand = seededRandom(seed);
  let svg = '';

  const numHills = 5 + Math.floor(rand() * 4);
  const hills = [];
  for (let i = 0; i < numHills; i++) {
    hills.push({
      cx: 50 + rand() * (width - 100),
      cy: 50 + rand() * (height - 100),
      rx: 60 + rand() * 120,
      ry: 40 + rand() * 80,
      opacity: 0.1 + rand() * 0.2,
    });
  }

  for (const hill of hills) {
    svg += `<ellipse cx="${hill.cx.toFixed(1)}" cy="${hill.cy.toFixed(1)}" rx="${hill.rx.toFixed(1)}" ry="${hill.ry.toFixed(1)}" fill="#ffffff" opacity="${hill.opacity.toFixed(2)}" />`;
  }

  const numContours = 8 + Math.floor(rand() * 5);
  for (let i = 0; i < numContours; i++) {
    const progress = i / numContours;
    const points = [];
    const segments = 12;
    for (let j = 0; j <= segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const baseR = 40 + progress * 180;
      const wobble = Math.sin(angle * 3 + i * 0.5) * 15 + Math.sin(angle * 5 + i) * 8;
      const r = baseR + wobble + rand() * 10;
      const cx = width / 2 + Math.sin(i * 0.7) * 40;
      const cy = height / 2 + Math.cos(i * 0.5) * 30;
      points.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r * 0.7,
      });
    }
    let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let j = 1; j < points.length; j++) {
      pathD += ` L ${points[j].x.toFixed(1)} ${points[j].y.toFixed(1)}`;
    }
    svg += `<path d="${pathD}" fill="none" stroke="rgba(255,255,255,${0.03 + progress * 0.04})" stroke-width="1" />`;
  }

  const numStipples = 100;
  for (let i = 0; i < numStipples; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 0.5 + rand() * 1.5;
    const opacity = 0.05 + rand() * 0.1;
    svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="white" opacity="${opacity.toFixed(2)}" />`;
  }

  return svg;
}

function generateContourPoints(width, height, index, total, seed) {
  const rand = seededRandom(seed + index * 1000);
  const points = [];
  const numPoints = 20 + index * 2;

  const cx = width / 2 + (rand() - 0.5) * 80;
  const cy = height / 2 + (rand() - 0.5) * 60;
  const baseR = 30 + (index / total) * 180;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const wobble1 = Math.sin(angle * 3 + index * 0.8) * 20;
    const wobble2 = Math.sin(angle * 5 + index * 1.2) * 10;
    const wobble3 = (rand() - 0.5) * 8;
    const r = baseR + wobble1 + wobble2 + wobble3;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r * 0.65;
    points.push({
      x: Math.max(10, Math.min(width - 10, x)),
      y: Math.max(10, Math.min(height - 10, y)),
      elevation: 100 + index * 20,
    });
  }

  return points;
}

function generateProfileData(startX, startY, endX, endY, seed) {
  const rand = seededRandom(seed);
  const data = [];
  const segments = 15;
  const totalDist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) * 0.5;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const baseElev = 120 + t * 60 + Math.sin(t * Math.PI * 2) * 30 + Math.sin(t * Math.PI * 4) * 15;
    data.push({
      distance: t * totalDist,
      elevation: Math.round(baseElev + (rand() - 0.5) * 10),
    });
  }

  const elevations = data.map(d => d.elevation);
  return {
    elevationData: data,
    maxElevation: Math.max(...elevations),
    minElevation: Math.min(...elevations),
    totalDistance: totalDist,
  };
}

const contourColors = [
  '#7bed9f', '#70a1ff', '#ff6b81', '#ffa502', '#a55eea',
  '#2ed573', '#1e90ff', '#ff4757', '#eccc68', '#8b5cf6',
];

function seedSample1() {
  const seed = 42;
  const mapWidth = 700;
  const mapHeight = 500;
  const numContours = 7;

  const masterId = generateId('master');
  const master = {
    id: masterId,
    name: '北岭山地沙盘',
    batch: 'SB-2024-001',
    version: '1.2.0',
    status: 'completed',
    mapImage: generateSvgTerrain(mapWidth, mapHeight, seed),
    mapWidth,
    mapHeight,
    scale: 1000,
    scaleUnit: '米',
    createdAt: '2024-01-15T09:00:00.000Z',
    updatedAt: '2024-01-20T14:30:00.000Z',
    description: '北岭山地训练沙盘地形图，包含主峰、次峰及山间谷地。比例尺 1:1000，等高距 20 米。已完成等高线描绘、山脊线识别和剖面分析。',
    terrainType: '山地',
  };

  const details = [];
  for (let i = 0; i < numContours; i++) {
    const detailId = generateId('detail');
    details.push({
      id: detailId,
      masterId,
      contourIndex: i + 1,
      elevation: 120 + i * 20,
      points: generateContourPoints(mapWidth, mapHeight, i, numContours, seed),
      isSmooth: true,
      color: contourColors[i % contourColors.length],
      createdAt: new Date(Date.now() - (numContours - i) * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - (numContours - i) * 3600000).toISOString(),
    });
  }

  const histories = [];

  const ridge1 = {
    id: generateId('ridge'),
    points: [
      { x: 350, y: 180, elevation: 220 },
      { x: 380, y: 210, elevation: 210 },
      { x: 410, y: 240, elevation: 200 },
      { x: 440, y: 270, elevation: 190 },
      { x: 470, y: 300, elevation: 180 },
    ],
    name: '主峰脊',
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'ridge',
    data: ridge1,
    version: '1.0.0',
    createdAt: '2024-01-16T10:00:00.000Z',
    operator: '张工',
    remark: '主峰山脊线描绘完成，共5个控制点',
  });

  const ridge2 = {
    id: generateId('ridge'),
    points: [
      { x: 250, y: 300, elevation: 180 },
      { x: 290, y: 330, elevation: 170 },
      { x: 330, y: 360, elevation: 160 },
      { x: 370, y: 390, elevation: 150 },
    ],
    name: '次脊线',
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'ridge',
    data: ridge2,
    version: '1.1.0',
    createdAt: '2024-01-17T11:00:00.000Z',
    operator: '李工',
    remark: '补充次山脊线',
  });

  const profile = generateProfileData(200, 250, 500, 300, seed);
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'profile',
    data: {
      id: generateId('profile'),
      name: 'A-A\' 剖面',
      startPoint: { x: 200, y: 250, elevation: 130 },
      endPoint: { x: 500, y: 300, elevation: 175 },
      ...profile,
    },
    version: '1.2.0',
    createdAt: '2024-01-20T14:00:00.000Z',
    operator: '王工',
    remark: '主剖面线生成完成，高程数据核验通过',
  });

  const aspect1 = {
    id: generateId('aspect'),
    direction: 45,
    slope: 28,
    position: { x: 400, y: 220, elevation: 200 },
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'aspect',
    data: aspect1,
    version: '1.1.0',
    createdAt: '2024-01-18T09:00:00.000Z',
    operator: '张工',
    remark: '东坡坡向测量',
  });

  const resultId = generateId('result');
  const result = {
    id: resultId,
    masterId,
    version: '1.2.0',
    status: 'exported',
    layers: details.map(d => ({
      id: generateId('layer'),
      layerId: d.id,
      visible: true,
      opacity: 1,
      color: d.color,
    })),
    pointLabels: [
      { id: generateId('label'), x: 350, y: 160, text: '主峰', type: 'landmark', elevation: 240 },
      { id: generateId('label'), x: 280, y: 280, text: '观景台', type: 'landmark', elevation: 175 },
      { id: generateId('label'), x: 450, y: 320, text: '200m', type: 'elevation', elevation: 200 },
      { id: generateId('label'), x: 200, y: 350, text: '入口', type: 'annotation', elevation: 130 },
    ],
    errorNotes: [
      { id: generateId('error'), x: 380, y: 200, message: '此处等高线间距略密，建议复核', severity: 'low', resolved: false, createdAt: '2024-01-19T10:00:00.000Z' },
    ],
    exportImage: 'sample1_export.png',
    createdAt: '2024-01-20T14:30:00.000Z',
    updatedAt: '2024-01-20T14:30:00.000Z',
  };

  const snapshot = {
    id: generateId('snapshot'),
    masterId,
    version: '1.2.0',
    name: 'v1.2.0 - 最终版本',
    createdAt: '2024-01-20T15:00:00.000Z',
    masterData: { ...master },
    details: details.map(d => ({ ...d })),
    histories: histories.map(h => ({ ...h })),
    result: { ...result },
  };

  return { master, details, histories, result, snapshot };
}

function seedSample2() {
  const seed = 88;
  const mapWidth = 600;
  const mapHeight = 450;
  const numContours = 8;

  const masterId = generateId('master');
  const master = {
    id: masterId,
    name: '河谷地形测绘',
    batch: 'SB-2024-002',
    version: '2.1.0',
    status: 'error',
    mapImage: generateSvgTerrain(mapWidth, mapHeight, seed),
    mapWidth,
    mapHeight,
    scale: 500,
    scaleUnit: '米',
    createdAt: '2024-02-01T08:00:00.000Z',
    updatedAt: '2024-02-10T16:00:00.000Z',
    description: '河谷地区地形测绘，存在多处误差待修正。比例尺 1:500，等高距 10 米。因等高线描绘误差超出阈值，已标记为异常状态，待重新采样。',
    terrainType: '河谷',
  };

  const details = [];
  for (let i = 0; i < numContours; i++) {
    const detailId = generateId('detail');
    details.push({
      id: detailId,
      masterId,
      contourIndex: i + 1,
      elevation: 80 + i * 10,
      points: generateContourPoints(mapWidth, mapHeight, i, numContours, seed),
      isSmooth: i < 5,
      color: contourColors[(i + 2) % contourColors.length],
      createdAt: new Date(Date.now() - (numContours - i) * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - (numContours - i) * 3600000).toISOString(),
    });
  }

  const histories = [];

  const ridge1 = {
    id: generateId('ridge'),
    points: [
      { x: 300, y: 150, elevation: 160 },
      { x: 330, y: 190, elevation: 150 },
      { x: 360, y: 230, elevation: 140 },
      { x: 390, y: 270, elevation: 130 },
      { x: 420, y: 310, elevation: 120 },
    ],
    name: '东岸脊',
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'ridge',
    data: ridge1,
    version: '1.0.0',
    createdAt: '2024-02-02T09:00:00.000Z',
    operator: '赵工',
    remark: '东岸山脊线初步描绘',
  });

  const profile = generateProfileData(150, 200, 480, 280, seed);
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'profile',
    data: {
      id: generateId('profile'),
      name: 'B-B\' 剖面',
      startPoint: { x: 150, y: 200, elevation: 95 },
      endPoint: { x: 480, y: 280, elevation: 150 },
      ...profile,
    },
    version: '2.0.0',
    createdAt: '2024-02-05T14:00:00.000Z',
    operator: '钱工',
    remark: '跨河谷剖面生成，中间段数据存疑',
  });

  const aspect1 = {
    id: generateId('aspect'),
    direction: 180,
    slope: 15,
    position: { x: 250, y: 250, elevation: 120 },
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'aspect',
    data: aspect1,
    version: '2.1.0',
    createdAt: '2024-02-08T10:00:00.000Z',
    operator: '赵工',
    remark: '南坡坡向测量',
  });

  const resultId = generateId('result');
  const result = {
    id: resultId,
    masterId,
    version: '2.1.0',
    status: 'ready',
    layers: details.map(d => ({
      id: generateId('layer'),
      layerId: d.id,
      visible: true,
      opacity: 1,
      color: d.color,
    })),
    pointLabels: [
      { id: generateId('label'), x: 300, y: 130, text: '高点1', type: 'landmark', elevation: 165 },
      { id: generateId('label'), x: 200, y: 350, text: '河谷', type: 'annotation', elevation: 85 },
    ],
    errorNotes: [
      { id: generateId('error'), x: 340, y: 220, message: '等高线不闭合，存在断裂', severity: 'high', resolved: false, createdAt: '2024-02-09T11:00:00.000Z' },
      { id: generateId('error'), x: 420, y: 180, message: '高程点与等高线偏差超过阈值', severity: 'high', resolved: false, createdAt: '2024-02-09T14:00:00.000Z' },
      { id: generateId('error'), x: 180, y: 280, message: '山脊线位置需校核', severity: 'medium', resolved: false, createdAt: '2024-02-08T16:00:00.000Z' },
      { id: generateId('error'), x: 280, y: 380, message: '坡向数据精度待提升', severity: 'low', resolved: true, createdAt: '2024-02-07T09:00:00.000Z' },
    ],
    createdAt: '2024-02-10T16:00:00.000Z',
    updatedAt: '2024-02-10T16:00:00.000Z',
  };

  const snapshot = {
    id: generateId('snapshot'),
    masterId,
    version: '2.1.0',
    name: 'v2.1.0 - 待修正版本',
    createdAt: '2024-02-10T17:00:00.000Z',
    masterData: { ...master },
    details: details.map(d => ({ ...d })),
    histories: histories.map(h => ({ ...h })),
    result: { ...result },
  };

  return { master, details, histories, result, snapshot };
}

function seedSample3() {
  const seed = 123;
  const mapWidth = 650;
  const mapHeight = 480;
  const numContours = 6;

  const masterId = generateId('master');
  const master = {
    id: masterId,
    name: '丘陵地貌分析',
    batch: 'SB-2024-003',
    version: '3.2.0',
    status: 'processing',
    mapImage: generateSvgTerrain(mapWidth, mapHeight, seed),
    mapWidth,
    mapHeight,
    scale: 2000,
    scaleUnit: '米',
    createdAt: '2024-03-01T08:00:00.000Z',
    updatedAt: '2024-03-15T12:00:00.000Z',
    description: '南方丘陵地貌分析图，正在进行点位标签补充和导出回滚验证。比例尺 1:2000，等高距 25 米。此记录用于演示版本回滚和重算功能。',
    terrainType: '丘陵',
  };

  const details = [];
  for (let i = 0; i < numContours; i++) {
    const detailId = generateId('detail');
    details.push({
      id: detailId,
      masterId,
      contourIndex: i + 1,
      elevation: 150 + i * 25,
      points: generateContourPoints(mapWidth, mapHeight, i, numContours, seed),
      isSmooth: true,
      color: contourColors[(i + 4) % contourColors.length],
      createdAt: new Date(Date.now() - (numContours - i) * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - (numContours - i) * 3600000).toISOString(),
    });
  }

  const histories = [];

  const ridge1 = {
    id: generateId('ridge'),
    points: [
      { x: 325, y: 140, elevation: 275 },
      { x: 355, y: 175, elevation: 260 },
      { x: 385, y: 210, elevation: 245 },
      { x: 415, y: 245, elevation: 230 },
      { x: 445, y: 280, elevation: 215 },
      { x: 475, y: 315, elevation: 200 },
    ],
    name: '主丘脊',
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'ridge',
    data: ridge1,
    version: '1.0.0',
    createdAt: '2024-03-02T10:00:00.000Z',
    operator: '孙工',
    remark: '主丘陵山脊线描绘',
  });

  const profile = generateProfileData(180, 220, 520, 310, seed);
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'profile',
    data: {
      id: generateId('profile'),
      name: 'C-C\' 剖面',
      startPoint: { x: 180, y: 220, elevation: 180 },
      endPoint: { x: 520, y: 310, elevation: 200 },
      ...profile,
    },
    version: '2.0.0',
    createdAt: '2024-03-08T15:00:00.000Z',
    operator: '周工',
    remark: '初版剖面生成，已回滚一次',
  });

  const aspect1 = {
    id: generateId('aspect'),
    direction: 135,
    slope: 22,
    position: { x: 380, y: 200, elevation: 250 },
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'aspect',
    data: aspect1,
    version: '3.0.0',
    createdAt: '2024-03-12T09:00:00.000Z',
    operator: '孙工',
    remark: '东南坡测量',
  });

  const aspect2 = {
    id: generateId('aspect'),
    direction: 315,
    slope: 18,
    position: { x: 280, y: 280, elevation: 210 },
  };
  histories.push({
    id: generateId('history'),
    masterId,
    type: 'aspect',
    data: aspect2,
    version: '3.1.0',
    createdAt: '2024-03-13T11:00:00.000Z',
    operator: '周工',
    remark: '西北坡补充测量',
  });

  const resultId = generateId('result');
  const result = {
    id: resultId,
    masterId,
    version: '3.2.0',
    status: 'rolled_back',
    layers: details.map(d => ({
      id: generateId('layer'),
      layerId: d.id,
      visible: d.contourIndex % 2 === 1,
      opacity: d.contourIndex % 2 === 1 ? 1 : 0.5,
      color: d.color,
    })),
    pointLabels: [
      { id: generateId('label'), x: 325, y: 120, text: '最高点', type: 'elevation', elevation: 280 },
      { id: generateId('label'), x: 220, y: 350, text: '洼地', type: 'landmark', elevation: 160 },
      { id: generateId('label'), x: 480, y: 200, text: '观测点', type: 'landmark', elevation: 240 },
      { id: generateId('label'), x: 150, y: 280, text: '起点', type: 'annotation' },
      { id: generateId('label'), x: 550, y: 340, text: '终点', type: 'annotation' },
    ],
    errorNotes: [
      { id: generateId('error'), x: 350, y: 160, message: '回滚后需重新校验', severity: 'medium', resolved: false, createdAt: '2024-03-15T10:00:00.000Z' },
    ],
    createdAt: '2024-03-14T09:00:00.000Z',
    updatedAt: '2024-03-15T12:00:00.000Z',
  };

  const snapshot1 = {
    id: generateId('snapshot'),
    masterId,
    version: '2.0.0',
    name: 'v2.0.0 - 初始剖面版本',
    createdAt: '2024-03-08T16:00:00.000Z',
    masterData: { ...master, version: '2.0.0', status: 'processing' },
    details: details.slice(0, 4).map(d => ({ ...d })),
    histories: histories.slice(0, 2).map(h => ({ ...h })),
    result: { ...result, version: '2.0.0', status: 'pending' },
  };

  const snapshot2 = {
    id: generateId('snapshot'),
    masterId,
    version: '3.1.0',
    name: 'v3.1.0 - 坡向测量完成',
    createdAt: '2024-03-13T16:00:00.000Z',
    masterData: { ...master, version: '3.1.0', status: 'completed' },
    details: details.map(d => ({ ...d })),
    histories: histories.slice(0, 3).map(h => ({ ...h })),
    result: { ...result, version: '3.1.0', status: 'exported' },
  };

  return { master, details, histories, result, snapshots: [snapshot1, snapshot2] };
}

function main() {
  ensureDataDir();

  const db = {
    masters: [],
    details: [],
    histories: [],
    results: [],
    snapshots: [],
  };

  const s1 = seedSample1();
  db.masters.push(s1.master);
  db.details.push(...s1.details);
  db.histories.push(...s1.histories);
  db.results.push(s1.result);
  db.snapshots.push(s1.snapshot);

  const s2 = seedSample2();
  db.masters.push(s2.master);
  db.details.push(...s2.details);
  db.histories.push(...s2.histories);
  db.results.push(s2.result);
  db.snapshots.push(s2.snapshot);

  const s3 = seedSample3();
  db.masters.push(s3.master);
  db.details.push(...s3.details);
  db.histories.push(...s3.histories);
  db.results.push(s3.result);
  db.snapshots.push(...s3.snapshots);

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

  console.log('✓ 种子数据生成完成');
  console.log(`  主记录: ${db.masters.length} 条`);
  console.log(`  明细记录: ${db.details.length} 条`);
  console.log(`  历史记录: ${db.histories.length} 条`);
  console.log(`  结果记录: ${db.results.length} 条`);
  console.log(`  版本快照: ${db.snapshots.length} 个`);
  console.log();
  console.log('  样本 1: 剖面生成正常完成 (北岭山地沙盘)');
  console.log('  样本 2: 误差备注触发异常 (河谷地形测绘)');
  console.log('  样本 3: 点位标签和导出图片需要回滚或重算 (丘陵地貌分析)');
}

main();
