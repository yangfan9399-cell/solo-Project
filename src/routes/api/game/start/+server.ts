import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createGameState } from '$lib/store';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.levelId || typeof body.levelId !== 'string') {
		return json({ error: 'levelId is required' }, { status: 400 });
	}
	const gameState = createGameState(body.levelId);
	if (!gameState) {
		return json({ error: 'Level not found' }, { status: 404 });
	}
	return json(gameState);
};
