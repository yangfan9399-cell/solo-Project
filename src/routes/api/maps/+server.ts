import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { store } from '$lib/server/storage';
import { initialSubwayMap } from '$lib/data/initialData';

export const GET: RequestHandler = async ({ url }) => {
	const mapId = url.searchParams.get('id') || 'main';
	const map = store.getMap(mapId) || initialSubwayMap;
	return json({ map });
};
