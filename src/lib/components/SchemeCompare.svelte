<script lang="ts">
	import { sessionStore, windStore } from '$lib/data/store';
	import type { Scheme, GameScores, SensorReading } from '$lib/data/types';

	let session = $derived($sessionStore);
	let windData = $derived($windStore);
	let schemeName = $state('');
	let showCompare = $state(false);

	let schemes = $derived(session?.schemes ?? []);

	function saveScheme() {
		if (!schemeName.trim()) return;
		if (!windData.scores) return;
		sessionStore.saveScheme(schemeName.trim(), windData.sensors, windData.scores);
		schemeName = '';
	}

	function scoreColor(score: number): string {
		if (score >= 70) return 'var(--success)';
		if (score >= 50) return 'var(--warning)';
		return 'var(--danger)';
	}
</script>

<div class="scheme-panel card">
	<h3>📊 方案对比</h3>

	{#if windData.scores}
		<div class="save-section">
			<input
				type="text"
				bind:value={schemeName}
				placeholder="方案名称"
				class="scheme-input"
			/>
			<button class="btn-primary" onclick={saveScheme} disabled={!schemeName.trim()}>
				保存方案
			</button>
		</div>
	{/if}

	{#if schemes.length === 0}
		<div class="no-schemes">暂无保存的方案，运行模拟后保存</div>
	{:else}
		<div class="scheme-list">
			{#each schemes as scheme}
				<div class="scheme-item">
					<div class="scheme-header">
						<span class="scheme-name">{scheme.name}</span>
						<span class="scheme-time">{new Date(scheme.timestamp).toLocaleTimeString()}</span>
					</div>
					<div class="scheme-scores">
						<div class="mini-score">
							<span>舒适</span>
							<span style="color: {scoreColor(scheme.scores.comfort)}">{scheme.scores.comfort}</span>
						</div>
						<div class="mini-score">
							<span>安全</span>
							<span style="color: {scoreColor(scheme.scores.safety)}">{scheme.scores.safety}</span>
						</div>
						<div class="mini-score">
							<span>效率</span>
							<span style="color: {scoreColor(scheme.scores.efficiency)}">{scheme.scores.efficiency}</span>
						</div>
						<div class="mini-score total">
							<span>总分</span>
							<span style="color: {scoreColor(scheme.scores.total)}">{scheme.scores.total}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>

		{#if schemes.length >= 2}
			<button class="btn-secondary" onclick={() => (showCompare = !showCompare)}>
				{showCompare ? '收起对比' : '展开对比'}
			</button>

			{#if showCompare}
				<div class="compare-table">
					<table>
						<thead>
							<tr>
								<th>指标</th>
								{#each schemes as s}
									<th>{s.name}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>舒适度</td>
								{#each schemes as s}
									<td style="color: {scoreColor(s.scores.comfort)}">{s.scores.comfort}</td>
								{/each}
							</tr>
							<tr>
								<td>安全性</td>
								{#each schemes as s}
									<td style="color: {scoreColor(s.scores.safety)}">{s.scores.safety}</td>
								{/each}
							</tr>
							<tr>
								<td>通风效率</td>
								{#each schemes as s}
									<td style="color: {scoreColor(s.scores.efficiency)}">{s.scores.efficiency}</td>
								{/each}
							</tr>
							<tr class="total-row">
								<td>综合</td>
								{#each schemes as s}
									<td style="color: {scoreColor(s.scores.total)}">{s.scores.total}</td>
								{/each}
							</tr>
							<tr>
								<td>建筑数</td>
								{#each schemes as s}
									<td>{s.buildings.length}</td>
								{/each}
							</tr>
						</tbody>
					</table>
				</div>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.scheme-panel h3 {
		font-size: 16px;
		color: var(--accent);
		margin-bottom: 12px;
	}

	.save-section {
		display: flex;
		gap: 8px;
		margin-bottom: 12px;
	}

	.scheme-input {
		flex: 1;
		padding: 6px 12px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--bg-card);
		color: var(--text-primary);
		font-size: 13px;
		outline: none;
	}

	.scheme-input:focus {
		border-color: var(--accent);
	}

	.no-schemes {
		color: var(--text-secondary);
		font-size: 13px;
		text-align: center;
		padding: 16px 0;
	}

	.scheme-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 12px;
	}

	.scheme-item {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 8px 12px;
	}

	.scheme-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.scheme-name {
		font-weight: 600;
		font-size: 13px;
	}

	.scheme-time {
		font-size: 11px;
		color: var(--text-secondary);
	}

	.scheme-scores {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 4px;
	}

	.mini-score {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 11px;
	}

	.mini-score span:first-child {
		color: var(--text-secondary);
		font-size: 10px;
	}

	.mini-score span:last-child {
		font-weight: 700;
	}

	.mini-score.total span:last-child {
		font-size: 14px;
	}

	.compare-table {
		margin-top: 12px;
		overflow-x: auto;
	}

	.compare-table table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}

	.compare-table th,
	.compare-table td {
		padding: 6px 8px;
		border: 1px solid var(--border);
		text-align: center;
	}

	.compare-table th {
		background: var(--bg-card);
		font-weight: 600;
	}

	.total-row td {
		font-weight: 700;
		font-size: 14px;
	}
</style>
