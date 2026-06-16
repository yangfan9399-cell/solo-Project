import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession, updateSession } from '$lib/server/db';
import type { Operation, Session } from '$lib/data/types';

export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('sessionId');
	if (!sessionId) return json({ error: 'Missing sessionId' }, { status: 400 });

	const session = await getSession(sessionId);
	if (!session) return json({ error: 'Session not found' }, { status: 404 });

	return json({ operations: session.operations, undoCount: 0 });
};

export const POST: RequestHandler = async ({ request }) => {
	const { sessionId, operation } = (await request.json()) as {
		sessionId: string;
		operation: Operation;
	};

	const session = await getSession(sessionId);
	if (!session) return json({ error: 'Session not found' }, { status: 404 });

	session.operations.push(operation);
	if (operation.type === 'place') {
		session.buildings.push(operation.building);
	} else {
		session.buildings = session.buildings.filter((b) => b.id !== operation.building.id);
	}
	session.updatedAt = Date.now();

	await updateSession(session);
	return json(session);
};

export const PUT: RequestHandler = async ({ request }) => {
	const { sessionId, action } = (await request.json()) as {
		sessionId: string;
		action: 'undo' | 'redo';
	};

	const session = await getSession(sessionId);
	if (!session) return json({ error: 'Session not found' }, { status: 404 });

	if (action === 'undo' && session.operations.length > 0) {
		const lastOp = session.operations.pop()!;
		if (lastOp.type === 'place') {
			session.buildings = session.buildings.filter((b) => b.id !== lastOp.building.id);
		} else {
			session.buildings.push(lastOp.building);
		}
	}

	session.updatedAt = Date.now();
	await updateSession(session);
	return json(session);
};
