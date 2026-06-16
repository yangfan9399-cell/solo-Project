<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { sessionStore, windStore, currentLevel, selectedBuildingType } from '$lib/data/store';
	import { LEVELS } from '$lib/data/seed';
	import GameBoard from '$lib/components/GameBoard.svelte';
	import BuildingPalette from '$lib/components/BuildingPalette.svelte';
	import SensorPanel from '$lib/components/SensorPanel.svelte';
	import SchemeCompare from '$lib/components/SchemeCompare.svelte';
	import ResearchReport from '$lib/components/ResearchReport.svelte';
	import SettlementScreen from '$lib/components/SettlementScreen.svelte';

	let levelId = $derived($page.params.level);
	let session = $derived($sessionStore);
	let level = $derived($currentLevel);
	let windData = $derived($windStore);
	let selectedType = $derived($selectedBuildingType);

	let activeTab = $state<'sensors' | 'schemes' | 'report'>('sensors');

	onMount(async () => {
		if (levelId) {
			await sessionStore.startSession(levelId);
		}
	});

	async function runSimulation() {
		if (!session || !level) return;
		await windStore.simulate(level.id, session.buildings);
	}

	async function handleUndo() {
		await sessionStore.undo();
	}

	async function handleRedo() {
		await sessionStore.redo();
	}

	async function submitResult() {
		if (!session || !level) return;
		const result = await windStore.submitScore(level.id, session.buildings);
		if (result) {
			await windStore.simulate(level.id, session.buildings);
			const status = result.passed ? 'passed' : 'failed';
			await sessionStore.updateSessionStatus(status, result.scores);
		}
	}

	function buildingCount(): number {
		if (!session || !level) return 0;
		return session.buildings.length - level.presetBuildings.length;
	}

	function maxBuildings(): number {
		return level?.maxBuildings ?? 0;
	}
</script>

{#if level}
	<div class="game-page">
		<div class="game-header">
			<a href="/" class="back-btn">← 返回</a>
			<div class="game-title">
				<h2>{level.name}</h2>
				<span class="wind-info">🌬️ {level.wind.baseSpeed}m/s {level.wind.direction} | 建筑 {buildingCount()}/{maxBuildings()}</span>
			</div>
			<div class="game-actions">
				<button class="btn-secondary" onclick={handleUndo} disabled={!session?.operations?.length}>
					↩️ 撤销
				</button>
				<button class="btn-primary" onclick={runSimulation} disabled={windData.loading}>
					{windData.loading ? '计算中...' : '▶️ 运行模拟'}
				</button>
				{#if windData.scores}
					<button class="btn-success" onclick={submitResult}>
						📝 提交结果
					</button>
				{/if}
			</div>
		</div>

		<div class="game-body">
			<div class="left-panel">
				<BuildingPalette />
			</div>

			<div class="center-panel">
				<GameBoard />
				{#if windData.scores}
					<div class="current-scores card">
						<div class="score-chip">
							<span>舒适</span>
							<strong>{windData.scores.comfort}</strong>
						</div>
						<div class="score-chip">
							<span>安全</span>
							<strong>{windData.scores.safety}</strong>
						</div>
						<div class="score-chip">
							<span>效率</span>
							<strong>{windData.scores.efficiency}</strong>
						</div>
						<div class="score-chip total">
							<span>综合</span>
							<strong>{windData.scores.total}</strong>
						</div>
					</div>
				{/if}
			</div>

			<div class="right-panel">
				<div class="tab-bar">
					<button class="tab-btn" class:active={activeTab === 'sensors'} onclick={() => (activeTab = 'sensors')}>传感器</button>
					<button class="tab-btn" class:active={activeTab === 'schemes'} onclick={() => (activeTab = 'schemes')}>方案</button>
					<button class="tab-btn" class:active={activeTab === 'report'} onclick={() => (activeTab = 'report')}>报告</button>
				</div>

				{#if activeTab === 'sensors'}
					<SensorPanel />
				{:else if activeTab === 'schemes'}
					<SchemeCompare />
				{:else}
					<ResearchReport />
				{/if}
			</div>
		</div>

		<SettlementScreen />
	</div>
{:else}
	<div class="loading-page">
		<p>加载中...</p>
	</div>
{/if}

<style>
	.game-page {
		max-width: 1400px;
		margin: 0 auto;
	}

	.game-header {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.back-btn {
		color: var(--text-secondary);
		font-size: 14px;
	}

	.game-title {
		flex: 1;
	}

	.game-title h2 {
		font-size: 20px;
		margin-bottom: 2px;
	}

	.wind-info {
		font-size: 13px;
		color: var(--text-secondary);
	}

	.game-actions {
		display: flex;
		gap: 8px;
	}

	.game-body {
		display: grid;
		grid-template-columns: 200px 1fr 320px;
		gap: 16px;
		align-items: start;
	}

	@media (max-width: 1024px) {
		.game-body {
			grid-template-columns: 1fr;
		}
	}

	.left-panel {
		background: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: 12px;
	}

	.center-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.current-scores {
		display: flex;
		gap: 12px;
		width: 100%;
		justify-content: center;
	}

	.score-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 6px 14px;
		background: var(--bg-card);
		border-radius: 8px;
	}

	.score-chip span {
		font-size: 11px;
		color: var(--text-secondary);
	}

	.score-chip strong {
		font-size: 18px;
		font-weight: 800;
	}

	.score-chip.total strong {
		color: var(--accent);
	}

	.right-panel {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.tab-bar {
		display: flex;
		gap: 0;
		margin-bottom: 12px;
	}

	.tab-btn {
		flex: 1;
		padding: 8px;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		font-size: 13px;
		font-weight: 600;
		border-radius: 0;
		transition: all 0.2s;
	}

	.tab-btn:first-child {
		border-radius: 8px 0 0 8px;
	}

	.tab-btn:last-child {
		border-radius: 0 8px 8px 0;
	}

	.tab-btn.active {
		background: var(--accent);
		color: var(--bg-primary);
		border-color: var(--accent);
	}

	.loading-page {
		text-align: center;
		padding: 100px 0;
		color: var(--text-secondary);
	}
</style>
