<script lang="ts">
	import { onMount } from 'svelte';
	import type { Level, Material, GlassBlock, BeamSegment } from '$lib/types';

	let levels: Level[] = [];
	let materials: Material[] = [];
	let selectedLevel: Level | null = null;
	let editingLevel: Level | null = null;
	let history: Level[] = [];
	let historyIndex = -1;
	let message = '';
	let messageType: 'info' | 'success' | 'warning' | 'error' = 'info';

	type SimResult = {
		segments: BeamSegment[];
		absorptionEvents: Array<{ materialId: string; absorptionLoss: number }>;
		finalIntensity: number;
		targetReached: boolean;
		failureReason: string | null;
	};
	let baselineSim: SimResult | null = null;
	let currentSim: SimResult | null = null;
	let simulating = false;

	let saveDiffData: {
		before: SimResult;
		after: SimResult;
		summary: string;
		improved: boolean;
		worsened: boolean;
	} | null = null;

	let newBlockMaterial = 'clear-glass';
	let newBlockShape: 'rectangle' | 'triangle' | 'prism' = 'rectangle';

	const CELL_SIZE = 56;

	onMount(async () => {
		const [lRes, mRes] = await Promise.all([
			fetch('/api/levels'),
			fetch('/api/materials')
		]);
		levels = await lRes.json();
		materials = await mRes.json();
	});

	async function runSim(level: Level): Promise<SimResult | null> {
		simulating = true;
		try {
			const res = await fetch('/api/simulate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ level })
			});
			if (res.ok) {
				return await res.json();
			}
			return null;
		} finally {
			simulating = false;
		}
	}

	async function selectLevel(level: Level) {
		selectedLevel = JSON.parse(JSON.stringify(level));
		editingLevel = JSON.parse(JSON.stringify(level));
		history = [JSON.parse(JSON.stringify(level))];
		historyIndex = 0;
		saveDiffData = null;

		baselineSim = await runSim(selectedLevel);
		currentSim = baselineSim ? JSON.parse(JSON.stringify(baselineSim)) : null;

		showMessage(`已加载关卡：${level.name}，已执行初始光线模拟`, 'info');
	}

	function showMessage(msg: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
		message = msg;
		messageType = type;
	}

	async function pushHistory() {
		if (!editingLevel) return;
		history = history.slice(0, historyIndex + 1);
		const snapshot = JSON.parse(JSON.stringify(editingLevel));
		history.push(snapshot);
		historyIndex = history.length - 1;
		currentSim = await runSim(snapshot);
	}

	async function undo() {
		if (historyIndex <= 0) return;
		historyIndex--;
		editingLevel = JSON.parse(JSON.stringify(history[historyIndex]));
		currentSim = await runSim(editingLevel);
		showMessage(`← 已回滚到第 ${historyIndex + 1} 个历史快照，已触发重新光路计算`, 'warning');
	}

	async function redo() {
		if (historyIndex >= history.length - 1) return;
		historyIndex++;
		editingLevel = JSON.parse(JSON.stringify(history[historyIndex]));
		currentSim = await runSim(editingLevel);
		showMessage(`→ 已重做回第 ${historyIndex + 1} 个历史快照，已触发重新光路计算`, 'info');
	}

	async function addBlock() {
		if (!editingLevel) return;
		const id = `custom-${Date.now()}`;
		const block: GlassBlock = {
			id,
			materialId: newBlockMaterial,
			gridX: Math.floor(editingLevel.gridWidth / 2),
			gridY: Math.floor(editingLevel.gridHeight / 2),
			rotation: 0,
			shape: newBlockShape
		};
		editingLevel.glassBlocks = [...editingLevel.glassBlocks, block];
		await pushHistory();
		showMessage(`✓ 已添加 ${newBlockMaterial} ${newBlockShape}，光路已重新计算`, 'success');
	}

	async function removeBlock(blockId: string) {
		if (!editingLevel) return;
		editingLevel.glassBlocks = editingLevel.glassBlocks.filter(b => b.id !== blockId);
		await pushHistory();
		showMessage(`✕ 已移除玻璃块 ${blockId}，光路已重新计算`, 'warning');
	}

	async function moveBlock(blockId: string, dx: number, dy: number) {
		if (!editingLevel) return;
		const block = editingLevel.glassBlocks.find(b => b.id === blockId);
		if (!block) return;
		const newX = Math.max(0, Math.min(editingLevel.gridWidth - 1, block.gridX + dx));
		const newY = Math.max(0, Math.min(editingLevel.gridHeight - 1, block.gridY + dy));
		if (newX === block.gridX && newY === block.gridY) {
			showMessage('⚠ 已在边界，无法继续移动', 'warning');
			return;
		}
		block.gridX = newX;
		block.gridY = newY;
		await pushHistory();
		showMessage(`↔↕ 已移动玻璃块到 (${newX},${newY})，需要重新计算光路 — 已完成`, 'info');
	}

	async function rotateEditorBlock(blockId: string, delta: 90 | 180 | 270) {
		if (!editingLevel) return;
		const block = editingLevel.glassBlocks.find(b => b.id === blockId);
		if (!block) return;
		block.rotation = ((block.rotation + delta) % 360) as 0 | 90 | 180 | 270;
		await pushHistory();
		showMessage(`↻ 已旋转玻璃块 ${delta}°，光路已重新计算`, 'success');
	}

	async function saveLevel() {
		if (!editingLevel || !selectedLevel) return;
		const beforeSim = baselineSim;
		const res = await fetch(`/api/levels/${editingLevel.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editingLevel)
		});
		if (res.ok) {
			selectedLevel = JSON.parse(JSON.stringify(editingLevel));
			baselineSim = currentSim;

			const lRes = await fetch('/api/levels');
			levels = await lRes.json();

			const diff = computeDiff(beforeSim, currentSim);
			if (beforeSim && currentSim) {
				saveDiffData = {
					before: beforeSim,
					after: currentSim,
					summary: diff.summary,
					improved: diff.improved,
					worsened: diff.worsened
				};
			}
			showMessage(
				`💾 关卡已保存！${diff.summary}`,
				diff.improved ? 'success' : diff.worsened ? 'warning' : 'info'
			);
		} else {
			showMessage('❌ 保存失败', 'error');
		}
	}

	function computeDiff(before: SimResult | null, after: SimResult | null): {
		summary: string;
		improved: boolean;
		worsened: boolean;
	} {
		if (!before || !after) {
			return { summary: '无法计算差异', improved: false, worsened: false };
		}
		const intensityDelta = after.finalIntensity - before.finalIntensity;
		const reachedChanged = after.targetReached !== before.targetReached;
		let summary = '';
		let improved = false;
		let worsened = false;

		if (reachedChanged) {
			if (after.targetReached) {
				summary = '🚀 关卡变更后目标从"不可达"变为"可达"！';
				improved = true;
			} else {
				summary = '⚠ 关卡变更后目标从"可达"变为"不可达"';
				worsened = true;
			}
		} else {
			if (Math.abs(intensityDelta) < 0.001) {
				summary = '光强无变化';
			} else if (intensityDelta > 0) {
				summary = `光强提升 +${intensityDelta.toFixed(3)}`;
				improved = true;
			} else {
				summary = `光强下降 ${intensityDelta.toFixed(3)}`;
				worsened = true;
			}
		}
		summary += ` | 前：${before.segments.length}段→${before.finalIntensity.toFixed(3)}，后：${after.segments.length}段→${after.finalIntensity.toFixed(3)}`;
		return { summary, improved, worsened };
	}

	function createNewLevel() {
		const id = `level-custom-${Date.now()}`;
		const level: Level = {
			id,
			name: '新关卡',
			description: '自定义关卡',
			gridWidth: 8,
			gridHeight: 6,
			lightSource: { gridX: 0, gridY: 2, direction: 'right', intensity: 1.0, color: '#ffdd00' },
			targetPrism: { gridX: 7, gridY: 2, requiredIntensity: 0.3, id: `target-${Date.now()}` },
			glassBlocks: [],
			parScore: 3
		};
		levels = [level, ...levels];
		selectLevel(level);
	}

	function getMaterial(id: string): Material | undefined {
		return materials.find(m => m.id === id);
	}

	function getBeamPath(segments: BeamSegment[] | undefined, size: number): string {
		if (!segments || segments.length === 0) return '';
		let d = '';
		for (const seg of segments) {
			const sx = (seg.start.x + 0.5) * size;
			const sy = (seg.start.y + 0.5) * size;
			const ex = (seg.end.x + 0.5) * size;
			const ey = (seg.end.y + 0.5) * size;
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

	function renderMiniBoard(level: Level, sim: SimResult | null, title: string) {
		return null;
	}

	$: if (editingLevel) {
		canvasWidth = (editingLevel.gridWidth + 2) * CELL_SIZE;
		canvasHeight = (editingLevel.gridHeight + 2) * CELL_SIZE;
	}
	let canvasWidth = 0;
	let canvasHeight = 0;

	$: diffData = (() => {
		if (!baselineSim || !currentSim) return null;
		return {
			dReached: currentSim.targetReached !== baselineSim.targetReached,
			dIntensity: Math.abs(currentSim.finalIntensity - baselineSim.finalIntensity),
			dSegments: currentSim.segments.length - baselineSim.segments.length,
			dAbsorption: currentSim.absorptionEvents.length - baselineSim.absorptionEvents.length,
			intensityDelta: currentSim.finalIntensity - baselineSim.finalIntensity
		};
	})();
</script>

<h1 class="page-title">🛠️ 关卡编辑器 <span style="font-size:14px; font-weight:400; color:var(--text-muted);">实时光线重算 · 前后差异对比 · 撤销/重做回滚</span></h1>

<div class="editor-layout">
	<div class="editor-left">
		<div style="margin-bottom:12px;">
			<button class="btn btn-primary" style="width:100%;" on:click={createNewLevel}>+ 新建关卡</button>
		</div>
		<h3 style="margin-bottom:12px; color:var(--text-secondary); font-size:14px;">关卡列表 ({levels.length})</h3>
		<div style="max-height:520px; overflow-y:auto;">
			{#each levels as level}
				<div
					class="card level-item"
					class:selected={selectedLevel?.id === level.id}
					on:click={() => selectLevel(level)}
					on:keypress={() => {}}
					role="button"
					tabindex="0"
				>
					<div style="font-weight:600;">{level.name}</div>
					<div style="font-size:12px; color:var(--text-muted);">
						{level.gridWidth}×{level.gridHeight} | {level.glassBlocks.length} 块
					</div>
					<div style="font-size:11px; color:var(--text-muted); word-break:break-all; margin-top:2px;">
						{level.id}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<div class="editor-center">
		{#if editingLevel}
			<div class="card" style="margin-bottom:16px;">
				<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
					<h3>编辑: {editingLevel.name}</h3>
					<div style="display:flex; gap:8px; align-items:center;">
						<span style="font-size:12px; color:var(--text-muted);">
							历史: {historyIndex + 1}/{history.length}
						</span>
						<button class="btn btn-secondary" style="padding:6px 10px;" on:click={undo} disabled={historyIndex <= 0}>
							↩ 撤销
						</button>
						<button class="btn btn-secondary" style="padding:6px 10px;" on:click={redo} disabled={historyIndex >= history.length - 1}>
							↪ 重做
						</button>
					</div>
				</div>

				{#if message}
					<div class="message-banner" class:msg-info={messageType==='info'} class:msg-success={messageType==='success'} class:msg-warning={messageType==='warning'} class:msg-error={messageType==='error'}>
						{message}
					</div>
				{/if}

				<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
					<div>
						<label for="e-name" style="font-size:13px; color:var(--text-secondary); display:block; margin-bottom:4px;">关卡名称</label>
						<input id="e-name" type="text" bind:value={editingLevel.name} style="width:100%; padding:6px 10px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary); font-size:14px;" />
					</div>
					<div>
						<label for="e-par" style="font-size:13px; color:var(--text-secondary); display:block; margin-bottom:4px;">标杆步数</label>
						<input id="e-par" type="number" bind:value={editingLevel.parScore} min="0" style="width:100%; padding:6px 10px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary); font-size:14px;" />
					</div>
				</div>
				<div style="margin-bottom:16px;">
					<label for="e-desc" style="font-size:13px; color:var(--text-secondary); display:block; margin-bottom:4px;">描述</label>
					<textarea id="e-desc" bind:value={editingLevel.description} rows="2" style="width:100%; padding:6px 10px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary); font-size:14px; resize:vertical;"></textarea>
				</div>
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h3 style="margin-bottom:12px;">📊 编辑前后差异对比（实时重算）</h3>
				<div class="diff-container">
					<div class="diff-col baseline">
						<div class="diff-col-header">
							<span style="font-weight:700;">编辑前 (基准)</span>
						</div>
						{#if baselineSim}
							<svg
								width={canvasWidth}
								height={canvasHeight}
								viewBox="0 0 {canvasWidth} {canvasHeight}"
								style="width:100%; height:auto;"
							>
								<rect width="100%" height="100%" fill="#0d1117" rx="6" />
								<circle
									cx={(editingLevel.lightSource.gridX + 0.5) * CELL_SIZE}
									cy={(editingLevel.lightSource.gridY + 0.5) * CELL_SIZE}
									r="8"
									fill="#fde047"
								/>
								<rect
									x={editingLevel.targetPrism.gridX * CELL_SIZE + 3}
									y={editingLevel.targetPrism.gridY * CELL_SIZE + 3}
									width={CELL_SIZE - 6}
									height={CELL_SIZE - 6}
									fill="none"
									stroke={baselineSim.targetReached ? '#4ade80' : '#f87171'}
									stroke-width="1.5"
									rx="3"
								/>
								{#each selectedLevel?.glassBlocks ?? [] as block}
									{@const mat = getMaterial(block.materialId)}
									<rect
										x={block.gridX * CELL_SIZE + 4}
										y={block.gridY * CELL_SIZE + 4}
										width={CELL_SIZE - 8}
										height={CELL_SIZE - 8}
										fill={mat?.color ?? '#555'}
										fill-opacity="0.25"
										stroke={mat?.color ?? '#555'}
										stroke-width="0.8"
										rx="2"
										transform={`rotate(${block.rotation} ${(block.gridX + 0.5) * CELL_SIZE} ${(block.gridY + 0.5) * CELL_SIZE})`}
									/>
								{/each}
								{#if baselineSim.segments.length > 0}
									<path
										d={getBeamPath(baselineSim.segments, CELL_SIZE)}
										fill="none"
										stroke={getIntensityColor(baselineSim.finalIntensity)}
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										opacity={Math.max(0.3, baselineSim.finalIntensity)}
									/>
								{/if}
							</svg>
							<div class="diff-stats">
								<span class="badge {baselineSim.targetReached ? 'badge-success' : 'badge-danger'}">
									{baselineSim.targetReached ? '✓ 可达' : '✗ 不可达'}
								</span>
								<div style="font-size:12px; margin-top:4px;">
									<span>光强: <strong>{baselineSim.finalIntensity.toFixed(3)}</strong></span>
									<span style="margin-left:8px;">光段: {baselineSim.segments.length}</span>
								</div>
								{#if baselineSim.failureReason}
									<div style="font-size:10px; color:var(--danger); margin-top:4px; word-break:break-all;">
										{baselineSim.failureReason}
									</div>
								{/if}
							</div>
						{:else}
							<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">
								选择关卡以加载基准模拟
							</div>
						{/if}
					</div>

					<div class="diff-arrow">
						<div>✂ 修改</div>
						<div style="font-size:18px; color:var(--accent);">→</div>
						<div>✓ 保存</div>
					</div>

					<div class="diff-col current">
						<div class="diff-col-header">
							<span style="font-weight:700;">编辑中 (当前)</span>
							{#if simulating}
								<span class="spinner-small"></span>
							{/if}
						</div>
						{#if currentSim && editingLevel}
							<svg
								width={canvasWidth}
								height={canvasHeight}
								viewBox="0 0 {canvasWidth} {canvasHeight}"
								style="width:100%; height:auto;"
							>
								<defs>
									<filter id="editor-beam-glow">
										<feGaussianBlur stdDeviation="3" />
									</filter>
								</defs>
								<rect width="100%" height="100%" fill="#0a1520" rx="6" stroke="#38bdf8" stroke-width="0.5" />
								<circle
									cx={(editingLevel.lightSource.gridX + 0.5) * CELL_SIZE}
									cy={(editingLevel.lightSource.gridY + 0.5) * CELL_SIZE}
									r="8"
									fill="#fde047"
								/>
								<rect
									x={editingLevel.targetPrism.gridX * CELL_SIZE + 3}
									y={editingLevel.targetPrism.gridY * CELL_SIZE + 3}
									width={CELL_SIZE - 6}
									height={CELL_SIZE - 6}
									fill="none"
									stroke={currentSim.targetReached ? '#4ade80' : '#f87171'}
									stroke-width="2"
									rx="3"
								/>
								{#each editingLevel.glassBlocks as block}
									{@const mat = getMaterial(block.materialId)}
									<g
										transform={`rotate(${block.rotation} ${(block.gridX + 0.5) * CELL_SIZE} ${(block.gridY + 0.5) * CELL_SIZE})`}
										class="editor-block"
										on:click={() => rotateEditorBlock(block.id, 90)}
										on:keypress={() => {}}
										role="button"
										tabindex="0"
									>
										<rect
											x={block.gridX * CELL_SIZE + 4}
											y={block.gridY * CELL_SIZE + 4}
											width={CELL_SIZE - 8}
											height={CELL_SIZE - 8}
											fill={mat?.color ?? '#555'}
											fill-opacity="0.4"
											stroke={mat?.color ?? '#555'}
											stroke-width="1.2"
											rx="2"
										/>
										{#if block.shape === 'triangle' || block.shape === 'prism'}
											<text
												x={(block.gridX + 0.5) * CELL_SIZE}
												y={(block.gridY + 0.5) * CELL_SIZE + 2}
												text-anchor="middle"
												font-size="9"
												fill="#fff"
												opacity="0.8"
											>△</text>
										{/if}
									</g>
								{/each}
								{#if currentSim.segments.length > 0}
									<path
										d={getBeamPath(currentSim.segments, CELL_SIZE)}
										fill="none"
										stroke={getIntensityColor(currentSim.finalIntensity)}
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
										opacity={Math.max(0.3, currentSim.finalIntensity)}
										filter="url(#editor-beam-glow)"
									/>
								{/if}
							</svg>
							<div class="diff-stats">
								<span class="badge {currentSim.targetReached ? 'badge-success' : 'badge-danger'}">
									{currentSim.targetReached ? '✓ 可达' : '✗ 不可达'}
								</span>
								{#if baselineSim && currentSim.finalIntensity !== baselineSim.finalIntensity}
									<span
										class="badge"
										style="margin-left:6px; background:{currentSim.finalIntensity > baselineSim.finalIntensity ? '#166534' : '#7f1d1d'}; color:{currentSim.finalIntensity > baselineSim.finalIntensity ? '#86efac' : '#fca5a5'};"
									>
										{currentSim.finalIntensity > baselineSim.finalIntensity ? '↑' : '↓'}
										{Math.abs(currentSim.finalIntensity - baselineSim.finalIntensity).toFixed(3)}
									</span>
								{/if}
								<div style="font-size:12px; margin-top:4px;">
									<span>光强: <strong>{currentSim.finalIntensity.toFixed(3)}</strong></span>
									<span style="margin-left:8px;">光段: {currentSim.segments.length}</span>
								</div>
								{#if currentSim.failureReason}
									<div style="font-size:10px; color:var(--danger); margin-top:4px; word-break:break-all;">
										{currentSim.failureReason}
									</div>
								{/if}
								<div style="font-size:10px; color:var(--accent); margin-top:4px;">
									💡 点击玻璃块可旋转 90°
								</div>
							</div>
						{:else}
							<div style="padding:20px; text-align:center; color:var(--text-muted); font-size:12px;">
								等待模拟结果
							</div>
						{/if}
					</div>
				</div>

				{#if baselineSim && currentSim && diffData}
					<div class="diff-summary" style="margin-top:12px;">
						<div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">差异分析</div>
						<div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
							<div class="diff-stat-cell">
								<div style="font-size:10px; color:var(--text-muted);">目标可达</div>
								<div style="font-size:14px; font-weight:700; color:{diffData.dReached ? 'var(--accent)' : 'var(--text-muted)'};">
									{baselineSim.targetReached ? '✓' : '✗'} → {currentSim.targetReached ? '✓' : '✗'}
								</div>
							</div>
							<div class="diff-stat-cell">
								<div style="font-size:10px; color:var(--text-muted);">光强变化</div>
								<div style="font-size:14px; font-weight:700; color:{diffData.dIntensity > 0.001 ? (currentSim.finalIntensity > baselineSim.finalIntensity ? 'var(--success)' : 'var(--danger)') : 'var(--text-muted)'};">
									{diffData.intensityDelta > 0 ? '+' : ''}{diffData.intensityDelta.toFixed(3)}
								</div>
							</div>
							<div class="diff-stat-cell">
								<div style="font-size:10px; color:var(--text-muted);">光段变化</div>
								<div style="font-size:14px; font-weight:700; color:{diffData.dSegments !== 0 ? 'var(--accent)' : 'var(--text-muted)'};">
									{diffData.dSegments > 0 ? '+' : ''}{diffData.dSegments}
								</div>
							</div>
							<div class="diff-stat-cell">
								<div style="font-size:10px; color:var(--text-muted);">吸收事件</div>
								<div style="font-size:14px; font-weight:700; color:{diffData.dAbsorption !== 0 ? 'var(--warning)' : 'var(--text-muted)'};">
									{diffData.dAbsorption > 0 ? '+' : ''}{diffData.dAbsorption}
								</div>
							</div>
						</div>
						<div style="font-size:11px; color:var(--text-muted); margin-top:8px;">
							{#if !diffData.dReached && diffData.dIntensity < 0.001 && diffData.dSegments === 0 && diffData.dAbsorption === 0}
								<span style="color:var(--text-secondary);">✓ 与基准相比无变化</span>
							{:else}
								{#if diffData.dReached}
									<span style="color:currentSim.targetReached ? 'var(--success)' : 'var(--danger)'; font-weight:600;">
										⚠ 可达性改变
									</span>
								{/if}
								{#if diffData.dSegments !== 0}
									<span style="margin-left:8px;">光路长度改变</span>
								{/if}
								{#if diffData.dAbsorption !== 0}
									<span style="margin-left:8px;">穿过玻璃数不同</span>
								{/if}
							{/if}
						</div>
					</div>
				{/if}
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h4 style="margin-bottom:8px;">添加玻璃块</h4>
				<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
					<select bind:value={newBlockMaterial} style="padding:6px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary);">
						{#each materials as mat}
							<option value={mat.id}>{mat.name} (n={mat.refractiveIndex})</option>
						{/each}
					</select>
					<select bind:value={newBlockShape} style="padding:6px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary);">
						<option value="rectangle">矩形</option>
						<option value="triangle">三角形</option>
						<option value="prism">棱镜</option>
					</select>
					<button class="btn btn-primary" on:click={addBlock}>+ 添加</button>
				</div>
			</div>

			<div class="card" style="margin-bottom:16px;">
				<h4 style="margin-bottom:8px;">玻璃块列表 ({editingLevel.glassBlocks.length})</h4>
				{#if editingLevel.glassBlocks.length === 0}
					<p style="font-size:13px; color:var(--text-muted);">暂无玻璃块</p>
				{:else}
					<div style="max-height:200px; overflow-y:auto;">
						{#each editingLevel.glassBlocks as block}
							{@const mat = getMaterial(block.materialId)}
							<div class="block-row">
								<span style="width:12px; height:12px; background:{mat?.color ?? '#555'}; border-radius:2px; flex-shrink:0;"></span>
								<span style="font-size:12px; flex:1; word-break:break-all;">
									{mat?.name ?? block.materialId} · {block.shape} · ({block.gridX},{block.gridY}) · {block.rotation}°
								</span>
								<div style="display:flex; gap:2px; flex-shrink:0;">
									<button class="mini-btn" on:click={() => rotateEditorBlock(block.id, 90)} title="旋转90°">↻</button>
									<button class="mini-btn" on:click={() => moveBlock(block.id, -1, 0)} title="左移">←</button>
									<button class="mini-btn" on:click={() => moveBlock(block.id, 1, 0)} title="右移">→</button>
									<button class="mini-btn" on:click={() => moveBlock(block.id, 0, -1)} title="上移">↑</button>
									<button class="mini-btn" on:click={() => moveBlock(block.id, 0, 1)} title="下移">↓</button>
									<button class="mini-btn danger" on:click={() => removeBlock(block.id)} title="删除">✕</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div style="display:flex; gap:8px; flex-wrap:wrap;">
				<button class="btn btn-success" on:click={saveLevel} disabled={!editingLevel}>💾 保存关卡</button>
				{#if editingLevel}
					<a href="/play/{editingLevel.id}" class="btn btn-primary">▶ 测试关卡</a>
				{/if}
			</div>

			{#if saveDiffData}
				<div class="card save-diff-card" style="margin-top:16px;">
					<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
						<h3 style="margin:0;">📌 本次保存触发的光线重算差异</h3>
						<button class="mini-btn" style="width:auto; padding:2px 8px; font-size:12px;" on:click={() => saveDiffData = null}>✕ 关闭</button>
					</div>

					<div class="save-diff-grid">
						<div class="save-diff-col before">
							<div class="save-diff-col-header">保存前（基准光线模拟）</div>
							<div class="save-diff-stat">
								<span class="badge {saveDiffData.before.targetReached ? 'badge-success' : 'badge-danger'}">
									{saveDiffData.before.targetReached ? '✓ 可达' : '✗ 不可达'}
								</span>
							</div>
							<div class="save-diff-stat">
								<span>光强: <strong>{saveDiffData.before.finalIntensity.toFixed(3)}</strong></span>
							</div>
							<div class="save-diff-stat">
								<span>光段: {saveDiffData.before.segments.length}</span>
							</div>
							<div class="save-diff-stat">
								<span>吸收事件: {saveDiffData.before.absorptionEvents.length}</span>
							</div>
							{#if saveDiffData.before.failureReason}
								<div class="save-diff-stat" style="color:var(--danger); font-size:11px; word-break:break-all;">
									{saveDiffData.before.failureReason}
								</div>
							{/if}
						</div>

						<div class="save-diff-arrow-col">
							<div style="font-size:22px; color:var(--accent);">→</div>
							<div style="font-size:10px; color:var(--text-muted); margin-top:4px;">编辑保存</div>
						</div>

						<div class="save-diff-col after" class:improved={saveDiffData.improved} class:worsened={saveDiffData.worsened}>
							<div class="save-diff-col-header">保存后（当前光线模拟）</div>
							<div class="save-diff-stat">
								<span class="badge {saveDiffData.after.targetReached ? 'badge-success' : 'badge-danger'}">
									{saveDiffData.after.targetReached ? '✓ 可达' : '✗ 不可达'}
								</span>
								{#if saveDiffData.before.targetReached !== saveDiffData.after.targetReached}
									<span
										class="badge"
										style="margin-left:4px; background:{saveDiffData.after.targetReached ? '#166534' : '#7f1d1d'}; color:{saveDiffData.after.targetReached ? '#86efac' : '#fca5a5'};"
									>变更!</span>
								{/if}
							</div>
							<div class="save-diff-stat">
								<span>光强: <strong>{saveDiffData.after.finalIntensity.toFixed(3)}</strong></span>
								{#if Math.abs(saveDiffData.after.finalIntensity - saveDiffData.before.finalIntensity) > 0.001}
									<span
										class="badge"
										style="margin-left:6px; background:{saveDiffData.after.finalIntensity > saveDiffData.before.finalIntensity ? '#166534' : '#7f1d1d'}; color:{saveDiffData.after.finalIntensity > saveDiffData.before.finalIntensity ? '#86efac' : '#fca5a5'};"
									>
										{saveDiffData.after.finalIntensity > saveDiffData.before.finalIntensity ? '↑' : '↓'}
										{Math.abs(saveDiffData.after.finalIntensity - saveDiffData.before.finalIntensity).toFixed(3)}
									</span>
								{/if}
							</div>
							<div class="save-diff-stat">
								<span>光段: {saveDiffData.after.segments.length}</span>
								{#if saveDiffData.after.segments.length !== saveDiffData.before.segments.length}
									<span style="color:var(--accent); margin-left:4px;">
										({saveDiffData.after.segments.length > saveDiffData.before.segments.length ? '+' : ''}{saveDiffData.after.segments.length - saveDiffData.before.segments.length})
									</span>
								{/if}
							</div>
							<div class="save-diff-stat">
								<span>吸收事件: {saveDiffData.after.absorptionEvents.length}</span>
								{#if saveDiffData.after.absorptionEvents.length !== saveDiffData.before.absorptionEvents.length}
									<span style="color:var(--warning); margin-left:4px;">
										({saveDiffData.after.absorptionEvents.length > saveDiffData.before.absorptionEvents.length ? '+' : ''}{saveDiffData.after.absorptionEvents.length - saveDiffData.before.absorptionEvents.length})
									</span>
								{/if}
							</div>
							{#if saveDiffData.after.failureReason}
								<div class="save-diff-stat" style="color:var(--danger); font-size:11px; word-break:break-all;">
									{saveDiffData.after.failureReason}
								</div>
							{/if}
						</div>
					</div>

					<div style="margin-top:12px; padding:10px; border-radius:6px; background:{saveDiffData.improved ? '#16653433' : saveDiffData.worsened ? '#7f1d1d33' : 'var(--bg-hover)'}; border-left:3px solid {saveDiffData.improved ? 'var(--success)' : saveDiffData.worsened ? 'var(--danger)' : 'var(--text-muted)'};">
						<div style="font-size:13px; font-weight:600; color:{saveDiffData.improved ? 'var(--success)' : saveDiffData.worsened ? 'var(--danger)' : 'var(--text-secondary)'};">
							{saveDiffData.improved ? '✓ 改善' : saveDiffData.worsened ? '⚠ 恶化' : '— 无明显变化'}
						</div>
						<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
							{saveDiffData.summary}
						</div>
						<div style="font-size:11px; color:var(--text-muted); margin-top:6px;">
							此差异由本次编辑保存触发的光线重算产生。若需回滚，可使用上方"撤销"按钮恢复到保存前的历史快照。
						</div>
					</div>
				</div>
			{/if}
		{:else}
			<div class="card" style="text-align:center; color:var(--text-muted); padding:40px;">
				<p>← 从左侧选择一个关卡开始编辑，或创建新关卡</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.editor-layout {
		display: grid;
		grid-template-columns: 260px 1fr;
		gap: 16px;
	}
	.level-item {
		cursor: pointer;
		padding: 10px;
		margin-bottom: 8px;
		transition: border-color 0.2s;
	}
	.level-item:hover {
		border-color: var(--accent);
	}
	.level-item.selected {
		border-color: var(--accent);
		background: var(--bg-hover);
	}
	.diff-container {
		display: grid;
		grid-template-columns: 1fr 60px 1fr;
		gap: 12px;
		align-items: start;
	}
	.diff-col {
		background: var(--bg-hover);
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--border);
	}
	.diff-col.baseline {
		opacity: 0.85;
	}
	.diff-col.current {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent-glow);
	}
	.diff-col-header {
		padding: 8px 10px;
		border-bottom: 1px solid var(--border);
		font-size: 12px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--bg-card);
	}
	.diff-col.baseline .diff-col-header {
		color: var(--text-secondary);
	}
	.diff-col.current .diff-col-header {
		color: var(--accent);
	}
	.diff-arrow {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-size: 11px;
		color: var(--text-muted);
		padding-top: 40px;
	}
	.diff-stats {
		padding: 8px 10px;
		border-top: 1px solid var(--border);
		background: var(--bg-card);
	}
	.diff-summary {
		background: var(--bg-hover);
		padding: 10px 12px;
		border-radius: 6px;
	}
	.diff-stat-cell {
		background: var(--bg-card);
		padding: 6px 8px;
		border-radius: 4px;
		text-align: center;
	}
	.block-row {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 8px;
		background: var(--bg-hover);
		border-radius: 4px;
		margin-bottom: 4px;
	}
	.mini-btn {
		background: var(--bg-card);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		width: 22px;
		height: 22px;
		border-radius: 3px;
		font-size: 11px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.mini-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.mini-btn.danger:hover {
		border-color: var(--danger);
		color: var(--danger);
	}
	.editor-block {
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.editor-block:hover {
		opacity: 0.85;
	}
	.spinner-small {
		width: 14px;
		height: 14px;
		border: 2px solid var(--bg-hover);
		border-top-color: var(--accent);
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.message-banner {
		padding: 8px 12px;
		border-radius: 4px;
		font-size: 12px;
		margin-bottom: 12px;
	}
	.msg-info { background: #1e3a5f33; color: #93c5fd; border-left: 3px solid var(--accent); }
	.msg-success { background: #16653433; color: #86efac; border-left: 3px solid var(--success); }
	.msg-warning { background: #713f1233; color: #fde68a; border-left: 3px solid var(--warning); }
	.msg-error { background: #7f1d1d33; color: #fca5a5; border-left: 3px solid var(--danger); }
	.save-diff-card {
		border: 2px solid var(--accent);
		animation: fadeSlideIn 0.3s ease;
	}
	@keyframes fadeSlideIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.save-diff-grid {
		display: grid;
		grid-template-columns: 1fr 50px 1fr;
		gap: 10px;
		align-items: start;
	}
	.save-diff-col {
		background: var(--bg-hover);
		border-radius: 6px;
		padding: 10px;
	}
	.save-diff-col.before {
		border-left: 3px solid var(--text-muted);
	}
	.save-diff-col.after {
		border-left: 3px solid var(--accent);
	}
	.save-diff-col.after.improved {
		border-left-color: var(--success);
	}
	.save-diff-col.after.worsened {
		border-left-color: var(--danger);
	}
	.save-diff-col-header {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 8px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}
	.save-diff-arrow-col {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 16px;
	}
	.save-diff-stat {
		font-size: 12px;
		padding: 3px 0;
		color: var(--text-secondary);
	}
	:global(button[disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}
	@media (max-width: 960px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}
		.diff-container {
			grid-template-columns: 1fr;
		}
		.diff-arrow {
			padding: 8px;
			flex-direction: row;
		}
	}
</style>
