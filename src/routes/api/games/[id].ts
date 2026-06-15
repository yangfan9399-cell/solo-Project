import { APIEvent, json } from "solid-start/api";
import { getActiveGame, persistGameState, getSession } from "../../../server/gameStore";
import { advanceTime, calculateSettlement, createAction, calculateTeaQuality, completeProcessing, scheduleBasketMove, calculateTravelTime } from "../../../server/gameEngine";
import { QUALITY_PRICES } from "../../../server/gameData";
import type { GameAction, TeaPlant, TeaBasket, ProcessingStation } from "../../../types/game";

// 获取游戏状态
export async function GET({ params }: APIEvent) {
  try {
    const sessionId = params.id;
    const state = getActiveGame(sessionId);

    if (!state) {
      const session = getSession(sessionId);
      if (!session) {
        return json(
          { success: false, error: "游戏不存在" },
          { status: 404 }
        );
      }
      return json({
        success: true,
        data: {
          session,
          fromCache: false,
        },
      });
    }

    return json({
      success: true,
      data: {
        session: state.session,
        plants: state.plants,
        cableways: state.cableways,
        stations: state.stations,
        baskets: state.baskets,
        basketPositions: state.basketPositions,
        conflicts: state.conflicts,
        windHistory: state.windHistory,
        maturityHistory: state.maturityHistory,
        actions: state.actions,
        fromCache: true,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

// 推进时间
export async function PUT({ params, request }: APIEvent) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const minutes = body.minutes || 30;

    let state = getActiveGame(sessionId);
    if (!state) {
      return json(
        { success: false, error: "游戏不在运行中" },
        { status: 404 }
      );
    }

    if (state.session.phase === "settled") {
      return json(
        { success: false, error: "游戏已结算，无法推进时间" },
        { status: 400 }
      );
    }

    if (state.session.phase === "planning") {
      return json(
        { success: false, error: "请先点击「开始游戏」进入采摘阶段" },
        { status: 400 }
      );
    }

    const previousTime = state.session.currentTime;
    state = advanceTime(state, minutes);
    persistGameState(state);

    return json({
      success: true,
      data: {
        session: state.session,
        windHistory: state.windHistory,
        maturityHistory: state.maturityHistory,
        conflicts: state.conflicts,
        actions: state.actions.slice(-10),
        stations: state.stations,
        timeAdvanced: state.session.currentTime - previousTime,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

// 执行操作
export async function POST({ params, request }: APIEvent) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { actionType, targetId, details } = body;

    let state = getActiveGame(sessionId);
    if (!state) {
      return json(
        { success: false, error: "游戏不在运行中" },
        { status: 404 }
      );
    }

    if (state.session.phase === "settled") {
      return json(
        { success: false, error: "游戏已结算，无法执行操作" },
        { status: 400 }
      );
    }

    if (actionType !== "start_game" && state.session.phase === "planning") {
      return json(
        { success: false, error: "请先点击「开始游戏」进入采摘阶段" },
        { status: 400 }
      );
    }

    let result: Record<string, any> = {};

    switch (actionType) {
      case "schedule_basket":
        result = handleScheduleBasket(state, details);
        state.actions.push(
          createAction(
            sessionId,
            actionType,
            targetId,
            state.session.currentTime,
            { ...details, ...result }
          )
        );
        break;

      case "pick_tea":
        result = handlePickTea(state, details);
        break;

      case "send_to_station":
        result = handleSendToStation(state, details);
        state.actions.push(
          createAction(
            sessionId,
            actionType,
            targetId,
            state.session.currentTime,
            { ...details, ...result }
          )
        );
        break;

      case "start_processing":
        result = handleStartProcessing(state, details);
        break;

      case "finish_processing":
        result = handleFinishProcessing(state, details);
        break;

      case "start_game":
        state.session.phase = "picking";
        result = { phase: "picking", message: "游戏开始！开始你的茶园采摘吧" };
        state.actions.push(
          createAction(
            sessionId,
            actionType,
            sessionId,
            state.session.currentTime,
            { phase: "picking" }
          )
        );
        break;

      default:
        return json(
          { success: false, error: `未知操作类型: ${actionType}` },
          { status: 400 }
        );
    }

    state.session.updatedAt = Date.now();
    persistGameState(state);

    return json({
      success: true,
      data: {
        ...result,
        session: state.session,
      },
    });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

function handleScheduleBasket(state: any, details: any): Record<string, any> {
  const { basketId, plantId, stationId } = details;
  const basket = state.baskets.find((b: any) => b.id === basketId);
  if (!basket) {
    throw new Error("吊篮不存在");
  }

  const cableway = state.cableways.find((c: any) => c.id === basket.cableCarId);
  if (!cableway) {
    throw new Error("索道不存在");
  }

  let targetY: number;
  let targetName: string;

  if (plantId) {
    const plant = state.plants.find((p: any) => p.id === plantId);
    if (!plant) throw new Error("茶树不存在");
    targetY = plant.positionY;
    targetName = `茶树 ${plantId.slice(-4)}`;
  } else if (stationId) {
    const station = state.stations.find((s: any) => s.id === stationId);
    if (!station) throw new Error("工位不存在");
    targetY = station.positionY;
    targetName = station.name;
  } else {
    targetY = cableway.startY;
    targetName = "山脚起点";
  }

  const moveResult = scheduleBasketMove(state, basketId, targetY);
  if (!moveResult.success) {
    throw new Error(moveResult.message);
  }

  if (plantId || stationId) {
    const pos = state.basketPositions[basketId];
    if (pos && moveResult.travelTime > 0) {
      const stateAfter = advanceTime(state, moveResult.travelTime);
      Object.assign(state.session, stateAfter.session);
      state.windHistory = stateAfter.windHistory;
      state.maturityHistory = stateAfter.maturityHistory;
      state.conflicts = stateAfter.conflicts;
      state.stations = stateAfter.stations;
      const newActions = stateAfter.actions.filter(
        (a: GameAction) => !state.actions.some((ea: GameAction) => ea.id === a.id)
      );
      state.actions.push(...newActions);
    }
  }

  return {
    basketId,
    targetY,
    targetName,
    travelTime: moveResult.travelTime,
    scheduled: true,
  };
}

function handlePickTea(state: any, details: any): Record<string, any> {
  const { basketId, plantId, quantity } = details;
  const basket = state.baskets.find((b: any) => b.id === basketId);
  const plant = state.plants.find((p: any) => p.id === plantId);

  if (!basket || !plant) {
    throw new Error("吊篮或茶树不存在");
  }

  if (plant.quantity < quantity) {
    throw new Error(`茶青数量不足（剩余${plant.quantity}）`);
  }

  if (quantity <= 0) {
    throw new Error("采摘数量必须大于0");
  }

  if (basket.quantity > 0) {
    throw new Error("吊篮已有茶青，请先送往制茶工位");
  }

  const pos = state.basketPositions[basketId];
  if (pos && Math.abs(pos.currentY - plant.positionY) > 50) {
    throw new Error("吊篮未到达该茶树位置，请先调度吊篮");
  }

  const { quality, reason } = calculateTeaQuality(plant as TeaPlant, state.session.currentTime);

  basket.teaPlantId = plantId;
  basket.quantity = quantity;
  basket.quality = quality;
  basket.pickedAt = state.session.currentTime;

  plant.quantity -= quantity;

  if (pos) {
    pos.state = "at_plant";
  }

  state.actions.push(
    createAction(
      state.session.id,
      "pick_tea",
      basketId,
      state.session.currentTime,
      {
        basketId,
        plantId,
        plantAltitude: plant.altitude,
        quantity,
        quality,
        reason,
        pricePerUnit: QUALITY_PRICES[quality],
        subtotal: quantity * QUALITY_PRICES[quality],
        remainingPlantQuantity: plant.quantity,
      }
    )
  );

  return {
    basketId,
    quantity,
    quality,
    reason,
    pricePerUnit: QUALITY_PRICES[quality],
    subtotal: quantity * QUALITY_PRICES[quality],
    remainingPlantQuantity: plant.quantity,
    message: `采摘成功：${quantity}单位 ${getQualityText(quality)} 茶青，预估价值¥${quantity * QUALITY_PRICES[quality]}`,
  };
}

function handleSendToStation(state: any, details: any): Record<string, any> {
  const { basketId, stationId } = details;
  const basket = state.baskets.find((b: any) => b.id === basketId);
  const station = state.stations.find((s: any) => s.id === stationId);

  if (!basket || !station) {
    throw new Error("吊篮或工位不存在");
  }

  if (basket.quantity === 0) {
    throw new Error("吊篮为空，无法运送");
  }

  if (station.status !== "idle") {
    throw new Error(`${station.name} 正在使用中`);
  }

  const cableway = state.cableways.find((c: any) => c.id === basket.cableCarId);
  const pos = state.basketPositions[basketId];
  if (!pos) {
    throw new Error("位置信息缺失");
  }
  const travelTime = calculateTravelTime(
    cableway,
    pos.currentY,
    station.positionY,
    state.session.windIntensity
  );

  pos.currentY = station.positionY;
  pos.targetY = station.positionY;
  pos.state = "at_station";

  if (travelTime > 0) {
    const stateAfter = advanceTime(state, travelTime);
    Object.assign(state.session, stateAfter.session);
    state.windHistory = stateAfter.windHistory;
    state.maturityHistory = stateAfter.maturityHistory;
    state.conflicts = stateAfter.conflicts;
    state.stations = stateAfter.stations;
    const newActions = stateAfter.actions.filter(
      (a: GameAction) => !state.actions.some((ea: GameAction) => ea.id === a.id)
    );
    state.actions.push(...newActions);
  }

  return {
    basketId,
    stationId,
    stationName: station.name,
    travelTime,
    sent: true,
    message: `茶青已送达 ${station.name}，耗时${travelTime}分钟`,
  };
}

function handleStartProcessing(state: any, details: any): Record<string, any> {
  const { stationId, basketId } = details;
  const station = state.stations.find((s: any) => s.id === stationId);
  const basket = state.baskets.find((b: any) => b.id === basketId);

  if (!station || !basket) {
    throw new Error("工位或吊篮不存在");
  }

  if (station.status !== "idle") {
    throw new Error(`${station.name} 正在使用中`);
  }

  if (basket.quantity === 0) {
    throw new Error("吊篮为空");
  }

  const pos = state.basketPositions[basketId];
  if (pos && Math.abs(pos.currentY - station.positionY) > 30) {
    throw new Error("吊篮未在工位旁，请先调度吊篮到工位");
  }

  station.status = "processing";
  station.currentBasketId = basketId;
  station.processStartTime = state.session.currentTime;

  state.actions.push(
    createAction(
      state.session.id,
      "start_processing",
      stationId,
      state.session.currentTime,
      {
        stationId,
        stationName: station.name,
        basketId,
        basketQuantity: basket.quantity,
        basketQuality: basket.quality,
        startTime: state.session.currentTime,
        duration: station.processDuration,
        estimatedFinish: state.session.currentTime + station.processDuration,
      }
    )
  );

  return {
    stationId,
    basketId,
    stationName: station.name,
    startTime: state.session.currentTime,
    duration: station.processDuration,
    estimatedFinish: state.session.currentTime + station.processDuration,
    message: `${station.name} 开始制茶，预计耗时 ${station.processDuration} 分钟`,
  };
}

function handleFinishProcessing(state: any, details: any): Record<string, any> {
  const { stationId } = details;
  const station = state.stations.find((s: any) => s.id === stationId);

  if (!station) {
    throw new Error("工位不存在");
  }

  if (station.status !== "processing") {
    throw new Error(`${station.name} 未在制茶中`);
  }

  if (station.processStartTime === null) {
    throw new Error("制茶开始时间记录错误");
  }

  const elapsed = state.session.currentTime - station.processStartTime;
  if (elapsed < station.processDuration) {
    const remaining = station.processDuration - elapsed;
    throw new Error(`制茶尚未完成，还需 ${remaining} 分钟（请先推进时间）`);
  }

  const result = completeProcessing(state, stationId);
  if (!result) {
    throw new Error("制茶完成失败");
  }

  const basket = state.baskets.find((b: any) => b.id === station.currentBasketId);
  if (basket) {
    basket.teaPlantId = null;
    basket.quantity = 0;
    basket.pickedAt = null;
    const pos = state.basketPositions[basket.id];
    if (pos) pos.state = "at_station";
  }

  return {
    stationId,
    stationName: result.station.name,
    outputQuality: result.station.outputQuality,
    quantity: result.basket.quantity,
    revenue: result.revenue,
    totalRevenue: state.session.totalRevenue,
    message: `制茶完成！${result.basket.quantity}单位 ${getQualityText(result.station.outputQuality || "normal")} 茶叶，收益¥${result.revenue}`,
  };
}

function getQualityText(quality: string): string {
  switch (quality) {
    case "premium":
      return "特级";
    case "normal":
      return "普通";
    case "degraded":
      return "降级";
    default:
      return quality;
  }
}
