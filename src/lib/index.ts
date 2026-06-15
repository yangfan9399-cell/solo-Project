export { MATERIALS, LEVELS, SEED_SAMPLES, BEST_SOLUTIONS } from './seed-data';
export { simulateBeam, calculateScore, determineFailureReason } from './simulation';
export {
	initializeStore,
	getLevels,
	getLevel,
	getMaterials,
	createGameState,
	rotateGlassBlock,
	finishGame,
	getGameRecord,
	getAllGameRecords,
	getBestSolution,
	getAllBestSolutions,
	getSeedSamples,
	saveLevel,
	deleteLevel
} from './store';
export type {
	Direction,
	Rotation,
	Point,
	BeamSegment,
	Material,
	GlassBlock,
	LightSource,
	TargetPrism,
	Level,
	RotationAction,
	GameState,
	GameRecord,
	AbsorptionEvent,
	BestSolution,
	LevelEditorState,
	SeedSample
} from './types';
