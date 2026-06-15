import {
  ALTITUDE_MATURITY,
  QUALITY_PRICES,
  WIND_SPEED_REDUCTION,
  BASE_CABLE_SPEED,
  PROCESSING_DURATION,
  NOON_MINUTE,
  SEED_DATA,
  generateId,
} from "./gameData";
import type {
  TeaPlant,
  Cableway,
  ProcessingStation,
  TeaBasket,
  TeaQuality,
  AltitudeLevel,
  CableConflict,
  WindCondition,
  GameSession,
  GameAction,
  ActionType,
  TeaMaturityHistory,
  GameResult,
  SeedType,
  GamePhase,
} from "../types/game";

// 吊篮位置追踪
export interface BasketPosition {
  basketId: string;
  currentY: number;
  targetY: number;
  state: "idle" | "moving_up" | "moving_down" | "at_plant" | "at_station";
  eta: number | null;
}

// 游戏运行时状态
export interface GameRuntimeState {
  session: GameSession;
  plants: TeaPlant[];
  cableways: Cableway[];
  stations: ProcessingStation[];
  baskets: TeaBasket[];
  basketPositions: Record<string, BasketPosition>;
  conflicts: CableConflict[];
  windHistory: WindCondition[];
  actions: GameAction[];
  maturityHistory: TeaMaturityHistory[];
}

// 初始化游戏
export function initGame(seedType: SeedType, sessionName?: string): GameRuntimeState {
  const seed = SEED_DATA[seedType];
  if (!seed) {
    throw new Error(`未知种子类型: ${seedType}`);
  }

  const now = Date.now();
  const session: GameSession = {
    id: generateId("session"),
    name: sessionName || seed.name,
    seedType,
    phase: "planning",
    currentTime: 0,
    totalRevenue: 0,
    windIntensity: seed.windSchedule[0]?.intensity || 0,
    createdAt: now,
    updatedAt: now,
  };

  // 初始化茶树，根据海拔设置成熟时间
  const plants: TeaPlant[] = seed.plants.map((p) => {
    const altitude = p.altitude as AltitudeLevel;
    const maturity = ALTITUDE_MATURITY[altitude];
    return {
      id: p.id || generateId("plant"),
      altitude,
      positionY: p.positionY || 200,
      matureStartTime: maturity.start,
      matureEndTime: maturity.end,
      initialQuality: p.initialQuality || "premium",
      quantity: p.quantity || 20,
    };
  });

  // 初始化索道
  const cableways: Cableway[] = seed.cableways.map((c) => ({
    id: c.id || generateId("cable"),
    name: c.name || "索道",
    startY: c.startY || 50,
    endY: c.endY || 450,
    capacity: c.capacity || 2,
    speed: c.speed || BASE_CABLE_SPEED,
    currentCars: [],
  }));

  // 初始化工位
  const stations: ProcessingStation[] = seed.stations.map((s) => ({
    id: s.id || generateId("station"),
    name: s.name || "制茶工位",
    positionY: s.positionY || 50,
    status: "idle",
    currentBasketId: null,
    processStartTime: null,
    processDuration: s.processDuration || PROCESSING_DURATION,
    outputQuality: null,
  }));

  // 初始化吊篮（每个索道根据容量创建吊篮）
  const baskets: TeaBasket[] = [];
  const basketPositions: Record<string, BasketPosition> = {};
  cableways.forEach((cw) => {
    for (let i = 0; i < cw.capacity; i++) {
      const basketId = generateId("basket");
      baskets.push({
        id: basketId,
        cableCarId: cw.id,
        teaPlantId: null,
        quantity: 0,
        quality: "premium",
        pickedAt: null,
      });
      cw.currentCars.push(basketId);
      // 吊篮初始位置：均匀分布在索道上
      const startY = cw.startY + ((cw.endY - cw.startY) * (i / Math.max(cw.capacity - 1, 1)));
      basketPositions[basketId] = {
        basketId,
        currentY: startY,
        targetY: startY,
        state: "idle",
        eta: null,
      };
    }
  });

  // 初始山风记录
  const windHistory: WindCondition[] = [
    {
      time: 0,
      intensity: session.windIntensity,
      affectedCableways: cableways.map((c) => c.id),
      speedReduction: WIND_SPEED_REDUCTION[session.windIntensity] || 0,
    },
  ];

  // 初始化茶青成熟历史
  const maturityHistory: TeaMaturityHistory[] = plants.map((p) => ({
    id: generateId("maturity"),
    sessionId: session.id,
    teaPlantId: p.id,
    altitude: p.altitude,
    matureStartTime: p.matureStartTime,
    matureEndTime: p.matureEndTime,
    quality: p.initialQuality,
    timestamp: 0,
  }));

  return {
    session,
    plants,
    cableways,
    stations,
    baskets,
    basketPositions,
    conflicts: [],
    windHistory,
    actions: [],
    maturityHistory,
  };
}

