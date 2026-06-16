import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameState, saveGameState } from '$lib/storage';
import { undoOperation } from '$lib/gameEngine';

export const POST: RequestHandler = async ({ params }) => {
  try {
    let gameState = getGameState(params.id);
    
    if (!gameState) {
      return json({ error: '游戏不存在' }, { status: 404 });
    }

    if (gameState.isGameOver) {
      return json({ error: '游戏已结束，无法撤销' }, { status: 400 });
    }

    const previousState = undoOperation(gameState);
    
    if (!previousState) {
      return json({ error: '没有可撤销的操作' }, { status: 400 });
    }

    saveGameState(previousState);

    return json({ gameState: previousState, undone: true });
  } catch (e) {
    return json({ error: '撤销操作失败' }, { status: 500 });
  }
};
