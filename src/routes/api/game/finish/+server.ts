import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { finishGame, getBestSolution, getGameState } from '$lib/store';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.stateId || typeof body.stateId !== 'string') {
		return json({ error: 'stateId is required' }, { status: 400 });
	}

	const state = getGameState(body.stateId);
	if (!state) {
		return json({ error: 'Game state not found' }, { status: 404 });
	}

	const previousBest = state.levelId ? getBestSolution(state.levelId) : undefined;
	const previousBestScore = previousBest ? previousBest.score : 0;

	const gameRecord = finishGame(body.stateId);
	if (!gameRecord) {
		return json({ error: 'Game state not found' }, { status: 404 });
	}

	const finalState = getGameState(body.stateId) || null;
	const newBest = getBestSolution(gameRecord.levelId);
	const bestSolutionUpdated = !!(newBest && newBest.gameRecordId === gameRecord.id);
	const newBestScore = bestSolutionUpdated ? (newBest?.score ?? 0) : previousBestScore;
	const scoreImprovement = bestSolutionUpdated
		? newBestScore - previousBestScore
		: 0;
	const isNewRecord = bestSolutionUpdated && gameRecord.resultRecord.status === 'won' && gameRecord.resultRecord.score > previousBestScore;

	return json({
		gameRecord,
		gameState: finalState,
		bestSolutionUpdated,
		previousBestScore,
		newBestScore,
		scoreImprovement,
		isNewRecord
	});
};
