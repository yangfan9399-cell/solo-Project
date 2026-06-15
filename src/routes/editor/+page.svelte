<script lang="ts">
	import { onMount } from 'svelte';
	import type { Level, Material, GlassBlock } from '$lib/types';

	let levels: Level[] = [];
	let materials: Material[] = [];
	let selectedLevel: Level | null = null;
	let editingLevel: Level | null = null;
	let history: Level[] = [];
	let historyIndex = -1;
	let message = '';

	let newBlockMaterial = 'clear-glass';
	let newBlockShape: 'rectangle' | 'triangle' | 'prism' = 'rectangle';

	onMount(async () => {
		const [lRes, mRes] = await Promise.all([
			fetch('/api/levels'),
			fetch('/api/materials')
		]);
		levels = await lRes.json();
		materials = await mRes.json();
	});

	function selectLevel(level: Level) {
		selectedLevel = level;
		editingLevel = JSON.parse(JSON.stringify(level));
		history = [JSON.parse(JSON.stringify(level))];
		historyIndex = 0;
		message = '';
	}

	function pushHistory() {
		if (!editingLevel) return;
		history = history.slice(0, historyIndex + 1);
		history.push(JSON.parse(JSON.stringify(editingLevel)));
		historyIndex = history.length - 1;
	}

	function undo() {
		if (historyIndex <= 0) return;
		historyIndex--;
		editingLevel = JSON.parse(JSON.stringify(history[historyIndex]));
		message = '已回滚到上一步';
	}

	function redo() {
		if (historyIndex >= history.length - 1) return;
		historyIndex++;
		editingLevel = JSON.parse(JSON.stringify(history[historyIndex]));
		message = '已重做';
	}

	function addBlock() {
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
		pushHistory();
		message = '已添加玻璃块';
	}

	function removeBlock(blockId: string) {
		if (!editingLevel) return;
		editingLevel.glassBlocks = editingLevel.glassBlocks.filter(b => b.id !== blockId);
		pushHistory();
		message = '已移除玻璃块';
	}

	function moveBlock(blockId: string, dx: number, dy: number) {
		if (!editingLevel) return;
		const block = editingLevel.glassBlocks.find(b => b.id === blockId);
		if (!block) return;
		block.gridX = Math.max(0, Math.min(editingLevel.gridWidth - 1, block.gridX + dx));
		block.gridY = Math.max(0, Math.min(editingLevel.gridHeight - 1, block.gridY + dy));
		pushHistory();
		message = '已移动玻璃块，需重新计算光路';
	}

	async function saveLevel() {
		if (!editingLevel) return;
		const res = await fetch(`/api/levels/${editingLevel.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editingLevel)
		});
		if (res.ok) {
			selectedLevel = JSON.parse(JSON.stringify(editingLevel));
			message = '关卡已保存';
			const lRes = await fetch('/api/levels');
			levels = await lRes.json();
		} else {
			message = '保存失败';
		}
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
		selectLevel(level);
		message = '已创建新关卡';
	}
</script>

<h1 class="page-title">🛠️ 关卡编辑器</h1>
<p style="color:var(--text-secondary); margin-bottom:24px;">
	编辑关卡布局，添加/移除/移动铅玻璃块。支持撤销和重做，保存后需要重新计算光路。
</p>

<div class="editor-layout">
	<div class="editor-left">
		<h3 style="margin-bottom:12px;">关卡列表</h3>
		<div style="margin-bottom:12px;">
			<button class="btn btn-primary" on:click={createNewLevel}>+ 新建关卡</button>
		</div>
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
			</div>
		{/each}
	</div>

	<div class="editor-center">
		{#if editingLevel}
			<div class="card">
				<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
					<h3>编辑: {editingLevel.name}</h3>
					<div style="display:flex; gap:8px;">
						<button class="btn btn-secondary" on:click={undo} disabled={historyIndex <= 0}>
							↩ 撤销
						</button>
						<button class="btn btn-secondary" on:click={redo} disabled={historyIndex >= history.length - 1}>
							↪ 重做
						</button>
					</div>
				</div>

				{#if message}
					<div style="padding:8px; margin-bottom:12px; background:var(--bg-hover); border-radius:4px; font-size:13px; color:var(--accent);">
						{message}
					</div>
				{/if}

				<div style="margin-bottom:16px;">
					<label for="edit-name" style="font-size:13px; color:var(--text-secondary); display:block; margin-bottom:4px;">关卡名称</label>
					<input id="edit-name" type="text" bind:value={editingLevel.name} style="width:100%; padding:6px 10px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary); font-size:14px;" />
				</div>
				<div style="margin-bottom:16px;">
					<label for="edit-desc" style="font-size:13px; color:var(--text-secondary); display:block; margin-bottom:4px;">描述</label>
					<textarea id="edit-desc" bind:value={editingLevel.description} rows="2" style="width:100%; padding:6px 10px; background:var(--bg-hover); border:1px solid var(--border); border-radius:4px; color:var(--text-primary); font-size:14px; resize:vertical;"></textarea>
				</div>

				<div style="margin-bottom:16px;">
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
						<button class="btn btn-primary" on:click={addBlock}>添加</button>
					</div>
				</div>

				<div style="margin-bottom:16px;">
					<h4 style="margin-bottom:8px;">玻璃块列表 ({editingLevel.glassBlocks.length})</h4>
					{#each editingLevel.glassBlocks as block}
						{@const mat = materials.find(m => m.id === block.materialId)}
						<div style="display:flex; align-items:center; gap:8px; padding:8px; background:var(--bg-hover); border-radius:4px; margin-bottom:6px;">
							<span style="width:12px; height:12px; background:{mat?.color ?? '#555'}; border-radius:2px; flex-shrink:0;"></span>
							<span style="font-size:13px; flex:1;">
								{mat?.name ?? block.materialId} ({block.shape}) @ ({block.gridX},{block.gridY}) {block.rotation}°
							</span>
							<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" on:click={() => moveBlock(block.id, -1, 0)}>←</button>
							<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" on:click={() => moveBlock(block.id, 1, 0)}>→</button>
							<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" on:click={() => moveBlock(block.id, 0, -1)}>↑</button>
							<button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" on:click={() => moveBlock(block.id, 0, 1)}>↓</button>
							<button class="btn btn-danger" style="padding:4px 8px; font-size:11px;" on:click={() => removeBlock(block.id)}>✕</button>
						</div>
					{/each}
					{#if editingLevel.glassBlocks.length === 0}
						<p style="font-size:13px; color:var(--text-muted);">暂无玻璃块，点击上方"添加"按钮</p>
					{/if}
				</div>

				<div style="display:flex; gap:8px;">
					<button class="btn btn-success" on:click={saveLevel}>💾 保存关卡</button>
					<a href="/play/{editingLevel.id}" class="btn btn-primary">▶ 测试关卡</a>
				</div>
			</div>
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
		grid-template-columns: 240px 1fr;
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
	:global(button[disabled]) {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}
	}
</style>
