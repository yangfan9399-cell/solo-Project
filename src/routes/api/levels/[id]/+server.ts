import { json } from '@sveltejs/kit';
import { levelsDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const level = levelsDb.getById(params.id);
	if (!level) {
		return json({ error: '关卡不存在' }, { status: 404 });
	}
	return json(level);
};
