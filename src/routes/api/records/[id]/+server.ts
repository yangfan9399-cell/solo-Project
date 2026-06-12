import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRecordById } from '$lib/services/recordService';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const record = await getRecordById(params.id);
    if (!record) {
      throw error(404, 'Record not found');
    }
    return json(record);
  } catch (e) {
    console.error('Error fetching record:', e);
    if (e instanceof Error && e.message.includes('404')) {
      throw error(404, 'Record not found');
    }
    throw error(500, 'Failed to fetch record');
  }
};
