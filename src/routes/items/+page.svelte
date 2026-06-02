<script lang="ts">
	import { page } from '$app/stores';
	import { CATEGORY_LABELS, STATUS_LABELS } from '$lib/types';

	export let data;

	let searchTerm = data.filters.search || '';
	let selectedStatus = data.filters.status || '';
	let selectedCategory = data.filters.category || '';

	function updateFilters() {
		const params = new URLSearchParams();
		if (searchTerm) params.set('search', searchTerm);
		if (selectedStatus) params.set('status', selectedStatus);
		if (selectedCategory) params.set('category', selectedCategory);
		window.location.href = `/items${params.toString() ? '?' + params.toString() : ''}`;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">物品管理</h1>
		<a href="/items/new" class="btn btn-primary">
			<svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			拾物登记
		</a>
	</div>

	<div class="card">
		<div class="flex flex-wrap gap-4 mb-6">
			<div class="flex-1 min-w-[200px]">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="搜索物品名称、编号..."
					class="form-input"
					on:keydown={(e) => e.key === 'Enter' && updateFilters()}
				/>
			</div>
			<select bind:value={selectedStatus} class="form-select w-40" on:change={updateFilters}>
				<option value="">全部状态</option>
				<option value="found">已拾获</option>
				<option value="storing">保管中</option>
				<option value="claimed">待领取</option>
				<option value="returned">已归还</option>
				<option value="disposed">已处置</option>
				<option value="exception">异常</option>
			</select>
			<select bind:value={selectedCategory} class="form-select w-40" on:change={updateFilters}>
				<option value="">全部分类</option>
				{#each Object.entries(CATEGORY_LABELS) as [key, label]}
					<option value={key}>{label}</option>
				{/each}
			</select>
			<button on:click={updateFilters} class="btn btn-primary">搜索</button>
		</div>

		{#if data.items.total === 0}
			<div class="text-center py-12 text-gray-500">
				<svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
				</svg>
				<p class="text-lg font-medium">暂无物品记录</p>
				<p class="mt-1">点击"拾物登记"添加第一条记录</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b border-gray-200">
							<th class="text-left py-3 px-4 font-semibold text-gray-700">物品编号</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">名称</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">分类</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">拾获位置</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">状态</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">登记时间</th>
							<th class="text-left py-3 px-4 font-semibold text-gray-700">操作</th>
						</tr>
					</thead>
					<tbody>
						{#each data.items.data as item}
							<tr class="border-b border-gray-100 hover:bg-gray-50">
								<td class="py-3 px-4 font-mono text-sm text-indigo-600">{item.item_code}</td>
								<td class="py-3 px-4 font-medium">{item.name}</td>
								<td class="py-3 px-4">
									<span class="text-sm text-gray-600">{CATEGORY_LABELS[item.category]}</span>
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{(item as any).hall_name || item.found_location || '未知'}
								</td>
								<td class="py-3 px-4">
									<span
										class="badge"
										class:bg-green-100={item.status === 'storing'}
										class:text-green-700={item.status === 'storing'}
										class:bg-yellow-100={item.status === 'found' || item.status === 'claimed'}
										class:text-yellow-700={item.status === 'found' || item.status === 'claimed'}
										class:bg-blue-100={item.status === 'returned'}
										class:text-blue-700={item.status === 'returned'}
										class:bg-gray-100={item.status === 'disposed'}
										class:text-gray-700={item.status === 'disposed'}
										class:bg-red-100={item.status === 'exception'}
										class:text-red-700={item.status === 'exception'}
									>
										{STATUS_LABELS[item.status]}
									</span>
								</td>
								<td class="py-3 px-4 text-sm text-gray-600">
									{new Date(item.found_time).toLocaleDateString()}
								</td>
								<td class="py-3 px-4">
									<a href="/items/{item.id}" class="text-indigo-600 hover:text-indigo-800 text-sm">查看详情</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			{#if data.items.total > 20}
				<div class="flex items-center justify-between mt-6 pt-4 border-t">
					<p class="text-sm text-gray-600">
						共 {data.items.total} 条记录，第 {data.items.page} 页
					</p>
					<div class="flex gap-2">
						{#if data.items.page > 1}
							<a href="?page={data.items.page - 1}" class="btn btn-secondary text-sm">上一页</a>
						{/if}
						{#if data.items.page * 20 < data.items.total}
							<a href="?page={data.items.page + 1}" class="btn btn-secondary text-sm">下一页</a>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
