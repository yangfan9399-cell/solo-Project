<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PlayerProfile, Level, GameState } from '$lib/types/game';

	let player: PlayerProfile | null = null;
	let levels: Level[] = [];
	let recentGames: GameState[] = [];
	let loading = true;

	const PLAYER_ID_KEY = 'currentPlayerId';

	onMount(async () => {
		try {
			const savedPlayerId = localStorage.getItem(PLAYER_ID_KEY);

			const playersRes = await fetch('/api/players');
			const players = await playersRes.json();

			if (savedPlayerId) {
				player = players.find((p: PlayerProfile) => p.id === savedPlayerId) || players[0];
			} else {
				player = players[0];
			}

			if (player) {
				localStorage.setItem(PLAYER_ID_KEY, player.id);
			}

			const levelsRes = await fetch('/api/levels');
			levels = await levelsRes.json();

			if (player) {
				const gamesRes = await fetch(`/api/games?playerId=${player.id}`);
				recentGames = await gamesRes.json();
				recentGames.sort((a: GameState, b: GameState) => b.startTime - a.startTime);
				recentGames = recentGames.slice(0, 5);
			}
		} catch (error) {
			console.error('加载数据失败:', error);
		} finally {
			loading = false;
		}
	});

	async function startGame(levelId: string) {
		if (!player) return;

		try {
			const res = await fetch('/api/games', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playerId: player.id,
					levelId
				})
			});

			if (res.ok) {
				const game = await res.json();
				goto(`/game/${game.id}`);
			}
		} catch (error) {
			console.error('创建游戏失败:', error);
		}
	}

	function getDifficultyStars(difficulty: number): string {
		return '⭐'.repeat(difficulty);
	}

	function getGameStatusLabel(status: string): string {
		switch (status) {
			case 'won': return '通关';
			case 'lost': return '失败';
			default: return '进行中';
		}
	}

	function getGameStatusClass(status: string): string {
		switch (status) {
			case 'won': return 'status-won';
			case 'lost': return 'status-lost';
			default: return 'status-playing';
		}
	}

	$: winRate = player && player.totalGames > 0
		? ((player.totalWins / player.totalGames) * 100).toFixed(1)
		: '0';
</script>

