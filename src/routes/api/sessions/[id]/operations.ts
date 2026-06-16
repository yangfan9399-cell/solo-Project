import type { RequestHandler } from '@builder.io/qwik-city';
import {
  getSessionById,
  getLevelById,
  addOperation,
  updateSession,
  getOperationCount,
  getOperationsBySession,
} from '~/lib/repositories';
import { validateOperation, applyOperationToBalance, getEnergyCost, calculateScore } from '~/lib/scoring';
import type { Operation, OperationType } from '~/types/game';

export const onGet: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = Number(params.id);
    const session = await getSessionById(sessionId);
    if (!session) {
      json(404, { success: false, error: '局次不存在' });
      return;
    }

    const operations = await getOperationsBySession(sessionId);
    json(200, { success: true, data: operations });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};

export const onPost: RequestHandler = async ({ params, request, json }) => {
  try {
    const sessionId = Number(params.id);
    const session = await getSessionById(sessionId);
    if (!session) {
      json(404, { success: false, error: '局次不存在' });
      return;
    }

    if (session.status !== 'playing') {
      json(409, { success: false, error: `该局次已结束 (${session.status})` });
      return;
    }

    const body = await request.json();
    const { type, payload = {} } = body as { type: OperationType; payload?: Record<string, unknown> };

    const level = await getLevelById(session.level_id);
    if (!level) {
      json(500, { success: false, error: '关联关卡不存在' });
      return;
    }

    const validation = validateOperation(type, session.energy, session.balance, level.balance_threshold);
    if (!validation.valid) {
      json(400, { success: false, error: validation.reason });
      return;
    }

    const floorBefore = session.current_floor;
    const balanceBefore = session.balance;
    const energyBefore = session.energy;

    let floorAfter = floorBefore;
    if (type === 'MOVE_UP') {
      floorAfter = Math.min(level.target_floor, floorBefore + 1);
    } else if (type === 'MOVE_DOWN') {
      floorAfter = Math.max(0, floorBefore - 1);
    }

    const balanceAfter = applyOperationToBalance(type, balanceBefore, payload);

    const rawCost = getEnergyCost(type);
    let energyAfter = energyBefore - rawCost;
    if (type === 'CHARGE_ENERGY') {
      energyAfter = Math.min(session.max_energy, energyBefore + 25);
    }
    energyAfter = Math.max(0, energyAfter);

    const sequence = (await getOperationCount(sessionId)) + 1;

    const operation = await addOperation({
      session_id: sessionId,
      type,
      payload,
      floor_before: floorBefore,
      floor_after: floorAfter,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      energy_before: energyBefore,
      energy_after: energyAfter,
      sequence,
    });

    await updateSession(sessionId, {
      current_floor: floorAfter,
      balance: balanceAfter,
      energy: energyAfter,
    });

    let gameStatus: 'playing' | 'won' | 'lost' = 'playing';
    if (floorAfter >= level.target_floor) {
      gameStatus = 'won';
    } else if (energyAfter <= 0 && type !== 'CHARGE_ENERGY') {
      gameStatus = 'lost';
    } else if (Math.abs(balanceAfter) > level.balance_threshold * 2.5) {
      gameStatus = 'lost';
    }

    json(200, {
      success: true,
      data: {
        operation: operation as Operation,
        state: {
          current_floor: floorAfter,
          balance: balanceAfter,
          energy: energyAfter,
          target_floor: level.target_floor,
          max_energy: session.max_energy,
          balance_threshold: level.balance_threshold,
        },
        gameStatus,
      },
    });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
