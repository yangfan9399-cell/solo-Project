import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getExceptionRecords } from '$lib/services/recordService';

export const GET: RequestHandler = async () => {
  try {
    const exceptions = await getExceptionRecords();
    return json(exceptions);
  } catch (e) {
    console.error('Error fetching exception records:', e);
    throw error(500, 'Failed to fetch exception records');
  }
};
