<script lang="ts">
	import { stats } from '$lib/stores/appStore';
</script>

<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-icon total">📋</div>
		<div class="stat-info">
			<div class="stat-value">{$stats.total}</div>
			<div class="stat-label">印稿总数</div>
		</div>
	</div>
	
	<div class="stat-card">
		<div class="stat-icon draft">📝</div>
		<div class="stat-info">
			<div class="stat-value">{$stats.draft}</div>
			<div class="stat-label">草稿</div>
		</div>
	</div>
	
	<div class="stat-card">
		<div class="stat-icon reviewing">⏳</div>
		<div class="stat-info">
			<div class="stat-value reviewing-text">{$stats.reviewing}</div>
			<div class="stat-label">评审中</div>
		</div>
	</div>
	
	<div class="stat-card">
		<div class="stat-icon approved">✅</div>
		<div class="stat-info">
			<div class="stat-value approved-text">{$stats.approved}</div>
			<div class="stat-label">已通过</div>
		</div>
	</div>
	
	<div class="stat-card">
		<div class="stat-icon rejected">❌</div>
		<div class="stat-info">
			<div class="stat-value rejected-text">{$stats.rejected}</div>
			<div class="stat-label">已驳回</div>
		</div>
	</div>
	
	<div class="stat-card">
		<div class="stat-icon anomaly">⚠️</div>
		<div class="stat-info">
			<div class="stat-value anomaly-text">{$stats.unresolvedAnomalies}</div>
			<div class="stat-label">待处理异常</div>
		</div>
	</div>
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
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
		width: 48px;
		height: 48px;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		background-color: var(--color-bg-alt);
		flex-shrink: 0;
	}
	
	.stat-icon.total {
		background-color: rgba(59, 130, 246, 0.1);
	}
	
	.stat-icon.draft {
		background-color: rgba(156, 163, 175, 0.2);
	}
	
	.stat-icon.reviewing {
		background-color: rgba(245, 158, 11, 0.1);
	}
	
	.stat-icon.approved {
		background-color: rgba(16, 185, 129, 0.1);
	}
	
	.stat-icon.rejected {
		background-color: rgba(239, 68, 68, 0.1);
	}
	
	.stat-icon.anomaly {
		background-color: rgba(239, 68, 68, 0.1);
	}
	
	.stat-info {
		flex: 1;
		min-width: 0;
	}
	
	.stat-value {
		font-size: 24px;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.2;
	}
	
	.stat-value.reviewing-text {
		color: var(--color-warning);
	}
	
	.stat-value.approved-text {
		color: var(--color-success);
	}
	
	.stat-value.rejected-text {
		color: var(--color-error);
	}
	
	.stat-value.anomaly-text {
		color: var(--color-error);
	}
	
	.stat-label {
		font-size: 13px;
		color: var(--color-text-muted);
		margin-top: 2px;
	}
</style>