// 计算茶青当前品质
export function calculateTeaQuality(
  plant: TeaPlant,
  currentTime: number
): { quality: TeaQuality; reason: string } {
  if (currentTime < plant.matureStartTime) {
    return { quality: "normal", reason: "未成熟" };
  }
  if (currentTime <= plant.matureEndTime) {
    return { quality: plant.initialQuality, reason: "最佳采摘期" };
  }
  if (currentTime <= NOON_MINUTE + 120) {
    return { quality: "normal", reason: "过午但尚可用" };
  }
  return { quality: "degraded", reason: "过午降级" };
}

// 计算索道实际速度（考虑山风）
export function calculateCableSpeed(
  cableway: Cableway,
  windIntensity: number
): number {
  const reduction = WIND_SPEED_REDUCTION[windIntensity] || 0;
  return cableway.speed * (1 - reduction);
}

// 计算吊篮移动时间
export function calculateTravelTime(
  cableway: Cableway,
  fromY: number,
  toY: number,
  windIntensity: number
): number {
  const distance = Math.abs(toY - fromY);
  const speed = calculateCableSpeed(cableway, windIntensity);
  return Math.max(1, Math.ceil(distance / speed));
}

// 检测索道冲突 - 增强版
export function detectConflicts(
  state: GameRuntimeState
): CableConflict[] {
  const newConflicts: CableConflict[] = [];

  for (const cableway of state.cableways) {
    const cwBaskets = state.baskets.filter((b) => b.cableCarId === cableway.id);
    const activePositions = cwBaskets
      .map((b) => state.basketPositions[b.id])
      .filter((p) => p && (p.state === "moving_up" || p.state === "moving_down"));

    // 检测位置接近的移动吊篮
    for (let i = 0; i < activePositions.length; i++) {
      for (let j = i + 1; j < activePositions.length; j++) {
        const posA = activePositions[i];
        const posB = activePositions[j];
        const distance = Math.abs(posA.currentY - posB.currentY);
        // 如果两个移动吊篮距离小于50单位，视为冲突风险
        if (distance < 50) {
          // 检查是否已有记录过这个冲突
          const existingConflict = state.conflicts.find(
            (c) =>
              c.cablewayId === cableway.id &&
              ((c.carAId === posA.basketId && c.carBId === posB.basketId) ||
                (c.carAId === posB.basketId && c.carBId === posA.basketId)) &&
              state.session.currentTime - c.startTime < c.duration
          );

          if (!existingConflict) {
            const causedDegrade = state.session.currentTime >= NOON_MINUTE;
            const conflict: CableConflict = {
              id: generateId("conflict"),
              cablewayId: cableway.id,
              carAId: posA.basketId,
              carBId: posB.basketId,
              startTime: state.session.currentTime,
              duration: 15, // 冲突延误15分钟
              causedDegrade,
            };
            newConflicts.push(conflict);

            // 添加冲突操作记录
            state.actions.push(
              createAction(state.session.id, "conflict_occur", cableway.id, state.session.currentTime, {
                cablewayName: cableway.name,
                carA: posA.basketId.slice(-4),
                carB: posB.basketId.slice(-4),
                duration: 15,
                causedDegrade,
                reason: causedDegrade ? "冲突延误导致茶青过午降级" : "发生索道冲突，延误15分钟",
              })
            );
          }
        }
      }
    }

    // 容量超载检测
    const totalActive = cwBaskets.filter((b) => {
      const pos = state.basketPositions[b.id];
      return pos && pos.state !== "idle";
    }).length;

    if (totalActive > cableway.capacity) {
      const conflict: CableConflict = {
        id: generateId("conflict"),
        cablewayId: cableway.id,
        carAId: cwBaskets[0]?.id || "",
        carBId: cwBaskets[1]?.id || "",
        startTime: state.session.currentTime,
        duration: 20,
        causedDegrade: state.session.currentTime >= NOON_MINUTE - 30,
      };
      newConflicts.push(conflict);
    }
  }

  return newConflicts;
}

