import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllRecords, getStatistics } from '$lib/services/recordService';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const status = url.searchParams.get('status') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const venue = url.searchParams.get('venue') || undefined;
    const search = url.searchParams.get('search') || undefined;
    const includeStats = url.searchParams.get('includeStats') === 'true';

    const records = await getAllRecords({ status, type, venue, search });

    if (includeStats) {
      const stats = await getStatistics();
      return json({ records, statistics: stats });
    }

    return json(records);
  } catch (e) {
    console.error('Error fetching records:', e);
    throw error(500, 'Failed to fetch records');
  }
};
