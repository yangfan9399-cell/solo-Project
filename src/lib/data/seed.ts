import type { BuildingDef, Level, Player } from './types';

export const BUILDING_DEFS: Record<string, BuildingDef> = {
	'low-rise': {
		type: 'low-rise',
		label: '低层建筑',
		width: 1,
		height: 3,
		gridCells: 1,
		color: '#4ade80'
	},
	'mid-rise': {
		type: 'mid-rise',
		label: '中层建筑',
		width: 1,
		height: 6,
		gridCells: 1,
		color: '#60a5fa'
	},
	'high-rise': {
		type: 'high-rise',
		label: '高层建筑',
		width: 2,
		height: 12,
		gridCells: 2,
		color: '#f87171'
	},
	'wind-corridor': {
		type: 'wind-corridor',
		label: '风廊通道',
		width: 1,
		height: 0,
		gridCells: 1,
		color: '#22d3ee'
	},
	'green-belt': {
		type: 'green-belt',
		label: '绿化带',
		width: 1,
		height: 1,
		gridCells: 1,
		color: '#a3e635'
	}
};

export const LEVELS: Level[] = [
	{
		id: 'level-1',
		name: '初识风道',
		description: '在街区中放置建筑，引导自然风穿过人行区域。学习建筑布局如何影响风环境。',
		gridSize: 8,
		wind: { direction: 'W', baseSpeed: 4.0, turbulence: 0.1 },
		objective: { comfortMin: 40, safetyMin: 30, efficiencyMin: 30, totalMin: 35 },
		availableBuildings: ['low-rise', 'mid-rise', 'wind-corridor'],
		maxBuildings: 5,
		presetBuildings: [],
		sensorPositions: [
			{ row: 2, col: 4 },
			{ row: 4, col: 4 },
			{ row: 6, col: 4 }
		]
	},
	{
		id: 'level-2',
		name: '峡谷效应',
		description: '高楼之间会形成风峡谷效应，风速急剧增加。合理利用或避免这一现象。',
		gridSize: 8,
		wind: { direction: 'W', baseSpeed: 5.0, turbulence: 0.15 },
		objective: { comfortMin: 50, safetyMin: 40, efficiencyMin: 45, totalMin: 45 },
		availableBuildings: ['low-rise', 'mid-rise', 'high-rise', 'wind-corridor'],
		maxBuildings: 7,
		presetBuildings: [
			{ id: 'preset-1', type: 'high-rise', cell: { row: 2, col: 1 } }
		],
		sensorPositions: [
			{ row: 3, col: 3 },
			{ row: 4, col: 3 },
			{ row: 5, col: 3 },
			{ row: 4, col: 6 }
		]
	},
	{
		id: 'level-3',
		name: '涡流陷阱',
		description: '建筑背风面会产生涡流区，可能导致行人不适。学会识别并化解涡流风险。',
		gridSize: 10,
		wind: { direction: 'N', baseSpeed: 6.0, turbulence: 0.25 },
		objective: { comfortMin: 50, safetyMin: 60, efficiencyMin: 40, totalMin: 50 },
		availableBuildings: ['low-rise', 'mid-rise', 'high-rise', 'wind-corridor', 'green-belt'],
		maxBuildings: 8,
		presetBuildings: [
			{ id: 'preset-1', type: 'high-rise', cell: { row: 1, col: 4 } },
			{ id: 'preset-2', type: 'high-rise', cell: { row: 1, col: 6 } }
		],
		sensorPositions: [
			{ row: 3, col: 3 },
			{ row: 3, col: 5 },
			{ row: 3, col: 7 },
			{ row: 6, col: 4 },
			{ row: 6, col: 6 }
		]
	},
	{
		id: 'level-4',
		name: '宜居街区',
		description: '平衡通风效率与行人舒适度，创造真正宜居的城市街区。多个指标需同时达标。',
		gridSize: 10,
		wind: { direction: 'E', baseSpeed: 5.5, turbulence: 0.2 },
		objective: { comfortMin: 60, safetyMin: 55, efficiencyMin: 55, totalMin: 57 },
		availableBuildings: ['low-rise', 'mid-rise', 'high-rise', 'wind-corridor', 'green-belt'],
		maxBuildings: 10,
		presetBuildings: [
			{ id: 'preset-1', type: 'mid-rise', cell: { row: 2, col: 2 } },
			{ id: 'preset-2', type: 'mid-rise', cell: { row: 7, col: 2 } }
		],
		sensorPositions: [
			{ row: 1, col: 5 },
			{ row: 3, col: 5 },
			{ row: 5, col: 5 },
			{ row: 7, col: 5 },
			{ row: 9, col: 5 },
			{ row: 5, col: 8 }
		]
	},
	{
		id: 'level-5',
		name: '超级社区',
		description: '大型城市综合体的风环境规划。在有限空间内实现最佳通风方案，所有指标必须优秀。',
		gridSize: 12,
		wind: { direction: 'W', baseSpeed: 7.0, turbulence: 0.3 },
		objective: { comfortMin: 65, safetyMin: 65, efficiencyMin: 60, totalMin: 63 },
		availableBuildings: ['low-rise', 'mid-rise', 'high-rise', 'wind-corridor', 'green-belt'],
		maxBuildings: 14,
		presetBuildings: [
			{ id: 'preset-1', type: 'high-rise', cell: { row: 2, col: 1 } },
			{ id: 'preset-2', type: 'high-rise', cell: { row: 9, col: 1 } },
			{ id: 'preset-3', type: 'mid-rise', cell: { row: 5, col: 3 } },
			{ id: 'preset-4', type: 'mid-rise', cell: { row: 6, col: 3 } }
		],
		sensorPositions: [
			{ row: 2, col: 4 },
			{ row: 4, col: 6 },
			{ row: 6, col: 6 },
			{ row: 8, col: 4 },
			{ row: 3, col: 9 },
			{ row: 6, col: 9 },
			{ row: 9, col: 9 },
			{ row: 5, col: 11 }
		]
	}
];

export const DEFAULT_PLAYER: Player = {
	id: 'player-1',
	name: '研究员',
	completedLevels: [],
	bestScores: {},
	createdAt: Date.now()
};
