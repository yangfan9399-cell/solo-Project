<script lang="ts">
	import type { PageData } from './$types';
	import { CATEGORY_LABELS, STATUS_LABELS, type ItemWithJoined, type ClaimWithJoined } from '$lib/types';

	export let data: PageData;
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">控制台</h1>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card">
			<div class="flex items-center">
				<div class="p-3 rounded-full bg-indigo-100 text-indigo-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-gray-500">在管物品</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.storingCount}</p>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center">
				<div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-gray-500">待审核申领</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.pendingClaims}</p>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center">
				<div class="p-3 rounded-full bg-red-100 text-red-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-gray-500">超期待处置</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.overdueCount}</p>
				</div>
			</div>
		</div>

		<div class="card">
			<div class="flex items-center">
				<div class="p-3 rounded-full bg-green-100 text-green-600">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-gray-500">可用保管柜</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.lockerAvailable}</p>
				</div>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900">最近保管物品</h2>
				<a href="/items" class="text-sm text-indigo-600 hover:text-indigo-800">查看全部</a>
			</div>
			{#if data.recentItems.length === 0}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
					</svg>
					<p>暂无保管中的物品</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.recentItems as item}
						<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
							<div class="flex items-center">
								<div class="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
									{CATEGORY_LABELS[item.category]?.charAt(0)}
								</div>
								<div class="ml-3">
									<p class="font-medium text-gray-900">{item.name}</p>
									<p class="text-sm text-gray-500">{(item as ItemWithJoined).hall_name || '未知位置'} · {new Date(item.found_time).toLocaleDateString()}</p>
								</div>
							</div>
							<span class="badge bg-blue-100 text-blue-700">{STATUS_LABELS[item.status]}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="card">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-gray-900">待审核申领</h2>
				<a href="/claims" class="text-sm text-indigo-600 hover:text-indigo-800">查看全部</a>
			</div>
			{#if data.pendingClaims.length === 0}
				<div class="text-center py-8 text-gray-500">
					<svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					<p>暂无待审核的申领</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each data.pendingClaims as claim}
						<div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
							<div>
								<p class="font-medium text-gray-900">{(claim as ClaimWithJoined).claimant_name} 申领</p>
								<p class="text-sm text-gray-500">{(claim as ClaimWithJoined).item_name} · {(claim as ClaimWithJoined).claimant_phone}</p>
							</div>
							<a href="/claims/{claim.id}" class="btn btn-primary text-sm">审核</a>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	{#if data.overdueItems.length > 0}
		<div class="card border-red-200 bg-red-50">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-lg font-semibold text-red-700">超期待处置物品</h2>
				<a href="/overdue" class="text-sm text-red-600 hover:text-red-800">处理</a>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each data.overdueItems as item}
					<div class="p-3 bg-white rounded-lg border border-red-200">
						<p class="font-medium text-gray-900">{item.name}</p>
						<p class="text-sm text-red-600">超期: {new Date(item.disposal_due_date!).toLocaleDateString()}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
