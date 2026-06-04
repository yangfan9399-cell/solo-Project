<script lang="ts">
	import { onMount } from 'svelte';
	import type { PrescriptionListItem } from '$lib/types';
	import { statusLabels, statusColors, sourceLabels } from '$lib/types';
	import type { PrescriptionStatus } from '@prisma/client';

	let prescriptions: PrescriptionListItem[] = [];
	let filteredPrescriptions: PrescriptionListItem[] = [];
	let searchQuery = '';
	let statusFilter: PrescriptionStatus | '' = '';
	let loading = true;

	onMount(async () => {
		await loadPrescriptions();
		loading = false;
	});

	async function loadPrescriptions() {
		const params = new URLSearchParams();
		if (statusFilter) params.set('status', statusFilter);
		if (searchQuery) params.set('search', searchQuery);

		const res = await fetch(`/api/prescriptions?${params}`);
		prescriptions = await res.json();
		filteredPrescriptions = prescriptions;
	}

	function filterPrescriptions() {
		filteredPrescriptions = prescriptions.filter(p => {
			const matchesSearch = !searchQuery ||
				p.prescriptionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.patientName.includes(searchQuery);
			const matchesStatus = !statusFilter || p.status === statusFilter;
			return matchesSearch && matchesStatus;
		});
	}

	$: if (prescriptions.length > 0) {
		filterPrescriptions();
	}

	const statusOptions = [
		{ value: '', label: '全部状态' },
		{ value: 'RECEIVED', label: '已接收' },
		{ value: 'REVIEWING', label: '审核中' },
		{ value: 'APPROVED', label: '审核通过' },
		{ value: 'DOSAGE_ISSUE', label: '剂量异常' },
		{ value: 'PATIENT_MISMATCH', label: '患者信息不符' },
		{ value: 'READY_FOR_PICKUP', label: '待取药' },
		{ value: 'PICKED_UP', label: '已取药' },
		{ value: 'TIMEOUT', label: '超时未取' },
		{ value: 'ARCHIVED', label: '已归档' }
	];

	function formatDate(date: Date) {
		return new Date(date).toLocaleString('zh-CN');
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<h2 class="text-2xl font-bold text-gray-900">处方列表</h2>
		<div class="flex flex-col sm:flex-row gap-3">
			<input
				type="text"
				placeholder="搜索处方号或患者姓名..."
				class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
				bind:value={searchQuery}
				on:input={filterPrescriptions}
			/>
			<select
				class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				bind:value={statusFilter}
				on:change={filterPrescriptions}
			>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if loading}
		<div class="text-center py-12 text-gray-500">加载中...</div>
	{:else if filteredPrescriptions.length === 0}
		<div class="text-center py-12 text-gray-500">暂无处方数据</div>
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
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前责任人</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">接收时间</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredPrescriptions as p}
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
