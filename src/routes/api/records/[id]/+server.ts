import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameRecord } from '$lib/store';

export const GET: RequestHandler = async ({ params }) => {
	const record = getGameRecord(params.id);
	if (!record) {
		return json({ error: 'Game record not found' }, { status: 404 });
	}
	return json(record);
};
