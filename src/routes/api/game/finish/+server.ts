import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { finishGame, getBestSolution, getGameState } from '$lib/store';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.stateId || typeof body.stateId !== 'string') {
		return json({ error: 'stateId is required' }, { status: 400 });
	}
	const previousBest = getBestSolution(body.stateId ? '' : '');
	const gameRecord = finishGame(body.stateId);
	if (!gameRecord) {
		return json({ error: 'Game state not found' }, { status: 404 });
	}
	const finalState = getGameState(body.stateId) || null;
	const newBest = getBestSolution(gameRecord.levelId);
	const bestSolutionUpdated = newBest && newBest.gameRecordId === gameRecord.id;
	const previousBestScore = newBest
		? (gameRecord.resultRecord.score >= newBest.score
			? newBest.score - gameRecord.resultRecord.score
			: newBest.score)
		: 0;

	return json({
		gameRecord,
		gameState: finalState,
		bestSolutionUpdated,
		previousBestScore: bestSolutionUpdated ? (newBest?.score ?? 0) - gameRecord.resultRecord.score : 0,
		isNewRecord: bestSolutionUpdated && gameRecord.resultRecord.status === 'won'
	});
};
