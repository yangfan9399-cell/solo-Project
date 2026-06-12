import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reprocessRecord } from '$lib/services/recordService';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { handlerId, reason }: { handlerId: string; reason: string } = body;

    if (!handlerId) {
      throw error(400, 'handlerId is required');
    }

    if (!reason) {
      throw error(400, 'reason is required');
    }

    const record = await reprocessRecord(params.id, handlerId, reason);

    if (!record) {
      throw error(404, 'Record not found or not archived');
    }

    return json(record);
  } catch (e) {
    console.error('Error reprocessing record:', e);
    if (e instanceof Error && e.message.includes('404')) {
      throw error(404, 'Record not found or not archived');
    }
    if (e instanceof Error && e.message.includes('400')) {
      throw error(400, e.message);
    }
    throw error(500, 'Failed to reprocess record');
  }
};
