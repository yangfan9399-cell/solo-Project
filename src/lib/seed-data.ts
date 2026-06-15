import type { Material, Level, GameRecord, GameState, SeedSample } from './types';
import { simulateBeam, calculateScore, determineFailureReason } from './simulation';

export const MATERIALS: Material[] = [
	{
		id: 'clear-glass',
		name: '普通玻璃',
		refractiveIndex: 1.52,
		absorptionRate: 0.02,
		color: '#a8d8ea',
		description: '低折射率、低吸收的标准玻璃，适合直线引导'
	},
	{
		id: 'lead-glass-light',
		name: '轻铅玻璃',
		refractiveIndex: 1.72,
		absorptionRate: 0.08,
		color: '#7ec8e3',
		description: '中等折射率，少量吸收，常用于弯折光路'
	},
	{
		id: 'lead-glass-heavy',
		name: '重铅玻璃',
		refractiveIndex: 1.92,
		absorptionRate: 0.18,
		color: '#5b8fb9',
		description: '高折射率但吸收严重，需谨慎使用'
	},
	{
		id: 'flint-glass',
		name: '火石玻璃',
		refractiveIndex: 1.85,
		absorptionRate: 0.12,
		color: '#9b59b6',
		description: '高色散玻璃，折射强烈'
	},
	{
		id: 'crystal-glass',
		name: '水晶玻璃',
		refractiveIndex: 2.0,
		absorptionRate: 0.25,
		color: '#e74c3c',
		description: '极高折射率，但也极高吸收，作为最后手段'
	}
];

export const LEVELS: Level[] = [
	{
		id: 'level-1',
		name: '初识折射',
		description: '旋转矩形玻璃块，将光束引导至目标棱镜。简单直线路径。',
		gridWidth: 6,
		gridHeight: 4,
		lightSource: { gridX: 0, gridY: 1, direction: 'right', intensity: 1.0, color: '#ffdd00' },
		targetPrism: { gridX: 5, gridY: 1, requiredIntensity: 0.3, id: 'target-1' },
		glassBlocks: [
			{ id: 'g1-1', materialId: 'clear-glass', gridX: 2, gridY: 1, rotation: 0, shape: 'rectangle' }
		],
		parScore: 0
	},
	{
		id: 'level-2',
		name: '弯折之路',
		description: '使用三角形玻璃弯折光路。需要找到正确的旋转角度。',
		gridWidth: 7,
		gridHeight: 5,
		lightSource: { gridX: 0, gridY: 2, direction: 'right', intensity: 1.0, color: '#ffdd00' },
		targetPrism: { gridX: 4, gridY: 0, requiredIntensity: 0.3, id: 'target-2' },
		glassBlocks: [
			{ id: 'g2-1', materialId: 'lead-glass-light', gridX: 2, gridY: 2, rotation: 0, shape: 'triangle' },
			{ id: 'g2-2', materialId: 'clear-glass', gridX: 4, gridY: 2, rotation: 0, shape: 'rectangle' }
		],
		parScore: 2
	},
	{
		id: 'level-3',
		name: '吸收陷阱',
		description: '部分玻璃有高吸收损耗，光强过弱无法触发棱镜。需避开高吸收材料。',
		gridWidth: 8,
		gridHeight: 5,
		lightSource: { gridX: 0, gridY: 2, direction: 'right', intensity: 1.0, color: '#ffdd00' },
		targetPrism: { gridX: 7, gridY: 2, requiredIntensity: 0.5, id: 'target-3' },
		glassBlocks: [
			{ id: 'g3-1', materialId: 'lead-glass-heavy', gridX: 2, gridY: 2, rotation: 0, shape: 'rectangle' },
			{ id: 'g3-2', materialId: 'crystal-glass', gridX: 4, gridY: 2, rotation: 0, shape: 'triangle' },
			{ id: 'g3-3', materialId: 'clear-glass', gridX: 3, gridY: 1, rotation: 0, shape: 'rectangle' },
			{ id: 'g3-4', materialId: 'lead-glass-light', gridX: 5, gridY: 1, rotation: 0, shape: 'triangle' }
		],
		parScore: 4
	},
	{
		id: 'level-4',
		name: '棱镜之镜',
		description: '使用棱镜折射和全反射组合，将光束送达远端。',
		gridWidth: 9,
		gridHeight: 6,
		lightSource: { gridX: 0, gridY: 3, direction: 'right', intensity: 1.0, color: '#ffdd00' },
		targetPrism: { gridX: 8, gridY: 1, requiredIntensity: 0.35, id: 'target-4' },
		glassBlocks: [
			{ id: 'g4-1', materialId: 'flint-glass', gridX: 2, gridY: 3, rotation: 0, shape: 'prism' },
			{ id: 'g4-2', materialId: 'lead-glass-light', gridX: 4, gridY: 3, rotation: 0, shape: 'triangle' },
			{ id: 'g4-3', materialId: 'clear-glass', gridX: 6, gridY: 1, rotation: 0, shape: 'rectangle' },
			{ id: 'g4-4', materialId: 'lead-glass-heavy', gridX: 5, gridY: 1, rotation: 0, shape: 'rectangle' }
		],
		parScore: 5
	},
	{
		id: 'level-5',
		name: '终极迷局',
		description: '多段折射、吸收损耗与全反射的综合挑战。',
		gridWidth: 10,
		gridHeight: 7,
		lightSource: { gridX: 0, gridY: 3, direction: 'right', intensity: 1.0, color: '#ffdd00' },
		targetPrism: { gridX: 9, gridY: 0, requiredIntensity: 0.4, id: 'target-5' },
		glassBlocks: [
			{ id: 'g5-1', materialId: 'flint-glass', gridX: 2, gridY: 3, rotation: 0, shape: 'prism' },
			{ id: 'g5-2', materialId: 'lead-glass-light', gridX: 3, gridY: 1, rotation: 0, shape: 'triangle' },
			{ id: 'g5-3', materialId: 'crystal-glass', gridX: 5, gridY: 3, rotation: 0, shape: 'rectangle' },
			{ id: 'g5-4', materialId: 'clear-glass', gridX: 6, gridY: 1, rotation: 0, shape: 'triangle' },
			{ id: 'g5-5', materialId: 'lead-glass-heavy', gridX: 7, gridY: 1, rotation: 0, shape: 'rectangle' },
			{ id: 'g5-6', materialId: 'flint-glass', gridX: 8, gridY: 0, rotation: 0, shape: 'prism' }
		],
		parScore: 6
	}
];

