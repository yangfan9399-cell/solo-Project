import { json } from '@sveltejs/kit';
import { playersDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const player = playersDb.getById(params.id);
	if (!player) {
		return json({ error: '玩家不存在' }, { status: 404 });
	}
	return json(player);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await request.json();
	const updated = playersDb.update(params.id, body);
	if (!updated) {
		return json({ error: '玩家不存在' }, { status: 404 });
	}
	return json(updated);
};
