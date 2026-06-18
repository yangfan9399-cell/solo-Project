<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { anomaliesStore, draftsStore } from '$lib/stores/appStore';
	import { getAnomalyTypeLabel, formatDate, getPriorityColor } from '$lib/utils/helpers';
	
	let showResolved = false;
	
	$: allAnomalies = $anomaliesStore;
	$: displayedAnomalies = showResolved
		? allAnomalies
		: allAnomalies.filter(a => !a.resolved);
	
	$: sortedAnomalies = [...displayedAnomalies].sort((a, b) => {
		if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
		return b.createdAt - a.createdAt;
	});
	
	function getDraftById(id: string) {
		return $draftsStore.find(d => d.id === id);
	}
	
	function handleResolve(id: string) {
		anomaliesStore.resolve(id);
	}
	
	function getSeverityLabel(severity: string) {
		const labels: Record<string, string> = {
			high: '高',
			medium: '中',
			low: '低'
		};
		return labels[severity] || severity;
	}
</script>

<svelte:head>
	<title>异常监控 - 篆刻印稿布局评审平台</title>
</svelte:head>

<Header>
	<span slot="title">异常监控</span>
	<span slot="subtitle">监控和处理系统中的异常数据</span>
</Header>

<div class="page-content">
	<div class="stats-row">
		<div class="stat-card anomaly">
			<div class="stat-icon">🔴</div>
			<div class="stat-info">
				<div class="stat-value high">{$anomaliesStore.filter(a => !a.resolved && a.severity === 'high').length}</div>
				<div class="stat-label">高优先级异常</div>
			</div>
		</div>
		<div class="stat-card anomaly">
			<div class="stat-icon">🟡</div>
			<div class="stat-info">
				<div class="stat-value medium">{$anomaliesStore.filter(a => !a.resolved && a.severity === 'medium').length}</div>
				<div class="stat-label">中优先级异常</div>
			</div>
		</div>
		<div class="stat-card anomaly">
			<div class="stat-icon">🟢</div>
			<div class="stat-info">
				<div class="stat-value low">{$anomaliesStore.filter(a => !a.resolved && a.severity === 'low').length}</div>
				<div class="stat-label">低优先级异常</div>
			</div>
		</div>
		<div class="stat-card anomaly">
			<div class="stat-icon">✅</div>
			<div class="stat-info">
				<div class="stat-value">{$anomaliesStore.filter(a => a.resolved).length}</div>
				<div class="stat-label">已处理</div>
			</div>
		</div>
	</div>
	
	<div class="page-header">
		<h2 class="section-title">异常列表</h2>
		<label class="toggle-label">
			<input type="checkbox" bind:checked={showResolved}>
			显示已处理
		</label>
	</div>
	
	<div class="anomaly-list">
		{#each sortedAnomalies as anomaly}
			{@const draft = getDraftById(anomaly.draftId)}
			<div class="anomaly-item severity-{anomaly.severity} {anomaly.resolved ? 'resolved' : ''}">
				<div class="anomaly-left">
					<div class="severity-indicator" style="background-color: {getPriorityColor(anomaly.severity)}"></div>
					<div class="anomaly-content">
						<div class="anomaly-header">
							<h4 class="anomaly-title">{getAnomalyTypeLabel(anomaly.type)}</h4>
							<span class="severity-badge">{getSeverityLabel(anomaly.severity)}</span>
							{#if anomaly.resolved}
								<span class="resolved-badge">已处理</span>
							{/if}
						</div>
						<p class="anomaly-message">{anomaly.message}</p>
						<div class="anomaly-meta">
							{#if draft}
								<a href={`/draft/${draft.id}`} class="draft-link">📋 {draft.title}</a>
							{/if}
							<span class="anomaly-time">{formatDate(anomaly.createdAt)}</span>
						</div>
						{#if anomaly.details && Object.keys(anomaly.details).length > 0}
							<details class="anomaly-details">
								<summary>详细信息</summary>
								<pre>{JSON.stringify(anomaly.details, null, 2)}</pre>
							</details>
						{/if}
					</div>
				</div>
				<div class="anomaly-actions">
					{#if !anomaly.resolved}
						<button class="btn btn-outline btn-sm" on:click={() => handleResolve(anomaly.id)}>
							标记已处理
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">🎉</div>
				<p>没有发现异常数据</p>
				<p class="empty-sub">系统运行正常</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.page-content {
		padding: 24px;
	}
	
	.stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}
	
	.stat-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 16px;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-sm);
	}
	
	.stat-icon {
		font-size: 28px;
	}
	
	.stat-info {
		flex: 1;
	}
	
	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.2;
	}
	
	.stat-value.high {
		color: var(--color-error);
	}
	
	.stat-value.medium {
		color: var(--color-warning);
	}
	
	.stat-value.low {
		color: var(--color-info);
	}
	
	.stat-label {
		font-size: 13px;
		color: var(--color-text-muted);
		margin-top: 4px;
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
	
	.toggle-label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--color-text-secondary);
		cursor: pointer;
	}
	
	.toggle-label input {
		cursor: pointer;
	}
	
	.anomaly-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.anomaly-item {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		padding: 16px 20px;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		border-left: 4px solid var(--color-error);
		transition: all var(--transition);
	}
	
	.anomaly-item.severity-medium {
		border-left-color: var(--color-warning);
	}
	
	.anomaly-item.severity-low {
		border-left-color: var(--color-info);
	}
	
	.anomaly-item.resolved {
		opacity: 0.6;
		border-left-color: var(--color-success);
	}
	
	.anomaly-left {
		display: flex;
		gap: 14px;
		flex: 1;
		min-width: 0;
	}
	
	.severity-indicator {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-top: 6px;
		flex-shrink: 0;
	}
	
	.anomaly-content {
		flex: 1;
		min-width: 0;
	}
	
	.anomaly-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 6px;
	}
	
	.anomaly-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.severity-badge {
		padding: 2px 8px;
		background-color: var(--color-error);
		color: white;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 500;
	}
	
	.severity-medium .severity-badge {
		background-color: var(--color-warning);
	}
	
	.severity-low .severity-badge {
		background-color: var(--color-info);
	}
	
	.resolved-badge {
		padding: 2px 8px;
		background-color: var(--color-success);
		color: white;
		border-radius: var(--radius-sm);
		font-size: 11px;
		font-weight: 500;
	}
	
	.anomaly-message {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 10px 0;
	}
	
	.anomaly-meta {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	
	.draft-link {
		font-size: 12px;
		color: var(--color-primary);
		text-decoration: none;
	}
	
	.draft-link:hover {
		text-decoration: underline;
	}
	
	.anomaly-time {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.anomaly-details {
		margin-top: 10px;
	}
	
	.anomaly-details summary {
		font-size: 12px;
		color: var(--color-text-muted);
		cursor: pointer;
	}
	
	.anomaly-details pre {
		margin-top: 8px;
		padding: 10px;
		background-color: var(--color-bg);
		border-radius: var(--radius-sm);
		font-size: 12px;
		color: var(--color-text-secondary);
		overflow-x: auto;
	}
	
	.anomaly-actions {
		flex-shrink: 0;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: var(--color-text-muted);
		background-color: var(--color-bg-card);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		text-align: center;
	}
	
	.empty-state-icon {
		font-size: 48px;
		margin-bottom: 12px;
	}
	
	.empty-sub {
		font-size: 13px;
		color: var(--color-text-muted);
		margin-top: 4px;
	}
</style>
