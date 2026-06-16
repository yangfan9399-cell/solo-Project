import type {
  GameSession,
  PlayerProfile,
  GameLevel,
  OrderWithStatus,
  ActionHistory,
  ActionType,
  WaterClockConfig,
  EnvironmentState,
} from '~/game/types';
import { generateId, generateDailyOrders, advanceDayTemperature, clamp } from '~/game/engine';

export function createNewSession(
  player: PlayerProfile,
  level: GameLevel
): GameSession {
  const startTemp = (level.temperatureRange[0] + level.temperatureRange[1]) / 2;
  const initialOrders = generateDailyOrders(level, 1);

  const session: GameSession = {
    id: generateId(),
    playerId: player.id,
    levelId: level.id,
    startedAt: Date.now(),
    currentDay: 1,
    totalDays: level.days,
    copper: level.startCopper,
    reputation: level.startReputation,
    orders: initialOrders,
    completedOrders: [],
    environment: {
      temperature: startTemp,
      humidity: 50,
    },
    waterClock: {
      holeDiameter: 0.8,
      scaleMarks: 100,
      waterLevel: 50,
      targetDuration: 120,
    },
    history: [],
    historyIndex: -1,
    status: 'playing',
  };

  return session;
}

function createSnapshot(session: GameSession) {
  return {
    copper: session.copper,
    reputation: session.reputation,
    waterClock: { ...session.waterClock },
    orders: session.orders.map((o) => ({ ...o })),
  };
}

