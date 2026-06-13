<script lang="ts">
	import type { RecordStatus, SampleType, VehicleUsageRecord } from '$lib/types';

	let { data } = $props();

	const statusLabels: Record<RecordStatus, string> = {
		RECEIVED: '受理',
		PROCESSING: '处理中',
		REVIEW: '复核中',
		ARCHIVED: '已归档'
	};

	const statusColors: Record<RecordStatus, string> = {
		RECEIVED: 'badge-blue',
		PROCESSING: 'badge-yellow',
		REVIEW: 'badge-gray',
		ARCHIVED: 'badge-green'
	};

	const sampleTypeLabels: Record<SampleType, string> = {
		NORMAL: '正常',
		INELIGIBLE: '资格不符',
		TIME_CONFLICT: '时间冲突',
		UNCONFIRMED: '未确认'
	};

	const sampleTypeColors: Record<SampleType, string> = {
		NORMAL: 'badge-green',
		INELIGIBLE: 'badge-red',
		TIME_CONFLICT: 'badge-yellow',
		UNCONFIRMED: 'badge-gray'
	};

	const statuses: RecordStatus[] = ['RECEIVED', 'PROCESSING', 'REVIEW', 'ARCHIVED'];
	const sampleTypes: SampleType[] = ['NORMAL', 'INELIGIBLE', 'TIME_CONFLICT', 'UNCONFIRMED'];

	let totalCount = $derived(
		(Object.values(data.stats.byStatus) as number[]).reduce((sum, c) => sum + c, 0)
	);

	let recordsByStatus = $derived(() => {
		const map = new Map<RecordStatus, VehicleUsageRecord[]>();
		for (const s of statuses) {
			map.set(s, []);
		}
		for (const r of data.records.records) {
			if (map.has(r.status)) {
				map.get(r.status)!.push(r);
			}
		}
		return map;
	});

	let kanbanFilter = $state<RecordStatus | ''>('');

	let filteredKanban = $derived(() => {
		const result = new Map<RecordStatus, VehicleUsageRecord[]>();
		for (const s of statuses) {
			if (kanbanFilter && s !== kanbanFilter) {
				result.set(s, []);
			} else {
				result.set(s, recordsByStatus().get(s) ?? []);
			}
		}
		return result;
	});

	function navigateToRecords(params: string) {
		window.location.href = `/records?${params}`;
	}

	function onStatCardClick(filterType: 'status' | 'sampleType' | 'violation', value: string) {
		if (filterType === 'status') {
			kanbanFilter = value as RecordStatus;
			const el = document.getElementById('kanban');
			if (el) el.scrollIntoView({ behavior: 'smooth' });
		} else {
			navigateToRecords(`${filterType === 'sampleType' ? 'sampleType' : 'violation'}=${value}`);
		}
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="dashboard">
	<section class="stats-section">
		<h2 class="mb-md">数据概览</h2>
		<div class="grid grid-4 mb-lg">
			<div class="stat-card" style="cursor:default">
				<div class="stat-value">{totalCount}</div>
				<div class="stat-label">总记录数</div>
			</div>
			{#each statuses as status}
				<button
					class="stat-card stat-card-clickable"
					onclick={() => onStatCardClick('status', status)}
				>
					<div class="stat-value">{data.stats.byStatus[status] ?? 0}</div>
					<div class="stat-label">{statusLabels[status]}</div>
				</button>
			{/each}
		</div>

		<h3 class="mb-md">样本类型分布</h3>
		<div class="grid grid-4 mb-lg">
			{#each sampleTypes as st}
				<button
					class="stat-card stat-card-clickable"
					onclick={() => navigateToRecords(`sampleType=${st}`)}
				>
					<div class="stat-value">{data.stats.bySampleType[st] ?? 0}</div>
					<div class="stat-label">{sampleTypeLabels[st]}</div>
				</button>
			{/each}
		</div>

		<h3 class="mb-md">违章统计</h3>
		<div class="grid grid-4 mb-lg">
			<button
				class="stat-card stat-card-clickable"
				onclick={() => navigateToRecords('violation=confirmed')}
			>
				<div class="stat-value" style="color:var(--color-danger)">{data.stats.violations.confirmed ?? 0}</div>
				<div class="stat-label">已确认违章</div>
			</button>
			<button
				class="stat-card stat-card-clickable"
				onclick={() => navigateToRecords('violation=unconfirmed')}
			>
				<div class="stat-value" style="color:var(--color-warning)">{data.stats.violations.unconfirmed ?? 0}</div>
				<div class="stat-label">未确认违章</div>
			</button>
		</div>
	</section>

	<section id="kanban" class="kanban-section mt-lg">
		<div class="flex items-center justify-between mb-md">
			<h2>看板视图</h2>
			{#if kanbanFilter}
				<button class="btn btn-outline btn-sm" onclick={() => (kanbanFilter = '')}>
					清除筛选（{statusLabels[kanbanFilter]}）
				</button>
			{/if}
		</div>
		<div class="kanban-board">
			{#each statuses as status}
				<div class="kanban-column">
					<div class="kanban-column-header">
						<span class="badge {statusColors[status]}">{statusLabels[status]}</span>
						<span class="text-xs text-muted">{filteredKanban().get(status)?.length ?? 0}</span>
					</div>
					<div class="kanban-column-body">
						{#each (filteredKanban().get(status) ?? []) as record (record.id)}
							<a href="/records/{record.id}" class="kanban-card card">
								{#if record.sampleType !== 'NORMAL'}
									<div class="blocking-banner" style="margin-bottom:var(--spacing-sm);padding:var(--spacing-sm) var(--spacing-md)">
										<div class="blocking-reason text-xs">
											⚠ {sampleTypeLabels[record.sampleType]}{record.blockingReason ? '：' + record.blockingReason : ''}
										</div>
									</div>
								{/if}
								<div class="kanban-card-title truncate">{record.title}</div>
								<div class="kanban-card-meta text-xs text-secondary mt-sm">
									<span>{record.applicant?.name ?? '-'}</span>
									<span class="ml-sm">{record.vehicle?.plateNumber ?? '-'}</span>
								</div>
								<div class="flex items-center gap-sm mt-sm">
									<span class="badge {sampleTypeColors[record.sampleType]} text-xs">{sampleTypeLabels[record.sampleType]}</span>
								</div>
								{#if record.currentAssignee}
									<div class="text-xs text-muted mt-sm">
										处理人：{record.currentAssignee.name}
									</div>
								{/if}
								<div class="text-xs text-muted mt-sm">
									{formatDate(record.createdAt)}
								</div>
							</a>
						{/each}
						{#if (filteredKanban().get(status) ?? []).length === 0}
							<div class="kanban-empty text-xs text-muted">暂无记录</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	.stats-section {
		margin-bottom: var(--spacing-xl);
	}

	.stat-card-clickable {
		cursor: pointer;
		border: 1px solid var(--color-border);
		text-align: left;
		width: 100%;
	}

	.stat-card-clickable:hover {
		border-color: var(--color-primary-light);
	}

	.kanban-board {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--spacing-md);
		min-height: 400px;
	}

	@media (max-width: 1024px) {
		.kanban-board {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.kanban-board {
			grid-template-columns: 1fr;
		}
	}

	.kanban-column {
		background-color: var(--color-bg);
		border-radius: var(--radius-md);
		display: flex;
		flex-direction: column;
		min-height: 300px;
	}

	.kanban-column-header {
		padding: var(--spacing-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--color-border);
	}

	.kanban-column-body {
		padding: var(--spacing-sm);
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.kanban-card {
		padding: var(--spacing-md);
		text-decoration: none;
		color: inherit;
		transition: box-shadow 0.15s ease;
	}

	.kanban-card:hover {
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}

	.kanban-card-title {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.kanban-card-meta {
		display: flex;
		gap: var(--spacing-sm);
	}

	.kanban-empty {
		text-align: center;
		padding: var(--spacing-xl) var(--spacing-md);
	}
</style>
