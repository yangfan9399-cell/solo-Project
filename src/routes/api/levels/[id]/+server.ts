import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getLevel, saveLevel, deleteLevel } from '$lib/store';
import type { Level } from '$lib/types';

export const GET: RequestHandler = async ({ params }) => {
	const level = getLevel(params.id);
	if (!level) {
		return json({ error: 'Level not found' }, { status: 404 });
	}
	return json(level);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const body: Level = await request.json();
	if (body.id !== params.id) {
		return json({ error: 'Level ID mismatch' }, { status: 400 });
	}
	const saved = saveLevel(body);
	return json(saved);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const deleted = deleteLevel(params.id);
	if (!deleted) {
		return json({ error: 'Level not found' }, { status: 404 });
	}
	return json({ success: true });
};
