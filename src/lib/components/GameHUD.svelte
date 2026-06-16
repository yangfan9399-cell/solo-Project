<script lang="ts">
	import type { LevelConfig, GameSession, ScoreBreakdown } from '$lib/types/game';
	import { getDifficultyLabel, getDifficultyTagClass, formatTimeLong } from '$lib/utils/format';

	export let level: LevelConfig;
	export let session: GameSession;
	export let realtimeElapsed: number;
	export let remainingSeconds: number;
	export let isLastTrain: boolean;
	export let previewScore: ScoreBreakdown | null = null;
	export let onBack: () => void;

	$: formattedTime = formatTimeLong(Math.floor(realtimeElapsed));
	$: formattedRemaining = formatTimeLong(Math.ceil(remainingSeconds));
	$: progress = Math.max(0, Math.min(100, (realtimeElapsed / level.timeLimitSeconds) * 100));
</script>

<div class="hud">
	<div class="hud-left">
		<button class="btn-secondary text-sm" on:click={onBack}>← 关卡列表</button>
		<div class="level-info">
			<span class="font-bold">{level.name}</span>
			<span class={getDifficultyTagClass(level.difficulty)}>
				{getDifficultyLabel(level.difficulty)}
			</span>
		</div>
	</div>

	<div class="hud-center">
		<div class="timer {isLastTrain && session.status === 'playing' ? 'urgent' : ''}">
			<div class="timer-label">剩余时间</div>
			<div class="timer-value">{formattedRemaining}</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {100 - progress}%;"></div>
			</div>
		</div>
	</div>

	<div class="hud-right">
		<div class="stat">
			<div class="stat-label">已用时间</div>
			<div class="stat-value">{formattedTime}</div>
		</div>
		<div class="stat">
			<div class="stat-label">换乘次数</div>
			<div class="stat-value {session.transfersUsed > level.maxTransfers ? 'text-danger' : ''}">
				{session.transfersUsed}/{level.maxTransfers}
			</div>
		</div>
		{#if previewScore}
			<div class="stat">
				<div class="stat-label">预估分数</div>
				<div class="stat-value text-warning">{previewScore.total}</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.hud {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 20px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		gap: 20px;
	}

	.hud-left,
	.hud-right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.level-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.hud-center {
		flex: 1;
		display: flex;
		justify-content: center;
	}

	.timer {
		text-align: center;
		min-width: 180px;
	}

	.timer-label {
		font-size: 11px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.timer-value {
		font-size: 32px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1.2;
	}

	.timer.urgent .timer-value {
		color: var(--danger);
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.progress-bar {
		width: 200px;
		height: 4px;
		background: var(--bg-card);
		border-radius: 2px;
		margin: 4px auto 0;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--success);
		transition: width 0.3s;
		border-radius: 2px;
	}

	.timer.urgent .progress-fill {
		background: var(--danger);
	}

	.stat {
		text-align: center;
		min-width: 70px;
	}

	.stat-label {
		font-size: 11px;
		color: var(--text-muted);
	}

	.stat-value {
		font-size: 18px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
</style>
