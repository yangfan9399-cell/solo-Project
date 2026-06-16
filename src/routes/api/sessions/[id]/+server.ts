import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { store } from '$lib/server/storage';
import { calculateScore, validateRoute, getRating } from '$lib/server/scoring';
import type { GameSession, PlayerAction, GameEventState, GameResult } from '$lib/types/game';

function applyRewind(session: GameSession): GameSession {
	const { actions, currentStep } = session.history;
	if (currentStep >= actions.length) return session;

	const level = store.getLevel(session.levelId);
	if (!level) return session;

	const keptActions = actions.slice(0, currentStep);
	let currentStation = level.startStationId;
	let currentLine: string | null = null;
	let elapsed = 0;
	let transfers = 0;
	const eventState: GameEventState = {
		activeEvents: session.eventState.activeEvents,
		triggeredAt: {}
	};

	for (const scheduled of level.eventSchedule) {
		if (scheduled.time <= elapsed) {
			eventState.triggeredAt[getEventKey(scheduled.event)] = scheduled.time;
		}
	}

	for (const action of keptActions) {
		switch (action.type) {
			case 'MOVE':
				currentStation = action.toStationId;
				elapsed += action.timeSpent;
				break;
			case 'TRANSFER':
				currentLine = action.toLineId;
				transfers++;
				elapsed += action.timeSpent;
				break;
			case 'WAIT':
			case 'TICK':
				elapsed += action.timeSpent;
				break;
		}
		for (const scheduled of level.eventSchedule) {
			if (scheduled.time <= elapsed && !eventState.triggeredAt[getEventKey(scheduled.event)]) {
				eventState.triggeredAt[getEventKey(scheduled.event)] = scheduled.time;
			}
		}
	}

	return {
		...session,
		currentStationId: currentStation,
		currentLineId: currentLine,
		elapsedSeconds: elapsed,
		transfersUsed: transfers,
		eventState,
		history: {
			actions: keptActions,
			currentStep: keptActions.length
		}
	};
}

function getEventKey(event: { type: string; stationId?: string; lineId?: string }): string {
	switch (event.type) {
		case 'STATION_CLOSED':
			return `${event.type}:${event.stationId}`;
		case 'ESCALATOR_DOWN':
			return `${event.type}:${event.stationId}:${event.lineId}`;
		case 'DELAY':
			return `${event.type}:${event.lineId}`;
		default:
			return event.type;
	}
}

