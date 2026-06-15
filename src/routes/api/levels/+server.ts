import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLevels } from '$lib/store';

export const GET: RequestHandler = async () => {
	const levels = getLevels();
	return json(levels);
};
