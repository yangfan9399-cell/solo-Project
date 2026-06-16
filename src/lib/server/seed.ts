import { playersDb, levelsDb, gamesDb } from './db';
import type { PlayerProfile, Level, GameState } from '$lib/types/game';
import { nanoid } from 'nanoid';

const seedLevels: Level[] = [
	{
		id: 'level-001',
		name: '初级校准训练',
		description: '熟悉基本操作，校准低强度信号',
		difficulty: 1,
		targetFrequency: 1420.5,
		targetGain: 50,
		targetAntennaAngle: 30,
		noiseLevel: 0.2,
		telemetryMessage: 'HELLO',
		timeLimit: 180,
		parScore: 800
	},
	{
		id: 'level-002',
		name: '中频信号捕获',
		description: '中等噪声环境下的信号校准',
		difficulty: 2,
		targetFrequency: 8450.0,
		targetGain: 75,
		targetAntennaAngle: 45,
		noiseLevel: 0.4,
		telemetryMessage: 'DEEP SPACE',
		timeLimit: 240,
		parScore: 1200
	},
	{
		id: 'level-003',
		name: '深空遥测解码',
		description: '高噪声环境，完整解码遥测信息',
		difficulty: 3,
		targetFrequency: 2295.0,
		targetGain: 65,
		targetAntennaAngle: 60,
		noiseLevel: 0.6,
		telemetryMessage: 'MARS PROBE OK',
		timeLimit: 300,
		parScore: 1800
	},
	{
		id: 'level-004',
		name: '星际信标定位',
		description: '极弱信号，精确天线角度校准',
		difficulty: 4,
		targetFrequency: 5678.25,
		targetGain: 90,
		targetAntennaAngle: 72.5,
		noiseLevel: 0.75,
		telemetryMessage: 'VOYAGER SIGNAL',
		timeLimit: 360,
		parScore: 2500
	},
	{
		id: 'level-005',
		name: '黑洞边缘探测',
		description: '极限挑战，全参数精确校准',
		difficulty: 5,
		targetFrequency: 9123.75,
		targetGain: 95,
		targetAntennaAngle: 88.8,
		noiseLevel: 0.9,
		telemetryMessage: 'EVENT HORIZON DATA',
		timeLimit: 420,
		parScore: 4000
	}
];

const seedPlayer: PlayerProfile = {
	id: 'player-local-001',
	name: '本地指挥官',
	createdAt: Date.now(),
	totalGames: 3,
	totalWins: 2,
	bestScore: 1450
};

const seedGames: GameState[] = [
	{
		id: 'game-seed-001',
		playerId: 'player-local-001',
		levelId: 'level-001',
		status: 'won',
		score: 950,
		startTime: Date.now() - 86400000 * 2,
		endTime: Date.now() - 86400000 * 2 + 120000,
		frequency: 1420.5,
		gain: 50,
		antennaAngle: 30,
		noiseFilter: 0.5,
		decodedChars: 'HELLO',
		history: [],
		historyIndex: -1
	},
	{
		id: 'game-seed-002',
		playerId: 'player-local-001',
		levelId: 'level-002',
		status: 'won',
		score: 1450,
		startTime: Date.now() - 86400000,
		endTime: Date.now() - 86400000 + 180000,
		frequency: 8450.0,
		gain: 75,
		antennaAngle: 45,
		noiseFilter: 0.6,
		decodedChars: 'DEEP SPACE',
		history: [],
		historyIndex: -1
	},
	{
		id: 'game-seed-003',
		playerId: 'player-local-001',
		levelId: 'level-003',
		status: 'lost',
		score: 320,
		startTime: Date.now() - 3600000,
		endTime: Date.now() - 3000000,
		frequency: 2100.0,
		gain: 40,
		antennaAngle: 30,
		noiseFilter: 0.3,
		decodedChars: 'MARS',
		history: [],
		historyIndex: -1
	}
];

export function initializeSeedData(): void {
	const existingLevels = levelsDb.getAll();
	if (existingLevels.length === 0) {
		levelsDb.bulkUpsert(seedLevels);
		console.log('[Seed] 关卡数据已初始化');
	} else {
		console.log('[Seed] 关卡数据已存在，跳过');
	}

	const existingPlayers = playersDb.getAll();
	if (existingPlayers.length === 0) {
		playersDb.create(seedPlayer);
		console.log('[Seed] 玩家档案已初始化');
	} else {
		console.log('[Seed] 玩家档案已存在，跳过');
	}

	const existingGames = gamesDb.getAll();
	if (existingGames.length === 0) {
		for (const game of seedGames) {
			gamesDb.create(game);
		}
		console.log('[Seed] 局次记录已初始化');
	} else {
		console.log('[Seed] 局次记录已存在，跳过');
	}
}

export function generateId(): string {
	return nanoid(12);
}
