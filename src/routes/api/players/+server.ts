import { json } from '@sveltejs/kit';
import { playersDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const players = playersDb.getAll();
	return json(players);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { name } = body;

	if (!name || name.trim().length === 0) {
		return json({ error: '玩家名称不能为空' }, { status: 400 });
	}

	const newPlayer = {
		id: `player-${Date.now()}`,
		name: name.trim(),
		createdAt: Date.now(),
		totalGames: 0,
		totalWins: 0,
		bestScore: 0
	};

	playersDb.create(newPlayer);
	return json(newPlayer, { status: 201 });
};
