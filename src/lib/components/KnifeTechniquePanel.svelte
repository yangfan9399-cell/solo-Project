<script lang="ts">
	import type { KnifeTechniqueSuggestion, KnifeTechnique } from '$lib/types';
	import { getTechniqueName } from '$lib/utils/sealGenerator';
	
	export let technique: KnifeTechniqueSuggestion;
	export let editable = false;
	export let onChange: ((technique: KnifeTechniqueSuggestion) => void) | null = null;
	
	const techniqueOptions: { value: KnifeTechnique; label: string }[] = [
		{ value: 'chongdao', label: '冲刀法' },
		{ value: 'qiedao', label: '切刀法' },
		{ value: 'liuidao', label: '留刀法' },
		{ value: 'chuodao', label: '戳刀法' },
		{ value: 'mixed', label: '混合刀法' }
	];
	
	$: difficultyStars = '★'.repeat(technique.difficultyLevel) + '☆'.repeat(5 - technique.difficultyLevel);
	
	function updateField<K extends keyof KnifeTechniqueSuggestion>(field: K, value: KnifeTechniqueSuggestion[K]) {
		if (!onChange) return;
		const updated = { ...technique, [field]: value };
		onChange(updated);
	}
	
	function updateStrokeAnalysis<K extends keyof KnifeTechniqueSuggestion['strokeAnalysis']>(
		field: K,
		value: KnifeTechniqueSuggestion['strokeAnalysis'][K]
	) {
		if (!onChange) return;
		onChange({
			...technique,
			strokeAnalysis: {
				...technique.strokeAnalysis,
				[field]: value
			}
		});
	}
	
	function updateForceDistribution<K extends keyof KnifeTechniqueSuggestion['forceDistribution']>(
		field: K,
		value: KnifeTechniqueSuggestion['forceDistribution'][K]
	) {
		if (!onChange) return;
		onChange({
			...technique,
			forceDistribution: {
				...technique.forceDistribution,
				[field]: value
			}
		});
	}
	
	function updateSuggestion(index: number, value: string) {
		if (!onChange) return;
		const newSuggestions = [...technique.suggestions];
		newSuggestions[index] = value;
		onChange({ ...technique, suggestions: newSuggestions });
	}
	
	function addSuggestion() {
		if (!onChange) return;
		onChange({ ...technique, suggestions: [...technique.suggestions, ''] });
	}
	
	function removeSuggestion(index: number) {
		if (!onChange) return;
		const newSuggestions = technique.suggestions.filter((_, i) => i !== index);
		onChange({ ...technique, suggestions: newSuggestions });
	}
	
	function updateWarning(index: number, value: string) {
		if (!onChange) return;
		const newWarnings = [...technique.warnings];
		newWarnings[index] = value;
		onChange({ ...technique, warnings: newWarnings });
	}
	
	function addWarning() {
		if (!onChange) return;
		onChange({ ...technique, warnings: [...technique.warnings, ''] });
	}
	
	function removeWarning(index: number) {
		if (!onChange) return;
		const newWarnings = technique.warnings.filter((_, i) => i !== index);
		onChange({ ...technique, warnings: newWarnings });
	}
	
	function toggleAlternative(alt: KnifeTechnique) {
		if (!onChange) return;
		const exists = technique.alternatives.includes(alt);
		let newAlternatives: KnifeTechnique[];
		if (exists) {
			newAlternatives = technique.alternatives.filter((a) => a !== alt);
		} else {
			newAlternatives = [...technique.alternatives, alt];
		}
		onChange({ ...technique, alternatives: newAlternatives });
	}
	
	function handleRecommendedChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		updateField('recommended', target.value as KnifeTechnique);
	}
	
	function handleDifficultyChange(e: Event) {
		const target = e.target as HTMLInputElement;
		updateField('difficultyLevel', parseInt(target.value, 10) || 1);
	}
	
	function handleStrokeAnalysisChange(
		e: Event,
		key: keyof KnifeTechniqueSuggestion['strokeAnalysis'],
		isFloat: boolean
	) {
		const target = e.target as HTMLInputElement;
		const val = isFloat ? parseFloat(target.value) || 0 : parseInt(target.value, 10) || 0;
		updateStrokeAnalysis(key, val as never);
	}
	
	function handleForceDistributionChange(
		e: Event,
		key: keyof KnifeTechniqueSuggestion['forceDistribution']
	) {
		const target = e.target as HTMLInputElement;
		updateForceDistribution(key, parseInt(target.value, 10) || 0);
	}
	
	function handleSuggestionChange(e: Event, index: number) {
		const target = e.target as HTMLInputElement;
		updateSuggestion(index, target.value);
	}
	
	function handleWarningChange(e: Event, index: number) {
		const target = e.target as HTMLInputElement;
		updateWarning(index, target.value);
	}
	
	const strokeAnalysisItems = [
		{ key: 'totalStrokes' as const, label: '总笔画数', suffix: '' },
		{ key: 'averageWidth' as const, label: '平均宽度', suffix: 'mm' },
		{ key: 'turningCount' as const, label: '转折数', suffix: '' },
		{ key: 'cornerCount' as const, label: '交角数', suffix: '' }
	];
	
	const forceDistributionItems = [
		{ key: 'heavy' as const, label: '重', class: 'heavy' },
		{ key: 'medium' as const, label: '中', class: 'medium' },
		{ key: 'light' as const, label: '轻', class: 'light' }
	];
</script>