// 检查制茶是否完成
export function checkProcessingComplete(
  state: GameRuntimeState
): { station: ProcessingStation; basket: TeaBasket }[] {
  const completed: { station: ProcessingStation; basket: TeaBasket }[] = [];

  for (const station of state.stations) {
    if (
      station.status === "processing" &&
      station.processStartTime !== null &&
      station.currentBasketId !== null
    ) {
      const elapsed = state.session.currentTime - station.processStartTime;
      if (elapsed >= station.processDuration) {
        const basket = state.baskets.find((b) => b.id === station.currentBasketId);
        if (basket) {
          completed.push({ station, basket });
        }
      }
    }
  }

  return completed;
}

// 完成制茶并计算收益
export function completeProcessing(
  state: GameRuntimeState,
  stationId: string
): { station: ProcessingStation; basket: TeaBasket; revenue: number } | null {
  const station = state.stations.find((s) => s.id === stationId);
  if (!station || station.status !== "processing" || station.currentBasketId === null) {
    return null;
  }

  const basket = state.baskets.find((b) => b.id === station.currentBasketId);
  if (!basket) return null;

  // 制茶完成后品质可能因时间过长而变化
  let finalQuality: TeaQuality = basket.quality;
  if (
    basket.pickedAt !== null &&
    state.session.currentTime - basket.pickedAt > 240
  ) {
    // 采摘后超过4小时未完成制茶，品质降一级
    if (finalQuality === "premium") finalQuality = "normal";
    else if (finalQuality === "normal") finalQuality = "degraded";
  }

  station.outputQuality = finalQuality;
  station.status = "finished";

  const revenue = basket.quantity * QUALITY_PRICES[finalQuality];
  state.session.totalRevenue += revenue;

  state.actions.push(
    createAction(state.session.id, "finish_processing", stationId, state.session.currentTime, {
      stationName: station.name,
      basketId: basket.id.slice(-4),
      quantity: basket.quantity,
      outputQuality: finalQuality,
      revenue,
      totalRevenue: state.session.totalRevenue,
    })
  );

  return { station, basket, revenue };
}