export function pushHistory(
  session: GameSession,
  type: ActionType,
  payload: Record<string, unknown>
): GameSession {
  const snapshotBefore = createSnapshot(session);

  const action: ActionHistory = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    dayIndex: session.currentDay,
    payload,
    snapshotBefore,
  };

  const newHistory = session.history.slice(0, session.historyIndex + 1);
  newHistory.push(action);

  return {
    ...session,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

export function canUndo(session: GameSession): boolean {
  return session.historyIndex >= 0;
}

export function canRedo(session: GameSession): boolean {
  return session.historyIndex < session.history.length - 1;
}

export function undoAction(session: GameSession): GameSession {
  if (!canUndo(session)) return session;

  const action = session.history[session.historyIndex];
  const snapshot = action.snapshotBefore;

  return {
    ...session,
    copper: snapshot.copper,
    reputation: snapshot.reputation,
    waterClock: { ...snapshot.waterClock },
    orders: snapshot.orders.map((o) => ({ ...o })),
    historyIndex: session.historyIndex - 1,
  };
}

export function redoAction(session: GameSession): GameSession {
  if (!canRedo(session)) return session;

  const nextIndex = session.historyIndex + 1;
  const newSession = applyHistoryAction(session, session.history[nextIndex]);

  return {
    ...newSession,
    historyIndex: nextIndex,
  };
}

function applyHistoryAction(session: GameSession, action: ActionHistory): GameSession {
  let updated = { ...session };
  const { type, payload } = action;

  switch (type) {
    case 'adjust_hole': {
      updated.waterClock = {
        ...updated.waterClock,
        holeDiameter: payload.holeDiameter as number,
      };
      break;
    }
    case 'adjust_scale': {
      updated.waterClock = {
        ...updated.waterClock,
        scaleMarks: payload.scaleMarks as number,
      };
      break;
    }
    case 'accept_order': {
      const orderId = payload.orderId as string;
      updated.orders = updated.orders.map((o) =>
        o.id === orderId ? { ...o, status: 'accepted' as const } : o
      );
      break;
    }
    case 'complete_order': {
      const orderId = payload.orderId as string;
      const result = payload.result as any;
      const success = payload.success as boolean;
      const reward = payload.reward as number;
      const repReward = payload.repReward as number;
      const penalty = payload.penalty as number;
      const repPenalty = payload.repPenalty as number;

      const order = updated.orders.find((o) => o.id === orderId);
      if (order) {
        const updatedOrder: OrderWithStatus = {
          ...order,
          status: success ? 'completed' : 'failed',
          actualResult: result,
          completedAt: Date.now(),
        };
        updated.orders = updated.orders.filter((o) => o.id !== orderId);
        updated.completedOrders = [...updated.completedOrders, updatedOrder];
        updated.copper += success ? reward : -penalty;
        updated.reputation += success ? repReward : -repPenalty;
        updated.reputation = Math.max(0, updated.reputation);
      }
      break;
    }
    case 'skip_day': {
      const level = payload.level as GameLevel;
      const newOrders = payload.newOrders as OrderWithStatus[];
      const newTemp = payload.newTemp as number;
      const expiringPenalty = payload.expiringPenalty as number;
      const repPenalty = payload.repPenalty as number;

      updated.currentDay = (payload.newDay as number) || updated.currentDay + 1;
      updated.environment = { ...updated.environment, temperature: newTemp };
      updated.orders = [...updated.orders, ...newOrders];
      updated.copper -= expiringPenalty;
      updated.reputation = Math.max(0, updated.reputation - repPenalty);
      break;
    }
    case 'calibrate': {
      updated.waterClock = {
        ...updated.waterClock,
        targetDuration: payload.targetDuration as number,
      };
      break;
    }
  }

  return updated;
}

export function adjustHole(session: GameSession, diameter: number): GameSession {
  const clampedDiameter = clamp(diameter, 0.2, 2.0);
  const updated = pushHistory(session, 'adjust_hole', { holeDiameter: clampedDiameter });
  updated.waterClock = { ...updated.waterClock, holeDiameter: clampedDiameter };
  return updated;
}

export function adjustScale(session: GameSession, scaleMarks: number): GameSession {
  const clampedScale = clamp(scaleMarks, 50, 200);
  const updated = pushHistory(session, 'adjust_scale', { scaleMarks: clampedScale });
  updated.waterClock = { ...updated.waterClock, scaleMarks: clampedScale };
  return updated;
}

export function acceptOrder(session: GameSession, orderId: string): GameSession {
  const order = session.orders.find((o) => o.id === orderId);
  if (!order || order.status !== 'pending') return session;

  const updated = pushHistory(session, 'accept_order', { orderId });
  updated.orders = updated.orders.map((o) =>
    o.id === orderId ? { ...o, status: 'accepted' as const } : o
  );
  return updated;
}

export function completeOrder(
  session: GameSession,
  orderId: string,
  result: any,
  passed: boolean
): GameSession {
  const order = session.orders.find((o) => o.id === orderId);
  if (!order) return session;

  const reward = order.rewardCopper;
  const repReward = order.reputationReward;
  const penalty = Math.floor(order.rewardCopper * 0.3);
  const repPenalty = Math.floor(order.reputationReward * 0.5);

  const updated = pushHistory(session, 'complete_order', {
    orderId,
    result,
    success: passed,
    reward,
    repReward,
    penalty,
    repPenalty,
  });

  const updatedOrder: OrderWithStatus = {
    ...order,
    status: passed ? 'completed' : 'failed',
    actualResult: result,
    completedAt: Date.now(),
  };

  updated.orders = updated.orders.filter((o) => o.id !== orderId);
  updated.completedOrders = [...updated.completedOrders, updatedOrder];
  updated.copper += passed ? reward : -penalty;
  updated.reputation = Math.max(0, updated.reputation + (passed ? repReward : -repPenalty));

  return updated;
}

export function skipToNextDay(session: GameSession, level: GameLevel): GameSession {
  if (session.currentDay >= session.totalDays) return session;

  const newDay = session.currentDay + 1;
  const newTemp = advanceDayTemperature(session.environment.temperature, level);
  const newOrders = generateDailyOrders(level, newDay);

  const expiringOrders = session.orders.filter(
    (o) => o.status === 'accepted' && o.deadline < newDay
  );
  let expiringPenalty = 0;
  let repPenalty = 0;

  const updatedOrders = session.orders
    .map((o) => {
      if (o.status === 'accepted' && o.deadline < newDay) {
        expiringPenalty += Math.floor(o.rewardCopper * 0.2);
        repPenalty += Math.floor(o.reputationReward * 0.3);
        return { ...o, status: 'expired' as const, completedAt: Date.now() };
      }
      return o;
    })
    .filter((o) => o.status !== 'expired');

  const expiredCompleted = session.orders
    .filter((o) => o.status === 'accepted' && o.deadline < newDay)
    .map((o) => ({ ...o, status: 'expired' as const, completedAt: Date.now() }));

  const updated = pushHistory(session, 'skip_day', {
    level,
    newDay,
    newTemp,
    newOrders,
    expiringPenalty,
    repPenalty,
  });

  updated.currentDay = newDay;
  updated.environment = { ...updated.environment, temperature: newTemp };
  updated.orders = [...updatedOrders, ...newOrders];
  updated.completedOrders = [...updated.completedOrders, ...expiredCompleted];
  updated.copper = Math.max(0, updated.copper - expiringPenalty);
  updated.reputation = Math.max(0, updated.reputation - repPenalty);

  return updated;
}
