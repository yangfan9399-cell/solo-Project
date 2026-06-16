import type { RequestHandler } from '@builder.io/qwik-city';
import {
  createSession,
  getSessionsByPlayer,
  getActiveSessionByPlayer,
  getPlayerById,
  getLevelById,
} from '~/lib/repositories';

export const onGet: RequestHandler = async ({ query, json }) => {
  try {
    const playerId = Number(query.get('playerId'));
    if (!playerId) {
      json(400, { success: false, error: '缺少 playerId 参数' });
      return;
    }
    const sessions = await getSessionsByPlayer(playerId, 50);
    json(200, { success: true, data: sessions });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};

export const onPost: RequestHandler = async ({ request, json }) => {
  try {
    const body = await request.json();
    const { playerId, levelId } = body;

    if (!playerId || !levelId) {
      json(400, { success: false, error: '缺少 playerId 或 levelId' });
      return;
    }

    const player = await getPlayerById(playerId);
    if (!player) {
      json(404, { success: false, error: '玩家不存在' });
      return;
    }

    const level = await getLevelById(levelId);
    if (!level) {
      json(404, { success: false, error: '关卡不存在' });
      return;
    }

    const existingActive = await getActiveSessionByPlayer(playerId);
    if (existingActive) {
      json(409, {
        success: false,
        error: '该玩家已有进行中的局次',
        data: { sessionId: existingActive.id },
      });
      return;
    }

    const session = await createSession(playerId, levelId);
    json(201, { success: true, data: session });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
