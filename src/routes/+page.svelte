<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DraftCard from '$lib/components/DraftCard.svelte';
	import { filteredDrafts, versionsStore } from '$lib/stores/appStore';
	
	import { resetSampleData } from '$lib/utils/sampleData';
	
	function handleReset() {
		if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
			resetSampleData();
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>印稿台账 - 篆刻印稿布局评审平台</title>
</svelte:head>

<Header>
	<span slot="title">印稿台账</span>
	<span slot="subtitle">管理所有篆刻印稿设计项目</span>
</Header>

<div class="page-content">
	<StatsGrid />
	
	<div class="page-header">
		<h2 class="section-title">印稿列表</h2>
		<div class="header-actions">
			<button class="btn btn-secondary btn-sm" on:click={handleReset}>重置数据</button>
			<button class="btn btn-primary btn-sm">
				<span>+ 新建印稿</span>
			</button>
		</div>
	</div>
	
	<FilterBar />
	
	<div class="drafts-grid">
		{#each $filteredDrafts as draft}
			{@const version = $versionsStore.find(v => v.id === draft.currentVersionId)}
			<DraftCard {draft} {version} />
		{:else}
			<div class="empty-state">
			<div class="empty-state-icon">📭</div>
			<p>没有找到符合条件的印稿</p>
			<button class="btn btn-secondary btn-sm mt-3">清除筛选条件</button>
		</div>
		{/each}
	</div>
	
	{#if $filteredDrafts.length > 0}
		<div class="list-footer">
			<span class="result-count">共 {$filteredDrafts.length} 条记录</span>
		</div>
	{/if}
</div>

<style>
	.page-content {
		padding: 24px;
	}
	
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	
	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.header-actions {
		display: flex;
		gap: 10px;
	}
	
	.drafts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
	}
	
	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: var(--color-text-muted);
		text-align: center;
		background-color: var(--color-bg-card);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	
	.empty-state-icon {
		font-size: 48px;
		margin-bottom: 12px;
		opacity: 0.6;
	}
	
	.list-footer {
		margin-top: 20px;
		text-align: center;
	}
	
	.result-count {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.mt-3 {
		margin-top: 12px;
	}
</style>
