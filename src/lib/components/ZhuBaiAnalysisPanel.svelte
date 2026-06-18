<script lang="ts">
	import type { ZhuBaiAnalysis } from '$lib/types';
	import { getScriptTypeName } from '$lib/utils/sealGenerator';
	
	export let analysis: ZhuBaiAnalysis;
</script>

<div class="analysis-panel">
	<h4 class="panel-title">朱白文分析</h4>
	
	<div class="analysis-summary">
		<div class="summary-item">
			<span class="summary-label">类型</span>
			<span class="summary-value">{getScriptTypeName(analysis.type)}</span>
		</div>
		<div class="summary-item">
			<span class="summary-label">对比评分</span>
			<span class="summary-value score">{analysis.contrastScore}分</span>
		</div>
		<div class="summary-item">
			<span class="summary-label">平衡评分</span>
			<span class="summary-value score">{analysis.balanceScore}分</span>
		</div>
	</div>
	
	<div class="ratio-section">
		<h5 class="sub-title">朱白比例</h5>
		<div class="ratio-bar">
			<div class="ratio-zhu" style="width: {analysis.zhuRatio * 100}%">
				<span>朱文 {Math.round(analysis.zhuRatio * 100)}%</span>
			</div>
			<div class="ratio-bai" style="width: {analysis.baiRatio * 100}%">
				<span>白文 {Math.round(analysis.baiRatio * 100)}%</span>
			</div>
		</div>
	</div>
	
	<div class="distribution-section">
		<h5 class="sub-title">笔画分布</h5>
		<div class="distribution-grid">
			<div class="dist-box top-left">
				<span class="dist-label">左上</span>
				<span class="dist-value">{analysis.strokeDistribution.left}%</span>
			</div>
			<div class="dist-box top-center">
				<span class="dist-label">上</span>
				<span class="dist-value">{analysis.strokeDistribution.top}%</span>
			</div>
			<div class="dist-box top-right">
				<span class="dist-label">右上</span>
				<span class="dist-value">{analysis.strokeDistribution.right}%</span>
			</div>
			<div class="dist-box middle-left">
				<span class="dist-label">左</span>
				<span class="dist-value">{analysis.strokeDistribution.left}%</span>
			</div>
			<div class="dist-box center">
				<span class="dist-label">中</span>
				<span class="dist-value">{analysis.strokeDistribution.center}%</span>
			</div>
			<div class="dist-box middle-right">
				<span class="dist-label">右</span>
				<span class="dist-value">{analysis.strokeDistribution.right}%</span>
			</div>
			<div class="dist-box bottom-left">
				<span class="dist-label">左下</span>
				<span class="dist-value">{analysis.strokeDistribution.left}%</span>
			</div>
			<div class="dist-box bottom-center">
				<span class="dist-label">下</span>
				<span class="dist-value">{analysis.strokeDistribution.bottom}%</span>
			</div>
			<div class="dist-box bottom-right">
				<span class="dist-label">右下</span>
				<span class="dist-value">{analysis.strokeDistribution.right}%</span>
			</div>
		</div>
	</div>
	
	<div class="notes-section">
		<h5 class="sub-title">分析说明</h5>
		<p class="notes-text">{analysis.notes}</p>
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
	
	.ratio-section {
		margin-bottom: 20px;
	}
	
	.ratio-bar {
		display: flex;
		height: 36px;
		border-radius: var(--radius);
		overflow: hidden;
		border: 1px solid var(--color-border);
	}
	
	.ratio-zhu,
	.ratio-bai {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		font-weight: 500;
		transition: width var(--transition-slow);
	}
	
	.ratio-zhu {
		background-color: var(--color-primary);
		color: white;
	}
	
	.ratio-bai {
		background-color: var(--color-bg-alt);
		color: var(--color-text-secondary);
	}
	
	.distribution-section {
		margin-bottom: 20px;
	}
	
	.distribution-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	
	.dist-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 12px 8px;
		background-color: var(--color-bg);
		border-radius: var(--radius-sm);
		border: 1px solid var(--color-border-light);
	}
	
	.dist-label {
		font-size: 11px;
		color: var(--color-text-muted);
		margin-bottom: 4px;
	}
	
	.dist-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
	}
	
	.notes-section {
		padding: 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
		border-left: 3px solid var(--color-primary);
	}
	
	.notes-text {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}
</style>
