import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameHistory } from '$lib/storage';

export const GET: RequestHandler = async ({ url }) => {
  const history = getGameHistory();
  
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const levelId = url.searchParams.get('levelId');
  const victoryOnly = url.searchParams.get('victory') === 'true';

  let filtered = history;
  
  if (levelId) {
    filtered = filtered.filter(h => h.levelId === parseInt(levelId, 10));
  }
  
  if (victoryOnly) {
    filtered = filtered.filter(h => h.victory);
  }

  return json({ 
    history: filtered.slice(0, limit),
    total: filtered.length
  });
};
