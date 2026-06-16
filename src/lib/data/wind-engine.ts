import type { BuildingDef, Direction, Level, PlacedBuilding, SensorReading, WindCell, WindProfile } from './types';
import { BUILDING_DEFS } from './seed';

const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
	N: { dr: 1, dc: 0 },
	S: { dr: -1, dc: 0 },
	E: { dr: 0, dc: 1 },
	W: { dr: 0, dc: -1 }
};

const OPPOSITE: Record<Direction, Direction> = {
	N: 'S',
	S: 'N',
	E: 'W',
	W: 'E'
};

function getBuildingHeight(type: string): number {
	return BUILDING_DEFS[type]?.height ?? 0;
}

function getBuildingWidth(type: string): number {
	return BUILDING_DEFS[type]?.width ?? 1;
}

function cellKey(row: number, col: number): string {
	return `${row},${col}`;
}

export function getOccupiedCells(buildings: PlacedBuilding[]): Set<string> {
	const occupied = new Set<string>();
	for (const b of buildings) {
		const w = getBuildingWidth(b.type);
		for (let dc = 0; dc < w; dc++) {
			occupied.add(cellKey(b.cell.row, b.cell.col + dc));
		}
	}
	return occupied;
}

export function canPlace(
	buildingType: string,
	row: number,
	col: number,
	gridSize: number,
	existing: PlacedBuilding[],
	preset: PlacedBuilding[]
): boolean {
	const w = getBuildingWidth(buildingType);
	if (col + w > gridSize || row >= gridSize || col < 0 || row < 0) return false;
	const occupied = getOccupiedCells([...existing, ...preset]);
	for (let dc = 0; dc < w; dc++) {
		if (occupied.has(cellKey(row, col + dc))) return false;
	}
	return true;
}

export function simulateWind(
	level: Level,
	buildings: PlacedBuilding[]
): WindCell[][] {
	const { gridSize, wind } = level;
	const grid: WindCell[][] = [];
	const heightMap: number[][] = [];
	const blocked: boolean[][] = [];

	for (let r = 0; r < gridSize; r++) {
		grid[r] = [];
		heightMap[r] = [];
		blocked[r] = [];
		for (let c = 0; c < gridSize; c++) {
			grid[r][c] = {
				windSpeed: wind.baseSpeed,
				direction: wind.direction,
				vortexIntensity: 0
			};
			heightMap[r][c] = 0;
			blocked[r][c] = false;
		}
	}

	for (const b of buildings) {
		const h = getBuildingHeight(b.type);
		const w = getBuildingWidth(b.type);
		for (let dc = 0; dc < w; dc++) {
			const rr = b.cell.row;
			const cc = b.cell.col + dc;
			if (rr >= 0 && rr < gridSize && cc >= 0 && cc < gridSize) {
				heightMap[rr][cc] = h;
				blocked[rr][cc] = h > 0;
			}
		}
	}

	const { dr, dc } = DIR_DELTA[wind.direction];

	for (let r = 0; r < gridSize; r++) {
		for (let c = 0; c < gridSize; c++) {
			if (blocked[r][c]) {
				grid[r][c].windSpeed = 0;
				grid[r][c].vortexIntensity = 0;
				continue;
			}

			const windR = r - dr;
			const windC = c - dc;
			let speedMod = 1.0;

			if (windR >= 0 && windR < gridSize && windC >= 0 && windC < gridSize) {
				if (blocked[windR][windC]) {
					speedMod -= 0.3 + heightMap[windR][windC] * 0.03;
				}
			}

			const perpDirs: Direction[] = getPerpendicularDirs(wind.direction);
			let narrowFactor = 1.0;
			for (const pd of perpDirs) {
				const pdelta = DIR_DELTA[pd];
				for (let dist = 1; dist <= 2; dist++) {
					const pr = r + pdelta.dr * dist;
					const pc = c + pdelta.dc * dist;
					if (pr >= 0 && pr < gridSize && pc >= 0 && pc < gridSize) {
						if (heightMap[pr][pc] > 0 && heightMap[r][c] < heightMap[pr][pc]) {
							narrowFactor += 0.08 * heightMap[pr][pc] / dist;
						}
					}
				}
			}

			speedMod *= narrowFactor;

			const behindR = r - dr;
			const behindC = c - dc;
			let vortexFactor = 0;
			if (behindR >= 0 && behindR < gridSize && behindC >= 0 && behindC < gridSize) {
				if (heightMap[behindR][behindC] > 3) {
					vortexFactor = Math.min(1, heightMap[behindR][behindC] * 0.05);
					if (heightMap[r][c] === 0 || heightMap[r][c] < heightMap[behindR][behindC] * 0.5) {
						speedMod *= (1 - vortexFactor * 0.5);
					}
				}
			}

			const greenBeltAdj = checkAdjacent(buildings, r, c, 'green-belt', gridSize);
			if (greenBeltAdj > 0) {
				speedMod *= (1 - 0.1 * greenBeltAdj);
			}

			const corridorAdj = checkAdjacent(buildings, r, c, 'wind-corridor', gridSize);
			if (corridorAdj > 0) {
				speedMod *= (1 + 0.25 * corridorAdj);
			}

			speedMod += (Math.random() - 0.5) * wind.turbulence * 0.5;

			grid[r][c].windSpeed = Math.max(0, wind.baseSpeed * speedMod);
			grid[r][c].vortexIntensity = vortexFactor;

			if (vortexFactor > 0.3) {
				grid[r][c].direction = OPPOSITE[wind.direction];
			}
		}
	}

	return grid;
}

