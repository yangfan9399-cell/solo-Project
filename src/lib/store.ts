import type { GameState, GameRecord, BestSolution, Level, Material, SeedSample } from './types';
import { MATERIALS, LEVELS, SEED_SAMPLES, BEST_SOLUTIONS } from './seed-data';
import { simulateBeam, calculateScore, determineFailureReason } from './simulation';

interface Store {
	gameStates: Map<string, GameState>;
	gameRecords: Map<string, GameRecord>;
	bestSolutions: Map<string, BestSolution>;
	levels: Map<string, Level>;
	materials: Map<string, Material>;
	seedSamples: SeedSample[];
}

const store: Store = {
	gameStates: new Map(),
	gameRecords: new Map(),
	bestSolutions: new Map(),
	levels: new Map(),
	materials: new Map(),
	seedSamples: []
};

let initialized = false;

export function initializeStore(): void {
	if (initialized) return;

	for (const mat of MATERIALS) {
		store.materials.set(mat.id, mat);
	}
	for (const level of LEVELS) {
		store.levels.set(level.id, { ...level });
	}

	store.seedSamples = SEED_SAMPLES;

	for (const sample of SEED_SAMPLES) {
		store.gameRecords.set(sample.gameRecord.id, sample.gameRecord);
		store.gameStates.set(sample.beforeSnapshot.id, sample.beforeSnapshot);
		store.gameStates.set(sample.afterSnapshot.id, sample.afterSnapshot);
	}

	for (const best of BEST_SOLUTIONS) {
		store.bestSolutions.set(best.levelId, best);
	}

	initialized = true;
}

export function getLevels(): Level[] {
	initializeStore();
	return Array.from(store.levels.values());
}

export function getLevel(id: string): Level | undefined {
	initializeStore();
	return store.levels.get(id);
}

export function getMaterials(): Material[] {
	initializeStore();
	return Array.from(store.materials.values());
}

export function getGameState(id: string): GameState | undefined {
	initializeStore();
	return store.gameStates.get(id);
}

export function createGameState(levelId: string): GameState | null {
	initializeStore();
	const level = store.levels.get(levelId);
	if (!level) return null;

	const id = `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const currentRotations: Record<string, 0 | 90 | 180 | 270> = {};
	for (const block of level.glassBlocks) {
		currentRotations[block.id] = block.rotation;
	}

	const blocksWithCurrentRotations = level.glassBlocks.map(b => ({
		...b,
		rotation: currentRotations[b.id]
	}));
	const result = simulateBeam(level.lightSource, blocksWithCurrentRotations, level.targetPrism, MATERIALS);

	const state: GameState = {
		id,
		levelId,
		actions: [],
		currentRotations,
		beamSegments: result.segments,
		finalIntensity: result.finalIntensity,
		targetReached: result.targetReached,
		status: 'playing',
		failureReason: determineFailureReason(result, level.targetPrism),
		startTime: Date.now(),
		endTime: null
	};

	store.gameStates.set(id, state);
	return state;
}

export function rotateGlassBlock(
	stateId: string,
	blockId: string,
	delta: 90 | 180 | 270
): GameState | null {
	initializeStore();
	const state = store.gameStates.get(stateId);
	if (!state || state.status !== 'playing') return null;

	const level = store.levels.get(state.levelId);
	if (!level) return null;

	const prevRotation = state.currentRotations[blockId];
	if (prevRotation === undefined) return null;

	const newRotation = ((prevRotation + delta) % 360) as 0 | 90 | 180 | 270;
	state.currentRotations[blockId] = newRotation;

	state.actions.push({
		glassBlockId: blockId,
		rotationDelta: delta,
		timestamp: Date.now(),
		previousRotation: prevRotation,
		newRotation
	});

	const blocksWithCurrentRotations = level.glassBlocks.map(b => ({
		...b,
		rotation: state.currentRotations[b.id]
	}));
	const result = simulateBeam(level.lightSource, blocksWithCurrentRotations, level.targetPrism, MATERIALS);

	state.beamSegments = result.segments;
	state.finalIntensity = result.finalIntensity;
	state.targetReached = result.targetReached;
	state.failureReason = determineFailureReason(result, level.targetPrism);

	store.gameStates.set(stateId, state);
	return state;
}

export function finishGame(stateId: string): GameRecord | null {
	initializeStore();
	const state = store.gameStates.get(stateId);
	if (!state) return null;

	const level = store.levels.get(state.levelId);
	if (!level) return null;

	state.endTime = Date.now();

	const blocksWithCurrentRotations = level.glassBlocks.map(b => ({
		...b,
		rotation: state.currentRotations[b.id]
	}));
	const result = simulateBeam(level.lightSource, blocksWithCurrentRotations, level.targetPrism, MATERIALS);

	const failureReason = determineFailureReason(result, level.targetPrism);
	state.status = result.targetReached ? 'won' : 'lost';
	state.failureReason = failureReason;

	const score = calculateScore(result, state.actions.length, level.parScore);
	const totalAbsorption = result.absorptionEvents.reduce((s, e) => s + e.absorptionLoss, 0);
	const weakest = result.absorptionEvents.length > 0
		? Math.min(...result.absorptionEvents.map(e => e.outputIntensity))
		: result.finalIntensity;

	const record: GameRecord = {
		id: `record-${Date.now()}`,
		levelId: state.levelId,
		mainRecord: {
			playerName: '玩家',
			totalRotations: state.actions.length,
			rotationDetails: [...state.actions]
		},
		detailRecord: {
			beamPathLength: result.segments.length,
			refractionsCount: result.segments.filter(s => s.refractedFrom).length,
			targetPrismReached: result.targetReached,
			finalBeamIntensity: result.finalIntensity
		},
		historyRecord: {
			absorptionEvents: result.absorptionEvents,
			totalAbsorptionLoss: totalAbsorption,
			weakestSegmentIntensity: weakest
		},
		resultRecord: {
			score,
			status: state.status,
			failureReason,
			intensityAtTarget: result.finalIntensity,
			requiredIntensity: level.targetPrism.requiredIntensity,
			intensityDeficit: result.targetReached ? 0 : level.targetPrism.requiredIntensity - result.finalIntensity
		},
		createdAt: Date.now()
	};

	store.gameRecords.set(record.id, record);

	const existingBest = store.bestSolutions.get(state.levelId);
	if (!existingBest || score > existingBest.score) {
		store.bestSolutions.set(state.levelId, {
			levelId: state.levelId,
			score,
			rotationCount: state.actions.length,
			achievedBy: '玩家',
			achievedAt: Date.now(),
			gameRecordId: record.id
		});
	}

	return record;
}

export function getGameRecord(id: string): GameRecord | undefined {
	initializeStore();
	return store.gameRecords.get(id);
}

export function getAllGameRecords(): GameRecord[] {
	initializeStore();
	return Array.from(store.gameRecords.values());
}

export function getBestSolution(levelId: string): BestSolution | undefined {
	initializeStore();
	return store.bestSolutions.get(levelId);
}

export function getAllBestSolutions(): BestSolution[] {
	initializeStore();
	return Array.from(store.bestSolutions.values());
}

export function getSeedSamples(): SeedSample[] {
	initializeStore();
	return store.seedSamples;
}

export function saveLevel(level: Level): Level {
	initializeStore();
	store.levels.set(level.id, { ...level });
	return level;
}

export function deleteLevel(id: string): boolean {
	initializeStore();
	return store.levels.delete(id);
}
