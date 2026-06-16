import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { simulateWind, readSensors, calculateScores, checkPass } from '$lib/data/wind-engine';
import type { PlacedBuilding } from '$lib/data/types';
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

	let breakdown = '';
	breakdown += `舒适度得分: ${scores.comfort}/100 (需求 ≥${level.objective.comfortMin})\n`;
	breakdown += `安全性得分: ${scores.safety}/100 (需求 ≥${level.objective.safetyMin})\n`;
	breakdown += `通风效率得分: ${scores.efficiency}/100 (需求 ≥${level.objective.efficiencyMin})\n`;
	breakdown += `综合得分: ${scores.total}/100 (需求 ≥${level.objective.totalMin})\n`;
	breakdown += `判定: ${passed ? '✅ 通过' : '❌ 未通过'}\n\n`;

	breakdown += `--- 传感器读数 ---\n`;
	for (const s of sensors) {
		const vortexWarn = s.vortexIntensity > 0.4 ? ' ⚠️涡流' : '';
		const speedWarn = s.windSpeed > 8 ? ' ⚠️超速' : '';
		breakdown += `位置(${s.cell.row},${s.cell.col}): 风速 ${s.windSpeed.toFixed(1)}m/s 方向${s.direction} 涡流${s.vortexIntensity.toFixed(2)}${vortexWarn}${speedWarn}\n`;
	}

	return json({
		scores,
		passed,
		breakdown,
		levelName: level.name,
		levelId: level.id,
		timestamp: Date.now()
	});
};
