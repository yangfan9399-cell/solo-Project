export type Direction = 'up' | 'down' | 'left' | 'right';

export type Rotation = 0 | 90 | 180 | 270;

export interface Point {
	x: number;
	y: number;
}

export interface BeamSegment {
	start: Point;
	end: Point;
	intensity: number;
	direction: Direction;
	refractedFrom?: string;
}

export interface Material {
	id: string;
	name: string;
	refractiveIndex: number;
	absorptionRate: number;
	color: string;
	description: string;
}

export interface GlassBlock {
	id: string;
	materialId: string;
	gridX: number;
	gridY: number;
	rotation: Rotation;
	shape: 'rectangle' | 'triangle' | 'prism';
}

export interface LightSource {
	gridX: number;
	gridY: number;
	direction: Direction;
	intensity: number;
	color: string;
}

export interface TargetPrism {
	gridX: number;
	gridY: number;
	requiredIntensity: number;
	id: string;
}

export interface Level {
	id: string;
	name: string;
	description: string;
	gridWidth: number;
	gridHeight: number;
	glassBlocks: GlassBlock[];
	lightSource: LightSource;
	targetPrism: TargetPrism;
	parScore: number;
}

export interface RotationAction {
	glassBlockId: string;
	rotationDelta: 90 | 180 | 270;
	timestamp: number;
	previousRotation: Rotation;
	newRotation: Rotation;
}

export interface GameState {
	id: string;
	levelId: string;
	actions: RotationAction[];
	currentRotations: Record<string, Rotation>;
	beamSegments: BeamSegment[];
	finalIntensity: number;
	targetReached: boolean;
	status: 'playing' | 'won' | 'lost';
	failureReason: string | null;
	startTime: number;
	endTime: number | null;
}

export interface GameRecord {
	id: string;
	levelId: string;
	mainRecord: {
		playerName: string;
		totalRotations: number;
		rotationDetails: RotationAction[];
	};
	detailRecord: {
		beamPathLength: number;
		refractionsCount: number;
		targetPrismReached: boolean;
		finalBeamIntensity: number;
	};
	historyRecord: {
		absorptionEvents: AbsorptionEvent[];
		totalAbsorptionLoss: number;
		weakestSegmentIntensity: number;
	};
	resultRecord: {
		score: number;
		status: 'won' | 'lost';
		failureReason: string | null;
		intensityAtTarget: number;
		requiredIntensity: number;
		intensityDeficit: number;
	};
	createdAt: number;
}

export interface AbsorptionEvent {
	glassBlockId: string;
	materialId: string;
	inputIntensity: number;
	outputIntensity: number;
	absorptionLoss: number;
	gridPosition: Point;
}

export interface BestSolution {
	levelId: string;
	score: number;
	rotationCount: number;
	achievedBy: string;
	achievedAt: number;
	gameRecordId: string;
}

export interface LevelEditorState {
	level: Level;
	history: Level[];
	historyIndex: number;
}

export interface SeedSample {
	id: string;
	scenario: 'normal_completion' | 'material_exception' | 'editor_rollback';
	description: string;
	levelId: string;
	gameRecord: GameRecord;
	beforeSnapshot: GameState;
	afterSnapshot: GameState;
}
