<script lang="ts">
	import { onMount } from 'svelte';
	import type { Level, BestSolution } from '$lib/types';

	let levels: Level[] = [];
	let bestSolutions: BestSolution[] = [];
	let loading = true;

	onMount(async () => {
		const [levelsRes, bestRes] = await Promise.all([
			fetch('/api/levels'),
			fetch('/api/best-solutions')
		]);
		levels = await levelsRes.json();
		bestSolutions = await bestRes.json();
		loading = false;
	});

	function getBestForLevel(levelId: string): BestSolution | undefined {
		return bestSolutions.find(b => b.levelId === levelId);
	}
</script>

<h1 class="page-title">🔬 铅玻璃迷宫折射游戏</h1>
<p style="color: var(--text-secondary); margin-bottom: 24px;">
	旋转不同折射率的铅玻璃块，将光束引导到目标棱镜。注意吸收损耗——光线过弱无法触发机关！
</p>

{#if loading}
	<p style="color: var(--text-muted);">加载中...</p>
{:else}
	<div class="grid grid-3">
		{#each levels as level}
			{@const best = getBestForLevel(level.id)}
			<div class="card level-card">
				<div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:12px;">
					<div>
						<h3 style="font-size:18px; margin-bottom:4px;">{level.name}</h3>
						<span class="badge badge-info">第 {level.id.split('-')[1]} 关</span>
					</div>
					{#if best && best.score > 0}
						<span class="badge badge-success">🏆 {best.score}</span>
					{:else if best}
						<span class="badge badge-danger">未通过</span>
					{/if}
				</div>
				<p style="color:var(--text-secondary); font-size:14px; margin-bottom:16px;">
					{level.description}
				</p>
				<div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; font-size:13px; color:var(--text-muted);">
					<span>📐 {level.gridWidth}×{level.gridHeight}</span>
					<span>🧊 {level.glassBlocks.length} 块</span>
					<span>🎯 强度≥{level.targetPrism.requiredIntensity}</span>
					<span>⭐ 标杆: {level.parScore} 步</span>
				</div>
				{#if best}
					<div style="font-size:12px; color:var(--text-muted); margin-bottom:12px;">
						最佳: {best.rotationCount} 步 / {best.achievedBy}
					</div>
				{/if}
				<a href="/play/{level.id}" class="btn btn-primary" style="width:100%; justify-content:center;">
					开始挑战 →
				</a>
			</div>
		{/each}
	</div>
{/if}

<style>
	.level-card {
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.level-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}
</style>
