<script lang="ts">
	import type { ZhuBaiAnalysis, SealScriptType } from '$lib/types';
	import { getScriptTypeName } from '$lib/utils/sealGenerator';
	
	export let analysis: ZhuBaiAnalysis;
	export let editable = false;
	export let onChange: ((analysis: ZhuBaiAnalysis) => void) | null = null;
	
	const scriptTypeOptions: { value: SealScriptType; label: string }[] = [
		{ value: 'zhuwen', label: '朱文' },
		{ value: 'baiwen', label: '白文' },
		{ value: 'mixed', label: '朱白相间' }
	];
	
	function updateField<K extends keyof ZhuBaiAnalysis>(field: K, value: ZhuBaiAnalysis[K]) {
		if (!onChange) return;
		const updated = { ...analysis, [field]: value };
		onChange(updated);
	}
	
	function updateStrokeDistribution(position: keyof ZhuBaiAnalysis['strokeDistribution'], value: number) {
		if (!onChange) return;
		const updated = {
			...analysis,
			strokeDistribution: {
				...analysis.strokeDistribution,
				[position]: value
			}
		};
		onChange(updated);
	}
	
	function handleZhuRatioChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const zhuRatio = parseFloat(target.value) / 100;
		const baiRatio = 1 - zhuRatio;
		if (onChange) {
			onChange({
				...analysis,
				zhuRatio,
				baiRatio
			});
		}
	}
	
	function handleTypeChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		updateField('type', target.value as SealScriptType);
	}
	
	function handleContrastScoreChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('contrastScore', parseInt(target.value, 10) || 0);
	}
	
	function handleBalanceScoreChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('balanceScore', parseInt(target.value, 10) || 0);
	}
	
	function handleStrokeDistributionChange(e: Event, position: keyof ZhuBaiAnalysis['strokeDistribution']) {
		const target = e.target as HTMLInputElement;
		updateStrokeDistribution(position, parseInt(target.value, 10) || 0);
	}
	
	function handleNotesChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		updateField('notes', target.value);
	}
	
	const strokeDistributionItems = [
		{ key: 'top' as const, label: '上' },
		{ key: 'left' as const, label: '左' },
		{ key: 'center' as const, label: '中' },
		{ key: 'right' as const, label: '右' },
		{ key: 'bottom' as const, label: '下' }
	];
</script>

<div class="analysis-panel">
	<h4 class="panel-title">朱白文分析</h4>
	
	<div class="analysis-summary">
		<div class="summary-item">
			<span class="summary-label">类型</span>
			{#if editable}
				<select
					class="form-control"
					value={analysis.type}
					on:change={handleTypeChange}
				>
					{#each scriptTypeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			{:else}
				<span class="summary-value">{getScriptTypeName(analysis.type)}</span>
			{/if}
		</div>
		<div class="summary-item">
			<span class="summary-label">对比评分</span>
			{#if editable}
				<input
					type="number"
					class="form-control"
					min="0"
					max="100"
					value={analysis.contrastScore}
					on:input={handleContrastScoreChange}
				/>
			{:else}
				<span class="summary-value score">{analysis.contrastScore}分</span>
			{/if}
		</div>
		<div class="summary-item">
			<span class="summary-label">平衡评分</span>
			{#if editable}
				<input
					type="number"
					class="form-control"
					min="0"
					max="100"
					value={analysis.balanceScore}
					on:input={handleBalanceScoreChange}
				/>
			{:else}
				<span class="summary-value score">{analysis.balanceScore}分</span>
			{/if}
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
		{#if editable}
			<div class="slider-control">
				<label>调整朱文比例</label>
				<input
					type="range"
					min="0"
					max="100"
					value={Math.round(analysis.zhuRatio * 100)}
					on:input={handleZhuRatioChange}
				/>
			</div>
		{/if}
	</div>
	
	<div class="distribution-section">
		<h5 class="sub-title">笔画分布</h5>
		<div class="distribution-grid simple">
			{#each strokeDistributionItems as item}
				<div class="dist-box">
					<span class="dist-label">{item.label}</span>
					{#if editable}
						<input
							type="number"
							class="dist-input"
							min="0"
							max="100"
							value={analysis.strokeDistribution[item.key]}
							on:input={(e) => handleStrokeDistributionChange(e, item.key)}
						/>
					{:else}
						<span class="dist-value">{analysis.strokeDistribution[item.key]}%</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	
	<div class="notes-section">
		<h5 class="sub-title">分析说明</h5>
		{#if editable}
			<textarea
				class="form-control"
				rows="4"
				value={analysis.notes}
				on:input={handleNotesChange}
			/>
		{:else}
			<p class="notes-text">{analysis.notes}</p>
		{/if}
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
	
	.slider-control {
		margin-top: 12px;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.slider-control label {
		font-size: 12px;
		color: var(--color-text-muted);
		white-space: nowrap;
	}
	
	.slider-control input[type='range'] {
		flex: 1;
	}
	
	.distribution-section {
		margin-bottom: 20px;
	}
	
	.distribution-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	
	.distribution-grid.simple {
		grid-template-columns: repeat(5, 1fr);
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
	
	.dist-input {
		width: 60px;
		text-align: center;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 4px;
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
	
	textarea.form-control {
		width: 100%;
		resize: vertical;
		min-height: 80px;
	}
</style>
