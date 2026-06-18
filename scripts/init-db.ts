import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import {
  archivesRepo,
  versionsRepo,
  pointsRepo,
  equipmentRepo,
  exportsRepo,
  anomaliesRepo,
} from "../lib/repo";
import { getDb, saveDb, type DatabaseShape } from "../lib/db";
import { detectAnomalies } from "../lib/anomaly";
import type { BowArchive, BowVersion, TargetPoint, Equipment } from "../lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

if (fs.existsSync(DB_FILE)) {
  fs.rmSync(DB_FILE);
  console.log("🗑  cleared existing database.json");
}

getDb();

const now = new Date().toISOString();

const equipment: Omit<Equipment, "id" | "createdAt">[] = [
  {
    name: "Samick Polaris 反曲弓把",
    category: "riser",
    status: "excellent",
    spec: "25 inch, 铝合金",
    notes: "入门竞技反曲弓把，左右可互换",
  },
  {
    name: "传统角弓（清代形制）",
    category: "bow",
    status: "good",
    spec: "弓长 54 inch，拉力 45 lbs@28",
    notes: "牛角弓胎，筋角复合，传统弦垫",
  },
  {
    name: "Carbon Express 箭组 × 12",
    category: "arrow",
    status: "good",
    spec: "Spine 500, 重量 380 grain, 长度 29 inch",
    notes: "竞技反曲训练箭",
  },
  {
    name: "BCY D97 弓弦",
    category: "string",
    status: "new",
    spec: "16股，弦长 66 inch，护弦 12 inch",
    notes: "高速弓弦材料，适用于竞技反曲",
  },
];

const equipmentIds: string[] = [];
for (const e of equipment) {
  const created = equipmentRepo.create(e);
  equipmentIds.push(created.id);
  console.log(`✅ 器材: ${e.name}`);
}

const archives: Omit<BowArchive, "id" | "createdAt" | "updatedAt">[] = [
  {
    name: "竞技反曲弓主配置",
    bowType: "recurve",
    bowLength: 68,
    drawWeight: 34,
    drawLength: 28,
    braceHeight: 8.25,
    upperTipWeight: 0.6,
    lowerTipWeight: 0.6,
    limbRatio: 3.0,
    arrowWeight: 380,
    arrowSpine: 500,
    stringStrands: 16,
    stringMaterial: "BCY D97",
    releaseType: "finger",
    restType: "Magnetic Rest",
    sightType: "Recurve Sight",
    status: "active",
    notes: "俱乐部训练主用弓，每周校弦距一次。",
  },
  {
    name: "传统角弓射礼配置",
    bowType: "traditional",
    bowLength: 54,
    drawWeight: 45,
    drawLength: 28,
    braceHeight: 5.5,
    upperTipWeight: 1.1,
    lowerTipWeight: 1.1,
    limbRatio: 2.4,
    arrowWeight: 540,
    arrowSpine: 400,
    stringStrands: 12,
    stringMaterial: "蚕丝复合",
    releaseType: "thumb",
    restType: "None (传统无箭台)",
    sightType: "None (直觉瞄准)",
    status: "active",
    notes: "用于汉服射礼演示，配合扳指撒放。",
  },
  {
    name: "新手训练弓（异常数据示例）",
    bowType: "recurve",
    bowLength: 30,
    drawWeight: 8,
    drawLength: 28,
    braceHeight: 3.0,
    upperTipWeight: 2.5,
    lowerTipWeight: 0.3,
    limbRatio: 5.5,
    arrowWeight: 120,
    arrowSpine: 900,
    stringStrands: 6,
    stringMaterial: "未知",
    releaseType: "finger",
    restType: "Stick-on",
    sightType: "None",
    status: "archived",
    notes: "故意设置异常参数，用于测试异常检测引擎。",
  },
];

const archiveIds: string[] = [];
for (const a of archives) {
  const created = archivesRepo.create(a);
  archiveIds.push(created.id);
  const anomalies = detectAnomalies(created);
  anomaliesRepo.clearByArchive(created.id);
  for (const anomaly of anomalies) {
    anomaliesRepo.create({ archiveId: created.id, ...anomaly });
  }
  console.log(`✅ 档案: ${a.name} (异常 ${anomalies.length} 项)`);
}

const targetPointsByArchive: Record<number, Omit<TargetPoint, "id" | "archiveId">[]> = {
  0: [
    { arrowNumber: 1, x: -2.1, y: 1.8, score: 9 },
    { arrowNumber: 2, x: 1.2, y: -0.6, score: 10 },
    { arrowNumber: 3, x: 3.8, y: 2.2, score: 7 },
    { arrowNumber: 4, x: -0.3, y: 0.2, score: 10 },
    { arrowNumber: 5, x: 1.5, y: 3.1, score: 8 },
    { arrowNumber: 6, x: -2.8, y: -1.4, score: 8 },
    { arrowNumber: 7, x: 0.4, y: -0.1, score: 10 },
    { arrowNumber: 8, x: -1.0, y: 2.4, score: 9 },
    { arrowNumber: 9, x: 2.6, y: -2.8, score: 7 },
    { arrowNumber: 10, x: -0.6, y: -1.8, score: 9 },
    { arrowNumber: 11, x: 3.2, y: 0.5, score: 8 },
    { arrowNumber: 12, x: -1.8, y: 1.0, score: 9 },
  ],
  1: [
    { arrowNumber: 1, x: -3.5, y: 2.2, score: 7 },
    { arrowNumber: 2, x: 0.4, y: -1.0, score: 10 },
    { arrowNumber: 3, x: 2.8, y: 3.4, score: 6 },
    { arrowNumber: 4, x: -1.6, y: -2.6, score: 8 },
    { arrowNumber: 5, x: 1.0, y: 0.6, score: 10 },
    { arrowNumber: 6, x: -4.0, y: 0.8, score: 6 },
    { arrowNumber: 7, x: 2.2, y: -0.4, score: 9 },
    { arrowNumber: 8, x: -0.8, y: 1.8, score: 9 },
  ],
  2: [],
};

