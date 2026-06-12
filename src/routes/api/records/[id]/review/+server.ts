import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reviewRecord } from '$lib/services/recordService';
import type { ReviewAction } from '$lib/types';

export const POST: RequestHandler = async ({ params, request }) => {
  try {
    const body = await request.json();
    const { reviewerId, action }: { reviewerId: string; action: ReviewAction } = body;

    if (!reviewerId) {
      throw error(400, 'reviewerId is required');
    }

    if (!action) {
      throw error(400, 'action is required');
    }

    const record = await reviewRecord(params.id, reviewerId, action);

    if (!record) {
      throw error(404, 'Record not found or already archived');
    }

    return json(record);
  } catch (e) {
    console.error('Error reviewing record:', e);
    if (e instanceof Error && e.message.includes('404')) {
      throw error(404, 'Record not found or already archived');
    }
    if (e instanceof Error && e.message.includes('400')) {
      throw error(400, e.message);
    }
    throw error(500, 'Failed to review record');
  }
};
