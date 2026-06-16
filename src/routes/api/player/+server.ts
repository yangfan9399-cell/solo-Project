import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPlayer, updatePlayer } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id') ?? 'player-1';
	const player = await getPlayer(id);
	if (!player) {
		return json({ error: 'Player not found' }, { status: 404 });
	}
	return json(player);
};

export const PUT: RequestHandler = async ({ request }) => {
	const player = await request.json();
	const updated = await updatePlayer(player);
	return json(updated);
};
