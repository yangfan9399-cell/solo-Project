import { json } from '@sveltejs/kit';
import { levelsDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const levels = levelsDb.getAll();
	return json(levels);
};