function makeRotation(rotation: number): 0 | 90 | 180 | 270 {
	return (rotation % 360) as 0 | 90 | 180 | 270;
}

function createGameRecordForSeed(
	levelId: string,
	actions: Array<{ blockId: string; delta: 90 | 180 | 270 }>,
	playerName: string,
	createdAt: number
): { gameRecord: GameRecord; beforeState: GameState; afterState: GameState } {
	const level = LEVELS.find(l => l.id === levelId)!;

	const currentRotations: Record<string, 0 | 90 | 180 | 270> = {};
	for (const block of level.glassBlocks) {
		currentRotations[block.id] = block.rotation;
	}

	const beforeRotations = { ...currentRotations };
	const beforeBlocks = level.glassBlocks.map(b => ({ ...b, rotation: beforeRotations[b.id] }));
	const beforeResult = simulateBeam(level.lightSource, beforeBlocks, level.targetPrism, MATERIALS);

	const beforeState: GameState = {
		id: `state-${createdAt}-before`,
		levelId,
		actions: [],
		currentRotations: beforeRotations,
		beamSegments: beforeResult.segments,
		finalIntensity: beforeResult.finalIntensity,
		targetReached: beforeResult.targetReached,
		status: 'playing',
		failureReason: determineFailureReason(beforeResult, level.targetPrism),
		startTime: createdAt,
		endTime: null
	};

	const rotationActions = actions.map((a, i) => {
		const prevRotation = currentRotations[a.blockId];
		const newRotation = makeRotation((prevRotation + a.delta) % 360);
		currentRotations[a.blockId] = newRotation;
		return {
			glassBlockId: a.blockId,
			rotationDelta: a.delta,
			timestamp: createdAt + i * 1000,
			previousRotation: prevRotation,
			newRotation
		};
	});

	const afterBlocks = level.glassBlocks.map(b => ({ ...b, rotation: currentRotations[b.id] }));
	const afterResult = simulateBeam(level.lightSource, afterBlocks, level.targetPrism, MATERIALS);

	const failureReason = determineFailureReason(afterResult, level.targetPrism);
	const afterState: GameState = {
		id: `state-${createdAt}-after`,
		levelId,
		actions: rotationActions,
		currentRotations: { ...currentRotations },
		beamSegments: afterResult.segments,
		finalIntensity: afterResult.finalIntensity,
		targetReached: afterResult.targetReached,
		status: afterResult.targetReached ? 'won' : 'lost',
		failureReason,
		startTime: createdAt,
		endTime: createdAt + actions.length * 1000
	};

	const score = calculateScore(afterResult, actions.length, level.parScore);
	const totalAbsorption = afterResult.absorptionEvents.reduce((s, e) => s + e.absorptionLoss, 0);
	const weakest = afterResult.absorptionEvents.length > 0
		? Math.min(...afterResult.absorptionEvents.map(e => e.outputIntensity))
		: afterResult.finalIntensity;

	const gameRecord: GameRecord = {
		id: `record-${createdAt}`,
		levelId,
		mainRecord: {
			playerName,
			totalRotations: actions.length,
			rotationDetails: rotationActions
		},
		detailRecord: {
			beamPathLength: afterResult.segments.length,
			refractionsCount: afterResult.segments.filter(s => s.refractedFrom).length,
			targetPrismReached: afterResult.targetReached,
			finalBeamIntensity: afterResult.finalIntensity
		},
		historyRecord: {
			absorptionEvents: afterResult.absorptionEvents,
			totalAbsorptionLoss: totalAbsorption,
			weakestSegmentIntensity: weakest
		},
		resultRecord: {
			score,
			status: afterResult.targetReached ? 'won' : 'lost',
			failureReason,
			intensityAtTarget: afterResult.finalIntensity,
			requiredIntensity: level.targetPrism.requiredIntensity,
			intensityDeficit: afterResult.targetReached ? 0 : level.targetPrism.requiredIntensity - afterResult.finalIntensity
		},
		createdAt
	};

	return { gameRecord, beforeState, afterState };
}

