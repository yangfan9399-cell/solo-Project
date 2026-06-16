import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { simulateWind, readSensors, calculateScores, checkPass } from '$lib/data/wind-engine';
import type { Level, PlacedBuilding } from '$lib/data/types';
import { LEVELS } from '$lib/data/seed';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { levelId, buildings } = body as { levelId: string; buildings: PlacedBuilding[] };

	const level = LEVELS.find((l) => l.id === levelId);
	if (!level) {
		return json({ error: 'Level not found' }, { status: 404 });
	}

	const windGrid = simulateWind(level, buildings);
	const sensors = readSensors(level, windGrid);
	const scores = calculateScores(level, windGrid, sensors);
	const passed = checkPass(scores, level.objective);

	return json({
		windGrid: windGrid.map((row) =>
			row.map((cell) => ({
				windSpeed: Math.round(cell.windSpeed * 10) / 10,
				direction: cell.direction,
				vortexIntensity: Math.round(cell.vortexIntensity * 100) / 100
			}))
		),
		sensors: sensors.map((s) => ({
			...s,
			windSpeed: Math.round(s.windSpeed * 10) / 10,
			vortexIntensity: Math.round(s.vortexIntensity * 100) / 100
		})),
		scores,
		passed
	});
};
