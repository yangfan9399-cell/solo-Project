import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllBestSolutions, getBestSolution } from '$lib/store';

export const GET: RequestHandler = async ({ url }) => {
	const levelId = url.searchParams.get('levelId');
	if (levelId) {
		const solution = getBestSolution(levelId);
		if (!solution) {
			return json({ error: 'Best solution not found for this level' }, { status: 404 });
		}
		return json(solution);
	}
	const solutions = getAllBestSolutions();
	return json(solutions);
};
