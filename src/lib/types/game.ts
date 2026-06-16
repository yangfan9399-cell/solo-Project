export interface PlayerProfile {
	id: string;
	name: string;
	createdAt: number;
	totalGames: number;
	totalWins: number;
	bestScore: number;
}

export interface Level {
	id: string;
	name: string;
	description: string;
	difficulty: number;
	targetFrequency: number;
	targetGain: number;
	targetAntennaAngle: number;
	noiseLevel: number;
	telemetryMessage: string;
	timeLimit: number;
	parScore: number;
}

export interface GameState {
	id: string;
	playerId: string;
	levelId: string;
	status: 'playing' | 'won' | 'lost';
	score: number;
	startTime: number;
	endTime?: number;
	frequency: number;
	gain: number;
	antennaAngle: number;
	noiseFilter: number;
	decodedChars: string;
	history: GameAction[];
	historyIndex: number;
}

export interface GameAction {
	timestamp: number;
	type: 'frequency' | 'gain' | 'antenna' | 'filter' | 'decode' | 'reset';
	from: number | string;
	to: number | string;
}

export interface GameResult {
	won: boolean;
	score: number;
	frequencyAccuracy: number;
	gainAccuracy: number;
	antennaAccuracy: number;
	decodeProgress: number;
	timeBonus: number;
	levelBonus: number;
}
