import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameState, saveGameState, removeGameState } from '$lib/storage';

export const GET: RequestHandler = async ({ params }) => {
  const gameState = getGameState(params.id);
  
  if (!gameState) {
    return json({ error: '游戏不存在' }, { status: 404 });
  }
  
  return json({ gameState });
};

export const PATCH: RequestHandler = async ({ params, request }) => {
  try {
    const data = await request.json();
    const existingState = getGameState(params.id);
    
    if (!existingState) {
      return json({ error: '游戏不存在' }, { status: 404 });
    }

    const gameState = { ...existingState, ...data };
    saveGameState(gameState);
    
    return json({ gameState });
  } catch (e) {
    return json({ error: '更新游戏状态失败' }, { status: 500 });
  }
};

export const DELETE: RequestHandler = async ({ params }) => {
  removeGameState(params.id);
  return json({ success: true });
};
