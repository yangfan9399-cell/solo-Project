import type {
	Direction,
	Rotation,
	BeamSegment,
	Point,
	GlassBlock,
	LightSource,
	TargetPrism,
	Material,
	AbsorptionEvent
} from './types';

const OPPOSITE: Record<Direction, Direction> = {
	up: 'down',
	down: 'up',
	left: 'right',
	right: 'left'
};

const DIRECTION_DELTA: Record<Direction, Point> = {
	up: { x: 0, y: -1 },
	down: { x: 0, y: 1 },
	left: { x: -1, y: 0 },
	right: { x: 1, y: 0 }
};

function rotateDirection(dir: Direction, rotation: Rotation): Direction {
	const dirs: Direction[] = ['up', 'right', 'down', 'left'];
	const idx = dirs.indexOf(dir);
	const steps = (rotation / 90) % 4;
	return dirs[(idx + steps) % 4];
}

function applySnellLaw(
	incidentAngle: number,
	n1: number,
	n2: number
): number | null {
	const sinRefracted = (n1 / n2) * Math.sin(incidentAngle);
	if (Math.abs(sinRefracted) > 1) return null;
	return Math.asin(sinRefracted);
}

function getSurfaceNormal(shape: string, rotation: Rotation, entryDir: Direction): number | null {
	if (shape === 'rectangle') {
		const normals: Record<Direction, number> = {
			up: 0, down: 0, left: Math.PI / 2, right: Math.PI / 2
		};
		const rotated = rotateDirection(entryDir, rotation);
		return normals[rotated] ?? null;
	}
	if (shape === 'triangle' || shape === 'prism') {
		const angle = shape === 'prism' ? Math.PI / 6 : Math.PI / 4;
		const baseAngle = rotation * Math.PI / 180;
		if (entryDir === 'right' || entryDir === 'left') return baseAngle;
		return baseAngle + angle;
	}
	return null;
}

function computeRefraction(
	entryDir: Direction,
	material: Material,
	shape: string,
	rotation: Rotation
): { newDir: Direction; refracted: boolean; totalReflection: boolean } {
	const n1 = 1.0;
	const n2 = material.refractiveIndex;

	if (shape === 'rectangle') {
		if (entryDir === 'up' || entryDir === 'down') {
			const incidentAngle = (rotation % 180 === 0) ? 0 : Math.PI / 6;
			const refracted = applySnellLaw(incidentAngle, n1, n2);
			if (refracted === null) {
				return { newDir: OPPOSITE[entryDir], refracted: false, totalReflection: true };
			}
			if (Math.abs(incidentAngle) < 0.01) {
				return { newDir: entryDir, refracted: true, totalReflection: false };
			}
			const deviation = refracted - incidentAngle;
			if (Math.abs(deviation) < 0.01) {
				return { newDir: entryDir, refracted: true, totalReflection: false };
			}
			return { newDir: rotateDirection(entryDir, deviation > 0 ? 90 : 270) as Rotation as Direction, refracted: true, totalReflection: false };
		}
		return { newDir: entryDir, refracted: true, totalReflection: false };
	}

	if (shape === 'triangle' || shape === 'prism') {
		const apexAngle = shape === 'prism' ? 60 : 45;
		const rotOffset = rotation / 90;
		const directions: Direction[] = ['up', 'right', 'down', 'left'];

		let exitDir: Direction;
		if (n2 > 1.5) {
			exitDir = directions[(directions.indexOf(entryDir) + 1 + rotOffset) % 4];
		} else {
			exitDir = directions[(directions.indexOf(entryDir) + 2 + rotOffset) % 4];
		}

		const incidentAngle = (apexAngle / 2) * Math.PI / 180;
		const refracted = applySnellLaw(incidentAngle, n1, n2);
		if (refracted === null) {
			return { newDir: OPPOSITE[entryDir], refracted: false, totalReflection: true };
		}
		return { newDir: exitDir, refracted: true, totalReflection: false };
	}

	return { newDir: entryDir, refracted: false, totalReflection: false };
}

export interface SimulationResult {
	segments: BeamSegment[];
	absorptionEvents: AbsorptionEvent[];
	finalIntensity: number;
	targetReached: boolean;
}

