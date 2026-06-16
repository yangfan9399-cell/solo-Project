export type Direction = 'N' | 'S' | 'E' | 'W';

export type BuildingType = 'low-rise' | 'mid-rise' | 'high-rise' | 'wind-corridor' | 'green-belt';

export interface BuildingDef {
	type: BuildingType;
	label: string;
	width: number;
	height: number;
	gridCells: number;
	color: string;
}

export interface Cell {
	row: number;
	col: number;
}

export interface PlacedBuilding {
	id: string;
	type: BuildingType;
	cell: Cell;
}

export interface SensorReading {
	cell: Cell;
	windSpeed: number;
	direction: Direction;
	vortexIntensity: number;
}

export interface WindProfile {
	direction: Direction;
	baseSpeed: number;
	turbulence: number;
}

export interface LevelObjective {
	comfortMin: number;
	safetyMin: number;
	efficiencyMin: number;
	totalMin: number;
}

export interface Level {
	id: string;
	name: string;
	description: string;
	gridSize: number;
	wind: WindProfile;
	objective: LevelObjective;
	availableBuildings: BuildingType[];
	maxBuildings: number;
	presetBuildings: PlacedBuilding[];
	sensorPositions: Cell[];
}

export interface Scheme {
	id: string;
	name: string;
	buildings: PlacedBuilding[];
	sensors: SensorReading[];
	scores: GameScores;
	timestamp: number;
}

export interface GameScores {
	comfort: number;
	safety: number;
	efficiency: number;
	total: number;
}

export interface Operation {
	id: string;
	type: 'place' | 'remove';
	building: PlacedBuilding;
	timestamp: number;
}

export interface Session {
	id: string;
	levelId: string;
	playerId: string;
	buildings: PlacedBuilding[];
	operations: Operation[];
	schemes: Scheme[];
	scores: GameScores | null;
	status: 'playing' | 'passed' | 'failed';
	createdAt: number;
	updatedAt: number;
}

export interface Player {
	id: string;
	name: string;
	completedLevels: string[];
	bestScores: Record<string, GameScores>;
	createdAt: number;
}

export interface WindCell {
	windSpeed: number;
	direction: Direction;
	vortexIntensity: number;
}
