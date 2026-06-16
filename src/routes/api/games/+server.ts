import { json } from '@sveltejs/kit';
import { gamesDb, playersDb, levelsDb } from '$lib/server/db';
import { createInitialGameState, calculateGameResult } from '$lib/game/engine';
import { generateId } from '$lib/server/seed';
import type { RequestHandler } from './$types';
import type { GameState } from '$lib/types/game';

export const GET: RequestHandler = async ({ url }) => {
	const playerId = url.searchParams.get('playerId');
	let games: GameState[];
	if (playerId) {
		games = gamesDb.getByPlayerId(playerId);
	} else {
		games = gamesDb.getAll();
	}
	return json(games);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { playerId, levelId } = body;

	if (!playerId || !levelId) {
		return json({ error: '缺少 playerId 或 levelId' }, { status: 400 });
	}

	const player = playersDb.getById(playerId);
	if (!player) {
		return json({ error: '玩家不存在' }, { status: 404 });
	}

	const level = levelsDb.getById(levelId);
	if (!level) {
		return json({ error: '关卡不存在' }, { status: 404 });
	}

	const initialState = createInitialGameState(playerId, level);
	const game: GameState = {
		...initialState,
		id: generateId()
	};

	gamesDb.create(game);

	playersDb.update(playerId, {
		totalGames: player.totalGames + 1
	});

	return json(game, { status: 201 });
};