export const SEED_SAMPLES: SeedSample[] = [
	(() => {
		const { gameRecord, beforeState, afterState } = createGameRecordForSeed(
			'level-1',
			[],
			'种子玩家A',
			1000000
		);
		return {
			id: 'seed-normal',
			scenario: 'normal_completion' as const,
			description: '第1关无需旋转即可通过，光束直接到达目标棱镜',
			levelId: 'level-1',
			gameRecord,
			beforeSnapshot: beforeState,
			afterSnapshot: afterState
		};
	})(),
	(() => {
		const { gameRecord, beforeState, afterState } = createGameRecordForSeed(
			'level-3',
			[
				{ blockId: 'g3-1', delta: 90 },
				{ blockId: 'g3-2', delta: 90 }
			],
			'种子玩家B',
			2000000
		);
		return {
			id: 'seed-material-exception',
			scenario: 'material_exception' as const,
			description: '第3关使用高吸收材料，光线被完全吸收，材料库触发异常——光强不足',
			levelId: 'level-3',
			gameRecord,
			beforeSnapshot: beforeState,
			afterSnapshot: afterState
		};
	})(),
	(() => {
		const { gameRecord, beforeState, afterState } = createGameRecordForSeed(
			'level-2',
			[
				{ blockId: 'g2-1', delta: 90 },
				{ blockId: 'g2-1', delta: 90 },
				{ blockId: 'g2-1', delta: 180 }
			],
			'种子玩家C',
			3000000
		);
		return {
			id: 'seed-editor-rollback',
			scenario: 'editor_rollback' as const,
			description: '第2关经过多次旋转尝试后回滚，最终重新计算得到正确解法',
			levelId: 'level-2',
			gameRecord,
			beforeSnapshot: beforeState,
			afterSnapshot: afterState
		};
	})()
];

export const BEST_SOLUTIONS: Array<{
	levelId: string;
	score: number;
	rotationCount: number;
	achievedBy: string;
	achievedAt: number;
	gameRecordId: string;
}> = [
	{ levelId: 'level-1', score: 1200, rotationCount: 0, achievedBy: '种子玩家A', achievedAt: 1000000, gameRecordId: 'record-1000000' },
	{ levelId: 'level-2', score: 850, rotationCount: 2, achievedBy: '种子玩家C', achievedAt: 3000000, gameRecordId: 'record-3000000' },
	{ levelId: 'level-3', score: 0, rotationCount: 2, achievedBy: '种子玩家B', achievedAt: 2000000, gameRecordId: 'record-2000000' }
];
