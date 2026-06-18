<script lang="ts">
	import type { BorderAssessment, BorderType } from '$lib/types';
	import { getBorderName } from '$lib/utils/sealGenerator';
	
	export let border: BorderAssessment;
	export let editable = false;
	export let onChange: ((border: BorderAssessment) => void) | null = null;
	
	const borderTypeOptions: { value: BorderType; label: string }[] = [
		{ value: 'none', label: '无边' },
		{ value: 'single', label: '单边' },
		{ value: 'double', label: '双边' },
		{ value: 'thick', label: '粗边' },
		{ value: 'broken', label: '残边' }
	];
	
	function updateField<K extends keyof BorderAssessment>(field: K, value: BorderAssessment[K]) {
		if (!onChange) return;
		const updated = { ...border, [field]: value };
		onChange(updated);
	}
	
	function handleTypeChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		updateField('type', target.value as BorderType);
	}
	
	function handleThicknessChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('thickness', parseFloat(target.value) || 0);
	}
	
	function handleBalanceScoreChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('balanceScore', parseInt(target.value, 10) || 0);
	}
	
	function handleCornerTreatmentChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('cornerTreatment', target.value);
	}
	
	function handleNotesChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('notes', target.value);
	}
	
	function handleBreakagesChange(e: Event) {
		const target = e.target as HTMLInputElement;
		const count = parseInt(target.value) || 0;
		const newBreakages = Array(Math.max(0, count)).fill(0).map(() => Math.floor(Math.random() * 3) + 1);
		updateField('breakages', newBreakages);
	}
	
	function handleThicknessSliderChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('thickness', parseFloat(target.value) || 0);
	}
	
	function handleNotesTextareaChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		updateField('notes', target.value);
	}
</script>

<div class="analysis-panel">
	<h4 class="panel-title">边栏评估</h4>
	
	<div class="analysis-summary">
		<div class="summary-item">
			<span class="summary-label">类型</span>
			{#if editable}
				<select
					class="form-control"
					value={border.type}
					on:change={handleTypeChange}
				>
					{#each borderTypeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			{:else}
				<span class="summary-value">{getBorderName(border.type)}</span>
			{/if}
		</div>
		<div class="summary-item">
			<span class="summary-label">粗细</span>
			{#if editable}
				<input
					type="number"
					class="form-control"
					step="0.1"
					min="0.1"
					max="10"
					value={border.thickness}
					on:input={handleThicknessChange}
				/>
			{:else}
				<span class="summary-value">{border.thickness.toFixed(1)} mm</span>
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
					value={border.balanceScore}
					on:input={handleBalanceScoreChange}
				/>
			{:else}
				<span class="summary-value score">{border.balanceScore}分</span>
			{/if}
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
			{#if editable}
				<input
					type="text"
					class="form-control"
					value={border.cornerTreatment}
					on:input={handleCornerTreatmentChange}
				/>
			{:else}
				<span class="detail-value">{border.cornerTreatment}</span>
			{/if}
		</div>
		<div class="detail-row">
			<span class="detail-label">残破数量</span>
			{#if editable}
				<input
					type="number"
					class="form-control"
					min="0"
					value={border.breakages.length}
					on:input={handleBreakagesChange}
				/>
			{:else}
				<span class="detail-value">{border.breakages.length > 0 ? border.breakages.length + ' 处' : '无'}</span>
			{/if}
		</div>
	</div>
	
	<div class="thickness-bar">
		<div class="bar-label">粗细程度</div>
		<div class="bar-track">
			<div class="bar-fill" style="width: {Math.min(border.thickness / 5 * 100, 100)}%"></div>
		</div>
		{#if editable}
			<div class="slider-control">
				<input
					type="range"
					min="0.1"
					max="10"
					step="0.1"
					value={border.thickness}
					on:input={handleThicknessSliderChange}
				/>
			</div>
		{/if}
		<div class="bar-labels">
			<span>细</span>
			<span>粗</span>
		</div>
	</div>
	
	<div class="notes-section">
		<h5 class="sub-title">评估说明</h5>
		{#if editable}
			<textarea
				class="form-control"
				rows="4"
				value={border.notes}
				on:input={handleNotesTextareaChange}
			/>
		{:else}
			<p class="notes-text">{border.notes}</p>
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
		align-items: center;
		gap: 12px;
	}
	
	.detail-row:last-child {
		border-bottom: none;
	}
	
	.detail-label {
		font-size: 13px;
		color: var(--color-text-muted);
		white-space: nowrap;
	}
	
	.detail-value {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.detail-row .form-control {
		max-width: 200px;
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
		background-color: var(--color-secondary);
		border-radius: var(--radius-full);
	}
	
	.slider-control {
		margin: 8px 0;
	}
	
	.slider-control input[type='range'] {
		width: 100%;
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
	
	textarea.form-control {
		width: 100%;
		resize: vertical;
		min-height: 80px;
	}
</style>
