<script lang="ts">
	import type { SealDraft, DraftVersion } from '$lib/types';
	import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDate, getShapeLabel } from '$lib/utils/helpers';
	import { getBorderName, getScriptTypeName } from '$lib/utils/sealGenerator';
	
	export let draft: SealDraft;
	export let version: DraftVersion | undefined;
</script>

<a href={`/draft/${draft.id}`} class="draft-card">
	<div class="card-visual">
		<div class="seal-preview">
			{#if version}
				{@html version.imageData}
			{:else}
				<div class="seal-placeholder">印</div>
			{/if}
		</div>
		<div class="card-badges">
			<span class="status-badge" style="background-color: {getStatusColor(draft.status)}">
				{getStatusLabel(draft.status)}
			</span>
			<span class="priority-badge" style="background-color: {getPriorityColor(draft.priority)}">
				{getPriorityLabel(draft.priority)}
			</span>
		</div>
	</div>
	
	<div class="card-content">
		<h3 class="card-title">{draft.title}</h3>
		<p class="card-desc">{draft.description}</p>
		
		<div class="card-meta">
			<div class="meta-item">
				<span class="meta-label">形状</span>
				<span class="meta-value">{getShapeLabel(draft.shape)}</span>
			</div>
			{#if version}
				<div class="meta-item">
					<span class="meta-label">朱白</span>
					<span class="meta-value">{getScriptTypeName(version.zhuBai.type)}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">边栏</span>
					<span class="meta-value">{getBorderName(version.border.type)}</span>
				</div>
			{/if}
		</div>
		
		<div class="card-tags">
			{#each draft.tags as tag}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	</div>
	
	<div class="card-footer">
		<div class="footer-left">
			<span class="version-info">V{draft.versionCount} 版本</span>
			<span class="review-info">{draft.reviewCount} 评审</span>
		</div>
		<div class="footer-right">
			<span class="update-time">{formatDate(draft.updatedAt)}</span>
		</div>
	</div>
</a>

<style>
	.draft-card {
		display: flex;
		flex-direction: column;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition: all var(--transition);
		box-shadow: var(--shadow-sm);
	}
	
	.draft-card:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary);
		transform: translateY(-2px);
	}
	
	.card-visual {
		position: relative;
		padding: 20px;
		background-color: var(--color-bg);
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.seal-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 120px;
	}
	
	.seal-preview :global(svg) {
		max-width: 100%;
		max-height: 100%;
	}
	
	.seal-placeholder {
		width: 80px;
		height: 80px;
		background-color: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-serif);
		font-size: 36px;
		border-radius: var(--radius);
	}
	
	.card-badges {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: flex-end;
	}
	
	.status-badge,
	.priority-badge {
		padding: 3px 8px;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 500;
		color: white;
	}
	
	.card-content {
		padding: 16px;
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.card-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 6px;
	}
	
	.card-desc {
		font-size: 13px;
		color: var(--color-text-secondary);
		margin-bottom: 12px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.5;
	}
	
	.card-meta {
		display: flex;
		gap: 16px;
		margin-bottom: 12px;
	}
	
	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.meta-label {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.meta-value {
		font-size: 13px;
		color: var(--color-text-secondary);
		font-weight: 500;
	}
	
	.card-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: auto;
	}
	
	.tag {
		display: inline-block;
		padding: 2px 8px;
		border-radius: var(--radius-sm);
		font-size: 11px;
		background-color: var(--color-bg-alt);
		color: var(--color-text-secondary);
	}
	
	.card-footer {
		padding: 10px 16px;
		border-top: 1px solid var(--color-border-light);
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--color-bg);
	}
	
	.footer-left {
		display: flex;
		gap: 12px;
	}
	
	.version-info,
	.review-info {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.update-time {
		font-size: 12px;
		color: var(--color-text-muted);
	}
</style>
