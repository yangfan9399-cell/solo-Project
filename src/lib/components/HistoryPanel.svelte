<script lang="ts">
	import type { GameState, GameAction } from '$lib/types/game';

	export let gameState: GameState;
	export let onUndo: () => void;
	export let onRedo: () => void;
	export let onReset: () => void;

	$: canUndo = gameState.historyIndex >= 0;
	$: canRedo = gameState.historyIndex < gameState.history.length - 1;

	function getActionLabel(action: GameAction): string {
		const labels: Record<string, string> = {
			frequency: '频率调整',
			gain: '增益调整',
			antenna: '天线角度',
			filter: '噪声滤波',
			decode: '解码操作',
			reset: '重置'
		};
		return labels[action.type] || action.type;
	}

	function formatValue(value: number | string): string {
		if (typeof value === 'number') {
			return value.toFixed(2);
		}
		return value;
	}
</script>

<div class="history-panel card">
	<div class="card-header">
		<span>操作历史</span>
		<span class="count">{gameState.history.length} 步</span>
	</div>

	<div class="history-actions">
		<button
			class="btn btn-ghost"
			on:click={onUndo}
			disabled={!canUndo || gameState.status !== 'playing'}
			title="撤销 (Ctrl+Z)"
		>
			↶ 撤销
		</button>
		<button
			class="btn btn-ghost"
			on:click={onRedo}
			disabled={!canRedo || gameState.status !== 'playing'}
			title="重做 (Ctrl+Y)"
		>
			↷ 重做
		</button>
		<button
			class="btn btn-ghost"
			on:click={onReset}
			disabled={gameState.status !== 'playing'}
			title="重置到初始状态"
		>
			⟲ 重置
		</button>
	</div>

	<div class="history-list">
		{#if gameState.history.length === 0}
			<div class="empty">暂无操作记录</div>
		{:else}
			{#each gameState.history as action, i}
				<div class="history-item {i <= gameState.historyIndex ? 'active' : 'future'}">
					<span class="step">第 {i + 1} 步</span>
					<span class="action-label">{getActionLabel(action)}</span>
					<span class="action-change">
						{formatValue(action.from)} → {formatValue(action.to)}
					</span>
				</div>
			{/each}
		{/if}
	</div>
</div>

<style>
	.history-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.count {
		font-size: 11px;
		color: var(--text-muted);
	}

	.history-actions {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.history-actions .btn {
		flex: 1;
		padding: 6px 8px;
		font-size: 12px;
	}

	.history-list {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.history-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 8px 10px;
		border-radius: 4px;
		font-size: 11px;
		transition: all 0.2s ease;
	}

	.history-item.active {
		background: rgba(59, 130, 246, 0.1);
		border-left: 2px solid var(--accent-blue);
	}

	.history-item.future {
		opacity: 0.4;
	}

	.step {
		font-weight: 600;
		color: var(--text-secondary);
	}

	.action-label {
		color: var(--text-primary);
	}

	.action-change {
		color: var(--accent-cyan);
		font-family: 'SF Mono', 'Menlo', monospace;
	}

	.empty {
		text-align: center;
		padding: 20px;
		color: var(--text-muted);
		font-size: 12px;
	}
</style>
