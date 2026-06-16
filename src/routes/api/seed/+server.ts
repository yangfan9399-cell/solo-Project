import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeSeedData, seedLevels, seedPlayer, seedHistory } from '$lib/seedData';
import { saveLevels, savePlayer, saveGameResult, isSeedInitialized, markSeedInitialized, getLevels, getPlayer, getGameHistory } from '$lib/storage';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    const force = data?.force === true;

    if (!force && isSeedInitialized()) {
      return json({ 
        initialized: true, 
        message: '种子数据已初始化',
        levels: getLevels().length,
        hasPlayer: !!getPlayer(),
        historyCount: getGameHistory().length
      });
    }

    saveLevels(seedLevels);
    savePlayer(seedPlayer);
    
    seedHistory.forEach(result => {
      saveGameResult(result);
    });

    markSeedInitialized();

    return json({
      initialized: true,
      message: '种子数据已重置',
      levels: seedLevels.length,
      player: seedPlayer,
      historyCount: seedHistory.length
    });
  } catch (e) {
    console.error('Seed init error:', e);
    return json({ error: '初始化种子数据失败' }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  initializeSeedData();
  
  return json({
    initialized: isSeedInitialized(),
    levels: seedLevels.map(l => ({ id: l.id, name: l.name, difficulty: l.difficulty })),
    player: seedPlayer,
    sampleHistory: seedHistory
  });
};
