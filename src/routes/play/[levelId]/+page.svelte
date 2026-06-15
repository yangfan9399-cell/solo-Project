<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { Level, GameState, Material, BeamSegment, GameRecord, BestSolution } from '$lib/types';

	$: levelId = $page?.params?.levelId || '';

	let level: Level | null = null;
	let materials: Material[] = [];
	let gameState: GameState | null = null;
	let gameRecord: GameRecord | null = null;
	let bestSolutionUpdated = false;
	let previousBestScoreDelta = 0;
	let isNewRecord = false;
	let previousBest: BestSolution | null = null;
	let currentBest: BestSolution | null = null;
	let loading = true;
	let errorMessage: string | null = null;
	let selectedBlock: string | null = null;
	let rotatingBlock: string | null = null;

	const CELL_SIZE = 64;

	onMount(async () => {
		if (!levelId) {
			loading = false;
			errorMessage = '路由参数缺失：未找到关卡ID';
			return;
		}
		try {
			const [levelRes, matRes, bestRes] = await Promise.all([
				fetch(`/api/levels/${levelId}`),
				fetch('/api/materials'),
				fetch(`/api/best-solutions?levelId=${levelId}`)
			]);

			if (!levelRes.ok) {
				errorMessage = `关卡加载失败 (${levelRes.status})`;
				loading = false;
				return;
			}

			level = await levelRes.json();
			materials = await matRes.json();

			try {
				const bestData = await bestRes.json();
				previousBest = Array.isArray(bestData) ? bestData[0] ?? null : (bestData || null);
				currentBest = previousBest;
			} catch (e) {
				previousBest = null;
			}

			if (level) {
				const startRes = await fetch('/api/game/start', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ levelId })
				});
				if (!startRes.ok) {
					const err = await startRes.json();
					errorMessage = err.error || '创建局次失败';
				} else {
					gameState = await startRes.json();
				}
			}
		} catch (e) {
			errorMessage = `加载异常: ${e instanceof Error ? e.message : String(e)}`;
		}
		loading = false;
	});

	function doRotate(delta: 90 | 180 | 270) {
		if (selectedBlock) rotateBlock(selectedBlock, delta);
	}

	function getMaterial(id: string): Material | undefined {
		return materials.find(m => m.id === id);
	}

	async function rotateBlock(blockId: string, delta: 90 | 180 | 270) {
		if (!gameState || gameState.status !== 'playing') return;
		rotatingBlock = blockId;
		try {
			const res = await fetch('/api/game/rotate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stateId: gameState!.id, blockId, delta })
			});
			if (res.ok) {
				const newState: GameState = await res.json();
				gameState = newState;
			}
		} finally {
			rotatingBlock = null;
		}
	}

	async function finishGame() {
		if (!gameState) return;
		try {
			const res = await fetch('/api/game/finish', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ stateId: gameState.id })
			});
			if (res.ok) {
				const data = await res.json();
				gameRecord = data.gameRecord;
				gameState = data.gameState;
				bestSolutionUpdated = data.bestSolutionUpdated;
				previousBestScoreDelta = data.previousBestScoreDelta;
				isNewRecord = data.isNewRecord;
				const bestRes = await fetch(`/api/best-solutions?levelId=${gameRecord.levelId}`);
				if (bestRes.ok) {
					const bestData = await bestRes.json();
					currentBest = Array.isArray(bestData) ? bestData[0] ?? null : (bestData || null);
				}
			}
		} catch (e) {
			errorMessage = `结算失败: ${e instanceof Error ? e.message : String(e)}`;
		}
	}

	async function restartGame() {
		if (!level) return;
		gameRecord = null;
		bestSolutionUpdated = false;
		isNewRecord = false;
		errorMessage = null;
		selectedBlock = null;
		try {
			const res = await fetch('/api/game/start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ levelId: level.id })
			});
			if (res.ok) {
				gameState = await res.json();
			}
		} catch (e) {
			errorMessage = `重启失败: ${e instanceof Error ? e.message : String(e)}`;
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
	<div class="loading-state">
		<div class="spinner"></div>
		<p>正在初始化局次...</p>
		{#if levelId}
			<p style="font-size:12px; color:var(--text-muted);">关卡ID: {levelId}</p>
		{/if}
	</div>
{:else if errorMessage}
	<div class="card error-card">
		<h3 style="color:var(--danger);">❌ 错误</h3>
		<p style="margin-top:8px;">{errorMessage}</p>
		<p style="font-size:12px; color:var(--text-muted); margin-top:8px;">
			路由参数 levelId = <code>{levelId}</code>
		</p>
		<a href="/" class="btn btn-secondary" style="margin-top:12px;">← 返回首页</a>
	</div>
{:else if !level}
	<p style="color:var(--danger);">关卡未找到 (levelId={levelId})</p>
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

					{#each Array(level.gridHeight + 2) as _, row}
						{#each Array(level.gridWidth + 2) as _, col}
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
							class:rotating={rotatingBlock === block.id}
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

			<div style="font-size:11px; color:var(--text-muted); margin-top:8px;">
				局次ID: <code>{gameState?.id ?? '未创建'}</code>
				| 关卡ID: <code>{level.id}</code>
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
					{#if previousBest}
						<div style="margin-top:4px;">🏆 历史最佳: {previousBest.score} ({previousBest.rotationCount}步)</div>
					{/if}
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
					<div style="display:flex; justify-content:space-between; font-size:12px; margin-top:4px; color:var(--text-muted);">
						<span>光段: {gameState.beamSegments.length}</span>
						<span>折射: {gameState.beamSegments.filter(s => s.refractedFrom).length}</span>
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
				{:else}
					<p style="color:var(--text-muted); font-size:12px;">局次尚未创建</p>
				{/if}
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:8px;">🔄 旋转操作</h3>
				{#if selectedBlock && gameState?.status === 'playing'}
					<p style="font-size:13px; color:var(--accent); margin-bottom:8px;">
						✓ 已选中: {selectedBlock}
					</p>
					<div style="display:flex; gap:8px; flex-wrap:wrap;">
						<button class="btn btn-secondary" on:click={() => doRotate(90)} disabled={rotatingBlock !== null}>
							↻ 顺时针90°
						</button>
						<button class="btn btn-secondary" on:click={() => doRotate(180)} disabled={rotatingBlock !== null}>
							↻ 180°
						</button>
						<button class="btn btn-secondary" on:click={() => doRotate(270)} disabled={rotatingBlock !== null}>
							↺ 逆时针90°
						</button>
					</div>
					<p style="font-size:11px; color:var(--text-muted); margin-top:8px;">
						每次旋转都会写入局次状态并触发后端光路重算
					</p>
				{:else if gameState?.status === 'playing'}
					<p style="font-size:13px; color:var(--text-muted);">
						👆 点击左侧棋盘上的玻璃块进行选择
					</p>
				{:else}
					<p style="font-size:13px; color:var(--text-muted);">
						本局已结束，可点击"重新开始"继续挑战
					</p>
				{/if}
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:8px;">📋 局次状态记录</h3>
				{#if gameState && gameState.actions.length > 0}
					<div style="max-height:150px; overflow-y:auto; font-size:12px;">
						{#each gameState.actions as action, i}
							<div style="padding:4px 0; border-bottom:1px solid var(--border); display:flex; justify-content:space-between;">
								<span>
									<span style="color:var(--text-muted);">#{i + 1}</span>
									{action.glassBlockId}
								</span>
								<span style="color:var(--accent);">
									{action.previousRotation}° → {action.newRotation}°
								</span>
							</div>
						{/each}
					</div>
					<div style="font-size:11px; color:var(--text-muted); margin-top:6px;">
						共 {gameState.actions.length} 次旋转操作，已持久化到局次状态
					</div>
				{:else}
					<p style="font-size:12px; color:var(--text-muted);">暂无操作（初始状态）</p>
				{/if}
			</div>

			<div style="display:flex; gap:8px; flex-wrap:wrap;">
				{#if gameState?.status === 'playing'}
					<button class="btn btn-success" on:click={finishGame}>
						✓ 完成本局 (后端结算)
					</button>
				{/if}
				<button class="btn btn-secondary" on:click={restartGame}>
					⟲ 重新开始
				</button>
				<a href="/" class="btn btn-secondary">← 返回</a>
			</div>

			{#if gameRecord}
				<div
					class="card result-card"
					style="margin-top:16px;"
					class:win={gameRecord.resultRecord.status === 'won'}
					class:lose={gameRecord.resultRecord.status === 'lost'}
				>
					<h3 style="margin-bottom:12px;">
						{#if gameRecord.resultRecord.status === 'won'}
							🎉 挑战成功！
						{:else}
							💔 挑战失败
						{/if}
					</h3>

					{#if isNewRecord}
						<div class="new-record-banner" style="margin-bottom:12px;">
							🏆 新纪录！分数提升了 +{previousBestScoreDelta}
						</div>
					{:else if bestSolutionUpdated && gameRecord.resultRecord.score > 0}
						<div class="new-record-banner" style="margin-bottom:12px; background:var(--bg-hover); color:var(--accent);">
							✓ 最佳解法已更新
						</div>
					{/if}

					<div class="result-grid">
						<div class="result-item">
							<div class="result-label">后端重算分数</div>
							<div class="result-value score">
								{gameRecord.resultRecord.score}
							</div>
						</div>
						<div class="result-item">
							<div class="result-label">旋转次数</div>
							<div class="result-value">{gameRecord.mainRecord.totalRotations}</div>
						</div>
						<div class="result-item">
							<div class="result-label">最终光强</div>
							<div class="result-value">{gameRecord.detailRecord.finalBeamIntensity.toFixed(3)}</div>
						</div>
						<div class="result-item">
							<div class="result-label">吸收损耗</div>
							<div class="result-value" style="color:var(--warning);">
								-{gameRecord.historyRecord.totalAbsorptionLoss.toFixed(3)}
							</div>
						</div>
					</div>

					{#if gameRecord.resultRecord.failureReason}
						<div style="margin-top:12px; padding:10px; background:#7f1d1d33; border-radius:6px; border-left:3px solid var(--danger);">
							<div style="font-size:12px; color:var(--danger); font-weight:600; margin-bottom:4px;">❌ 失败原因</div>
							<div style="font-size:13px; color:#fca5a5;">{gameRecord.resultRecord.failureReason}</div>
							{#if gameRecord.resultRecord.intensityDeficit > 0}
								<div style="font-size:12px; color:#fca5a5; margin-top:6px;">
									光强差额: 需要 {gameRecord.resultRecord.requiredIntensity.toFixed(3)}，
									实际 {gameRecord.resultRecord.intensityAtTarget.toFixed(3)}，
									差 <strong>{gameRecord.resultRecord.intensityDeficit.toFixed(3)}</strong>
								</div>
							{/if}
						</div>
					{/if}

					{#if currentBest}
						<div style="margin-top:12px; padding:10px; background:#16653433; border-radius:6px; border-left:3px solid var(--success);">
							<div style="font-size:12px; color:var(--success); font-weight:600; margin-bottom:4px;">🏆 当前最佳解法</div>
							<div style="font-size:13px; color:#86efac;">
								分数: {currentBest.score} | 步数: {currentBest.rotationCount} | {currentBest.achievedBy}
							</div>
						</div>
					{/if}

					<div class="records-breakdown" style="margin-top:16px;">
						<div class="record-block">
							<div class="record-title">① 主记录 (旋转操作)</div>
							<div class="record-content">
								{#each gameRecord.mainRecord.rotationDetails as a, i}
									<span class="tag" style="background:var(--bg-hover);">#{i + 1} {a.glassBlockId}</span>
								{/each}
								共 {gameRecord.mainRecord.totalRotations} 次
							</div>
						</div>
						<div class="record-block">
							<div class="record-title">② 明细记录 (光束引导)</div>
							<div class="record-content">
								光段: {gameRecord.detailRecord.beamPathLength} |
								折射: {gameRecord.detailRecord.refractionsCount} |
								到达: {gameRecord.detailRecord.targetPrismReached ? '✓' : '✗'}
							</div>
						</div>
						<div class="record-block">
							<div class="record-title">③ 历史记录 (吸收损耗)</div>
							<div class="record-content">
								事件: {gameRecord.historyRecord.absorptionEvents.length} 次 |
								最弱: {gameRecord.historyRecord.weakestSegmentIntensity.toFixed(3)}
							</div>
						</div>
						<div class="record-block">
							<div class="record-title">④ 结果记录 (最终判定)</div>
							<div class="record-content">
								<strong style="color:{gameRecord.resultRecord.status === 'won' ? 'var(--success)' : 'var(--danger)'};">
									{gameRecord.resultRecord.status === 'won' ? '胜利' : '失败'}
								</strong>
								| 分数: {gameRecord.resultRecord.score}
							</div>
						</div>
					</div>

					<div style="margin-top:12px; text-align:center;">
						<button class="btn btn-primary" on:click={restartGame}>
							🔄 再来一局
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.game-layout {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 16px;
		align-items: start;
	}
	.game-board {
		border-radius: var(--radius);
		display: block;
	}
	.glass-block {
		cursor: pointer;
		transition: opacity 0.2s, transform 0.3s;
	}
	.glass-block:hover {
		opacity: 0.9;
	}
	.glass-block.rotating {
		animation: pulse 0.4s ease;
	}
	@keyframes pulse {
		0% { filter: brightness(1); }
		50% { filter: brightness(1.6); }
		100% { filter: brightness(1); }
	}
	.loading-state {
		text-align: center;
		padding: 60px 20px;
		color: var(--text-secondary);
	}
	.spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--bg-hover);
		border-top-color: var(--accent);
		border-radius: 50%;
		margin: 0 auto 16px;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.error-card {
		max-width: 480px;
		margin: 40px auto;
		border-color: var(--danger);
	}
	.result-card {
		border-width: 2px;
	}
	.result-card.win {
		border-color: var(--success);
		background: linear-gradient(135deg, var(--bg-card) 0%, #0d2218 100%);
	}
	.result-card.lose {
		border-color: var(--danger);
		background: linear-gradient(135deg, var(--bg-card) 0%, #220d0d 100%);
	}
	.new-record-banner {
		padding: 10px;
		background: linear-gradient(135deg, #f59e0b, #ef4444);
		color: #fff;
		font-weight: 700;
		text-align: center;
		border-radius: 6px;
		animation: recordPulse 1s ease infinite alternate;
	}
	@keyframes recordPulse {
		from { box-shadow: 0 0 4px rgba(245, 158, 11, 0.4); }
		to { box-shadow: 0 0 20px rgba(245, 158, 11, 0.8); }
	}
	.result-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
	.result-item {
		background: var(--bg-hover);
		padding: 10px;
		border-radius: 6px;
		text-align: center;
	}
	.result-label {
		font-size: 11px;
		color: var(--text-muted);
		margin-bottom: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.result-value {
		font-size: 18px;
		font-weight: 700;
	}
	.result-value.score {
		font-size: 24px;
		color: var(--accent);
	}
	.records-breakdown {
		display: grid;
		gap: 8px;
	}
	.record-block {
		background: var(--bg-hover);
		padding: 8px 10px;
		border-radius: 5px;
		border-left: 3px solid var(--accent);
	}
	.record-title {
		font-size: 11px;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 3px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.record-content {
		font-size: 12px;
		color: var(--text-secondary);
	}
	.tag {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 11px;
		margin-right: 4px;
		margin-bottom: 3px;
	}
	:global(button[disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}
	code {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 11px;
		background: var(--bg-hover);
		padding: 2px 6px;
		border-radius: 3px;
	}

	@media (max-width: 900px) {
		.game-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