// 结算收益（按局次明细重新计算）- 增强版
export function calculateSettlement(
  state: GameRuntimeState,
  mode: "before" | "after" = "before"
): GameResult {
  let beforePremium = 0;
  let beforeNormal = 0;
  let beforeDegraded = 0;

  state.plants.forEach((plant) => {
    const optimalTime = plant.matureStartTime + Math.floor((plant.matureEndTime - plant.matureStartTime) / 2);
    const { quality } = calculateTeaQuality(plant, optimalTime);
    if (quality === "premium") beforePremium += plant.quantity;
    else if (quality === "normal") beforeNormal += plant.quantity;
    else beforeDegraded += plant.quantity;
  });

  const beforeRevenue =
    beforePremium * QUALITY_PRICES.premium +
    beforeNormal * QUALITY_PRICES.normal +
    beforeDegraded * QUALITY_PRICES.degraded;

  let afterPremium = 0;
  let afterNormal = 0;
  let afterDegraded = 0;
  let totalPicked = 0;

  const pickActions = state.actions.filter((a) => a.actionType === "pick_tea");
  const finishActions = state.actions.filter((a) => a.actionType === "finish_processing");

  const parseDetails = (d: any) => {
    if (typeof d === "string") {
      try { return JSON.parse(d); } catch { return {}; }
    }
    return d || {};
  };

  for (const action of pickActions) {
    const details = parseDetails(action.details);
    const qty = details.quantity || 0;
    const quality = details.quality || "normal";
    totalPicked += qty;
    if (quality === "premium") afterPremium += qty;
    else if (quality === "normal") afterNormal += qty;
    else afterDegraded += qty;
  }

  for (const action of finishActions) {
    const details = parseDetails(action.details);
    const qty = details.quantity || 0;
    const outputQuality = details.outputQuality;
    const pickQuality = details.quality;
    if (outputQuality && pickQuality && outputQuality !== pickQuality) {
      if (pickQuality === "premium") afterPremium -= qty;
      else if (pickQuality === "normal") afterNormal -= qty;
      else afterDegraded -= qty;
      if (outputQuality === "premium") afterPremium += qty;
      else if (outputQuality === "normal") afterNormal += qty;
      else afterDegraded += qty;
    }
    const rev = details.revenue || 0;
    if (mode === "after" && rev > 0) {
      state.session.totalRevenue = (state.session.totalRevenue || 0) * 0 + rev;
    }
  }

  const afterRevenue =
    afterPremium * QUALITY_PRICES.premium +
    afterNormal * QUALITY_PRICES.normal +
    afterDegraded * QUALITY_PRICES.degraded;

  const windAffected = state.windHistory.filter((w) => w.intensity > 0).length;
  const conflictCount = state.conflicts.length;

  const degradeReasons: string[] = [];
  const degradeActions = state.actions.filter((a) => a.actionType === "quality_degrade");
  for (const act of degradeActions) {
    const d = parseDetails(act.details);
    degradeReasons.push(`${minuteToTime(act.timestamp)}: ${d.reason || "品质变化"}`);
  }

  if (mode === "before") {
    return {
      id: generateId("result"),
      sessionId: state.session.id,
      totalTeaPicked: state.plants.reduce((sum, p) => sum + p.quantity, 0),
      premiumCount: beforePremium,
      normalCount: beforeNormal,
      degradedCount: beforeDegraded,
      totalRevenue: beforeRevenue,
      windAffectedCount: windAffected,
      conflictCount,
      settlementDetails: JSON.stringify({
        type: "before",
        description: "计划预估收益（最佳情况）",
        assumptions: "全部茶青按最佳采摘期计算，无风无冲突",
        altitudeBreakdown: state.plants.reduce((acc, p) => {
          acc[p.altitude] = (acc[p.altitude] || 0) + p.quantity;
          return acc;
        }, {} as Record<string, number>),
        qualityBreakdown: {
          premium: beforePremium,
          normal: beforeNormal,
          degraded: beforeDegraded,
        },
        totalConflicts: conflictCount,
      }),
      calculatedAt: Date.now(),
    };
  }

  return {
    id: generateId("result"),
    sessionId: state.session.id,
    totalTeaPicked: totalPicked,
    premiumCount: afterPremium,
    normalCount: afterNormal,
    degradedCount: afterDegraded,
    totalRevenue: afterRevenue,
    windAffectedCount: windAffected,
    conflictCount,
    settlementDetails: JSON.stringify({
      type: "after",
      description: "实际结算收益（按操作记录独立计算）",
      qualityBreakdown: {
        premium: afterPremium,
        normal: afterNormal,
        degraded: afterDegraded,
      },
      windImpact: state.windHistory.map((w) => ({
        time: minuteToTime(w.time),
        intensity: w.intensity,
        reductionPercent: Math.round(w.speedReduction * 100),
      })),
      conflicts: state.conflicts.map((c) => ({
        cableway: c.cablewayId,
        time: minuteToTime(c.startTime),
        duration: c.duration,
        causedDegrade: c.causedDegrade,
      })),
      degradeReasons,
      totalConflicts: conflictCount,
      calculationBasis: "收益依据局次操作记录（pick_tea 和 finish_processing）独立重算，非前端状态",
    }),
    calculatedAt: Date.now(),
  };
}

// 创建操作记录
export function createAction(
  sessionId: string,
  actionType: ActionType,
  targetId: string,
  gameTime: number,
  details: Record<string, unknown>
): GameAction {
  return {
    id: generateId("action"),
    sessionId,
    actionType,
    targetId,
    timestamp: gameTime,
    realTimestamp: Date.now(),
    details: JSON.stringify(details),
  };
}

