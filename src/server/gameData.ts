import type { SeedData, AltitudeLevel } from "../types/game";

// 游戏时间：6:00-18:00，共12小时=720分钟
export const GAME_START_MINUTE = 0; // 6:00
export const GAME_END_MINUTE = 720; // 18:00
export const NOON_MINUTE = 360; // 12:00 正午，过午降级时间点

// 海拔对应的成熟时间（游戏分钟）
export const ALTITUDE_MATURITY: Record<AltitudeLevel, { start: number; end: number }> = {
  low: { start: 60, end: 300 }, // 低海拔：7:00-11:00 成熟
  mid: { start: 120, end: 360 }, // 中海拔：8:00-12:00 成熟
  high: { start: 180, end: 420 }, // 高海拔：9:00-13:00 成熟
};

// 品质价格（每单位茶青）
export const QUALITY_PRICES = {
  premium: 50, // 特级
  normal: 30, // 普通
  degraded: 10, // 降级
};

// 山风减速比例
export const WIND_SPEED_REDUCTION = [0, 0.15, 0.3, 0.5]; // 风力0-3级对应的减速比例

// 索道基础速度（游戏单位/分钟）
export const BASE_CABLE_SPEED = 5;

// 制茶耗时（分钟）
export const PROCESSING_DURATION = 60;

// 三个种子样本数据
export const SEED_DATA: Record<string, SeedData> = {
  normal: {
    type: "normal",
    name: "索道冲突正常完成",
    description: "玩家合理调度，虽有索道冲突但茶青未过午降级，正常完成采摘制茶",
    plants: [
      { id: "plant-1", altitude: "low", positionY: 100, quantity: 20, initialQuality: "premium" },
      { id: "plant-2", altitude: "low", positionY: 120, quantity: 15, initialQuality: "premium" },
      { id: "plant-3", altitude: "mid", positionY: 250, quantity: 25, initialQuality: "premium" },
      { id: "plant-4", altitude: "mid", positionY: 280, quantity: 20, initialQuality: "premium" },
      { id: "plant-5", altitude: "high", positionY: 400, quantity: 30, initialQuality: "premium" },
      { id: "plant-6", altitude: "high", positionY: 430, quantity: 25, initialQuality: "premium" },
    ],
    cableways: [
      { id: "cable-1", name: "东线索道", startY: 50, endY: 450, capacity: 3, speed: 5 },
      { id: "cable-2", name: "西线索道", startY: 50, endY: 450, capacity: 2, speed: 6 },
    ],
    stations: [
      { id: "station-1", name: "一号制茶坊", positionY: 50, processDuration: 60 },
      { id: "station-2", name: "二号制茶坊", positionY: 50, processDuration: 50 },
    ],
    windSchedule: [
      { time: 0, intensity: 0 },
      { time: 180, intensity: 1 },
      { time: 300, intensity: 2 },
      { time: 420, intensity: 1 },
      { time: 540, intensity: 0 },
    ],
    expectedOutcome: "正常完成，所有茶青均在过午前采摘，收益约2500-3000",
  },
  exception: {
    type: "exception",
    name: "采摘计划触发异常",
    description: "玩家安排的采摘计划不合理，高海拔茶青未及时采摘导致过午降级，触发异常结算",
    plants: [
      { id: "plant-1", altitude: "low", positionY: 100, quantity: 15, initialQuality: "premium" },
      { id: "plant-2", altitude: "mid", positionY: 250, quantity: 20, initialQuality: "premium" },
      { id: "plant-3", altitude: "high", positionY: 400, quantity: 35, initialQuality: "premium" },
      { id: "plant-4", altitude: "high", positionY: 450, quantity: 30, initialQuality: "premium" },
    ],
    cableways: [
      { id: "cable-1", name: "主线索道", startY: 50, endY: 500, capacity: 2, speed: 4 },
    ],
    stations: [
      { id: "station-1", name: "制茶工坊", positionY: 50, processDuration: 70 },
    ],
    windSchedule: [
      { time: 0, intensity: 0 },
      { time: 200, intensity: 2 },
      { time: 350, intensity: 3 },
      { time: 500, intensity: 2 },
    ],
    expectedOutcome: "高海拔茶青过午降级，收益减少约40%，品质降级率高",
  },
  rollback: {
    type: "rollback",
    name: "索道占用图需要回滚或重算",
    description: "玩家操作导致索道冲突频繁，需要回滚操作或重新计算索道占用图以优化调度",
    plants: [
      { id: "plant-1", altitude: "low", positionY: 80, quantity: 20, initialQuality: "premium" },
      { id: "plant-2", altitude: "low", positionY: 100, quantity: 20, initialQuality: "premium" },
      { id: "plant-3", altitude: "mid", positionY: 200, quantity: 20, initialQuality: "premium" },
      { id: "plant-4", altitude: "mid", positionY: 220, quantity: 20, initialQuality: "premium" },
      { id: "plant-5", altitude: "high", positionY: 350, quantity: 20, initialQuality: "premium" },
      { id: "plant-6", altitude: "high", positionY: 380, quantity: 20, initialQuality: "premium" },
    ],
    cableways: [
      { id: "cable-1", name: "主线", startY: 50, endY: 400, capacity: 1, speed: 5 },
      { id: "cable-2", name: "副线", startY: 50, endY: 400, capacity: 1, speed: 5 },
    ],
    stations: [
      { id: "station-1", name: "制茶A线", positionY: 50, processDuration: 45 },
      { id: "station-2", name: "制茶B线", positionY: 50, processDuration: 45 },
    ],
    windSchedule: [
      { time: 0, intensity: 1 },
      { time: 150, intensity: 0 },
      { time: 300, intensity: 1 },
      { time: 450, intensity: 2 },
    ],
    expectedOutcome: "索道容量有限易冲突，需要回滚重算，优化后收益可提升30%",
  },
};

// 生成唯一ID
export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 游戏分钟转显示时间
export function minuteToTime(minute: number): string {
  const hour = Math.floor(minute / 60) + 6;
  const min = minute % 60;
  return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}
