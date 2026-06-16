import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { store } from '$lib/server/storage';
import type { PlayerProfile } from '$lib/types/game';

export const GET: RequestHandler = async ({ url }) => {
	const playerId = url.searchParams.get('id');
	if (playerId) {
		const player = store.getPlayer(playerId);
		return json(player ? { player } : { player: null });
	}
	return json({ players: store.getAllPlayers() });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const name = (body.name as string)?.trim() || '匿名玩家';
	const avatar = body.avatar || '🚇';

	const id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
	const player: PlayerProfile = {
		id,
		name,
		avatar,
		createdAt: Date.now(),
		totalGames: 0,
		totalWins: 0,
		bestScores: {},
		completedLevels: []
	};

	store.savePlayer(player);
	return json({ player }, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const id = body.id as string;
	if (!id) {
		return json({ error: '缺少玩家ID' }, { status: 400 });
	}

	const existing = store.getPlayer(id);
	if (!existing) {
		return json({ error: '玩家不存在' }, { status: 404 });
	}

	const updated: PlayerProfile = {
		...existing,
		name: body.name || existing.name,
		avatar: body.avatar || existing.avatar
	};

	store.savePlayer(updated);
	return json({ player: updated });
};
