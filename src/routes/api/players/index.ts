import type { RequestHandler } from '@builder.io/qwik-city';
import { getAllPlayers, getPlayerById, createPlayer, getPlayerByName } from '~/lib/repositories';

export const onGet: RequestHandler = async ({ json }) => {
  try {
    const players = await getAllPlayers();
    json(200, { success: true, data: players });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};

export const onPost: RequestHandler = async ({ request, json }) => {
  try {
    const body = await request.json();
    const { name, avatar = '👨‍🚀' } = body;

    if (!name || name.length < 2) {
      json(400, { success: false, error: '玩家名称至少需要 2 个字符' });
      return;
    }

    const existing = await getPlayerByName(name);
    if (existing) {
      json(409, { success: false, error: '该玩家名称已存在' });
      return;
    }

    const player = await createPlayer(name, avatar);
    json(201, { success: true, data: player });
  } catch (error) {
    json(500, { success: false, error: (error as Error).message });
  }
};
