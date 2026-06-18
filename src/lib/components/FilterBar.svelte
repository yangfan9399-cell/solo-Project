<script lang="ts">
	import { filterStore, allTags, allCreators } from '$lib/stores/appStore';
	import type { FilterState } from '$lib/types';
	
	let isExpanded = false;
	
	const statusOptions = [
		{ value: 'all', label: '全部状态' },
		{ value: 'draft', label: '草稿' },
		{ value: 'submitted', label: '已提交' },
		{ value: 'reviewing', label: '评审中' },
		{ value: 'approved', label: '已通过' },
		{ value: 'rejected', label: '已驳回' },
		{ value: 'archived', label: '已归档' }
	];
	
	const priorityOptions = [
		{ value: 'all', label: '全部优先级' },
		{ value: 'high', label: '高' },
		{ value: 'medium', label: '中' },
		{ value: 'low', label: '低' }
	];
	
	const shapeOptions = [
		{ value: 'all', label: '全部形状' },
		{ value: 'square', label: '方形' },
		{ value: 'rectangle', label: '长方形' },
		{ value: 'round', label: '圆形' },
		{ value: 'oval', label: '椭圆形' },
		{ value: 'irregular', label: '随形' }
	];
	
	const scriptTypeOptions = [
		{ value: 'all', label: '全部朱白文' },
		{ value: 'zhuwen', label: '朱文' },
		{ value: 'baiwen', label: '白文' },
		{ value: 'mixed', label: '朱白相间' }
	];
	
	const sortOptions = [
		{ value: 'updatedAt', label: '更新时间' },
		{ value: 'createdAt', label: '创建时间' },
		{ value: 'title', label: '标题' },
		{ value: 'priority', label: '优先级' }
	];
	
	type FilterKey = keyof FilterState;
	
	function updateField(field: FilterKey, value: string) {
		filterStore.update(function(f: FilterState) {
			const result = { ...f };
			(result as Record<string, unknown>)[field as string] = value;
			return result;
		});
	}
	
	function onKeywordInput(event: Event) {
		const target = event.target as HTMLInputElement;
		updateField('keyword', target.value);
	}
	
	function onStatusChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('status', target.value);
	}
	
	function onPriorityChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('priority', target.value);
	}
	
	function onShapeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('shape', target.value);
	}
	
	function onScriptTypeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('scriptType', target.value);
	}
	
	function onSortByChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('sortBy', target.value);
	}
	
	function onTagChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('tag', target.value);
	}
	
	function onCreatorChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		updateField('creator', target.value);
	}
	
	function toggleSortOrder() {
		filterStore.update(function(f: FilterState) {
			return {
				...f,
				sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc'
			};
		});
	}
	
	function toggleExpand() {
		isExpanded = !isExpanded;
	}
	
	function clearKeyword() {
		updateField('keyword', '');
	}
	
	function resetFilters() {
		filterStore.reset();
	}
</script>

<div class="filter-bar">
	<div class="filter-main">
		<div class="search-box">
			<span class="search-icon">🔍</span>
			<input
				type="text"
				class="search-input"
				placeholder="搜索印稿标题、描述、标签..."
				value={$filterStore.keyword}
				on:input={onKeywordInput}
			/>
			{#if $filterStore.keyword}
				<button class="clear-btn" on:click={clearKeyword}>×</button>
			{/if}
		</div>
		
		<div class="filter-quick">
			<select
				class="form-control filter-select"
				value={$filterStore.status}
				on:change={onStatusChange}
			>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			
			<select
				class="form-control filter-select"
				value={$filterStore.priority}
				on:change={onPriorityChange}
			>
				{#each priorityOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			
			<select
				class="form-control filter-select"
				value={$filterStore.sortBy}
				on:change={onSortByChange}
			>
				{#each sortOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			
			<button class="btn btn-outline btn-sm sort-order-btn" on:click={toggleSortOrder}>
				{$filterStore.sortOrder === 'desc' ? '↓ 降序' : '↑ 升序'}
			</button>
			
			<button class="btn btn-secondary btn-sm toggle-btn" on:click={toggleExpand}>
				{isExpanded ? '收起筛选' : '更多筛选'}
			</button>
		</div>
	</div>
	
	{#if isExpanded}
		<div class="filter-advanced">
			<div class="filter-row">
				<div class="filter-group">
					<label class="form-label">形状</label>
					<select
						class="form-control"
						value={$filterStore.shape}
						on:change={onShapeChange}
					>
						{#each shapeOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
				
				<div class="filter-group">
					<label class="form-label">朱白文</label>
					<select
						class="form-control"
						value={$filterStore.scriptType}
						on:change={onScriptTypeChange}
					>
						{#each scriptTypeOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>
				
				<div class="filter-group">
					<label class="form-label">标签</label>
					<select
						class="form-control"
						value={$filterStore.tag}
						on:change={onTagChange}
					>
						<option value="">全部标签</option>
						{#each $allTags as tag}
							<option value={tag}>{tag}</option>
						{/each}
					</select>
				</div>
				
				<div class="filter-group">
					<label class="form-label">创建者</label>
					<select
						class="form-control"
						value={$filterStore.creator}
						on:change={onCreatorChange}
					>
						<option value="">全部创建者</option>
						{#each $allCreators as creator}
							<option value={creator}>{creator}</option>
						{/each}
					</select>
				</div>
			</div>
			
			<div class="filter-actions">
				<button class="btn btn-secondary btn-sm" on:click={resetFilters}>重置筛选</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-bar {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-border-light);
		margin-bottom: 20px;
		overflow: hidden;
	}
	
	.filter-main {
		padding: 16px 20px;
		display: flex;
		align-items: center;
		gap: 16px;
	}
	
	.search-box {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}
	
	.search-icon {
		position: absolute;
		left: 12px;
		font-size: 14px;
		opacity: 0.5;
	}
	
	.search-input {
		width: 100%;
		padding: 8px 36px 8px 36px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-size: 14px;
		transition: all var(--transition-fast);
	}
	
	.search-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(196, 30, 58, 0.1);
	}
	
	.clear-btn {
		position: absolute;
		right: 8px;
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background-color: var(--color-bg-alt);
		color: var(--color-text-muted);
		font-size: 16px;
	}
	
	.clear-btn:hover {
		background-color: var(--color-border);
	}
	
	.filter-quick {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.filter-select {
		min-width: 120px;
	}
	
	.sort-order-btn {
		min-width: 80px;
	}
	
	.toggle-btn {
		min-width: 80px;
	}
	
	.filter-advanced {
		padding: 16px 20px;
		border-top: 1px solid var(--color-border-light);
		background-color: var(--color-bg);
	}
	
	.filter-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}
	
	.filter-group {
		min-width: 0;
	}
	
	.filter-actions {
		margin-top: 16px;
		display: flex;
		justify-content: flex-end;
	}
</style>