<div class="home-page grid-bg">
	<div class="stars-bg"></div>

	<header class="page-header">
		<div class="logo">
			<span class="logo-icon">🛰</span>
			<div class="logo-text">
				<h1>深空探针信号校准</h1>
				<p>DEEP SPACE PROBE CALIBRATION</p>
			</div>
		</div>
	</header>

	<main class="main-content">
		{#if loading}
			<div class="loading">加载中...</div>
		{:else}
			<section class="profile-section">
				<div class="profile-card card">
					<div class="card-header">指挥官档案</div>
					<div class="profile-body">
						<div class="avatar">
							{player?.name?.charAt(0) || '?'}
						</div>
						<h2 class="player-name">{player?.name}</h2>
						<div class="player-stats">
							<div class="stat">
								<span class="stat-value">{player?.totalGames}</span>
								<span class="stat-label">总局数</span>
							</div>
							<div class="stat">
								<span class="stat-value">{player?.totalWins}</span>
								<span class="stat-label">通关</span>
							</div>
							<div class="stat">
								<span class="stat-value">{winRate}%</span>
								<span class="stat-label">胜率</span>
							</div>
							<div class="stat">
								<span class="stat-value best">{player?.bestScore}</span>
								<span class="stat-label">最高分</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section class="levels-section">
				<div class="section-header">
					<h2>选择任务</h2>
					<p>校准深空探针信号，解码遥测数据</p>
				</div>

				<div class="levels-grid">
					{#each levels as level}
						<div class="level-card card" on:click={() => startGame(level.id)}>
							<div class="level-header">
								<span class="level-num">{level.id.split('-')[1]}</span>
								<span class="level-difficulty">{getDifficultyStars(level.difficulty)}</span>
							</div>
							<h3 class="level-name">{level.name}</h3>
							<p class="level-desc">{level.description}</p>
							<div class="level-info">
								<div class="info-item">
									<span class="info-icon">📡</span>
									<span>{level.targetFrequency.toFixed(0)} MHz</span>
								</div>
								<div class="info-item">
									<span class="info-icon">⏱</span>
									<span>{level.timeLimit}s</span>
								</div>
								<div class="info-item">
									<span class="info-icon">🏆</span>
									<span>{level.parScore} 分</span>
								</div>
							</div>
							<button class="btn btn-primary start-btn">
								开始校准
							</button>
						</div>
					{/each}
				</div>
			</section>

			<section class="history-section">
				<div class="section-header">
					<h2>最近记录</h2>
				</div>
				<div class="history-card card">
					{#if recentGames.length === 0}
						<div class="empty-history">暂无游戏记录</div>
					{:else}
						<div class="history-list">
							{#each recentGames as game}
								<div class="history-item" on:click={() => goto(`/game/${game.id}`)}>
									<div class="history-level">
										{levels.find(l => l.id === game.levelId)?.name || '未知关卡'}
									</div>
									<div class="history-score">
										{game.score} 分
									</div>
									<div class="history-status {getGameStatusClass(game.status)}">
										{getGameStatusLabel(game.status)}
									</div>
									<div class="history-time">
										{new Date(game.startTime).toLocaleDateString()}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		{/if}
	</main>
</div>

<style>
	.home-page {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		position: relative;
	}

	.stars-bg {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			radial-gradient(1px 1px at 20px 30px, white, transparent),
			radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
			radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
			radial-gradient(1px 1px at 90px 40px, white, transparent),
			radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.7), transparent),
			radial-gradient(1.5px 1.5px at 160px 120px, white, transparent);
		background-size: 200px 200px;
		animation: twinkle 4s ease-in-out infinite;
		pointer-events: none;
		z-index: 0;
	}

	@keyframes twinkle {
		0%, 100% { opacity: 0.5; }
		50% { opacity: 1; }
	}

	.page-header {
		padding: 30px 40px;
		position: relative;
		z-index: 1;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.logo-icon {
		font-size: 48px;
		animation: float 3s ease-in-out infinite;
	}

	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-5px); }
	}

	.logo-text h1 {
		font-size: 28px;
		font-weight: bold;
		margin: 0;
		color: var(--text-primary);
		letter-spacing: 2px;
	}

	.logo-text p {
		font-size: 12px;
		color: var(--text-muted);
		margin: 4px 0 0 0;
		letter-spacing: 3px;
	}

	.main-content {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 40px 60px;
		position: relative;
		z-index: 1;
	}

	.loading {
		text-align: center;
		padding: 100px;
		color: var(--text-muted);
	}

	.profile-section {
		margin-bottom: 40px;
	}

	.profile-card {
		max-width: 400px;
	}

	.profile-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 10px 0;
	}

	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28px;
		font-weight: bold;
		color: white;
		margin-bottom: 12px;
		box-shadow: 0 0 20px var(--glow-blue);
	}

	.player-name {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 20px 0;
		color: var(--text-primary);
	}

	.player-stats {
		display: flex;
		gap: 24px;
		width: 100%;
		justify-content: center;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.stat-value {
		font-size: 20px;
		font-weight: bold;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.stat-value.best {
		color: var(--accent-yellow);
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
	}

	.section-header {
		margin-bottom: 20px;
	}

	.section-header h2 {
		font-size: 20px;
		font-weight: 600;
		margin: 0 0 4px 0;
		color: var(--text-primary);
	}

	.section-header p {
		font-size: 13px;
		color: var(--text-muted);
		margin: 0;
	}

	.levels-section {
		margin-bottom: 40px;
	}

	.levels-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
	}

	.level-card {
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
	}

	.level-card:hover {
		transform: translateY(-4px);
		border-color: var(--accent-blue);
		box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
	}

	.level-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.level-num {
		font-size: 12px;
		color: var(--text-muted);
		font-weight: 600;
	}

	.level-difficulty {
		font-size: 12px;
	}

	.level-name {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: var(--text-primary);
	}

	.level-desc {
		font-size: 13px;
		color: var(--text-secondary);
		margin: 0 0 16px 0;
		flex: 1;
	}

	.level-info {
		display: flex;
		gap: 16px;
		margin-bottom: 16px;
		padding-top: 12px;
		border-top: 1px solid var(--border-color);
	}

	.info-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--text-secondary);
	}

	.info-icon {
		font-size: 14px;
	}

	.start-btn {
		width: 100%;
	}

	.history-section {
		margin-bottom: 40px;
	}

	.empty-history {
		text-align: center;
		padding: 30px;
		color: var(--text-muted);
		font-size: 14px;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.history-item {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		align-items: center;
		padding: 12px 16px;
		background: var(--bg-secondary);
		border-radius: 6px;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.history-item:hover {
		background: var(--bg-tertiary);
	}

	.history-level {
		font-weight: 500;
		color: var(--text-primary);
	}

	.history-score {
		color: var(--accent-cyan);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.history-status {
		font-size: 12px;
		padding: 4px 8px;
		border-radius: 4px;
		width: fit-content;
	}

	.status-won {
		background: rgba(16, 185, 129, 0.2);
		color: var(--accent-green);
	}

	.status-lost {
		background: rgba(239, 68, 68, 0.2);
		color: var(--accent-red);
	}

	.status-playing {
		background: rgba(59, 130, 246, 0.2);
		color: var(--accent-blue);
	}

	.history-time {
		text-align: right;
		font-size: 12px;
		color: var(--text-muted);
	}
</style>
