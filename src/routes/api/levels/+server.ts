import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { store } from '$lib/server/storage';

export const GET: RequestHandler = async ({ url }) => {
	const levelId = url.searchParams.get('id');
	if (levelId) {
		const level = store.getLevel(levelId);
		return json(level ? { level } : { level: null });
	}
	return json({ levels: store.getAllLevels() });
};
