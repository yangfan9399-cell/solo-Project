import { json } from '@sveltejs/kit';
import { gamesDb, levelsDb, playersDb } from '$lib/server/db';
import { calculateGameResult } from '$lib/game/engine';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const game = gamesDb.getById(params.id);
	if (!game) {
		return json({ error: '游戏不存在' }, { status: 404 });
	}

	const level = levelsDb.getById(game.levelId);
	if (!level) {
		return json({ error: '关卡不存在' }, { status: 404 });
	}

	if (game.status !== 'playing') {
		return json({ error: '游戏已结束' }, { status: 400 });
	}

	const endTime = Date.now();
	const gameWithEndTime = { ...game, endTime };

	const result = calculateGameResult(gameWithEndTime, level);

	const status = result.won ? 'won' : 'lost';

	const updatedGame = gamesDb.update(params.id, {
		status,
		score: result.score,
		endTime
	});

	const player = playersDb.getById(game.playerId);
	if (player) {
		const newWins = result.won ? player.totalWins + 1 : player.totalWins;
		const newBest = Math.max(player.bestScore, result.score);
		playersDb.update(player.id, {
			totalWins: newWins,
			bestScore: newBest
		});
	}

	return json({
		game: updatedGame,
		result,
		level
	});
};
