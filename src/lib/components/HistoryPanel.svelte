<script lang="ts">
	import type { GameSession, PlayerAction } from '$lib/types/game';
	import { formatTime } from '$lib/utils/format';

	export let session: GameSession;
	export let onRewind: (step: number) => void;

	$: actions = session.history.actions;
	$: currentStep = session.history.currentStep;

	function formatAction(a: PlayerAction, idx: number): string {
		switch (a.type) {
			case 'MOVE':
				return `乘 → 站${idx + 1}`;
			case 'TRANSFER':
				return `🔄 换乘`;
			case 'WAIT':
				return `⏸ 等待 ${formatTime(a.timeSpent)}`;
			default:
				return a.type;
		}
	}

	function getActionDetail(a: PlayerAction): string {
		switch (a.type) {
			case 'MOVE':
				return formatTime(a.timeSpent);
			case 'TRANSFER':
				return formatTime(a.timeSpent);
			default:
				return '';
		}
	}
</script>

<div class="card history-panel">
	<div class="panel-header">
		<span class="font-bold">📜 操作历史</span>
		<span class="text-sm text-muted">共 {actions.length} 步</span>
	</div>

	{#if actions.length === 0}
		<div class="empty-state text-center py-6">
			<div class="text-2xl mb-2">🎯</div>
			<div class="text-sm text-muted">开始游戏后操作将显示在这里</div>
		</div>
	{:else}
		<div class="history-list">
			{#each actions as action, idx}
				<div
					class="history-item {idx < currentStep ? 'applied' : ''} {idx === currentStep - 1 ? 'current' : ''}"
					on:click={() => session.status === 'playing' && onRewind(idx)}
					class:clickable={session.status === 'playing'}
				>
					<div class="step-num">{idx + 1}</div>
					<div class="step-content">
						<div class="step-text">{formatAction(action, idx)}</div>
						<div class="step-detail text-xs text-muted">{getActionDetail(action)}</div>
					</div>
					{#if idx < currentStep}
						<span class="check">✓</span>
					{/if}
				</div>
			{/each}
		</div>

		{#if session.status === 'playing' && actions.length > 0}
			<div class="hint text-xs text-muted text-center mt-2">
				💡 点击任意步骤可回退到该位置
			</div>
		{/if}
	{/if}
</div>

<style>
	.history-panel {
		padding: 14px 16px;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 10px;
		margin-bottom: 10px;
		border-bottom: 1px solid var(--border);
	}

	.history-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-right: 4px;
	}

	.history-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 6px;
		background: var(--bg-card);
		opacity: 0.5;
	}

	.history-item.applied {
		opacity: 1;
	}

	.history-item.current {
		background: rgba(59, 130, 246, 0.15);
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.history-item.clickable {
		cursor: pointer;
	}

	.history-item.clickable:hover {
		background: var(--border);
	}

	.step-num {
		width: 24px;
		height: 24px;
		background: var(--bg-secondary);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 700;
		flex-shrink: 0;
	}

	.current .step-num {
		background: var(--accent);
		color: white;
	}

	.step-content {
		flex: 1;
		min-width: 0;
	}

	.step-text {
		font-size: 13px;
		font-weight: 500;
	}

	.check {
		color: var(--success);
		font-weight: 700;
		font-size: 12px;
	}

	.hint {
		padding-top: 8px;
		border-top: 1px solid var(--border);
	}
</style>
