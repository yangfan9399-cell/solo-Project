<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getLocalPlayerId, playersApi, levelsApi } from '$lib/client/api';
	import type { PlayerProfile, LevelConfig } from '$lib/types/game';

	let player: PlayerProfile | null = null;
	let levels: LevelConfig[] = [];
	let isLoading = true;

	onMount(async () => {
		const id = getLocalPlayerId();
		if (id) {
			const { player: p } = await playersApi.get(id);
			player = p;
		}
		const { levels: l } = await levelsApi.getAll();
		levels = l;
		isLoading = false;
	});

	async function startGame() {
		if (!player) {
			goto('/levels');
			return;
		}
		const inProgress = levels.find((l) => !player!.completedLevels.includes(l.id));
		if (inProgress) {
			goto(`/game?level=${inProgress.id}`);
		} else {
			goto('/levels');
		}
	}
</script>

<div class="container">
	<section class="hero">
		<div class="hero-content">
			<div class="hero-badge">🎮 全栈策略游戏</div>
			<h1 class="hero-title">地铁换乘迷宫</h1>
			<p class="hero-desc">
				在复杂的地铁网络中规划最优路线，躲避扶梯故障、封站事件，赶在末班车前到达目的地。
				每一步都影响你的最终评分！
			</p>
			<div class="hero-features">
				<div class="feature">
					<span class="feature-icon">🗺️</span>
					<div>
						<div class="feature-title">动态换乘图</div>
						<div class="feature-desc">实时受事件影响的地铁网络</div>
					</div>
				</div>
				<div class="feature">
					<span class="feature-icon">⏱️</span>
					<div>
						<div class="feature-title">限时挑战</div>
						<div class="feature-desc">末班车倒计时紧张刺激</div>
					</div>
				</div>
				<div class="feature">
					<span class="feature-icon">⚠️</span>
					<div>
						<div class="feature-title">随机事件</div>
						<div class="feature-desc">扶梯停运、封站、延误</div>
					</div>
				</div>
				<div class="feature">
					<span class="feature-icon">⭐</span>
					<div>
						<div class="feature-title">路线评分</div>
						<div class="feature-desc">后端验证的星级评价</div>
					</div>
				</div>
			</div>
			<button class="btn-primary hero-btn" on:click={startGame}>
				{isLoading ? '加载中...' : player ? '继续游戏' : '开始游戏'}
			</button>
		</div>

		<div class="hero-stats">
			{#if player}
				<div class="card stat-card">
					<div class="stat-header">
						<span class="stat-avatar">{player.avatar}</span>
						<div>
							<div class="font-bold">{player.name}</div>
							<div class="text-sm text-muted">玩家档案</div>
						</div>
					</div>
					<div class="stat-grid">
						<div>
							<div class="stat-value">{player.totalGames}</div>
							<div class="stat-label">总局数</div>
						</div>
						<div>
							<div class="stat-value text-success">{player.totalWins}</div>
							<div class="stat-label">通关</div>
						</div>
						<div>
							<div class="stat-value">{player.completedLevels.length}/{levels.length}</div>
							<div class="stat-label">关卡进度</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="card stat-card">
					<div class="text-center py-6">
						<div class="text-4xl mb-2">🚉</div>
						<div class="font-medium mb-1">创建你的玩家档案</div>
						<div class="text-sm text-muted">保存进度、记录分数</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<section class="levels-section">
		<h2 class="section-title">关卡一览</h2>
		<div class="grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
			{#each levels as level}
				<div class="card level-card">
					<div class="flex justify-between items-start mb-3">
						<div>
							<div class="font-bold text-lg">{level.name}</div>
							<div class="text-sm text-muted">{level.description}</div>
						</div>
						<span class="tag tag-{level.difficulty}">
							{level.difficulty === 'easy' ? '简单' : level.difficulty === 'medium' ? '中等' : '困难'}
						</span>
					</div>
					<div class="level-meta">
						<div class="meta-item">⏱️ 时限 {level.timeLimitSeconds}s</div>
						<div class="meta-item">🔄 最多换乘 {level.maxTransfers}次</div>
						<div class="meta-item">🎯 目标时间 {level.parTime}s</div>
					</div>
					{#if player?.bestScores[level.id]}
						<div class="best-score text-sm">
							最高分: <span class="text-warning font-bold">{player.bestScores[level.id]}</span>
						</div>
					{/if}
					<button
						class="btn-primary"
						style="width: 100%; margin-top: 12px;"
						on:click={() => goto(`/game?level=${level.id}`)}
					>
						{player?.completedLevels.includes(level.id) ? '再来一次' : '挑战'}
					</button>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.hero {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 40px;
		padding: 40px 0;
	}

	@media (max-width: 768px) {
		.hero {
			grid-template-columns: 1fr;
		}
	}

	.hero-badge {
		display: inline-block;
		background: rgba(59, 130, 246, 0.15);
		color: var(--accent);
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 500;
		margin-bottom: 16px;
	}

	.hero-title {
		font-size: 48px;
		margin: 0 0 16px 0;
		line-height: 1.1;
	}

	.hero-desc {
		font-size: 16px;
		color: var(--text-secondary);
		line-height: 1.7;
		margin-bottom: 28px;
		max-width: 560px;
	}

	.hero-features {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
		margin-bottom: 32px;
	}

	.feature {
		display: flex;
		gap: 12px;
		align-items: flex-start;
	}

	.feature-icon {
		font-size: 28px;
	}

	.feature-title {
		font-weight: 600;
		font-size: 14px;
	}

	.feature-desc {
		font-size: 12px;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.hero-btn {
		padding: 14px 36px;
		font-size: 16px;
	}

	.stat-card {
		height: fit-content;
	}

	.stat-header {
		display: flex;
		gap: 12px;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 1px solid var(--border);
	}

	.stat-avatar {
		font-size: 36px;
	}

	.stat-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		text-align: center;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 700;
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.section-title {
		font-size: 24px;
		margin: 20px 0;
	}

	.level-card {
		transition: transform 0.2s;
	}

	.level-card:hover {
		transform: translateY(-2px);
	}

	.level-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
	}

	.meta-item {
		font-size: 12px;
		color: var(--text-muted);
		background: var(--bg-card);
		padding: 4px 10px;
		border-radius: 6px;
	}

	.best-score {
		margin-top: 12px;
		padding: 8px 12px;
		background: rgba(245, 158, 11, 0.1);
		border-radius: 6px;
	}
</style>
