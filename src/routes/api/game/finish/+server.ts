import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { finishGame } from '$lib/store';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.stateId || typeof body.stateId !== 'string') {
		return json({ error: 'stateId is required' }, { status: 400 });
	}
	const record = finishGame(body.stateId);
	if (!record) {
		return json({ error: 'Game state not found' }, { status: 404 });
	}
	return json(record);
};
