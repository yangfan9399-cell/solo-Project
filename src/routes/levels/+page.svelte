<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { levelsApi, getLocalPlayerId, playersApi } from '$lib/client/api';
	import type { LevelConfig, PlayerProfile } from '$lib/types/game';

	let levels: LevelConfig[] = [];
	let player: PlayerProfile | null = null;
	let isLoading = true;

	onMount(async () => {
		const [{ levels: l }, playerId] = [await levelsApi.getAll(), getLocalPlayerId()];
		levels = l;
		if (playerId) {
			const { player: p } = await playersApi.get(playerId);
			player = p;
		}
		isLoading = false;
	});

	function getDifficultyLabel(d: string) {
		return d === 'easy' ? '简单' : d === 'medium' ? '中等' : '困难';
	}

	function difficultyStars(d: string) {
		return d === 'easy' ? '⭐' : d === 'medium' ? '⭐⭐' : '⭐⭐⭐';
	}
</script>

<div class="container">
	<div class="page-header">
		<div>
			<h1 class="text-2xl font-bold">选择关卡</h1>
			<p class="text-muted mt-1">循序渐进，挑战更难的路线</p>
		</div>
		<button class="btn-secondary" on:click={() => goto('/')}>返回首页</button>
	</div>

	{#if isLoading}
		<div class="text-center py-12 text-muted">加载中...</div>
	{:else}
		<div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
			{#each levels as level, i}
				<div class="card level-detail-card">
					<div class="level-number">第 {i + 1} 关</div>
					<div class="flex justify-between items-start mb-4">
						<div>
							<h3 class="text-xl font-bold">{level.name}</h3>
							<div class="text-muted text-sm mt-1">{level.description}</div>
						</div>
						<div>
							<span class="tag tag-{level.difficulty}">{getDifficultyLabel(level.difficulty)}</span>
							<div class="text-xs text-muted text-right mt-1">{difficultyStars(level.difficulty)}</div>
						</div>
					</div>

					<div class="info-grid">
						<div class="info-item">
							<div class="info-icon">⏱️</div>
							<div>
								<div class="info-label">时间限制</div>
								<div class="info-value">{level.timeLimitSeconds} 秒</div>
							</div>
						</div>
						<div class="info-item">
							<div class="info-icon">🔄</div>
							<div>
								<div class="info-label">最大换乘</div>
								<div class="info-value">{level.maxTransfers} 次</div>
							</div>
						</div>
						<div class="info-item">
							<div class="info-icon">🎯</div>
							<div>
								<div class="info-label">基准时间</div>
								<div class="info-value">{level.parTime} 秒</div>
							</div>
						</div>
						<div class="info-item">
							<div class="info-icon">🚇</div>
							<div>
								<div class="info-label">基准换乘</div>
								<div class="info-value">{level.parTransfers} 次</div>
							</div>
						</div>
					</div>

					{#if level.eventSchedule.length > 0}
						<div class="events-preview">
							<div class="text-sm font-medium mb-2">⚠️ 途中事件</div>
							<div class="flex flex-wrap gap-2">
								{#each level.eventSchedule as ev}
									<span class="event-tag">
										{ev.time}s: {ev.event.type === 'ESCALATOR_DOWN' ? '扶梯故障' : ev.event.type === 'STATION_CLOSED' ? '封站' : '延误'}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					{#if player?.bestScores[level.id]}
						<div class="best-score-row">
							<span class="text-muted text-sm">最高分</span>
							<span class="font-bold text-warning">{player.bestScores[level.id]}</span>
							{#if player.completedLevels.includes(level.id)}
								<span class="tag tag-easy">✓ 已通关</span>
							{/if}
						</div>
					{/if}

					<button
						class="btn-primary"
						style="width: 100%; margin-top: 16px;"
						on:click={() => goto(`/game?level=${level.id}`)}
					>
						{player?.completedLevels.includes(level.id) ? '再次挑战' : '开始挑战'}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 24px 0;
	}

	.level-detail-card {
		position: relative;
		overflow: hidden;
	}

	.level-number {
		position: absolute;
		top: 0;
		right: 0;
		background: var(--accent);
		color: white;
		padding: 4px 14px;
		font-size: 12px;
		font-weight: 600;
		border-bottom-left-radius: 10px;
	}

	.info-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin: 16px 0;
	}

	.info-item {
		display: flex;
		gap: 10px;
		align-items: center;
		background: var(--bg-card);
		padding: 10px 12px;
		border-radius: 8px;
	}

	.info-icon {
		font-size: 22px;
	}

	.info-label {
		font-size: 11px;
		color: var(--text-muted);
	}

	.info-value {
		font-size: 14px;
		font-weight: 600;
	}

	.events-preview {
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.2);
		padding: 10px 12px;
		border-radius: 8px;
	}

	.event-tag {
		font-size: 11px;
		background: rgba(245, 158, 11, 0.2);
		color: var(--warning);
		padding: 3px 8px;
		border-radius: 4px;
	}

	.best-score-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 12px;
		padding: 10px 12px;
		background: var(--bg-card);
		border-radius: 8px;
	}
</style>
