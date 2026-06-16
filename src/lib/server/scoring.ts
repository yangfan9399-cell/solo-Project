import type { ScoreBreakdown, GameSession, LevelConfig, PlayerAction, GameEventState } from '../types/game';

export function calculateScore(
	session: GameSession,
	level: LevelConfig,
	eventState: GameEventState
): ScoreBreakdown {
	const won = session.status === 'won';
	const elapsed = session.elapsedSeconds;
	const transfers = session.transfersUsed;

	let baseScore = 0;
	if (won) {
		baseScore = 1000;
		switch (level.difficulty) {
			case 'easy':
				baseScore = 1000;
				break;
			case 'medium':
				baseScore = 2000;
				break;
			case 'hard':
				baseScore = 3500;
				break;
		}
	}

	const timeRatio = elapsed / level.parTime;
	let timeBonus = 0;
	if (won) {
		if (timeRatio <= 1.0) {
			timeBonus = Math.round(500 * (1 - (timeRatio - 0.5) * 0.8));
		} else if (timeRatio <= 1.5) {
			timeBonus = Math.round(200 * (1.5 - timeRatio) / 0.5);
		}
		timeBonus = Math.max(0, timeBonus);
	}

	let transferBonus = 0;
	if (won) {
		const transferDiff = level.parTransfers - transfers;
		if (transferDiff >= 0) {
			transferBonus = transferDiff * 200;
		} else {
			transferBonus = transferDiff * 100;
		}
	}

	const eventPenalty = calculateEventPenalty(session.history.actions, eventState);

	const total = Math.max(0, baseScore + timeBonus + transferBonus - eventPenalty);

	return {
		baseScore,
		timeBonus,
		transferBonus,
		eventPenalty,
		total,
		serverValidated: true
	};
}

function calculateEventPenalty(actions: PlayerAction[], _eventState: GameEventState): number {
	let penalty = 0;
	let waitedTime = 0;

	for (const action of actions) {
		if (action.type === 'WAIT') {
			waitedTime += action.timeSpent;
		}
	}

	penalty += waitedTime * 15;

	let detourCount = 0;
	const visitedStations = new Set<string>();
	for (const action of actions) {
		if (action.type === 'MOVE') {
			if (visitedStations.has(action.toStationId)) {
				detourCount++;
			}
			visitedStations.add(action.toStationId);
		}
	}
	penalty += detourCount * 50;

	return penalty;
}

export function validateRoute(
	actions: PlayerAction[],
	startStationId: string,
	endStationId: string
): { valid: boolean; endStation: string; totalTime: number; totalTransfers: number } {
	let currentStation = startStationId;
	let totalTime = 0;
	let totalTransfers = 0;

	for (const action of actions) {
		switch (action.type) {
			case 'MOVE':
				if (action.fromStationId !== currentStation) {
					return { valid: false, endStation: currentStation, totalTime, totalTransfers };
				}
				currentStation = action.toStationId;
				totalTime += action.timeSpent;
				break;
			case 'TRANSFER':
				if (action.stationId !== currentStation) {
					return { valid: false, endStation: currentStation, totalTime, totalTransfers };
				}
				totalTransfers++;
				totalTime += action.timeSpent;
				break;
			case 'WAIT':
				totalTime += action.timeSpent;
				break;
		}
	}

	return {
		valid: currentStation === endStationId,
		endStation: currentStation,
		totalTime,
		totalTransfers
	};
}

export function getRating(score: number, difficulty: 'easy' | 'medium' | 'hard'): { stars: number; label: string } {
	const thresholds = {
		easy: [800, 1200, 1500, 1800],
		medium: [1500, 2000, 2500, 3000],
		hard: [2500, 3200, 4000, 4800]
	};

	const t = thresholds[difficulty];
	let stars = 1;
	if (score >= t[0]) stars = 1;
	if (score >= t[1]) stars = 2;
	if (score >= t[2]) stars = 3;
	if (score >= t[3]) stars = 4;
	if (score >= t[3] * 1.1) stars = 5;

	const labels = ['继续加油', '不错', '很好', '优秀', '完美', '传奇'];
	return { stars, label: labels[stars - 1] || labels[0] };
}