<div class="analysis-panel">
	<h4 class="panel-title">刀法建议</h4>
	
	<div class="technique-main">
		<div class="recommended-technique">
			<span class="technique-label">推荐刀法</span>
			{#if editable}
				<select
					class="form-control technique-select"
					value={technique.recommended}
					on:change={handleRecommendedChange}
				>
					{#each techniqueOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			{:else}
				<span class="technique-name">{getTechniqueName(technique.recommended)}</span>
			{/if}
		</div>
		<div class="difficulty">
			<span class="difficulty-label">难度等级</span>
			{#if editable}
				<div class="difficulty-editor">
					<input
						type="range"
						min="1"
						max="5"
						value={technique.difficultyLevel}
						on:input={handleDifficultyChange}
					/>
					<span class="difficulty-text">{technique.difficultyLevel} / 5</span>
				</div>
			{:else}
				<div>
					<span class="difficulty-stars">{difficultyStars}</span>
					<span class="difficulty-text">{technique.difficultyLevel} / 5</span>
				</div>
			{/if}
		</div>
	</div>
	
	<div class="alternatives">
		<h5 class="sub-title">备选刀法</h5>
		{#if editable}
			<div class="alt-list editable">
				{#each techniqueOptions as opt}
					<label class="alt-checkbox">
						<input
							type="checkbox"
							checked={technique.alternatives.includes(opt.value)}
							on:change={() => toggleAlternative(opt.value)}
						/>
						<span>{opt.label}</span>
					</label>
				{/each}
			</div>
		{:else}
			<div class="alt-list">
				{#each technique.alternatives as alt}
					<span class="alt-tag">{getTechniqueName(alt)}</span>
				{/each}
			</div>
		{/if}
	</div>
	
	<div class="stroke-analysis">
		<h5 class="sub-title">笔画分析</h5>
		<div class="stroke-stats">
			{#each strokeAnalysisItems as item}
				<div class="stroke-stat">
					<span class="stat-label">{item.label}</span>
					{#if editable}
						<input
							type="number"
							class="stat-input"
							min="0"
							step={item.key === 'averageWidth' ? '0.1' : '1'}
							value={technique.strokeAnalysis[item.key]}
							on:input={(e) => handleStrokeAnalysisChange(e, item.key, item.key === 'averageWidth')}
						/>
					{:else}
						<span class="stat-value">{technique.strokeAnalysis[item.key]}{item.suffix}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	
	<div class="force-section">
		<h5 class="sub-title">力度分布</h5>
		<div class="force-bars">
			{#each forceDistributionItems as item}
				<div class="force-row">
					<span class="force-label">{item.label}</span>
					<div class="force-bar">
						<div class="force-fill {item.class}" style="width: {technique.forceDistribution[item.key]}%"></div>
					</div>
					{#if editable}
						<input
							type="number"
							class="force-input"
							min="0"
							max="100"
							value={technique.forceDistribution[item.key]}
							on:input={(e) => handleForceDistributionChange(e, item.key)}
						/>
					{:else}
						<span class="force-value">{technique.forceDistribution[item.key]}%</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
	
	<div class="suggestions-section">
		<h5 class="sub-title">
			刻制建议
			{#if editable}
				<button class="btn btn-primary btn-xs" on:click={addSuggestion}>+ 添加</button>
			{/if}
		</h5>
		<ul class="suggestion-list">
			{#each technique.suggestions as suggestion, i}
				<li>
					<span class="suggestion-icon">💡</span>
					{#if editable}
						<input
							type="text"
							class="editable-input"
							value={suggestion}
							on:input={(e) => handleSuggestionChange(e, i)}
						/>
						<button class="remove-btn" on:click={() => removeSuggestion(i)}>×</button>
					{:else}
						{suggestion}
					{/if}
				</li>
			{/each}
		</ul>
	</div>
	
	<div class="warnings-section">
		<h5 class="sub-title">
			注意事项
			{#if editable}
				<button class="btn btn-primary btn-xs" on:click={addWarning}>+ 添加</button>
			{/if}
		</h5>
		<ul class="warning-list">
			{#each technique.warnings as warning, i}
				<li>
					<span class="warning-icon">⚠️</span>
					{#if editable}
						<input
							type="text"
							class="editable-input"
							value={warning}
							on:input={(e) => handleWarningChange(e, i)}
						/>
						<button class="remove-btn" on:click={() => removeWarning(i)}>×</button>
					{:else}
						{warning}
					{/if}
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
	
	.technique-select {
		background-color: rgba(255, 255, 255, 0.2);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}
	
	.technique-select option {
		color: var(--color-text);
	}
	
	.difficulty-stars {
		font-size: 16px;
		color: var(--color-warning);
	}
	
	.difficulty-editor {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.difficulty-editor input[type='range'] {
		flex: 1;
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
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.btn-xs {
		padding: 2px 8px;
		font-size: 11px;
	}
	
	.alternatives {
		margin-bottom: 20px;
	}
	
	.alt-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}
	
	.alt-list.editable {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 6px;
	}
	
	.alt-checkbox {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 10px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-sm);
		font-size: 12px;
		cursor: pointer;
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
	
	.stat-input {
		width: 100%;
		text-align: center;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 4px;
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
	
	.force-input {
		width: 50px;
		text-align: center;
		font-size: 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 2px 4px;
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
		align-items: center;
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
	
	.editable-input {
		flex: 1;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 4px 8px;
		font-size: 13px;
	}
	
	.remove-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: var(--color-error);
		color: white;
		font-size: 16px;
		line-height: 1;
		flex-shrink: 0;
	}
	
	.warnings-section .sub-title {
		color: var(--color-warning);
	}
	
	.warning-list li {
		border-left: 3px solid var(--color-warning);
	}
</style>
