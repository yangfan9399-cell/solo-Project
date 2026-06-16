<script lang="ts">
	import type { SubwayMap, LevelConfig, GameSession } from '$lib/types/game';

	export let session: GameSession;
	export let level: LevelConfig;
	export let map: SubwayMap;
	export let adjacentStations: { stationId: string; lineId: string; time: number }[] = [];
	export let availableTransfers: string[] = [];
	export let stationClosed: boolean;
	export let onStart: () => void;
	export let onMove: (stationId: string, lineId: string, time: number) => void;
	export let onTransfer: (lineId: string) => void;
	export let onSelectLine: (lineId: string) => void;
	export let onWait: (seconds: number) => void;
	export let onFinish: () => void;
	export let onReset: () => void;

	$: currentStation = map.stations[session.currentStationId];
	$: isAtTarget = session.currentStationId === level.targetStationId;
	$: currentLineColor = session.currentLineId ? map.lines[session.currentLineId]?.color : '#64748b';
</script>

<div class="card controls">
	{#if session.status === 'idle'}
		<div class="idle-state">
			<div class="text-center py-4">
				<div class="text-3xl mb-3">🚇</div>
				<div class="font-bold text-lg mb-1">准备出发</div>
				<div class="text-sm text-muted mb-4">
					从 <b>{map.stations[level.startStationId].name}</b> 到 <b>{map.stations[level.targetStationId].name}</b>
				</div>
				<button class="btn-primary" style="width: 100%; padding: 12px;" on:click={onStart}>
					▶ 开始游戏
				</button>
			</div>
		</div>
	{:else if session.status === 'won' || session.status === 'lost'}
		<div class="end-state text-center py-4">
			<div class="text-3xl mb-2">{session.status === 'won' ? '🎉' : '😔'}</div>
			<div class="font-bold text-lg mb-1">
				{session.status === 'won' ? '挑战成功！' : '挑战失败'}
			</div>
			<div class="text-sm text-muted mb-4">
				用时 {session.elapsedSeconds}s · 换乘 {session.transfersUsed} 次
			</div>
			<div class="flex gap-2">
				<button class="btn-secondary" style="flex: 1;" on:click={onReset}>再试一次</button>
			</div>
		</div>
	{:else}
		<div class="current-info">
			<div class="info-row">
				<div class="info-label">当前位置</div>
				<div class="info-value">
					<span class="station-dot" style="background: {currentLineColor};"></span>
					{currentStation?.name}
				</div>
			</div>
			<div class="info-row">
				<div class="info-label">当前线路</div>
				<div class="info-value">
					{#if session.currentLineId}
						<span class="line-badge" style="background: {currentLineColor};">
							{map.lines[session.currentLineId]?.name}
						</span>
					{:else}
						<span class="text-muted">请选择线路</span>
					{/if}
				</div>
			</div>
			<div class="info-row">
				<div class="info-label">目的地</div>
				<div class="info-value {isAtTarget ? 'text-success' : ''}">
					🎯 {map.stations[level.targetStationId].name}
					{#if isAtTarget} ✓{/if}
				</div>
			</div>
		</div>

		{#if !session.currentLineId}
			<div class="section">
				<div class="section-title">🚇 选择上车线路</div>
				<div class="btn-grid">
					{#each availableTransfers as lineId}
						<button
							class="line-btn"
							style="background: {map.lines[lineId]?.color};"
							on:click={() => onSelectLine(lineId)}
						>
							{map.lines[lineId]?.name}
						</button>
					{/each}
				</div>
			</div>
		{:else}
			{#if adjacentStations.length > 0}
				<div class="section">
					<div class="section-title">🚉 前往下一站</div>
					<div class="station-list">
						{#each adjacentStations as adj}
							<button
								class="station-btn"
								on:click={() => onMove(adj.stationId, adj.lineId, adj.time)}
							>
								<span class="station-name">{map.stations[adj.stationId]?.name}</span>
								<span class="station-time">{adj.time}s</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if availableTransfers.length > 0 && currentStation?.isTransfer}
				<div class="section">
					<div class="section-title">🔄 换乘线路 (-3s)</div>
					<div class="btn-grid">
						{#each availableTransfers as lineId}
							<button
								class="line-btn"
								style="background: {map.lines[lineId]?.color};"
								on:click={() => onTransfer(lineId)}
							>
								{map.lines[lineId]?.name}
							</button>
						{/each}
					</div>
				</div>
			{/if}
		{/if}

		{#if stationClosed && session.status === 'playing'}
			<div class="warning-box">
				⚠️ 目的地暂时封闭，可等待或选择其他路线
			</div>
		{/if}

		<div class="section">
			<div class="section-title">⏸️ 等待</div>
			<div class="btn-grid">
				<button class="wait-btn" on:click={() => onWait(5)}>等待 5s</button>
				<button class="wait-btn" on:click={() => onWait(10)}>等待 10s</button>
				<button class="wait-btn" on:click={() => onWait(20)}>等待 20s</button>
			</div>
		</div>

		<div class="action-row">
			{#if isAtTarget}
				<button class="btn-success" style="flex: 1; padding: 12px;" on:click={onFinish}>
					🏁 提交路线
				</button>
			{:else}
				<button class="btn-danger" style="flex: 1;" on:click={onFinish}>
					提前结束
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	.controls {
		padding: 16px;
	}

	.current-info {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-bottom: 14px;
		margin-bottom: 14px;
		border-bottom: 1px solid var(--border);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-label {
		font-size: 12px;
		color: var(--text-muted);
	}

	.info-value {
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.station-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.line-badge {
		font-size: 11px;
		color: white;
		padding: 3px 10px;
		border-radius: 4px;
		font-weight: 600;
	}

	.section {
		margin-bottom: 14px;
	}

	.section-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.btn-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: 8px;
	}

	.line-btn {
		color: white;
		font-size: 12px;
		font-weight: 600;
		padding: 8px 10px;
		border-radius: 6px;
	}

	.station-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.station-btn {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 12px;
		background: var(--bg-card);
		color: var(--text-primary);
		border-radius: 6px;
		border: 1px solid var(--border);
	}

	.station-btn:hover {
		background: var(--border);
	}

	.station-name {
		font-weight: 500;
	}

	.station-time {
		font-size: 11px;
		color: var(--text-muted);
		background: var(--bg-secondary);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.wait-btn {
		background: var(--bg-card);
		color: var(--text-primary);
		border: 1px solid var(--border);
		padding: 8px 10px;
		border-radius: 6px;
		font-size: 12px;
	}

	.wait-btn:hover {
		background: var(--border);
	}

	.action-row {
		margin-top: 4px;
		display: flex;
		gap: 8px;
	}

	.warning-box {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: var(--danger);
		padding: 10px 12px;
		border-radius: 6px;
		font-size: 12px;
		margin-bottom: 14px;
	}
</style>
