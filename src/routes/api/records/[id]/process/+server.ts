import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processRecord } from '$lib/services/recordService';
import type { ProcessingAction } from '$lib/types';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { handlerId, action }: { handlerId: string; action: ProcessingAction } = body;

    if (!handlerId) {
      throw error(400, 'handlerId is required');
    }

    if (!action) {
      throw error(400, 'action is required');
    }

    const record = await processRecord(params.id, handlerId, action);

    if (!record) {
      throw error(404, 'Record not found or already archived');
    }

    return json(record);
  } catch (e) {
    console.error('Error processing record:', e);
    if (e instanceof Error && e.message.includes('404')) {
      throw error(404, 'Record not found or already archived');
    }
    if (e instanceof Error && e.message.includes('400')) {
      throw error(400, e.message);
    }
    throw error(500, 'Failed to process record');
  }
};
