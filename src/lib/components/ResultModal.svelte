<script lang="ts">
	import type { GameResult, LevelConfig } from '$lib/types/game';

	export let result: GameResult;
	export let rating: { stars: number; label: string };
	export let level: LevelConfig;
	export let onClose: () => void;
	export let onReplay: () => void;
	export let onBack: () => void;

	$: timeDiff = level.parTime - result.elapsedSeconds;
	$: transferDiff = level.parTransfers - result.transfersUsed;
</script>

<div class="modal-overlay" on:click={onClose}>
	<div class="modal" on:click|stopPropagation>
		<div class="result-header {result.won ? 'won' : 'lost'}">
			<div class="result-emoji">{result.won ? '🎉' : '😔'}</div>
			<div class="result-title">{result.won ? '挑战成功！' : '挑战失败'}</div>
			<div class="result-reason text-sm">{result.reason}</div>
		</div>

		{#if result.won}
			<div class="stars-row">
				{#each Array(5) as _, i}
					<span class="star {i < rating.stars ? 'active' : ''}">★</span>
				{/each}
				<span class="rating-label">{rating.label}</span>
			</div>
		{/if}

		<div class="stats-grid">
			<div class="stat-box">
				<div class="stat-box-label">用时</div>
				<div class="stat-box-value">{result.elapsedSeconds}s</div>
				<div class="stat-box-diff {timeDiff >= 0 ? 'text-success' : 'text-danger'}">
					基准 {level.parTime}s · {timeDiff >= 0 ? '快' : '慢'} {Math.abs(timeDiff)}s
				</div>
			</div>
			<div class="stat-box">
				<div class="stat-box-label">换乘</div>
				<div class="stat-box-value">{result.transfersUsed}次</div>
				<div class="stat-box-diff {transferDiff >= 0 ? 'text-success' : 'text-danger'}">
					基准 {level.parTransfers}次 · {transferDiff >= 0 ? '少' : '多'} {Math.abs(transferDiff)}次
				</div>
			</div>
		</div>

		<div class="score-breakdown">
			<div class="breakdown-title">📊 分数明细 <span class="server-tag">后端验证</span></div>
			<div class="breakdown-row">
				<span>基础分</span>
				<span class="text-success">+{result.score.baseScore}</span>
			</div>
			<div class="breakdown-row">
				<span>时间奖励</span>
				<span class={result.score.timeBonus > 0 ? 'text-success' : 'text-muted'}>+{result.score.timeBonus}</span>
			</div>
			<div class="breakdown-row">
				<span>换乘奖励</span>
				<span class={result.score.transferBonus >= 0 ? 'text-success' : 'text-danger'}>{result.score.transferBonus >= 0 ? '+' : ''}{result.score.transferBonus}</span>
			</div>
			<div class="breakdown-row">
				<span>事件惩罚</span>
				<span class="text-danger">-{result.score.eventPenalty}</span>
			</div>
			<div class="breakdown-total">
				<span>总分</span>
				<span class="total-value">{result.score.total}</span>
			</div>
		</div>

		<div class="route-preview">
			<div class="breakdown-title">🛤️ 行驶路线</div>
			<div class="route-stations">
				{#each result.route as r, idx}
					{#if idx > 0}
						<span class="route-arrow">→</span>
					{/if}
					<span class="route-station">{r.stationId.replace('s', '站')}</span>
				{/each}
			</div>
		</div>

		<div class="modal-actions">
			<button class="btn-secondary" on:click={onBack}>返回关卡</button>
			<button class="btn-primary" on:click={onReplay}>再来一次</button>
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 20px;
	}

	.modal {
		background: var(--bg-secondary);
		border-radius: 16px;
		width: 100%;
		max-width: 460px;
		border: 1px solid var(--border);
		overflow: hidden;
		animation: pop 0.3s ease;
	}

	@keyframes pop {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.result-header {
		padding: 28px 24px;
		text-align: center;
	}

	.result-header.won {
		background: linear-gradient(180deg, rgba(16, 185, 129, 0.15), transparent);
	}

	.result-header.lost {
		background: linear-gradient(180deg, rgba(239, 68, 68, 0.15), transparent);
	}

	.result-emoji {
		font-size: 56px;
		margin-bottom: 8px;
	}

	.result-title {
		font-size: 26px;
		font-weight: 700;
		margin-bottom: 4px;
	}

	.result-reason {
		color: var(--text-muted);
	}

	.stars-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 0 24px 16px;
	}

	.star {
		font-size: 30px;
		color: var(--bg-card);
	}

	.star.active {
		color: #fbbf24;
		text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
	}

	.rating-label {
		margin-left: 10px;
		font-size: 14px;
		color: var(--warning);
		font-weight: 600;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		padding: 0 24px;
	}

	.stat-box {
		background: var(--bg-card);
		padding: 12px;
		border-radius: 10px;
		text-align: center;
	}

	.stat-box-label {
		font-size: 11px;
		color: var(--text-muted);
	}

	.stat-box-value {
		font-size: 22px;
		font-weight: 700;
		margin: 4px 0;
	}

	.stat-box-diff {
		font-size: 11px;
	}

	.score-breakdown {
		margin: 16px 24px;
		padding: 14px;
		background: var(--bg-card);
		border-radius: 10px;
	}

	.breakdown-title {
		font-size: 13px;
		font-weight: 600;
		margin-bottom: 10px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.server-tag {
		font-size: 10px;
		background: rgba(59, 130, 246, 0.2);
		color: var(--accent);
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 500;
	}

	.breakdown-row {
		display: flex;
		justify-content: space-between;
		padding: 4px 0;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.breakdown-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 10px;
		margin-top: 8px;
		border-top: 1px solid var(--border);
		font-weight: 600;
	}

	.total-value {
		font-size: 22px;
		color: var(--warning);
	}

	.route-preview {
		margin: 0 24px 16px;
		padding: 12px 14px;
		background: var(--bg-card);
		border-radius: 10px;
	}

	.route-stations {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 4px;
		font-size: 12px;
	}

	.route-station {
		background: var(--bg-secondary);
		padding: 3px 8px;
		border-radius: 4px;
	}

	.route-arrow {
		color: var(--text-muted);
		font-size: 11px;
	}

	.modal-actions {
		display: flex;
		gap: 10px;
		padding: 16px 24px 24px;
	}

	.modal-actions button {
		flex: 1;
		padding: 12px;
	}
</style>
