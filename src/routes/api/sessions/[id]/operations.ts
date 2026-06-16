import type { RequestHandler } from '@builder.io/qwik-city';
import {
  getSessionById,
  getLevelById,
  addOperation,
  updateSession,
  getOperationCount,
  getOperationsBySession,
  deleteLastOperation,
} from '~/lib/repositories';
import { validateOperation, applyOperationToBalance, getEnergyCost } from '~/lib/scoring';
import type { Operation, OperationType } from '~/types/game';

function computeBalance(leftWeights: number[], rightWeights: number[]): number {
  const leftSum = leftWeights.reduce((a, b) => a + b, 0);
  const rightSum = rightWeights.reduce((a, b) => a + b, 0);
  return leftSum - rightSum;
}

function applyWeightsOp(
  type: OperationType,
  left: number[],
  right: number[],
  payload: Record<string, unknown>
): { leftWeights: number[]; rightWeights: number[]; ok: boolean; reason?: string } {
  const mass = (payload.mass as number) || 5;
  let lw = [...left];
  let rw = [...right];

  switch (type) {
    case 'ADD_WEIGHT_LEFT':
      lw.push(mass);
      break;
    case 'ADD_WEIGHT_RIGHT':
      rw.push(mass);
      break;
    case 'REMOVE_WEIGHT_LEFT':
      if (lw.length === 0) return { leftWeights: lw, rightWeights: rw, ok: false, reason: '左侧配重已空' };
      lw.pop();
      break;
    case 'REMOVE_WEIGHT_RIGHT':
      if (rw.length === 0) return { leftWeights: lw, rightWeights: rw, ok: false, reason: '右侧配重已空' };
      rw.pop();
      break;
    case 'SWAP_WEIGHTS': {
      const tmp = lw;
      lw = rw;
      rw = tmp;
      break;
    }
    case 'EMERGENCY_BALANCE': {
      const total = [...lw, ...rw];
      const half = Math.floor(total.length / 2);
      lw = total.slice(0, half);
      rw = total.slice(half);
      break;
    }
  }
  return { leftWeights: lw, rightWeights: rw, ok: true };
}

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

    const leftBefore = session.leftWeights || [];
    const rightBefore = session.rightWeights || [];

    const weightsResult = applyWeightsOp(type, leftBefore, rightBefore, payload);
    if (!weightsResult.ok) {
      json(400, { success: false, error: weightsResult.reason || '操作失败' });
      return;
    }
    const leftAfter = weightsResult.leftWeights;
    const rightAfter = weightsResult.rightWeights;

    const balanceAfter = computeBalance(leftAfter, rightAfter);

    const validation = validateOperation(type, session.energy, balanceAfter, level.balance_threshold);
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
      leftWeightsBefore: leftBefore,
      leftWeightsAfter: leftAfter,
      rightWeightsBefore: rightBefore,
      rightWeightsAfter: rightAfter,
    });

    await updateSession(sessionId, {
      current_floor: floorAfter,
      balance: balanceAfter,
      energy: energyAfter,
      left_weights: JSON.stringify(leftAfter),
      right_weights: JSON.stringify(rightAfter),
    } as never);

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
          leftWeights: leftAfter,
          rightWeights: rightAfter,
        },
        gameStatus,
      },
    });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};

export const onDelete: RequestHandler = async ({ params, json }) => {
  try {
    const sessionId = Number(params.id);
    const session = await getSessionById(sessionId);
    if (!session) {
      json(404, { success: false, error: '局次不存在' });
      return;
    }
    if (session.status !== 'playing') {
      json(409, { success: false, error: '局次已结束，无法撤销' });
      return;
    }

    const operations = await getOperationsBySession(sessionId);
    if (operations.length === 0) {
      json(400, { success: false, error: '没有可撤销的操作' });
      return;
    }

    const lastOp = operations[operations.length - 1];
    const prevFloor = lastOp.floor_before;
    const prevBalance = lastOp.balance_before;
    const prevEnergy = lastOp.energy_before;
    const prevLeft = lastOp.leftWeightsBefore || session.leftWeights;
    const prevRight = lastOp.rightWeightsBefore || session.rightWeights;

    await deleteLastOperation(sessionId);

    await updateSession(sessionId, {
      current_floor: prevFloor,
      balance: prevBalance,
      energy: prevEnergy,
      left_weights: JSON.stringify(prevLeft),
      right_weights: JSON.stringify(prevRight),
    } as never);

    json(200, {
      success: true,
      data: {
        reverted: lastOp,
        state: {
          current_floor: prevFloor,
          balance: prevBalance,
          energy: prevEnergy,
          leftWeights: prevLeft,
          rightWeights: prevRight,
        },
      },
    });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