function getPerpendicularDirs(dir: Direction): Direction[] {
	if (dir === 'N' || dir === 'S') return ['E', 'W'];
	return ['N', 'S'];
}

function checkAdjacent(
	buildings: PlacedBuilding[],
	row: number,
	col: number,
	type: string,
	gridSize: number
): number {
	let count = 0;
	for (const b of buildings) {
		if (b.type !== type) continue;
		const w = getBuildingWidth(b.type);
		for (let dc = 0; dc < w; dc++) {
			const br = b.cell.row;
			const bc = b.cell.col + dc;
			const dist = Math.abs(br - row) + Math.abs(bc - col);
			if (dist === 1) count++;
		}
	}
	return count;
}

export function readSensors(
	level: Level,
	windGrid: WindCell[][]
): SensorReading[] {
	return level.sensorPositions.map((cell) => {
		const w = windGrid[cell.row]?.[cell.col];
		return {
			cell,
			windSpeed: w?.windSpeed ?? 0,
			direction: w?.direction ?? level.wind.direction,
			vortexIntensity: w?.vortexIntensity ?? 0
		};
	});
}

export function calculateScores(
	level: Level,
	windGrid: WindCell[][],
	sensors: SensorReading[]
): { comfort: number; safety: number; efficiency: number; total: number } {
	const { gridSize } = level;

	let comfortSum = 0;
	let comfortCount = 0;
	for (let r = 0; r < gridSize; r++) {
		for (let c = 0; c < gridSize; c++) {
			if (windGrid[r][c].windSpeed > 0) {
				const speed = windGrid[r][c].windSpeed;
				const ideal = 3.5;
				const deviation = Math.abs(speed - ideal);
				const cellComfort = Math.max(0, 100 - deviation * 15);
				comfortSum += cellComfort;
				comfortCount++;
			}
		}
	}
	const comfort = comfortCount > 0 ? comfortSum / comfortCount : 0;

	let safetySum = 0;
	let dangerCount = 0;
	for (const s of sensors) {
		if (s.vortexIntensity > 0.4) {
			dangerCount++;
			safetySum += Math.max(0, 100 - s.vortexIntensity * 120);
		} else if (s.windSpeed > 8) {
			dangerCount++;
			safetySum += Math.max(0, 100 - (s.windSpeed - 8) * 20);
		} else {
			safetySum += 100;
			dangerCount++;
		}
	}
	const safety = dangerCount > 0 ? safetySum / dangerCount : 100;

	let ventilatedCells = 0;
	let totalOpenCells = 0;
	const { dr, dc } = DIR_DELTA[level.wind.direction];
	for (let r = 0; r < gridSize; r++) {
		for (let c = 0; c < gridSize; c++) {
			if (windGrid[r][c].windSpeed > 0) {
				totalOpenCells++;
				if (windGrid[r][c].windSpeed >= level.wind.baseSpeed * 0.5) {
					ventilatedCells++;
				}
			}
		}
	}
	const efficiency = totalOpenCells > 0 ? (ventilatedCells / totalOpenCells) * 100 : 0;

	const total = comfort * 0.35 + safety * 0.35 + efficiency * 0.3;

	return {
		comfort: Math.round(comfort),
		safety: Math.round(safety),
		efficiency: Math.round(efficiency),
		total: Math.round(total)
	};
}

export function checkPass(scores: { comfort: number; safety: number; efficiency: number; total: number }, objective: { comfortMin: number; safetyMin: number; efficiencyMin: number; totalMin: number }): boolean {
	return (
		scores.comfort >= objective.comfortMin &&
		scores.safety >= objective.safetyMin &&
		scores.efficiency >= objective.efficiencyMin &&
		scores.total >= objective.totalMin
	);
}
