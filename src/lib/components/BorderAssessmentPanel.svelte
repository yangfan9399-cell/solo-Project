<script lang="ts">
	import type { BorderAssessment } from '$lib/types';
	import { getBorderName } from '$lib/utils/sealGenerator';
	
	export let border: BorderAssessment;
</script>

<div class="analysis-panel">
	<h4 class="panel-title">边栏评估</h4>
	
	<div class="analysis-summary">
		<div class="summary-item">
			<span class="summary-label">类型</span>
			<span class="summary-value">{getBorderName(border.type)}</span>
		</div>
		<div class="summary-item">
			<span class="summary-label">粗细</span>
			<span class="summary-value">{border.thickness.toFixed(1)} mm</span>
		</div>
		<div class="summary-item">
			<span class="summary-label">平衡评分</span>
			<span class="summary-value score">{border.balanceScore}分</span>
		</div>
	</div>
	
	<div class="border-visual">
		<div class="border-preview">
			<div class="border-frame type-{border.type}">
				<div class="border-inner">
					<span class="preview-text">印</span>
				</div>
			</div>
		</div>
	</div>
	
	<div class="border-details">
		<div class="detail-row">
			<span class="detail-label">角部处理</span>
			<span class="detail-value">{border.cornerTreatment}</span>
		</div>
		<div class="detail-row">
			<span class="detail-label">残破数量</span>
			<span class="detail-value">{border.breakages.length > 0 ? border.breakages.length + ' 处' : '无'}</span>
		</div>
	</div>
	
	<div class="thickness-bar">
		<div class="bar-label">粗细程度</div>
		<div class="bar-track">
			<div class="bar-fill" style="width: {Math.min(border.thickness / 5 * 100, 100)}%"></div>
		</div>
		<div class="bar-labels">
			<span>细</span>
			<span>粗</span>
		</div>
	</div>
	
	<div class="notes-section">
		<h5 class="sub-title">评估说明</h5>
		<p class="notes-text">{border.notes}</p>
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
	
	.border-visual {
		display: flex;
		justify-content: center;
		margin-bottom: 20px;
		padding: 20px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
	}
	
	.border-preview {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.border-frame {
		width: 120px;
		height: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-bg-card);
		border: 3px solid var(--color-text);
	}
	
	.border-frame.type-none {
		border: none;
	}
	
	.border-frame.type-double {
		border: none;
		outline: 3px solid var(--color-text);
		outline-offset: 4px;
	}
	
	.border-frame.type-thick {
		border-width: 8px;
	}
	
	.border-frame.type-broken {
		border-style: dashed;
	}
	
	.border-inner {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.preview-text {
		font-family: var(--font-serif);
		font-size: 48px;
		color: var(--color-text);
	}
	
	.border-details {
		margin-bottom: 20px;
	}
	
	.detail-row {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.detail-row:last-child {
		border-bottom: none;
	}
	
	.detail-label {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.detail-value {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.thickness-bar {
		margin-bottom: 20px;
	}
	
	.bar-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: 8px;
	}
	
	.bar-track {
		height: 8px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-full);
		overflow: hidden;
	}
	
	.bar-fill {
		height: 100%;
		background-color: var(--color-primary);
		border-radius: var(--radius-full);
	}
	
	.bar-labels {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.sub-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 8px;
	}
	
	.notes-section {
		padding: 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
		border-left: 3px solid var(--color-secondary);
	}
	
	.notes-text {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}
</style>
