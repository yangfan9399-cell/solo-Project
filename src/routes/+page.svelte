<script lang="ts">
	import { onMount } from 'svelte';
	import { playerStore } from '$lib/data/store';
	import { LEVELS } from '$lib/data/seed';
	import type { Level } from '$lib/data/types';

	let player = $derived($playerStore);
	let levels = LEVELS;

	onMount(() => {
		playerStore.load();
	});

	function isUnlocked(level: Level, index: number): boolean {
		if (index === 0) return true;
		return player?.completedLevels?.includes(LEVELS[index - 1].id) ?? false;
	}

	function getBestScore(levelId: string): string {
		const best = player?.bestScores?.[levelId];
		return best ? `${best.total}分` : '--';
	}
</script>

<div class="home-page">
	<section class="hero">
		<h1>🏙️ 城市风洞模型测试游戏</h1>
		<p class="subtitle">在虚拟风洞中规划建筑布局，优化城市风环境</p>
		<div class="player-info card">
			<span class="player-name">👤 {player?.name ?? '研究员'}</span>
			<span class="player-progress">已通关 {player?.completedLevels?.length ?? 0}/{levels.length} 关</span>
		</div>
	</section>

	<section class="level-grid">
		{#each levels as level, i}
			{@const unlocked = isUnlocked(level, i)}
			{@const completed = player?.completedLevels?.includes(level.id) ?? false}
			<a
				href={unlocked ? `/game/${level.id}` : '#'}
				class="level-card card"
				class:locked={!unlocked}
				class:completed={completed}
			>
				<div class="level-number">关卡 {i + 1}</div>
				<h3>{level.name}</h3>
				<p class="level-desc">{level.description}</p>
				<div class="level-meta">
					<span>🌬️ {level.wind.baseSpeed}m/s {level.wind.direction}</span>
					<span>🏗️ 最多{level.maxBuildings}栋</span>
				</div>
				<div class="level-score">
					最高分: {getBestScore(level.id)}
				</div>
				{#if !unlocked}
					<div class="lock-overlay">🔒 未解锁</div>
				{/if}
				{#if completed}
					<div class="completed-badge">✅ 已通关</div>
				{/if}
			</a>
		{/each}
	</section>
</div>

<style>
	.home-page {
		max-width: 1200px;
		margin: 0 auto;
	}

	.hero {
		text-align: center;
		margin-bottom: 40px;
	}

	.hero h1 {
		font-size: 36px;
		margin-bottom: 8px;
		background: linear-gradient(135deg, var(--accent), var(--success));
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: 16px;
		margin-bottom: 16px;
	}

	.player-info {
		display: inline-flex;
		gap: 24px;
		padding: 12px 24px;
	}

	.player-name {
		font-weight: 600;
	}

	.player-progress {
		color: var(--accent);
	}

	.level-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 20px;
	}

	.level-card {
		position: relative;
		text-decoration: none;
		color: var(--text-primary);
		transition: transform 0.2s, box-shadow 0.2s;
		cursor: pointer;
	}

	.level-card:hover:not(.locked) {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
	}

	.level-card.locked {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.level-number {
		color: var(--accent);
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		margin-bottom: 4px;
	}

	.level-card h3 {
		font-size: 20px;
		margin-bottom: 8px;
	}

	.level-desc {
		color: var(--text-secondary);
		font-size: 13px;
		margin-bottom: 12px;
		line-height: 1.5;
	}

	.level-meta {
		display: flex;
		gap: 12px;
		font-size: 12px;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.level-score {
		font-size: 14px;
		font-weight: 600;
		color: var(--warning);
	}

	.lock-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(15, 23, 42, 0.7);
		border-radius: 12px;
		font-size: 16px;
		font-weight: 700;
	}

	.completed-badge {
		position: absolute;
		top: 12px;
		right: 12px;
		font-size: 12px;
	}
</style>
