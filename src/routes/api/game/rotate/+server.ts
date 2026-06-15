import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { rotateGlassBlock } from '$lib/store';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.stateId || typeof body.stateId !== 'string') {
		return json({ error: 'stateId is required' }, { status: 400 });
	}
	if (!body.blockId || typeof body.blockId !== 'string') {
		return json({ error: 'blockId is required' }, { status: 400 });
	}
	if (![90, 180, 270].includes(body.delta)) {
		return json({ error: 'delta must be 90, 180, or 270' }, { status: 400 });
	}
	const gameState = rotateGlassBlock(body.stateId, body.blockId, body.delta);
	if (!gameState) {
		return json({ error: 'Game state not found or game is not in progress' }, { status: 404 });
	}
	return json(gameState);
};
