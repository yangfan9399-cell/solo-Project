import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameHistory, getLevels } from '$lib/storage';
import { seedLevels } from '$lib/seedData';
import { replayOperations } from '$lib/gameEngine';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const history = getGameHistory();
    const gameResult = history.find(h => h.gameId === params.gameId);
    
    if (!gameResult) {
      return json({ error: '游戏记录不存在' }, { status: 404 });
    }

    let levels = getLevels();
    if (levels.length === 0) {
      levels = seedLevels;
    }

    const level = levels.find(l => l.id === gameResult.levelId);
    if (!level) {
      return json({ error: '关卡不存在' }, { status: 404 });
    }

    const stepStr = url.searchParams.get('step');
    const step = stepStr ? parseInt(stepStr, 10) : -1;

    return json({
      gameResult,
      level,
      totalOperations: gameResult.operationsPerformed,
      currentStep: step
    });
  } catch (e) {
    return json({ error: '获取回放数据失败' }, { status: 500 });
  }
};
