import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLevels, getPlayer, saveGameState } from '$lib/storage';
import { createGameState } from '$lib/gameEngine';
import { seedLevels } from '$lib/seedData';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { levelId } = data;

    if (levelId === undefined) {
      return json({ error: '缺少关卡ID' }, { status: 400 });
    }

    const player = getPlayer();
    if (!player) {
      return json({ error: '请先创建玩家档案' }, { status: 401 });
    }

    let levels = getLevels();
    if (levels.length === 0) {
      levels = seedLevels;
    }

    const level = levels.find(l => l.id === levelId);
    if (!level) {
      return json({ error: '关卡不存在' }, { status: 404 });
    }

    const gameState = createGameState(level, player.id);
    saveGameState(gameState);

    return json({ gameState, level });
  } catch (e) {
    console.error('Start game error:', e);
    return json({ error: '开始游戏失败' }, { status: 500 });
  }
};
