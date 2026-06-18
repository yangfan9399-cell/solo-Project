<script lang="ts">
	import type { DensityAssessment } from '$lib/types';
	import { getDensityName } from '$lib/utils/sealGenerator';
	
	export let density: DensityAssessment;
</script>

<div class="analysis-panel">
	<h4 class="panel-title">疏密评估</h4>
	
	<div class="analysis-summary">
		<div class="summary-item">
			<span class="summary-label">整体疏密</span>
			<span class="summary-value">{getDensityName(density.overallLevel)}</span>
		</div>
		<div class="summary-item">
			<span class="summary-label">朱文密度</span>
			<span class="summary-value">{getDensityName(density.zhuDensity)}</span>
		</div>
		<div class="summary-item">
			<span class="summary-label">平衡评分</span>
			<span class="summary-value score">{density.balanceScore}分</span>
		</div>
	</div>
	
	<div class="zones-section">
		<h5 class="sub-title">分区密度</h5>
		<div class="zones-grid">
			{#each density.zones as zone}
				<div class="zone-card level-{zone.level}">
					<div class="zone-name">{zone.name}</div>
					<div class="zone-level">{getDensityName(zone.level)}</div>
					<div class="zone-strokes">{zone.strokeCount}笔</div>
				</div>
			{/each}
		</div>
	</div>
	
	<div class="density-visual">
		<h5 class="sub-title">密度分布示意</h5>
		<div class="density-map">
			{#each density.zones as zone, i}
				<div class="density-cell level-{zone.level}" style="grid-area: zone-{i + 1};">
					<span class="cell-label">{zone.name}</span>
				</div>
			{/each}
		</div>
	</div>
	
	<div class="stats-row">
		<div class="stat-box">
			<span class="stat-label">白文密度</span>
			<span class="stat-value">{getDensityName(density.baiDensity)}</span>
		</div>
	</div>
	
	<div class="notes-section">
		<h5 class="sub-title">评估说明</h5>
		<p class="notes-text">{density.notes}</p>
	</div>
</div>

<style>
	.analysis-panel {
		padding: 4px;
	}
	
	.panel-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 16px;
	}
	
	.analysis-summary {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		margin-bottom: 20px;
	}
	
	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
	}
	
	.summary-label {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.summary-value {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.summary-value.score {
		color: var(--color-primary);
	}
	
	.sub-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 10px;
	}
	
	.zones-section {
		margin-bottom: 20px;
	}
	
	.zones-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
	
	.zone-card {
		padding: 12px;
		border-radius: var(--radius);
		background-color: var(--color-bg);
		border-left: 3px solid var(--color-border);
	}
	
	.zone-card.level-very_sparse {
		border-left-color: #10b981;
	}
	
	.zone-card.level-sparse {
		border-left-color: #34d399;
	}
	
	.zone-card.level-balanced {
		border-left-color: #f59e0b;
	}
	
	.zone-card.level-dense {
		border-left-color: #f97316;
	}
	
	.zone-card.level-very_dense {
		border-left-color: #ef4444;
	}
	
	.zone-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: 2px;
	}
	
	.zone-level {
		font-size: 12px;
		color: var(--color-text-secondary);
		margin-bottom: 4px;
	}
	
	.zone-strokes {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.density-visual {
		margin-bottom: 20px;
	}
	
	.density-map {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		grid-template-areas:
			"zone-1 zone-2"
			"zone-3 zone-4";
		gap: 4px;
		height: 160px;
		background-color: var(--color-bg);
		padding: 8px;
		border-radius: var(--radius);
	}
	
	.density-cell {
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition);
	}
	
	.density-cell.level-very_sparse {
		background-color: rgba(16, 185, 129, 0.2);
	}
	
	.density-cell.level-sparse {
		background-color: rgba(52, 211, 153, 0.3);
	}
	
	.density-cell.level-balanced {
		background-color: rgba(245, 158, 11, 0.4);
	}
	
	.density-cell.level-dense {
		background-color: rgba(249, 115, 22, 0.5);
	}
	
	.density-cell.level-very_dense {
		background-color: rgba(239, 68, 68, 0.6);
	}
	
	.cell-label {
		font-size: 12px;
		color: var(--color-text);
		font-weight: 500;
	}
	
	.stats-row {
		margin-bottom: 20px;
	}
	
	.stat-box {
		display: flex;
		justify-content: space-between;
		padding: 10px 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
	}
	
	.stat-label {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.stat-value {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.notes-section {
		padding: 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
		border-left: 3px solid var(--color-accent);
	}
	
	.notes-text {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}
</style>