// 推进游戏时间（模拟时间流逝）- 增强版
export function advanceTime(state: GameRuntimeState, minutes: number): GameRuntimeState {
  let newTime = state.session.currentTime + minutes;
  const newState: GameRuntimeState = JSON.parse(JSON.stringify(state));
  newState.session = { ...state.session, currentTime: newTime, updatedAt: Date.now() };

  // 更新山风状态
  const seed = SEED_DATA[state.session.seedType];
  if (seed) {
    let currentWind = 0;
    for (const wind of seed.windSchedule) {
      if (newTime >= wind.time) {
        currentWind = wind.intensity;
      }
    }
    if (currentWind !== state.session.windIntensity) {
      newState.session.windIntensity = currentWind;
      const windCond: WindCondition = {
        time: newTime,
        intensity: currentWind,
        affectedCableways: state.cableways.map((c) => c.id),
        speedReduction: WIND_SPEED_REDUCTION[currentWind] || 0,
      };
      newState.windHistory = [...state.windHistory, windCond];
      newState.actions.push(
        createAction(state.session.id, "wind_change", "wind", newTime, {
          intensity: currentWind,
          speedReduction: WIND_SPEED_REDUCTION[currentWind],
          description: currentWind === 0 ? "山风停止" : `山风变为${currentWind}级，减速${Math.round(WIND_SPEED_REDUCTION[currentWind] * 100)}%`,
        })
      );
    }
  }

  // 更新茶青品质历史
  const newMaturity: TeaMaturityHistory[] = [];
  state.plants.forEach((plant) => {
    const { quality, reason } = calculateTeaQuality(plant, newTime);
    const lastRecord = state.maturityHistory
      .filter((m) => m.teaPlantId === plant.id)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!lastRecord || lastRecord.quality !== quality) {
      newMaturity.push({
        id: generateId("maturity"),
        sessionId: state.session.id,
        teaPlantId: plant.id,
        altitude: plant.altitude,
        matureStartTime: plant.matureStartTime,
        matureEndTime: plant.matureEndTime,
        quality,
        timestamp: newTime,
      });

      if (lastRecord && lastRecord.quality !== quality) {
        newState.actions.push(
          createAction(state.session.id, "quality_degrade", plant.id, newTime, {
            from: lastRecord.quality,
            to: quality,
            reason: `茶树${plant.id.slice(-4)}: ${reason}`,
            altitude: plant.altitude,
          })
        );
      }
    }
  });

  if (newMaturity.length > 0) {
    newState.maturityHistory = [...state.maturityHistory, ...newMaturity];
  }

  // 检测索道冲突
  const detectedConflicts = detectConflicts(newState);
  if (detectedConflicts.length > 0) {
    newState.conflicts = [...state.conflicts, ...detectedConflicts];
    // 冲突导致的时间延误（增加额外时间）
    const maxDelay = Math.max(...detectedConflicts.map(c => c.duration), 0);
    if (maxDelay > 0) {
      newTime += maxDelay;
      newState.session.currentTime = newTime;
    }
  }

  // 检查并自动完成制茶（如果时间够了）
  const completed = checkProcessingComplete(newState);
  for (const { station } of completed) {
    completeProcessing(newState, station.id);
  }

  return newState;
}

// 游戏分钟转显示时间
function minuteToTime(minute: number): string {
  const hour = Math.floor(minute / 60) + 6;
  const min = minute % 60;
  return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
}

// 调度吊篮到指定位置
export function scheduleBasketMove(
  state: GameRuntimeState,
  basketId: string,
  targetY: number
): { success: boolean; travelTime: number; message: string } {
  const basket = state.baskets.find(b => b.id === basketId);
  if (!basket) return { success: false, travelTime: 0, message: "吊篮不存在" };

  const cableway = state.cableways.find(c => c.id === basket.cableCarId);
  if (!cableway) return { success: false, travelTime: 0, message: "索道不存在" };

  const pos = state.basketPositions[basketId];
  if (!pos) return { success: false, travelTime: 0, message: "位置信息不存在" };

  // 计算移动时间（考虑山风）
  const travelTime = calculateTravelTime(
    cableway,
    pos.currentY,
    targetY,
    state.session.windIntensity
  );

  // 更新位置信息
  const newState = state;
  pos.targetY = targetY;
  pos.state = targetY > pos.currentY ? "moving_down" : "moving_up";
  pos.eta = state.session.currentTime + travelTime;
  pos.currentY = targetY; // 简化：直接移动到目标
  pos.state = targetY < 100 ? "at_station" : "at_plant";

  return {
    success: true,
    travelTime,
    message: `调度完成，预计耗时${travelTime}分钟`,
  };
}
