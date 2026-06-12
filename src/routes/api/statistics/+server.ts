import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getStatistics } from '$lib/services/recordService';

export const GET: RequestHandler = async () => {
  try {
    const stats = await getStatistics();
    return json(stats);
  } catch (e) {
    console.error('Error fetching statistics:', e);
    throw error(500, 'Failed to fetch statistics');
  }
};
