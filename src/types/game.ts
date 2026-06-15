// 游戏类型定义

// 海拔等级
export type AltitudeLevel = "low" | "mid" | "high";

// 茶青品质
export type TeaQuality = "premium" | "normal" | "degraded";

// 索道状态
export type CableCarStatus = "idle" | "moving" | "loading" | "unloading" | "conflict";

// 工位状态
export type StationStatus = "idle" | "processing" | "finished";

// 游戏阶段
export type GamePhase = "planning" | "picking" | "processing" | "settled";

// 茶树信息
export interface TeaPlant {
  id: string;
  altitude: AltitudeLevel;
  positionY: number;
  matureStartTime: number; // 成熟开始时间（游戏分钟）
  matureEndTime: number; // 过午降级时间（游戏分钟）
  initialQuality: TeaQuality;
  quantity: number;
}

// 索道（主记录核心）
export interface Cableway {
  id: string;
  name: string;
  startY: number;
  endY: number;
  capacity: number;
  speed: number; // 基础速度（单位/分钟）
  currentCars: string[];
}

// 采茶篮（明细记录核心）
export interface TeaBasket {
  id: string;
  cableCarId: string;
  teaPlantId: string | null;
  quantity: number;
  quality: TeaQuality;
  pickedAt: number | null; // 采摘时间（游戏分钟）
}

// 制茶工位（明细记录核心）
export interface ProcessingStation {
  id: string;
  name: string;
  positionY: number;
  status: StationStatus;
  currentBasketId: string | null;
  processStartTime: number | null;
  processDuration: number; // 制茶耗时（游戏分钟）
  outputQuality: TeaQuality | null;
}

// 山风信息（结果记录核心）
export interface WindCondition {
  time: number;
  intensity: number; // 0-3，风力等级
  affectedCableways: string[];
  speedReduction: number; // 减速百分比 0-0.6
}

// 索道冲突记录
export interface CableConflict {
  id: string;
  cablewayId: string;
  carAId: string;
  carBId: string;
  startTime: number;
  duration: number; // 冲突持续时间（游戏分钟）
  causedDegrade: boolean;
}

// 局次主记录
export interface GameSession {
  id: string;
  name: string;
  seedType: SeedType;
  phase: GamePhase;
  currentTime: number; // 当前游戏时间（分钟，从6:00开始，即0=6:00）
  totalRevenue: number;
  windIntensity: number; // 当前山风强度
  createdAt: number;
  updatedAt: number;
}

// 操作明细记录
export interface GameAction {
  id: string;
  sessionId: string;
  actionType: ActionType;
  targetId: string;
  timestamp: number; // 游戏内时间
  realTimestamp: number; // 实际时间戳
  details: string; // JSON 字符串
}

export type ActionType =
  | "schedule_basket" // 调度吊篮
  | "pick_tea" // 采摘茶青
  | "send_to_station" // 送往工位
  | "start_processing" // 开始制茶
  | "finish_processing" // 完成制茶
  | "wind_change" // 山风变化
  | "conflict_occur" // 发生冲突
  | "quality_degrade"; // 品质降级

// 茶青历史记录
export interface TeaMaturityHistory {
  id: string;
  sessionId: string;
  teaPlantId: string;
  altitude: AltitudeLevel;
  matureStartTime: number;
  matureEndTime: number;
  quality: TeaQuality;
  timestamp: number;
}

// 结算结果记录
export interface GameResult {
  id: string;
  sessionId: string;
  totalTeaPicked: number;
  premiumCount: number;
  normalCount: number;
  degradedCount: number;
  totalRevenue: number;
  windAffectedCount: number;
  conflictCount: number;
  settlementDetails: string; // JSON 字符串
  calculatedAt: number;
}

// 种子类型
export type SeedType = "normal" | "exception" | "rollback";

// 种子数据定义
export interface SeedData {
  type: SeedType;
  name: string;
  description: string;
  plants: Partial<TeaPlant>[];
  cableways: Partial<Cableway>[];
  stations: Partial<ProcessingStation>[];
  windSchedule: { time: number; intensity: number }[];
  expectedOutcome: string;
}
