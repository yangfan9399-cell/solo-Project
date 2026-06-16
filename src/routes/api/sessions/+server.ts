import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { store } from '$lib/server/storage';
import type { GameSession, GameEventState } from '$lib/types/game';

export const GET: RequestHandler = async ({ url }) => {
	const sessionId = url.searchParams.get('id');
	const playerId = url.searchParams.get('playerId');

	if (sessionId) {
		const session = store.getSession(sessionId);
		return json(session ? { session } : { session: null });
	}

	if (playerId) {
		return json({ sessions: store.getSessionsByPlayer(playerId) });
	}

	return json({ sessions: [] });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const playerId = body.playerId as string;
	const levelId = body.levelId as string;
	const mapId = body.mapId as string || 'main';

	if (!playerId || !levelId) {
		return json({ error: '缺少必要参数' }, { status: 400 });
	}

	const player = store.getPlayer(playerId);
	const level = store.getLevel(levelId);

	if (!player || !level) {
		return json({ error: '玩家或关卡不存在' }, { status: 404 });
	}

	const id = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

	const initialEventState: GameEventState = {
		activeEvents: level.eventSchedule.map((e) => e.event),
		triggeredAt: {}
	};

	const session: GameSession = {
		id,
		playerId,
		levelId,
		status: 'idle',
		currentStationId: level.startStationId,
		currentLineId: null,
		elapsedSeconds: 0,
		transfersUsed: 0,
		history: {
			actions: [],
			currentStep: 0
		},
		eventState: initialEventState,
		startedAt: null,
		endedAt: null,
		score: null,
		serverScore: null
	};

	store.saveSession(session);
	return json({ session, level, mapId }, { status: 201 });
};
