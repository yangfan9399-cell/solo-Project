<script lang="ts">
	import type { DraftVersion } from '$lib/types';
	import { formatDate } from '$lib/utils/helpers';
	import { getBorderName, getScriptTypeName, getDensityName, getTechniqueName } from '$lib/utils/sealGenerator';
	
	export let versions: DraftVersion[];
	export let currentVersionId: string;
	export let onSelect: (versionId: string) => void = () => {};
</script>

<div class="version-history">
	<h4 class="section-title">版本历史</h4>
	
	<div class="version-list">
		{#each versions as version}
			<div class="version-item {version.id === currentVersionId ? 'active' : ''}" on:click={() => onSelect(version.id)}>
				<div class="version-header">
					<span class="version-label">{version.label}</span>
					{#if version.isCurrent}
						<span class="current-badge">当前</span>
					{/if}
				</div>
				<div class="version-meta">
					<span class="version-date">{formatDate(version.createdAt)}</span>
				</div>
				<p class="version-desc">{version.description}</p>
				<div class="version-changes">
					{#each version.changeSummary as change}
						<span class="change-tag">• {change}</span>
					{/each}
				</div>
				<div class="version-preview">
					{@html version.imageData}
				</div>
			</div>
		{/each}
	</div>
	
	<div class="version-actions">
		<button class="btn btn-outline btn-sm w-full">
			<span>➕ 新建版本</span>
		</button>
	</div>
</div>

<style>
	.version-history {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	
	.section-title {
		padding: 14px 16px;
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		border-bottom: 1px solid var(--color-border-light);
		background-color: var(--color-bg);
	}
	
	.version-list {
		max-height: 600px;
		overflow-y: auto;
		padding: 8px;
	}
	
	.version-item {
		padding: 12px;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all var(--transition-fast);
		border: 1px solid transparent;
		margin-bottom: 8px;
	}
	
	.version-item:hover {
		background-color: var(--color-bg);
	}
	
	.version-item.active {
		background-color: rgba(196, 30, 58, 0.05);
		border-color: var(--color-primary);
	}
	
	.version-item:last-child {
		margin-bottom: 0;
	}
	
	.version-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}
	
	.version-label {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.current-badge {
		padding: 1px 6px;
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius-sm);
		font-size: 10px;
		font-weight: 500;
	}
	
	.version-meta {
		margin-bottom: 6px;
	}
	
	.version-date {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.version-desc {
		font-size: 12px;
		color: var(--color-text-secondary);
		margin-bottom: 8px;
		line-height: 1.4;
	}
	
	.version-changes {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin-bottom: 10px;
	}
	
	.change-tag {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.version-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
		background-color: var(--color-bg);
		border-radius: var(--radius-sm);
	}
	
	.version-preview :global(svg) {
		width: 60px;
		height: 60px;
	}
	
	.version-actions {
		padding: 12px;
		border-top: 1px solid var(--color-border-light);
	}
	
	.w-full {
		width: 100%;
	}
</style>