for (const [idx, points] of Object.entries(targetPointsByArchive)) {
  for (const p of points) {
    pointsRepo.create({ archiveId: archiveIds[Number(idx)], ...p });
  }
  console.log(`✅ 靶纸标点: 档案 ${Number(idx) + 1} 共 ${points.length} 支箭`);
}

const versionsTemplate: Record<number, Omit<BowVersion, "id" | "archiveId" | "createdAt">[]> = {
  0: [
    {
      versionNumber: 1,
      batchCode: "BATCH-2024-SPR-001",
      label: "初版参数快照",
      snapshot: JSON.stringify({ braceHeight: 8.0, arrowWeight: 375, note: "初始记录" }),
      changeNote: "首次建档，完成器材装配与基准参数记录。",
    },
    {
      versionNumber: 2,
      batchCode: "BATCH-2024-SPR-001",
      label: "调整弦距",
      snapshot: JSON.stringify({ braceHeight: 8.25, arrowWeight: 375 }),
      changeNote: "将 Brace Height 从 8.0 上调至 8.25，减少弦打手反馈。",
    },
    {
      versionNumber: 3,
      batchCode: "BATCH-2024-SPR-002",
      label: "更换箭组",
      snapshot: JSON.stringify({ braceHeight: 8.25, arrowWeight: 380, arrowSpine: 500 }),
      changeNote: "换用新的 Carbon Express 箭组，箭重+5 grain。",
    },
  ],
  1: [
    {
      versionNumber: 1,
      batchCode: "BATCH-2024-AUT-003",
      label: "射礼活动配置",
      snapshot: JSON.stringify({ braceHeight: 5.5, stringStrands: 12, stringMaterial: "蚕丝复合" }),
      changeNote: "配置为射礼演示使用，配传统蚕丝弦。",
    },
    {
      versionNumber: 2,
      batchCode: "BATCH-2024-AUT-003",
      label: "重缠弓弦护弦",
      snapshot: JSON.stringify({ braceHeight: 5.5, stringStrands: 12 }),
      changeNote: "护弦磨耗重缠，弦长无变化。",
    },
  ],
  2: [],
};

for (const [idx, vlist] of Object.entries(versionsTemplate)) {
  for (const v of vlist) {
    versionsRepo.create({ archiveId: archiveIds[Number(idx)], ...v });
  }
  console.log(`✅ 版本批次: 档案 ${Number(idx) + 1} 共 ${vlist.length} 条快照`);
}

function buildTextSummary(archive: BowArchive, points: TargetPoint[], versions: BowVersion[]): string {
  const avg =
    points.length > 0
      ? (points.reduce((s, p) => s + p.score, 0) / points.length).toFixed(2)
      : "N/A";
  return `传统弓箭调弓参数档案 — ${archive.name}
================================
基础信息
  档案编号：${archive.id.slice(0, 8)}
  弓型：${archive.bowType}
  弓长：${archive.bowLength} inch
  状态：${archive.status}
  更新时间：${archive.updatedAt}

弓体参数
  额定拉力：${archive.drawWeight} lbs @ ${archive.drawLength} inch
  弦距（ Brace Height ）：${archive.braceHeight} inch
  上弓梢：${archive.upperTipWeight ?? "-"} oz；下弓梢：${archive.lowerTipWeight ?? "-"} oz
  弓片弹力比：${archive.limbRatio ?? "-"}

箭与弓弦
  箭重：${archive.arrowWeight} grain
  箭杆挠度（ Spine ）：${archive.arrowSpine ?? "-"}
  弦股数：${archive.stringStrands ?? "-"}；弦材质：${archive.stringMaterial ?? "-"}
  GPP（箭重/拉力）：${(Number(archive.arrowWeight) / Number(archive.drawWeight)).toFixed(2)}

撒放与瞄准
  撒放方式：${archive.releaseType}
  箭台：${archive.restType ?? "-"}；瞄准器：${archive.sightType ?? "-"}

靶纸统计
  记录箭数：${points.length}
  累计环数：${points.reduce((s, p) => s + p.score, 0)}
  平均环值：${avg}

版本批次
  快照版本数：${versions.length}
  最新批次：${versions[0]?.batchCode ?? "暂无"}

备注：${archive.notes ?? "—"}
`;
}

for (let i = 0; i < archiveIds.length; i++) {
  const archive = archivesRepo.get(archiveIds[i])!;
  const points = pointsRepo.listByArchive(archiveIds[i]);
  const versions = versionsRepo.listByArchive(archiveIds[i]);

  const textContent = buildTextSummary(archive, points, versions);
  exportsRepo.create({
    archiveId: archiveIds[i],
    format: "text",
    archiveName: archive.name,
    content: textContent,
  });

  exportsRepo.create({
    archiveId: archiveIds[i],
    format: "json",
    archiveName: archive.name,
    content: JSON.stringify({ archive, points, versions }, null, 2),
  });

  console.log(`✅ 导出摘要: ${archive.name} (TXT + JSON)`);
}

console.log("\n🎉 初始化完成！所有样例数据已写入 data/database.json");
