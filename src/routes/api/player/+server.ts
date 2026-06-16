import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlayer, savePlayer } from '$lib/storage';
import { generateId } from '$lib/gameEngine';
import type { Player } from '$types';

export const GET: RequestHandler = async () => {
  const player = getPlayer();
  return json({ player });
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const { name } = data;

    if (!name || typeof name !== 'string') {
      return json({ error: '玩家名称不能为空' }, { status: 400 });
    }

    const existingPlayer = getPlayer();
    
    let player: Player;
    if (existingPlayer) {
      player = { ...existingPlayer, name: name.trim() };
    } else {
      player = {
        id: generateId(),
        name: name.trim(),
        createdAt: Date.now(),
        totalScore: 0,
        gamesPlayed: 0,
        gamesWon: 0,
        bestLevel: 0
      };
    }

    savePlayer(player);
    return json({ player });
  } catch (e) {
    return json({ error: '创建玩家失败' }, { status: 500 });
  }
};

export const PATCH: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const player = getPlayer();
    
    if (!player) {
      return json({ error: '玩家不存在' }, { status: 404 });
    }

    const updatedPlayer = { ...player, ...data };
    savePlayer(updatedPlayer);
    
    return json({ player: updatedPlayer });
  } catch (e) {
    return json({ error: '更新玩家失败' }, { status: 500 });
  }
};