export const POST: RequestHandler = async ({ request, params }) => {
	const sessionId = params.id;
	const body = await request.json();
	const action = body.action as PlayerAction | 'START' | 'FINISH' | 'PAUSE' | 'RESUME' | 'RESET';

	const session = store.getSession(sessionId);
	if (!session) {
		return json({ error: '局次不存在' }, { status: 404 });
	}

	const level = store.getLevel(session.levelId);
	if (!level) {
		return json({ error: '关卡不存在' }, { status: 404 });
	}

	let updatedSession = { ...session };

	if (action === 'START') {
		updatedSession.status = 'playing';
		updatedSession.startedAt = Date.now();
	} else if (action === 'PAUSE') {
		updatedSession.status = 'paused';
	} else if (action === 'RESUME') {
		updatedSession.status = 'playing';
	} else if (action === 'FINISH') {
		const validation = validateRoute(
			updatedSession.history.actions,
			level.startStationId,
			level.targetStationId
		);
		const won = validation.valid && updatedSession.elapsedSeconds <= level.timeLimitSeconds;

		updatedSession.status = won ? 'won' : 'lost';
		updatedSession.endedAt = Date.now();

		const serverScore = calculateScore(updatedSession, level, updatedSession.eventState);
		updatedSession.serverScore = serverScore.total;
		updatedSession.score = serverScore.total;

		const player = store.getPlayer(updatedSession.playerId);
		if (player) {
			player.totalGames++;
			if (won) {
				player.totalWins++;
				if (!player.completedLevels.includes(level.id)) {
					player.completedLevels.push(level.id);
				}
				if (!player.bestScores[level.id] || serverScore.total > player.bestScores[level.id]) {
					player.bestScores[level.id] = serverScore.total;
				}
			}
			store.savePlayer(player);
		}

		const route: { stationId: string; lineId: string | null }[] = [
			{ stationId: level.startStationId, lineId: null }
		];
		for (const a of updatedSession.history.actions) {
			if (a.type === 'MOVE') {
				route.push({ stationId: a.toStationId, lineId: a.lineId });
			}
		}

		const result: GameResult = {
			sessionId: updatedSession.id,
			won,
			reason: won ? '成功抵达目的地' : validation.valid ? '超时失败' : '路线无效',
			elapsedSeconds: updatedSession.elapsedSeconds,
			transfersUsed: updatedSession.transfersUsed,
			score: serverScore,
			route
		};

		store.saveSession(updatedSession);

		const rating = getRating(serverScore.total, level.difficulty);

		return json({
			session: updatedSession,
			result,
			rating
		});
	} else if (action === 'RESET') {
		updatedSession.status = 'idle';
		updatedSession.currentStationId = level.startStationId;
		updatedSession.currentLineId = null;
		updatedSession.elapsedSeconds = 0;
		updatedSession.transfersUsed = 0;
		updatedSession.history = { actions: [], currentStep: 0 };
		updatedSession.eventState = {
			activeEvents: level.eventSchedule.map((e) => e.event),
			triggeredAt: {}
		};
		updatedSession.startedAt = null;
		updatedSession.endedAt = null;
		updatedSession.score = null;
		updatedSession.serverScore = null;
	} else if (typeof action === 'object' && action.type === 'REWIND') {
		updatedSession.history.currentStep = action.toStep;
		updatedSession = applyRewind(updatedSession);
	} else if (typeof action === 'object') {
		if (updatedSession.status !== 'playing') {
			return json({ error: '游戏未开始' }, { status: 400 });
		}

		if (action.type === 'TICK') {
			updatedSession.elapsedSeconds += action.timeSpent;
		} else {
			const newActions = [...updatedSession.history.actions.slice(0, updatedSession.history.currentStep), action];
			updatedSession.history = {
				actions: newActions,
				currentStep: newActions.length
			};

			if (action.type === 'MOVE') {
				updatedSession.currentStationId = action.toStationId;
				updatedSession.currentLineId = action.lineId;
				updatedSession.elapsedSeconds += action.timeSpent;
			} else if (action.type === 'TRANSFER') {
				updatedSession.currentLineId = action.toLineId;
				updatedSession.transfersUsed++;
				updatedSession.elapsedSeconds += action.timeSpent;
			} else if (action.type === 'WAIT') {
				updatedSession.elapsedSeconds += action.timeSpent;
			}
		}

		for (const scheduled of level.eventSchedule) {
			if (scheduled.time <= updatedSession.elapsedSeconds && !updatedSession.eventState.triggeredAt[getEventKey(scheduled.event)]) {
				updatedSession.eventState.triggeredAt[getEventKey(scheduled.event)] = scheduled.time;
			}
		}

		if (updatedSession.elapsedSeconds >= level.timeLimitSeconds) {
			updatedSession.status = 'lost';
			updatedSession.endedAt = Date.now();
			const serverScore = calculateScore(updatedSession, level, updatedSession.eventState);
			updatedSession.serverScore = serverScore.total;
			updatedSession.score = serverScore.total;

			const player = store.getPlayer(updatedSession.playerId);
			if (player) {
				player.totalGames++;
				store.savePlayer(player);
			}
		}
	}

	store.saveSession(updatedSession);

	let previewScore: ReturnType<typeof calculateScore> | null = null;
	if (updatedSession.status === 'won' || updatedSession.status === 'lost') {
		previewScore = calculateScore(updatedSession, level, updatedSession.eventState);
	} else if (updatedSession.status === 'playing') {
		const baseScore = updatedSession.transfersUsed > level.maxTransfers ? 0 : 500;
		const timeRatio = updatedSession.elapsedSeconds / Math.max(1, level.parTime);
		const timeBonus = timeRatio <= 1.0 ? Math.round(300 * (1 - (timeRatio - 0.5) * 0.8)) : 0;
		const transferDiff = level.parTransfers - updatedSession.transfersUsed;
		const transferBonus = transferDiff >= 0 ? transferDiff * 150 : transferDiff * 80;
		previewScore = {
			baseScore,
			timeBonus: Math.max(0, timeBonus),
			transferBonus,
			eventPenalty: 0,
			total: Math.max(0, baseScore + Math.max(0, timeBonus) + transferBonus),
			serverValidated: false
		};
	}

	return json({
		session: updatedSession,
		previewScore
	});
};
