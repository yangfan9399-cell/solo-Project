<script lang="ts">
	import { CLAIM_STATUS_LABELS } from '$lib/types';

	export let data;

	let selectedStatus = data.filters.status || '';

	function updateFilters() {
		const params = new URLSearchParams();
		if (selectedStatus) params.set('status', selectedStatus);
		window.location.href = `/claims${params.toString() ? '?' + params.toString() : ''}`;
	}

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending': case 'verifying': return 'bg-yellow-100 text-yellow-700';
			case 'approved': return 'bg-green-100 text-green-700';
			case 'rejected': case 'cancelled': return 'bg-red-100 text-red-700';
			case 'completed': return 'bg-blue-100 text-blue-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">申领管理</h1>
	</div>

	<div class="card">
		<div class="flex flex-wrap gap-4 mb-6">
			<select bind:value={selectedStatus} class="form-select w-40" on:change={updateFilters}>
				<option value="">全部状态</option>
				<option value="pending">待审核</option>
				<option value="verifying">核验中</option>
				<option value="approved">已通过</option>
				<option value="rejected">已拒绝</option>
				<option value="completed">已完成</option>
				<option value="cancelled">已取消</option>
			</select>
		</div>

		{#if data.claims.total === 0}
			<div class="text-center py-12 text-gray-500">
				<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<p class="text-lg font-medium">暂无申领记录</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-200">
							<th class="text-left py-3 px-4 font-semibold text-gray-700">申领编号</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">物品</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">失主</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">电话</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">申领时间</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
						</tr>
					</thead>
					<tbody>
						{#each data.claims.data as claim}
							<tr class="border-b border-gray-100 hover:bg-gray-50">
								<td class="py-3 px-4 font-mono text-sm text-indigo-600">#{claim.id}</td>
								<td class="py-3 px-4">
									<div>
										<p class="font-medium">{(claim as any).item_name}</p>
										<p class="text-xs text-gray-500">{(claim as any).item_code}</p>
									</div>
								</td>
								<td class="py-3 px-4">{(claim as any).claimant_name}</td>
								<td class="py-3 px-4 text-gray-600">{(claim as any).claimant_phone}</td>
								<td class="py-3 px-4">
									<span class="badge {getStatusColor(claim.status)}">
										{CLAIM_STATUS_LABELS[claim.status]}
									</span>
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{new Date(claim.claim_time).toLocaleDateString()}
								</td>
								<td class="py-3 px-4">
									<a href="/claims/{claim.id}" class="text-indigo-600 hover:text-indigo-800 text-sm">处理</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
