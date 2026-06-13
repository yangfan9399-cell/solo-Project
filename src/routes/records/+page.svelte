<script lang="ts">
	import { goto } from '$app/navigation';
	import type { RecordStatus, SampleType } from '$lib/types';

	let { data } = $props();

	const statusOptions: { value: RecordStatus; label: string }[] = [
		{ value: 'RECEIVED', label: '受理' },
		{ value: 'PROCESSING', label: '处理中' },
		{ value: 'REVIEW', label: '复核中' },
		{ value: 'ARCHIVED', label: '已归档' }
	];

	const sampleTypeOptions: { value: SampleType; label: string }[] = [
		{ value: 'NORMAL', label: '正常' },
		{ value: 'INELIGIBLE', label: '资格不符' },
		{ value: 'TIME_CONFLICT', label: '时间冲突' },
		{ value: 'UNCONFIRMED', label: '未确认' }
	];

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

	let filterStatus = $state(data.filters.status);
	let filterSampleType = $state(data.filters.sampleType);
	let filterSearch = $state(data.filters.search);

	let totalPages = $derived(Math.ceil(data.data.total / data.data.limit));

	function applyFilters(pageNum?: number) {
		const params = new URLSearchParams();
		if (filterStatus) params.set('status', filterStatus);
		if (filterSampleType) params.set('sampleType', filterSampleType);
		if (filterSearch) params.set('search', filterSearch);
		params.set('page', String(pageNum ?? 1));
		goto(`/records?${params}`);
	}

	function resetFilters() {
		filterStatus = '';
		filterSampleType = '';
		filterSearch = '';
		goto('/records');
	}

	function goToPage(page: number) {
		applyFilters(page);
	}

	function truncate(str: string | undefined | null, max: number) {
		if (!str) return '-';
		return str.length > max ? str.slice(0, max) + '...' : str;
	}

	function formatDate(d: string) {
		return new Date(d).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="records-page">
	<h2 class="mb-lg">记录列表</h2>

	<div class="filter-bar card mb-lg">
		<div class="filter-bar-inner">
			<div class="form-group" style="margin-bottom:0">
				<label class="form-label" for="filter-status">状态</label>
				<select id="filter-status" class="form-select" bind:value={filterStatus}>
					<option value="">全部状态</option>
					{#each statusOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<div class="form-group" style="margin-bottom:0">
				<label class="form-label" for="filter-sampleType">样本类型</label>
				<select id="filter-sampleType" class="form-select" bind:value={filterSampleType}>
					<option value="">全部类型</option>
					{#each sampleTypeOptions as opt}
						<option value={opt.value}>{opt.label}</option>
					{/each}
				</select>
			</div>
			<div class="form-group" style="margin-bottom:0">
				<label class="form-label" for="filter-search">搜索</label>
				<input
					id="filter-search"
					type="text"
					class="form-input"
					placeholder="搜索标题/申请人/车牌号..."
					bind:value={filterSearch}
					onkeydown={(e) => { if (e.key === 'Enter') applyFilters(); }}
				/>
			</div>
			<div class="filter-actions">
				<button class="btn btn-primary" onclick={() => applyFilters()}>查询</button>
				<button class="btn btn-outline" onclick={resetFilters}>重置</button>
			</div>
		</div>
	</div>

	<div class="card">
		<div class="table-wrapper">
			<table class="table">
				<thead>
					<tr>
						<th>ID</th>
						<th>标题</th>
						<th>申请人</th>
						<th>车牌号</th>
						<th>样本类型</th>
						<th>状态</th>
						<th>申请/实际里程</th>
						<th>阻断原因</th>
						<th>当前处理人</th>
						<th>创建时间</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{#each data.data.records as record (record.id)}
						<tr class:exception-row={record.sampleType !== 'NORMAL'}>
							<td>{record.id}</td>
							<td class="truncate" style="max-width:180px">{record.title}</td>
							<td>{record.applicant?.name ?? '-'}</td>
							<td>{record.vehicle?.plateNumber ?? '-'}</td>
							<td>
								<span class="badge {sampleTypeColors[record.sampleType as SampleType]}">
									{sampleTypeLabels[record.sampleType as SampleType] ?? record.sampleType}
								</span>
							</td>
							<td>
								<span class="badge {statusColors[record.status as RecordStatus]}">
									{statusLabels[record.status as RecordStatus] ?? record.status}
								</span>
							</td>
							<td>{record.appliedMileage} / {record.actualMileage}</td>
							<td class="truncate" style="max-width:120px">
								{record.blockingReason ? truncate(record.blockingReason, 20) : '-'}
							</td>
							<td>{record.currentAssignee?.name ?? '-'}</td>
							<td class="text-xs">{formatDate(record.createdAt)}</td>
							<td>
								<a href="/records/{record.id}" class="btn btn-outline btn-sm">查看详情</a>
							</td>
						</tr>
					{/each}
					{#if data.data.records.length === 0}
						<tr>
							<td colspan="11" class="text-center text-muted" style="padding:var(--spacing-xl)">
								暂无记录
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	{#if totalPages > 1}
		<div class="pagination mt-md flex items-center justify-between">
			<div class="text-sm text-secondary">
				共 {data.data.total} 条记录，第 {data.filters.page} / {totalPages} 页
			</div>
			<div class="flex items-center gap-sm">
				<button
					class="btn btn-outline btn-sm"
					disabled={data.filters.page <= 1}
					onclick={() => goToPage(data.filters.page - 1)}
				>
					上一页
				</button>
				{#each Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
					if (totalPages <= 7) return i + 1;
					if (data.filters.page <= 4) return i + 1;
					if (data.filters.page >= totalPages - 3) return totalPages - 6 + i;
					return data.filters.page - 3 + i;
				}) as pageNum}
					<button
						class="btn btn-sm {pageNum === data.filters.page ? 'btn-primary' : 'btn-outline'}"
						onclick={() => goToPage(pageNum)}
					>
						{pageNum}
					</button>
				{/each}
				<button
					class="btn btn-outline btn-sm"
					disabled={data.filters.page >= totalPages}
					onclick={() => goToPage(data.filters.page + 1)}
				>
					下一页
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.filter-bar-inner {
		display: flex;
		align-items: flex-end;
		gap: var(--spacing-md);
		flex-wrap: wrap;
		padding: var(--spacing-md) var(--spacing-lg);
	}

	.filter-bar-inner .form-group {
		min-width: 160px;
		flex: 1;
	}

	.filter-actions {
		display: flex;
		gap: var(--spacing-sm);
		flex-shrink: 0;
	}

	.table-wrapper {
		overflow-x: auto;
	}

	:global(.exception-row) td {
		border-left: 3px solid var(--color-danger-light);
	}

	.text-center {
		text-align: center;
	}

	.pagination {
		flex-wrap: wrap;
		gap: var(--spacing-md);
	}
</style>
