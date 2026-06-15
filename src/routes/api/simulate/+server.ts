import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { simulateLevel } from '$lib/store';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	if (!body.level || typeof body.level !== 'object') {
		return json({ error: 'level is required' }, { status: 400 });
	}
	try {
		const result = simulateLevel(body.level);
		return json(result);
	} catch (e) {
		return json({ error: 'Invalid level data' }, { status: 400 });
	}
};
