<script lang="ts">
	import type { GameResult, Level } from '$lib/types/game';

	export let result: GameResult;
	export let level: Level;
	export let onRetry: () => void;
	export let onBack: () => void;

	function getScoreGrade(score: number, parScore: number): { grade: string; color: string } {
		const ratio = score / parScore;
		if (ratio >= 1.5) return { grade: 'S+', color: '#8b5cf6' };
		if (ratio >= 1.2) return { grade: 'S', color: '#a855f7' };
		if (ratio >= 1.0) return { grade: 'A', color: '#10b981' };
		if (ratio >= 0.8) return { grade: 'B', color: '#06b6d4' };
		if (ratio >= 0.6) return { grade: 'C', color: '#f59e0b' };
		return { grade: 'D', color: '#ef4444' };
	}

	$: gradeInfo = getScoreGrade(result.score, level.parScore);
</script>

<div class="result-overlay">
	<div class="result-modal">
		<div class="result-header {result.won ? 'won' : 'lost'}">
			<div class="result-icon">
				{#if result.won}
					🏆
				{:else}
					💫
				{/if}
			</div>
			<h2 class="result-title">
				{result.won ? '校准成功！' : '校准失败'}
			</h2>
			<p class="result-subtitle">
				{result.won
					? '遥测信号已成功解码'
					: '信号强度不足，无法完整解码'}
			</p>
		</div>

		<div class="result-score">
			<div class="score-main">
				<span class="score-label">最终得分</span>
				<span class="score-value" style="color: {gradeInfo.color}">{result.score}</span>
				<span class="score-grade" style="background: {gradeInfo.color}">{gradeInfo.grade}</span>
			</div>
			<div class="score-par">
				标准分: {level.parScore}
			</div>
		</div>

		<div class="result-details">
			<div class="detail-row">
				<span class="detail-label">频率准确度</span>
				<div class="detail-bar">
					<div class="detail-fill" style="width: {result.frequencyAccuracy}%"></div>
				</div>
				<span class="detail-value">{result.frequencyAccuracy.toFixed(1)}%</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">增益准确度</span>
				<div class="detail-bar">
					<div class="detail-fill" style="width: {result.gainAccuracy}%"></div>
				</div>
				<span class="detail-value">{result.gainAccuracy.toFixed(1)}%</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">天线对准度</span>
				<div class="detail-bar">
					<div class="detail-fill" style="width: {result.antennaAccuracy}%"></div>
				</div>
				<span class="detail-value">{result.antennaAccuracy.toFixed(1)}%</span>
			</div>

			<div class="detail-row">
				<span class="detail-label">解码进度</span>
				<div class="detail-bar">
					<div class="detail-fill" style="width: {result.decodeProgress}%"></div>
				</div>
				<span class="detail-value">{result.decodeProgress.toFixed(1)}%</span>
			</div>
		</div>

		<div class="result-bonuses">
			<div class="bonus-item">
				<span class="bonus-label">⏱ 时间奖励</span>
				<span class="bonus-value">+{result.timeBonus}</span>
			</div>
			<div class="bonus-item">
				<span class="bonus-label">⭐ 关卡奖励</span>
				<span class="bonus-value">+{result.levelBonus}</span>
			</div>
		</div>

		<div class="result-actions">
			<button class="btn btn-ghost" on:click={onBack}>
				返回关卡
			</button>
			<button class="btn btn-primary" on:click={onRetry}>
				{result.won ? '再玩一次' : '重新挑战'}
			</button>
		</div>
	</div>
</div>

<style>
	.result-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		backdrop-filter: blur(4px);
	}

	.result-modal {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		width: 90%;
		max-width: 480px;
		overflow: hidden;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.result-header {
		padding: 32px 24px;
		text-align: center;
	}

	.result-header.won {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1));
		border-bottom: 1px solid rgba(16, 185, 129, 0.3);
	}

	.result-header.lost {
		background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1));
		border-bottom: 1px solid rgba(239, 68, 68, 0.3);
	}

	.result-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}

	.result-title {
		font-size: 24px;
		font-weight: bold;
		margin: 0 0 8px 0;
		color: var(--text-primary);
	}

	.result-subtitle {
		font-size: 14px;
		color: var(--text-secondary);
		margin: 0;
	}

	.result-score {
		padding: 24px;
		text-align: center;
		border-bottom: 1px solid var(--border-color);
	}

	.score-main {
		display: flex;
		align-items: baseline;
		justify-content: center;
		gap: 12px;
	}

	.score-label {
		font-size: 14px;
		color: var(--text-secondary);
	}

	.score-value {
		font-size: 48px;
		font-weight: bold;
		font-variant-numeric: tabular-nums;
	}

	.score-grade {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 16px;
		font-weight: bold;
		color: white;
	}

	.score-par {
		margin-top: 8px;
		font-size: 12px;
		color: var(--text-muted);
	}

	.result-details {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.detail-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.detail-label {
		width: 100px;
		font-size: 12px;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.detail-bar {
		flex: 1;
		height: 8px;
		background: var(--bg-tertiary);
		border-radius: 4px;
		overflow: hidden;
	}

	.detail-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--accent-cyan), var(--accent-green));
		transition: width 0.5s ease;
	}

	.detail-value {
		width: 60px;
		text-align: right;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.result-bonuses {
		padding: 16px 24px;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		display: flex;
		justify-content: center;
		gap: 32px;
	}

	.bonus-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.bonus-label {
		font-size: 12px;
		color: var(--text-muted);
	}

	.bonus-value {
		font-size: 16px;
		font-weight: 600;
		color: var(--accent-green);
	}

	.result-actions {
		padding: 20px 24px;
		display: flex;
		gap: 12px;
	}

	.result-actions .btn {
		flex: 1;
		padding: 12px;
		font-size: 14px;
	}
</style>
