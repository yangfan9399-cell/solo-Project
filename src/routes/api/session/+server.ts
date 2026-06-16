import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSession, getSession, updateSession, getSessionsForPlayer, getSessionsForLevel } from '$lib/server/db';
import type { Session } from '$lib/data/types';

export const GET: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	const playerId = url.searchParams.get('playerId');
	const levelId = url.searchParams.get('levelId');

	if (id) {
		const session = await getSession(id);
		if (!session) return json({ error: 'Session not found' }, { status: 404 });
		return json(session);
	}
	if (playerId && levelId) {
		const sessions = await getSessionsForLevel(playerId, levelId);
		return json(sessions);
	}
	if (playerId) {
		const sessions = await getSessionsForPlayer(playerId);
		return json(sessions);
	}
	return json({ error: 'Missing query params' }, { status: 400 });
};

export const POST: RequestHandler = async ({ request }) => {
	const session: Session = await request.json();
	const created = await createSession(session);
	return json(created);
};

export const PUT: RequestHandler = async ({ request }) => {
	const session: Session = await request.json();
	const updated = await updateSession(session);
	return json(updated);
};
