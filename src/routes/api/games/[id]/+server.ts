import { json } from '@sveltejs/kit';
import { gamesDb, levelsDb, playersDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const game = gamesDb.getById(params.id);
	if (!game) {
		return json({ error: '游戏不存在' }, { status: 404 });
	}
	return json(game);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const updated = gamesDb.update(params.id, body);
	if (!updated) {
		return json({ error: '游戏不存在' }, { status: 404 });
	}
	return json(updated);
};
