<script lang="ts">
	import { sessionStore, windStore, currentLevel } from '$lib/data/store';
	import type { GameScores } from '$lib/data/types';

	let session = $derived($sessionStore);
	let level = $derived($currentLevel);
	let windData = $derived($windStore);

	function scoreColor(score: number, min: number): string {
		return score >= min ? 'var(--success)' : 'var(--danger)';
	}

	async function settle() {
		if (!session || !level) return;
		const result = await windStore.submitScore(level.id, session.buildings);
		if (result) {
			const status = result.passed ? 'passed' : 'failed';
			await sessionStore.updateSessionStatus(status, result.scores);
		}
	}

	async function retry() {
		if (!level) return;
		await sessionStore.startSession(level.id);
		windStore.reset();
	}
</script>

{#if session?.status !== 'playing' && windData.scores}
	<div class="settlement-overlay">
		<div class="settlement-card card">
			{#if session?.status === 'passed'}
				<div class="settle-icon">🎉</div>
				<h2>通关成功！</h2>
			{:else}
				<div class="settle-icon">💨</div>
				<h2>未通过</h2>
			{/if}

			<div class="settle-scores">
				<div class="settle-score">
					<span>舒适度</span>
					<strong style="color: {scoreColor(windData.scores!.comfort, level?.objective.comfortMin ?? 0)}">
						{windData.scores!.comfort} / {level?.objective.comfortMin}
					</strong>
				</div>
				<div class="settle-score">
					<span>安全性</span>
					<strong style="color: {scoreColor(windData.scores!.safety, level?.objective.safetyMin ?? 0)}">
						{windData.scores!.safety} / {level?.objective.safetyMin}
					</strong>
				</div>
				<div class="settle-score">
					<span>通风效率</span>
					<strong style="color: {scoreColor(windData.scores!.efficiency, level?.objective.efficiencyMin ?? 0)}">
						{windData.scores!.efficiency} / {level?.objective.efficiencyMin}
					</strong>
				</div>
				<div class="settle-score total-score">
					<span>综合得分</span>
					<strong style="color: {scoreColor(windData.scores!.total, level?.objective.totalMin ?? 0)}">
						{windData.scores!.total} / {level?.objective.totalMin}
					</strong>
				</div>
			</div>

			<div class="settle-actions">
				<button class="btn-secondary" onclick={retry}>重新挑战</button>
				{#if session?.status === 'passed'}
					<a href="/" class="btn-primary" style="text-decoration:none; display:inline-block;">返回关卡</a>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.settlement-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
	}

	.settlement-card {
		text-align: center;
		min-width: 360px;
		max-width: 480px;
	}

	.settle-icon {
		font-size: 48px;
		margin-bottom: 8px;
	}

	.settlement-card h2 {
		font-size: 24px;
		margin-bottom: 20px;
	}

	.settle-scores {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 20px;
	}

	.settle-score {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.settle-score span {
		font-size: 12px;
		color: var(--text-secondary);
	}

	.settle-score strong {
		font-size: 18px;
	}

	.total-score {
		grid-column: 1 / -1;
		background: rgba(56, 189, 248, 0.08);
		border: 1px solid var(--accent);
	}

	.settle-actions {
		display: flex;
		gap: 12px;
		justify-content: center;
	}
</style>
