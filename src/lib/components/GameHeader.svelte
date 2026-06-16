<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { GameState, Level } from '$lib/types/game';

	export let gameState: GameState;
	export let level: Level;
	export let onSettle: () => void;
	export let onBack: () => void;

	let elapsedSeconds = 0;
	let timerInterval: number | undefined;

	$: timeRemaining = Math.max(0, level.timeLimit - elapsedSeconds);
	$: timePercent = (timeRemaining / level.timeLimit) * 100;
	$: timeWarning = timeRemaining < 30;
	$: timeCritical = timeRemaining < 10;

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function getDifficultyStars(difficulty: number): string {
		return '⭐'.repeat(difficulty);
	}

	onMount(() => {
		if (gameState.status === 'playing') {
			elapsedSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
			timerInterval = window.setInterval(() => {
				elapsedSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
				if (timeRemaining <= 0) {
					clearInterval(timerInterval);
				}
			}, 1000);
		} else if (gameState.endTime) {
			elapsedSeconds = Math.floor((gameState.endTime - gameState.startTime) / 1000);
		}
	});

	onDestroy(() => {
		if (timerInterval) {
			clearInterval(timerInterval);
		}
	});
</script>

<div class="game-header">
	<div class="header-left">
		<button class="btn btn-ghost back-btn" on:click={onBack}>
			← 返回
		</button>
		<div class="level-info">
			<h2 class="level-name">{level.name}</h2>
			<div class="level-meta">
				<span class="difficulty">{getDifficultyStars(level.difficulty)}</span>
				<span class="separator">•</span>
				<span class="par">标准分 {level.parScore}</span>
			</div>
		</div>
	</div>

	<div class="header-center">
		<div class="timer {timeCritical ? 'critical' : timeWarning ? 'warning' : ''}">
			<span class="timer-icon">⏱</span>
			<span class="timer-value">{formatTime(timeRemaining)}</span>
		</div>
		<div class="timer-bar">
			<div
				class="timer-fill"
				style="width: {timePercent}%; background: {timeCritical ? 'var(--accent-red)' : timeWarning ? 'var(--accent-yellow)' : 'var(--accent-green)'}"
			></div>
		</div>
	</div>

	<div class="header-right">
		<div class="status-badge {gameState.status}">
			{#if gameState.status === 'playing'}
				<span class="status-indicator status-live"></span>
				进行中
			{:else if gameState.status === 'won'}
				✅ 通关
			{:else}
				❌ 失败
			{/if}
		</div>
		{#if gameState.status === 'playing'}
			<button class="btn btn-primary settle-btn" on:click={onSettle}>
				提交校准
			</button>
		{/if}
	</div>
</div>

<style>
	.game-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 20px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		gap: 20px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1;
	}

	.back-btn {
		padding: 6px 12px;
		font-size: 12px;
	}

	.level-info h2 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		color: var(--text-primary);
	}

	.level-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	.difficulty {
		color: var(--accent-yellow);
	}

	.separator {
		color: var(--text-muted);
	}

	.header-center {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	.timer {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 24px;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
		color: var(--text-primary);
		transition: color 0.3s ease;
	}

	.timer.warning {
		color: var(--accent-yellow);
	}

	.timer.critical {
		color: var(--accent-red);
		animation: pulse 1s ease-in-out infinite;
	}

	.timer-icon {
		font-size: 20px;
	}

	.timer-bar {
		width: 200px;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: 2px;
		overflow: hidden;
	}

	.timer-fill {
		height: 100%;
		transition: width 1s linear, background 0.3s ease;
	}

	.header-right {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
	}

	.status-badge {
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-badge.playing {
		background: rgba(16, 185, 129, 0.1);
		color: var(--accent-green);
		border: 1px solid rgba(16, 185, 129, 0.3);
	}

	.status-badge.won {
		background: rgba(16, 185, 129, 0.2);
		color: var(--accent-green);
		border: 1px solid var(--accent-green);
	}

	.status-badge.lost {
		background: rgba(239, 68, 68, 0.1);
		color: var(--accent-red);
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.settle-btn {
		padding: 8px 16px;
		font-size: 13px;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
</style>
