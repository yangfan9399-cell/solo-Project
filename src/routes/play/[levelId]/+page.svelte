<script lang="ts">
	import { onMount } from 'svelte';
	import type { Level, GameState, Material, BeamSegment } from '$lib/types';

	export let levelId: string;

	let level: Level | null = null;
	let materials: Material[] = [];
	let gameState: GameState | null = null;
	let loading = true;
	let selectedBlock: string | null = null;

	function doRotate(delta: 90 | 180 | 270) {
		if (selectedBlock) rotateBlock(selectedBlock, delta);
	}

	const CELL_SIZE = 64;

	onMount(async () => {
		const [levelRes, matRes] = await Promise.all([
			fetch(`/api/levels/${levelId}`),
			fetch('/api/materials')
		]);
		level = await levelRes.json();
		materials = await matRes.json();

		if (level) {
			const startRes = await fetch('/api/game/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ levelId })
			});
			gameState = await startRes.json();
		}
		loading = false;
	});

	function getMaterial(id: string): Material | undefined {
		return materials.find(m => m.id === id);
	}

	async function rotateBlock(blockId: string, delta: 90 | 180 | 270) {
		if (!gameState || gameState.status !== 'playing') return;
		const res = await fetch('/api/game/rotate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stateId: gameState!.id, blockId, delta })
		});
		if (res.ok) {
			gameState = await res.json();
		}
	}

	async function finishGame() {
		if (!gameState) return;
		const res = await fetch('/api/game/finish', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ stateId: gameState.id })
		});
		if (res.ok) {
			gameState = await res.json();
		}
	}

	async function restartGame() {
		if (!level) return;
		const res = await fetch('/api/game/start', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ levelId: level.id })
		});
		if (res.ok) {
			gameState = await res.json();
			selectedBlock = null;
		}
	}

	$: canvasWidth = level ? (level.gridWidth + 2) * CELL_SIZE : 0;
	$: canvasHeight = level ? (level.gridHeight + 2) * CELL_SIZE : 0;

	function getBeamPath(segments: BeamSegment[]): string {
		if (segments.length === 0) return '';
		let d = '';
		for (const seg of segments) {
			const sx = (seg.start.x + 0.5) * CELL_SIZE;
			const sy = (seg.start.y + 0.5) * CELL_SIZE;
			const ex = (seg.end.x + 0.5) * CELL_SIZE;
			const ey = (seg.end.y + 0.5) * CELL_SIZE;
			if (!d) d = `M ${sx} ${sy}`;
			d += ` L ${ex} ${ey}`;
		}
		return d;
	}

	function getIntensityColor(intensity: number): string {
		if (intensity > 0.7) return '#fde047';
		if (intensity > 0.4) return '#fb923c';
		return '#ef4444';
	}

	function getShapePath(shape: string, x: number, y: number, size: number): string {
		const cx = x + size / 2;
		const cy = y + size / 2;
		const half = size / 2 - 4;
		if (shape === 'rectangle') {
			return `M ${cx - half} ${cy - half} L ${cx + half} ${cy - half} L ${cx + half} ${cy + half} L ${cx - half} ${cy + half} Z`;
		}
		if (shape === 'triangle') {
			return `M ${cx} ${cy - half} L ${cx + half} ${cy + half} L ${cx - half} ${cy + half} Z`;
		}
		return `M ${cx - half * 0.6} ${cy - half} L ${cx + half * 0.6} ${cy - half} L ${cx + half} ${cy + half} L ${cx - half} ${cy + half} Z`;
	}

	function getRotationTransform(gridX: number, gridY: number, rotation: number): string {
		const cx = (gridX + 0.5) * CELL_SIZE;
		const cy = (gridY + 0.5) * CELL_SIZE;
		return `rotate(${rotation} ${cx} ${cy})`;
	}
</script>

