import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGameState } from '$lib/store';

export const GET: RequestHandler = async ({ params }) => {
	const gameState = getGameState(params.id);
	if (!gameState) {
		return json({ error: 'Game state not found' }, { status: 404 });
	}
	return json(gameState);
};
