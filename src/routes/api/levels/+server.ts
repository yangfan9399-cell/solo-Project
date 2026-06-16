import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLevels } from '$lib/storage';
import { seedLevels, initializeSeedData } from '$lib/seedData';

export const GET: RequestHandler = async () => {
  initializeSeedData();
  
  let levels = getLevels();
  if (levels.length === 0) {
    levels = seedLevels;
  }
  
  return json({ levels });
};