{#if loading}
	<p style="color:var(--text-muted);">加载中...</p>
{:else if !level}
	<p style="color:var(--danger);">关卡未找到</p>
{:else}
	<div class="game-layout">
		<div class="game-left">
			<div class="card" style="padding:12px;">
				<svg
					width={canvasWidth}
					height={canvasHeight}
					viewBox="0 0 {canvasWidth} {canvasHeight}"
					class="game-board"
				>
					<defs>
						<filter id="beam-glow">
							<feGaussianBlur stdDeviation="4" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
						<filter id="source-glow">
							<feGaussianBlur stdDeviation="6" result="blur" />
							<feMerge>
								<feMergeNode in="blur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					<rect width="100%" height="100%" fill="#0d1117" rx="8" />

					{#each Array(level.gridHeight + 1) as _, row}
						{#each Array(level.gridWidth + 1) as _, col}
							<rect
								x={col * CELL_SIZE}
								y={row * CELL_SIZE}
								width={CELL_SIZE}
								height={CELL_SIZE}
								fill="none"
								stroke="#1e293b"
								stroke-width="0.5"
							/>
						{/each}
					{/each}

					<circle
						cx={(level.lightSource.gridX + 0.5) * CELL_SIZE}
						cy={(level.lightSource.gridY + 0.5) * CELL_SIZE}
						r="12"
						fill="#fde047"
						filter="url(#source-glow)"
					/>
					<text
						x={(level.lightSource.gridX + 0.5) * CELL_SIZE}
						y={(level.lightSource.gridY + 0.5) * CELL_SIZE + 4}
						text-anchor="middle"
						fill="#000"
						font-size="10"
						font-weight="bold"
					>☀</text>

					<rect
						x={level.targetPrism.gridX * CELL_SIZE + 4}
						y={level.targetPrism.gridY * CELL_SIZE + 4}
						width={CELL_SIZE - 8}
						height={CELL_SIZE - 8}
						fill="none"
						stroke={gameState?.targetReached ? '#4ade80' : '#f87171'}
						stroke-width="2"
						rx="4"
						stroke-dasharray="4 2"
					/>
					<text
						x={(level.targetPrism.gridX + 0.5) * CELL_SIZE}
						y={(level.targetPrism.gridY + 0.5) * CELL_SIZE + 4}
						text-anchor="middle"
						fill={gameState?.targetReached ? '#4ade80' : '#f87171'}
						font-size="14"
					>◆</text>

					{#each level.glassBlocks as block}
						{@const mat = getMaterial(block.materialId)}
						{@const currentRotation = gameState?.currentRotations[block.id] ?? block.rotation}
						<g
							transform={getRotationTransform(block.gridX, block.gridY, currentRotation)}
							class="glass-block"
							on:click={() => selectedBlock = selectedBlock === block.id ? null : block.id}
							on:keypress={() => {}}
							role="button"
							tabindex="0"
						>
							<path
								d={getShapePath('rectangle', block.gridX * CELL_SIZE, block.gridY * CELL_SIZE, CELL_SIZE)}
								fill={mat?.color ?? '#555'}
								fill-opacity="0.35"
								stroke={selectedBlock === block.id ? '#38bdf8' : mat?.color ?? '#555'}
								stroke-width={selectedBlock === block.id ? 2.5 : 1.5}
							/>
							{#if block.shape === 'triangle' || block.shape === 'prism'}
								<path
									d={getShapePath(block.shape, block.gridX * CELL_SIZE, block.gridY * CELL_SIZE, CELL_SIZE)}
									fill={mat?.color ?? '#555'}
									fill-opacity="0.25"
									stroke={mat?.color ?? '#555'}
									stroke-width="1"
								/>
							{/if}
						</g>
						<text
							x={(block.gridX + 0.5) * CELL_SIZE}
							y={(block.gridY + 0.5) * CELL_SIZE + 3}
							text-anchor="middle"
							fill="#fff"
							font-size="9"
							opacity="0.7"
						>n={mat?.refractiveIndex.toFixed(1) ?? '?'}</text>
					{/each}

					{#if gameState && gameState.beamSegments.length > 0}
						{@const pathD = getBeamPath(gameState.beamSegments)}
						<path
							d={pathD}
							fill="none"
							stroke={getIntensityColor(gameState.finalIntensity)}
							stroke-width="3"
							filter="url(#beam-glow)"
							stroke-linecap="round"
							stroke-linejoin="round"
							opacity={Math.max(0.3, gameState.finalIntensity)}
						/>
						<path
							d={pathD}
							fill="none"
							stroke={getIntensityColor(gameState.finalIntensity)}
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					{/if}
				</svg>
			</div>
		</div>

		<div class="game-right">
			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:8px;">🎯 {level.name}</h3>
				<p style="color:var(--text-secondary); font-size:13px; margin-bottom:12px;">
					{level.description}
				</p>
				<div style="font-size:13px; color:var(--text-muted);">
					<div>目标强度 ≥ {level.targetPrism.requiredIntensity}</div>
					<div>标杆步数: {level.parScore}</div>
				</div>
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:8px;">💡 光束状态</h3>
				{#if gameState}
					<div class="intensity-bar" style="margin-bottom:8px;">
						<div
							class="intensity-bar-fill"
							style="width:{Math.max(0, gameState.finalIntensity * 100)}%; background:{getIntensityColor(gameState.finalIntensity)};"
						></div>
					</div>
					<div style="display:flex; justify-content:space-between; font-size:13px;">
						<span>强度: {gameState.finalIntensity.toFixed(3)}</span>
						<span>需要: {level.targetPrism.requiredIntensity}</span>
					</div>
					<div style="margin-top:8px; font-size:13px;">
						状态:
						{#if gameState.targetReached}
							<span class="badge badge-success">✓ 已到达目标</span>
						{:else}
							<span class="badge badge-danger">✗ 未到达</span>
						{/if}
					</div>
					{#if gameState.failureReason}
						<div style="margin-top:8px; padding:8px; background:#7f1d1d33; border-radius:4px; font-size:12px; color:#fca5a5;">
							⚠ {gameState.failureReason}
						</div>
					{/if}
				{/if}
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:8px;">🔄 旋转操作</h3>
				{#if selectedBlock && gameState?.status === 'playing'}
					<p style="font-size:13px; color:var(--text-secondary); margin-bottom:8px;">
						选中: {selectedBlock}
					</p>
					<div style="display:flex; gap:8px; flex-wrap:wrap;">
						<button class="btn btn-secondary" on:click={() => doRotate(90)}>
							↻ 顺时针90°
						</button>
						<button class="btn btn-secondary" on:click={() => doRotate(180)}>
							↻ 180°
						</button>
						<button class="btn btn-secondary" on:click={() => doRotate(270)}>
							↺ 逆时针90°
						</button>
					</div>
				{:else if gameState?.status === 'playing'}
					<p style="font-size:13px; color:var(--text-muted);">点击棋盘上的玻璃块进行选择</p>
				{/if}
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:8px;">📋 操作记录</h3>
				{#if gameState && gameState.actions.length > 0}
					<div style="max-height:150px; overflow-y:auto; font-size:12px;">
						{#each gameState.actions as action, i}
							<div style="padding:4px 0; border-bottom:1px solid var(--border);">
								<span style="color:var(--text-muted);">#{i + 1}</span>
								{action.glassBlockId}: {action.previousRotation}° → {action.newRotation}°
							</div>
						{/each}
					</div>
				{:else}
					<p style="font-size:12px; color:var(--text-muted);">尚无操作</p>
				{/if}
			</div>

			<div style="display:flex; gap:8px;">
				{#if gameState?.status === 'playing'}
					<button class="btn btn-success" on:click={finishGame}>
						✓ 完成本局
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={restartGame}>
					⟲ 重新开始
				</button>
				<a href="/" class="btn btn-secondary">← 返回</a>
			</div>

			{#if gameState && gameState.status !== 'playing'}
				<div class="card" style="margin-top:16px; border-color: {gameState.status === 'won' ? '#4ade80' : '#f87171'};">
					<h3 style="color: {gameState.status === 'won' ? 'var(--success)' : 'var(--danger)'};">
						{gameState.status === 'won' ? '🎉 挑战成功！' : '💔 挑战失败'}
					</h3>
					{#if gameState.failureReason}
						<p style="font-size:13px; color:var(--danger); margin-top:4px;">
							{gameState.failureReason}
						</p>
					{/if}
					<p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">
						最终光强: {gameState.finalIntensity.toFixed(3)} | 操作次数: {gameState.actions.length}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.game-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 16px;
	}
	.game-board {
		border-radius: var(--radius);
		display: block;
	}
	.glass-block {
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.glass-block:hover {
		opacity: 0.9;
	}

	@media (max-width: 900px) {
		.game-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
