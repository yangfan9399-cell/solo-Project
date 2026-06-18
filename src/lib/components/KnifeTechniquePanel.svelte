<script lang="ts">
	import type { KnifeTechniqueSuggestion } from '$lib/types';
	import { getTechniqueName } from '$lib/utils/sealGenerator';
	
	export let technique: KnifeTechniqueSuggestion;
	
	$: difficultyStars = '★'.repeat(technique.difficultyLevel) + '☆'.repeat(5 - technique.difficultyLevel);
</script>

<div class="analysis-panel">
	<h4 class="panel-title">刀法建议</h4>
	
	<div class="technique-main">
		<div class="recommended-technique">
			<span class="technique-label">推荐刀法</span>
			<span class="technique-name">{getTechniqueName(technique.recommended)}</span>
		</div>
		<div class="difficulty">
			<span class="difficulty-label">难度等级</span>
			<span class="difficulty-stars">{difficultyStars}</span>
			<span class="difficulty-text">{technique.difficultyLevel} / 5</span>
		</div>
	</div>
	
	<div class="alternatives">
		<h5 class="sub-title">备选刀法</h5>
		<div class="alt-list">
			{#each technique.alternatives as alt}
				<span class="alt-tag">{getTechniqueName(alt)}</span>
			{/each}
		</div>
	</div>
	
	<div class="stroke-analysis">
		<h5 class="sub-title">笔画分析</h5>
		<div class="stroke-stats">
			<div class="stroke-stat">
				<span class="stat-label">总笔画数</span>
				<span class="stat-value">{technique.strokeAnalysis.totalStrokes}</span>
			</div>
			<div class="stroke-stat">
				<span class="stat-label">平均宽度</span>
				<span class="stat-value">{technique.strokeAnalysis.averageWidth.toFixed(1)}mm</span>
			</div>
			<div class="stroke-stat">
				<span class="stat-label">转折数</span>
				<span class="stat-value">{technique.strokeAnalysis.turningCount}</span>
			</div>
			<div class="stroke-stat">
				<span class="stat-label">交角数</span>
				<span class="stat-value">{technique.strokeAnalysis.cornerCount}</span>
			</div>
		</div>
	</div>
	
	<div class="force-section">
		<h5 class="sub-title">力度分布</h5>
		<div class="force-bars">
			<div class="force-row">
				<span class="force-label">重</span>
				<div class="force-bar">
					<div class="force-fill heavy" style="width: {technique.forceDistribution.heavy}%"></div>
				</div>
				<span class="force-value">{technique.forceDistribution.heavy}%</span>
			</div>
			<div class="force-row">
				<span class="force-label">中</span>
				<div class="force-bar">
					<div class="force-fill medium" style="width: {technique.forceDistribution.medium}%"></div>
				</div>
				<span class="force-value">{technique.forceDistribution.medium}%</span>
			</div>
			<div class="force-row">
				<span class="force-label">轻</span>
				<div class="force-bar">
					<div class="force-fill light" style="width: {technique.forceDistribution.light}%"></div>
				</div>
				<span class="force-value">{technique.forceDistribution.light}%</span>
			</div>
		</div>
	</div>
	
	<div class="suggestions-section">
		<h5 class="sub-title">刻制建议</h5>
		<ul class="suggestion-list">
			{#each technique.suggestions as suggestion}
				<li>
					<span class="suggestion-icon">💡</span>
					{suggestion}
				</li>
			{/each}
		</ul>
	</div>
	
	<div class="warnings-section">
		<h5 class="sub-title">注意事项</h5>
		<ul class="warning-list">
			{#each technique.warnings as warning}
				<li>
					<span class="warning-icon">⚠️</span>
					{warning}
				</li>
			{/each}
		</ul>
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
	
	.technique-main {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-bottom: 20px;
	}
	
	.recommended-technique,
	.difficulty {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
	}
	
	.recommended-technique {
		background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
		color: white;
	}
	
	.technique-label,
	.difficulty-label {
		font-size: 12px;
		opacity: 0.8;
	}
	
	.recommended-technique .technique-label {
		color: rgba(255, 255, 255, 0.8);
	}
	
	.technique-name {
		font-size: 18px;
		font-weight: 700;
	}
	
	.difficulty-stars {
		font-size: 16px;
		color: var(--color-warning);
	}
	
	.difficulty-text {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.sub-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 10px;
	}
	
	.alternatives {
		margin-bottom: 20px;
	}
	
	.alt-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	
	.alt-tag {
		padding: 4px 12px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-full);
		font-size: 12px;
		color: var(--color-text-secondary);
	}
	
	.stroke-analysis {
		margin-bottom: 20px;
	}
	
	.stroke-stats {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}
	
	.stroke-stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 10px 8px;
		text-align: center;
		background-color: var(--color-bg);
		border-radius: var(--radius-sm);
	}
	
	.stat-label {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.stat-value {
		font-size: 16px;
		font-weight: 700;
		color: var(--color-primary);
	}
	
	.force-section {
		margin-bottom: 20px;
	}
	
	.force-bars {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.force-row {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.force-label {
		width: 24px;
		font-size: 12px;
		color: var(--color-text-secondary);
		text-align: center;
	}
	
	.force-bar {
		flex: 1;
		height: 20px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-full);
		overflow: hidden;
	}
	
	.force-fill {
		height: 100%;
		border-radius: var(--radius-full);
		transition: width var(--transition-slow);
	}
	
	.force-fill.heavy {
		background: linear-gradient(90deg, var(--color-error), #f87171);
	}
	
	.force-fill.medium {
		background: linear-gradient(90deg, var(--color-warning), #fbbf24);
	}
	
	.force-fill.light {
		background: linear-gradient(90deg, var(--color-success), #34d399);
	}
	
	.force-value {
		width: 40px;
		text-align: right;
		font-size: 12px;
		color: var(--color-text-secondary);
		font-weight: 500;
	}
	
	.suggestions-section {
		margin-bottom: 16px;
	}
	
	.suggestion-list,
	.warning-list {
		margin: 0;
		padding: 0;
		list-style: none;
	}
	
	.suggestion-list li,
	.warning-list li {
		display: flex;
		gap: 10px;
		padding: 10px 12px;
		background-color: var(--color-bg);
		border-radius: var(--radius-sm);
		margin-bottom: 6px;
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}
	
	.suggestion-list li:last-child,
	.warning-list li:last-child {
		margin-bottom: 0;
	}
	
	.suggestion-icon,
	.warning-icon {
		font-size: 16px;
		flex-shrink: 0;
	}
	
	.warnings-section .sub-title {
		color: var(--color-warning);
	}
	
	.warning-list li {
		border-left: 3px solid var(--color-warning);
	}
</style>
