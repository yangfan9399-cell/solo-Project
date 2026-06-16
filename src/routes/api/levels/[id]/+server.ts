import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLevels } from '$lib/storage';
import { seedLevels, initializeSeedData } from '$lib/seedData';

export const GET: RequestHandler = async ({ params }) => {
  initializeSeedData();
  
  const levelId = parseInt(params.id, 10);
  
  let levels = getLevels();
  if (levels.length === 0) {
    levels = seedLevels;
  }
  
  const level = levels.find(l => l.id === levelId);
  
  if (!level) {
    return json({ error: '关卡不存在' }, { status: 404 });
  }
  
  return json({ level });
};
