export interface Station {
	id: string;
	name: string;
	lineIds: string[];
	x: number;
	y: number;
	isTransfer: boolean;
}

export interface Line {
	id: string;
	name: string;
	color: string;
	stationIds: string[];
}

export interface Connection {
	from: string;
	to: string;
	lineId: string;
	travelTime: number;
}

export interface SubwayMap {
	stations: Record<string, Station>;
	lines: Record<string, Line>;
	connections: Connection[];
}

export type GameEvent =
	| { type: 'ESCALATOR_DOWN'; stationId: string; lineId: string; duration: number }
	| { type: 'STATION_CLOSED'; stationId: string; duration: number }
	| { type: 'DELAY'; lineId: string; duration: number; extraTime: number };

export interface GameEventState {
	activeEvents: GameEvent[];
	triggeredAt: Record<string, number>;
}

export interface LevelConfig {
	id: string;
	name: string;
	description: string;
	mapId: string;
	startStationId: string;
	targetStationId: string;
	timeLimitSeconds: number;
	lastTrainCountdown: number;
	maxTransfers: number;
	difficulty: 'easy' | 'medium' | 'hard';
	eventSchedule: { time: number; event: GameEvent }[];
	parTime: number;
	parTransfers: number;
}

export type PlayerAction =
	| { type: 'MOVE'; fromStationId: string; toStationId: string; lineId: string; timeSpent: number }
	| { type: 'TRANSFER'; stationId: string; fromLineId: string; toLineId: string; timeSpent: number }
	| { type: 'WAIT'; stationId: string; timeSpent: number }
	| { type: 'REWIND'; toStep: number }
	| { type: 'TICK'; timeSpent: number };

export interface GameHistory {
	actions: PlayerAction[];
	currentStep: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost' | 'abandoned';

export interface GameSession {
	id: string;
	playerId: string;
	levelId: string;
	status: GameStatus;
	currentStationId: string;
	currentLineId: string | null;
	elapsedSeconds: number;
	transfersUsed: number;
	history: GameHistory;
	eventState: GameEventState;
	startedAt: number | null;
	endedAt: number | null;
	score: number | null;
	serverScore: number | null;
}

export interface PlayerProfile {
	id: string;
	name: string;
	avatar: string;
	createdAt: number;
	totalGames: number;
	totalWins: number;
	bestScores: Record<string, number>;
	completedLevels: string[];
}

export interface ScoreBreakdown {
	baseScore: number;
	timeBonus: number;
	transferBonus: number;
	eventPenalty: number;
	total: number;
	serverValidated: boolean;
}

export interface GameResult {
	sessionId: string;
	won: boolean;
	reason: string;
	elapsedSeconds: number;
	transfersUsed: number;
	score: ScoreBreakdown;
	route: { stationId: string; lineId: string | null }[];
}
