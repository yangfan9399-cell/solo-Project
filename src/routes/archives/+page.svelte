<script lang="ts">
	import { onMount } from 'svelte';
	import type { PrescriptionListItem } from '$lib/types';
	import { statusLabels, statusColors, sourceLabels } from '$lib/types';

	let archivedPrescriptions: PrescriptionListItem[] = [];
	let disputedPrescriptions: PrescriptionListItem[] = [];
	let loading = true;
	let activeTab = 'archived';

	onMount(async () => {
		const [archivedRes, disputedRes] = await Promise.all([
			fetch('/api/prescriptions?status=ARCHIVED'),
			fetch('/api/prescriptions?status=DISPUTED')
		]);
		archivedPrescriptions = await archivedRes.json();
		disputedPrescriptions = await disputedRes.json();
		loading = false;
	});

	function formatDate(date: Date) {
		return new Date(date).toLocaleString('zh-CN');
	}

	$: currentPrescriptions = activeTab === 'archived' ? archivedPrescriptions : disputedPrescriptions;
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<h2 class="text-2xl font-bold text-gray-900">异常归档管理</h2>
		<div class="flex space-x-2 bg-gray-100 p-1 rounded-lg">
			<button
				on:click={() => activeTab = 'archived'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {
					activeTab === 'archived'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}"
			>
				已归档 ({archivedPrescriptions.length})
			</button>
			<button
				on:click={() => activeTab = 'disputed'}
				class="px-4 py-2 rounded-lg text-sm font-medium transition-colors {
					activeTab === 'disputed'
						? 'bg-white text-gray-900 shadow-sm'
						: 'text-gray-600 hover:text-gray-900'
				}"
			>
				争议中 ({disputedPrescriptions.length})
			</button>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-12 text-gray-500">加载中...</div>
	{:else if currentPrescriptions.length === 0}
		<div class="bg-white shadow-sm rounded-lg border p-12 text-center">
			<div class="text-5xl mb-4">📦</div>
			<p class="text-gray-500">
				{activeTab === 'archived' ? '暂无归档处方' : '暂无争议处方'}
			</p>
		</div>
	{:else}
		<div class="bg-white shadow-sm rounded-lg border overflow-hidden">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">处方号</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">患者</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">药品数</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">责任人</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each currentPrescriptions as p}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap font-mono text-sm text-blue-600">{p.prescriptionNo}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
								{sourceLabels[p.source]}
								{#if p.sourceHospital}
									<span class="text-gray-500 ml-1">({p.sourceHospital})</span>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.patientName}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.medicineCount} 种</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-2 py-1 text-xs font-medium rounded-full {statusColors[p.status]}">
									{statusLabels[p.status]}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.currentHandler || '-'}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(p.createdAt)}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<a href="/prescription/{p.id}" class="text-blue-600 hover:text-blue-800 font-medium">
									查看详情
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