export function simulateBeam(
	lightSource: LightSource,
	glassBlocks: GlassBlock[],
	targetPrism: TargetPrism,
	materials: Material[],
	maxSteps: number = 50
): SimulationResult {
	const segments: BeamSegment[] = [];
	const absorptionEvents: AbsorptionEvent[] = [];
	const blockMap = new Map<string, GlassBlock>();
	const materialMap = new Map<string, Material>();

	for (const block of glassBlocks) {
		blockMap.set(`${block.gridX},${block.gridY}`, block);
	}
	for (const mat of materials) {
		materialMap.set(mat.id, mat);
	}

	let currentPos: Point = { x: lightSource.gridX, y: lightSource.gridY };
	let currentDir: Direction = lightSource.direction;
	let intensity = lightSource.intensity;
	let steps = 0;

	while (steps < maxSteps && intensity > 0.01) {
		const delta = DIRECTION_DELTA[currentDir];
		const nextPos: Point = { x: currentPos.x + delta.x, y: currentPos.y + delta.y };

		const block = blockMap.get(`${nextPos.x},${nextPos.y}`);

		if (!block) {
			segments.push({
				start: { ...currentPos },
				end: { ...nextPos },
				intensity,
				direction: currentDir
			});

			if (nextPos.x === targetPrism.gridX && nextPos.y === targetPrism.gridY) {
				return {
					segments,
					absorptionEvents,
					finalIntensity: intensity,
					targetReached: intensity >= targetPrism.requiredIntensity
				};
			}

			if (nextPos.x < -1 || nextPos.x > 10 || nextPos.y < -1 || nextPos.y > 10) {
				break;
			}

			currentPos = nextPos;
			steps++;
			continue;
		}

		const material = materialMap.get(block.materialId);
		if (!material) {
			segments.push({
				start: { ...currentPos },
				end: { ...nextPos },
				intensity,
				direction: currentDir
			});
			currentPos = nextPos;
			steps++;
			continue;
		}

		segments.push({
			start: { ...currentPos },
			end: { ...nextPos },
			intensity,
			direction: currentDir,
			refractedFrom: block.id
		});

		const inputIntensity = intensity;
		intensity = intensity * (1 - material.absorptionRate);

		absorptionEvents.push({
			glassBlockId: block.id,
			materialId: material.id,
			inputIntensity,
			outputIntensity: intensity,
			absorptionLoss: inputIntensity - intensity,
			gridPosition: { x: block.gridX, y: block.gridY }
		});

		if (intensity <= 0.01) break;

		const refraction = computeRefraction(currentDir, material, block.shape, block.rotation);

		if (refraction.totalReflection) {
			currentDir = OPPOSITE[currentDir];
			segments.push({
				start: { ...nextPos },
				end: { ...currentPos },
				intensity,
				direction: currentDir
			});
		} else {
			currentPos = nextPos;
			currentDir = refraction.newDir;
		}

		steps++;
	}

	const targetReached = intensity >= targetPrism.requiredIntensity &&
		segments.some(s =>
			s.end.x === targetPrism.gridX && s.end.y === targetPrism.gridY
		);

	return {
		segments,
		absorptionEvents,
		finalIntensity: intensity,
		targetReached
	};
}

export function calculateScore(
	result: SimulationResult,
	rotationCount: number,
	parScore: number
): number {
	if (!result.targetReached) return 0;
	let score = 1000;
	score -= rotationCount * 50;
	score += Math.floor(result.finalIntensity * 200);
	score += Math.max(0, (parScore - rotationCount) * 30);
	return Math.max(0, score);
}

export function determineFailureReason(
	result: SimulationResult,
	targetPrism: TargetPrism
): string | null {
	if (result.targetReached) return null;

	if (result.finalIntensity <= 0.01) {
		const totalLoss = result.absorptionEvents.reduce((s, e) => s + e.absorptionLoss, 0);
		return `光线被完全吸收！总吸收损耗: ${totalLoss.toFixed(2)}，光束在到达目标前已耗尽`;
	}

	if (result.segments.length === 0) {
		return '光束未能进入迷宫，请检查光源方向';
	}

	const reachesTarget = result.segments.some(
		s => s.end.x === targetPrism.gridX && s.end.y === targetPrism.gridY
	);
	if (reachesTarget && result.finalIntensity < targetPrism.requiredIntensity) {
		const deficit = targetPrism.requiredIntensity - result.finalIntensity;
		return `光线到达目标但强度不足！当前: ${result.finalIntensity.toFixed(2)}，需要: ${targetPrism.requiredIntensity.toFixed(2)}，差额: ${deficit.toFixed(2)}`;
	}

	return '光线未到达目标棱镜，请调整玻璃块角度引导光束';
}
