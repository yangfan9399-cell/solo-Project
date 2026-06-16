<script lang="ts">
	import { onMount } from 'svelte';
	import { sessionStore, currentLevel, windStore, selectedBuildingType } from '$lib/data/store';
	import { BUILDING_DEFS } from '$lib/data/seed';
	import { getOccupiedCells } from '$lib/data/wind-engine';
	import type { PlacedBuilding, WindCell, Direction } from '$lib/data/types';

	let canvas: HTMLCanvasElement;
	let cellSize = 48;

	let session = $derived($sessionStore);
	let level = $derived($currentLevel);
	let selectedType = $derived($selectedBuildingType);
	let windData = $derived($windStore);
	let hoverCell = $state<{ row: number; col: number } | null>(null);

	const DIR_ARROW: Record<Direction, string> = {
		N: '↑',
		S: '↓',
		E: '→',
		W: '←'
	};

	function getGridSize(): number {
		return level?.gridSize ?? 8;
	}

	function getBuildings(): PlacedBuilding[] {
		return session?.buildings ?? [];
	}

	function isPreset(id: string): boolean {
		return level?.presetBuildings.some((pb) => pb.id === id) ?? false;
	}

	function handleCellClick(row: number, col: number) {
		if (!selectedType || !level) return;
		sessionStore.placeBuilding(selectedType, row, col);
	}

	function handleCellHover(row: number, col: number) {
		hoverCell = { row, col };
	}

	function handleCellLeave() {
		hoverCell = null;
	}

	function handleRightClick(row: number, col: number, e: MouseEvent) {
		e.preventDefault();
		const buildings = getBuildings();
		const occupied = new Map<string, PlacedBuilding>();
		for (const b of buildings) {
			const w = BUILDING_DEFS[b.type]?.width ?? 1;
			for (let dc = 0; dc < w; dc++) {
				occupied.set(`${b.cell.row},${b.cell.col + dc}`, b);
			}
		}
		const b = occupied.get(`${row},${col}`);
		if (b && !isPreset(b.id)) {
			sessionStore.removeBuilding(b.id);
		}
	}

	function canPlaceHere(row: number, col: number): boolean {
		if (!selectedType || !level) return false;
		const occupied = getOccupiedCells(getBuildings());
		const w = BUILDING_DEFS[selectedType]?.width ?? 1;
		if (col + w > getGridSize()) return false;
		for (let dc = 0; dc < w; dc++) {
			if (occupied.has(`${row},${col + dc}`)) return false;
		}
		return true;
	}

	function drawCanvas() {
		if (!canvas || !level) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const gs = getGridSize();
		const w = gs * cellSize;
		const h = gs * cellSize;
		canvas.width = w;
		canvas.height = h;

		ctx.clearRect(0, 0, w, h);

		ctx.fillStyle = '#0f172a';
		ctx.fillRect(0, 0, w, h);

		ctx.strokeStyle = '#1e293b';
		ctx.lineWidth = 1;
		for (let r = 0; r <= gs; r++) {
			ctx.beginPath();
			ctx.moveTo(0, r * cellSize);
			ctx.lineTo(w, r * cellSize);
			ctx.stroke();
		}
		for (let c = 0; c <= gs; c++) {
			ctx.beginPath();
			ctx.moveTo(c * cellSize, 0);
			ctx.lineTo(c * cellSize, h);
			ctx.stroke();
		}

		if (windData.grid) {
			for (let r = 0; r < gs; r++) {
				for (let c = 0; c < gs; c++) {
					const cell = windData.grid[r]?.[c];
					if (!cell || cell.windSpeed <= 0) continue;

					const cx = c * cellSize + cellSize / 2;
					const cy = r * cellSize + cellSize / 2;

					const intensity = Math.min(cell.windSpeed / (level.wind.baseSpeed * 2), 1);
					const alpha = 0.15 + intensity * 0.3;

					if (cell.vortexIntensity > 0.3) {
						ctx.fillStyle = `rgba(248, 113, 113, ${cell.vortexIntensity * 0.4})`;
						ctx.beginPath();
						ctx.arc(cx, cy, cellSize * 0.3, 0, Math.PI * 2);
						ctx.fill();
					}

					ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
					ctx.lineWidth = 1.5;
					const arrowLen = cellSize * 0.3;
					const deltas: Record<Direction, { dx: number; dy: number }> = {
						N: { dx: 0, dy: -1 },
						S: { dx: 0, dy: 1 },
						E: { dx: 1, dy: 0 },
						W: { dx: -1, dy: 0 }
					};
					const d = deltas[cell.direction];
					const ex = cx + d.dx * arrowLen;
					const ey = cy + d.dy * arrowLen;

					ctx.beginPath();
					ctx.moveTo(cx - d.dx * arrowLen * 0.5, cy - d.dy * arrowLen * 0.5);
					ctx.lineTo(ex, ey);
					ctx.stroke();

					const headLen = 5;
					const angle = Math.atan2(d.dy, d.dx);
					ctx.beginPath();
					ctx.moveTo(ex, ey);
					ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
					ctx.moveTo(ex, ey);
					ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
					ctx.stroke();
				}
			}
		}

		for (const sensor of level.sensorPositions) {
			const sx = sensor.col * cellSize + cellSize / 2;
			const sy = sensor.row * cellSize + cellSize / 2;
			ctx.strokeStyle = '#fbbf24';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(sx, sy, cellSize * 0.35, 0, Math.PI * 2);
			ctx.stroke();
			ctx.fillStyle = '#fbbf24';
			ctx.font = '10px monospace';
			ctx.textAlign = 'center';
			ctx.fillText('S', sx, sy + 3);
		}

		const buildings = getBuildings();
		for (const b of buildings) {
			const def = BUILDING_DEFS[b.type];
			if (!def) continue;
			const bx = b.cell.col * cellSize + 2;
			const by = b.cell.row * cellSize + 2;
			const bw = def.width * cellSize - 4;
			const bh = cellSize - 4;

			ctx.fillStyle = def.color;
			ctx.globalAlpha = isPreset(b.id) ? 0.7 : 1;
			ctx.beginPath();
			ctx.roundRect(bx, by, bw, bh, 4);
			ctx.fill();

			ctx.globalAlpha = 1;
			ctx.fillStyle = '#0f172a';
			ctx.font = 'bold 11px sans-serif';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(`${def.height}`, bx + bw / 2, by + bh / 2);
		}

		if (hoverCell && selectedType) {
			const { row, col } = hoverCell;
			const w2 = BUILDING_DEFS[selectedType]?.width ?? 1;
			const canPlace = canPlaceHere(row, col);
			ctx.fillStyle = canPlace ? 'rgba(74, 222, 128, 0.25)' : 'rgba(248, 113, 113, 0.25)';
			ctx.fillRect(col * cellSize, row * cellSize, w2 * cellSize, cellSize);
		}

		const windDir = level.wind.direction;
		ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
		ctx.font = 'bold 14px sans-serif';
		ctx.textAlign = 'left';
		const windLabel = `🌬️ ${level.wind.baseSpeed}m/s ${DIR_ARROW[windDir]}`;
		ctx.fillText(windLabel, 8, 20);
	}

	$effect(() => {
		drawCanvas();
	});

	onMount(() => {
		drawCanvas();
	});
</script>

<div class="game-board-wrapper">
	<canvas
		bind:this={canvas}
		class="game-canvas"
		onclick={(e) => {
			if (!level) return;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const col = Math.floor(x / cellSize);
			const row = Math.floor(y / cellSize);
			handleCellClick(row, col);
		}}
		onmousemove={(e) => {
			if (!level) return;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const col = Math.floor(x / cellSize);
			const row = Math.floor(y / cellSize);
			handleCellHover(row, col);
		}}
		onmouseleave={handleCellLeave}
		oncontextmenu={(e) => {
			if (!level) return;
			const rect = canvas.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const col = Math.floor(x / cellSize);
			const row = Math.floor(y / cellSize);
			handleRightClick(row, col, e);
		}}
	></canvas>
	<div class="board-hint">
		左键放置 | 右键删除 | 先选建筑类型
	</div>
</div>

<style>
	.game-board-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.game-canvas {
		border: 2px solid var(--border);
		border-radius: 8px;
		cursor: crosshair;
		image-rendering: pixelated;
	}

	.board-hint {
		margin-top: 8px;
		font-size: 12px;
		color: var(--text-secondary);
	}
</style>
