<script lang="ts">
	import { stats, anomaliesStore } from '$lib/stores/appStore';
	import { getAnomalyTypeLabel } from '$lib/utils/helpers';
	
	let showAnomalyPanel = false;
	
	function toggleAnomalyPanel() {
		showAnomalyPanel = !showAnomalyPanel;
	}
	
	function closePanel() {
		showAnomalyPanel = false;
	}
	
	$: unresolvedAnomalies = $anomaliesStore.filter(a => !a.resolved);
</script>

<header class="header">
	<div class="header-left">
		<h1 class="page-title">
			<slot name="title">印稿台账</slot>
		</h1>
		<p class="page-subtitle">
			<slot name="subtitle">管理和评审篆刻印稿设计</slot>
		</p>
	</div>
	
	<div class="header-right">
		<div class="stats-mini">
			<div class="stat-mini-item">
				<span class="stat-mini-label">总数</span>
				<span class="stat-mini-value">{$stats.total}</span>
			</div>
			<div class="stat-mini-item">
				<span class="stat-mini-label">评审中</span>
				<span class="stat-mini-value reviewing">{$stats.reviewing}</span>
			</div>
			<div class="stat-mini-item">
				<span class="stat-mini-label">已通过</span>
				<span class="stat-mini-value approved">{$stats.approved}</span>
			</div>
		</div>
		
		<div class="anomaly-wrapper">
			<button class="anomaly-btn" on:click={toggleAnomalyPanel}>
				<span class="anomaly-icon">⚠️</span>
				{#if unresolvedAnomalies.length > 0}
					<span class="anomaly-badge">{unresolvedAnomalies.length}</span>
				{/if}
			</button>
			
			{#if showAnomalyPanel}
				<div class="anomaly-panel" on:click|stopPropagation>
					<div class="panel-header">
						<span class="panel-title">异常提示</span>
						<button class="panel-close" on:click={closePanel}>×</button>
					</div>
					<div class="panel-body">
						{#if unresolvedAnomalies.length === 0}
							<div class="empty-anomalies">
								<span class="empty-icon">✓</span>
								<p>暂无异常数据</p>
							</div>
						{:else}
							{#each unresolvedAnomalies as anomaly}
								<div class="anomaly-item severity-{anomaly.severity}">
									<div class="anomaly-header">
										<span class="anomaly-type">{getAnomalyTypeLabel(anomaly.type)}</span>
										<span class="anomaly-severity">{anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}</span>
									</div>
									<p class="anomaly-message">{anomaly.message}</p>
									<a href={`/draft/${anomaly.draftId}`} class="anomaly-link">查看详情 →</a>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<style>
	.header {
		background-color: var(--color-bg-card);
		border-bottom: 1px solid var(--color-border-light);
		padding: 16px 24px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: sticky;
		top: 0;
		z-index: 50;
	}
	
	.header-left {
		flex: 1;
	}
	
	.page-title {
		font-size: 20px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.page-subtitle {
		font-size: 13px;
		color: var(--color-text-muted);
		margin: 2px 0 0 0;
	}
	
	.header-right {
		display: flex;
		align-items: center;
		gap: 24px;
	}
	
	.stats-mini {
		display: flex;
		gap: 20px;
	}
	
	.stat-mini-item {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	
	.stat-mini-label {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.stat-mini-value {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.stat-mini-value.reviewing {
		color: var(--color-warning);
	}
	
	.stat-mini-value.approved {
		color: var(--color-success);
	}
	
	.anomaly-wrapper {
		position: relative;
	}
	
	.anomaly-btn {
		position: relative;
		width: 40px;
		height: 40px;
		border-radius: var(--radius);
		background-color: var(--color-bg-alt);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
	}
	
	.anomaly-btn:hover {
		background-color: var(--color-border);
	}
	
	.anomaly-icon {
		font-size: 18px;
	}
	
	.anomaly-badge {
		position: absolute;
		top: -2px;
		right: -2px;
		min-width: 18px;
		height: 18px;
		background-color: var(--color-error);
		color: white;
		border-radius: 9px;
		font-size: 11px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 4px;
	}
	
	.anomaly-panel {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 320px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--color-border-light);
		z-index: 100;
		overflow: hidden;
	}
	
	.panel-header {
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border-light);
		display: flex;
		align-items: center;
		justify-content: space-between;
		background-color: var(--color-bg);
	}
	
	.panel-title {
		font-size: 14px;
		font-weight: 600;
	}
	
	.panel-close {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		font-size: 18px;
		color: var(--color-text-muted);
	}
	
	.panel-close:hover {
		background-color: var(--color-bg-alt);
	}
	
	.panel-body {
		max-height: 400px;
		overflow-y: auto;
		padding: 8px;
	}
	
	.empty-anomalies {
		padding: 32px;
		text-align: center;
		color: var(--color-text-muted);
	}
	
	.empty-icon {
		font-size: 32px;
		display: block;
		margin-bottom: 8px;
	}
	
	.anomaly-item {
		padding: 12px;
		border-radius: var(--radius);
		margin-bottom: 8px;
		border-left: 3px solid var(--color-warning);
		background-color: var(--color-bg);
	}
	
	.anomaly-item:last-child {
		margin-bottom: 0;
	}
	
	.anomaly-item.severity-high {
		border-left-color: var(--color-error);
	}
	
	.anomaly-item.severity-low {
		border-left-color: var(--color-info);
	}
	
	.anomaly-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
	}
	
	.anomaly-type {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.anomaly-severity {
		font-size: 11px;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		background-color: var(--color-warning);
		color: white;
	}
	
	.severity-high .anomaly-severity {
		background-color: var(--color-error);
	}
	
	.severity-low .anomaly-severity {
		background-color: var(--color-info);
	}
	
	.anomaly-message {
		font-size: 12px;
		color: var(--color-text-secondary);
		margin-bottom: 6px;
	}
	
	.anomaly-link {
		font-size: 12px;
		color: var(--color-primary);
		text-decoration: none;
	}
</style>
