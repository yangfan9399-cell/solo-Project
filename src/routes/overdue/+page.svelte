<script lang="ts">
	import { CATEGORY_LABELS } from '$lib/types';

	export let data;
	export let form;

	let showDisposeModal = false;
	let selectedItemId: number | null = null;
	let disposeReason = '';

	function openDisposeModal(itemId: number) {
		selectedItemId = itemId;
		disposeReason = '';
		showDisposeModal = true;
	}
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">超期待处置</h1>

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
			{form.error}
		</div>
	{/if}

	<div class="card">
		<div class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
			<p class="text-yellow-800">
				<svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
				</svg>
				以下物品已超过 30 天保管期，请及时处理
			</p>
		</div>

		{#if data.items.length === 0}
			<div class="text-center py-12 text-gray-500">
				<svg class="w-16 h-16 mx-auto mb-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-lg font-medium">暂无超期待处置物品</p>
				<p class="mt-1">所有物品都在保管期内</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each data.items as item}
					<div class="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
						<div class="flex items-center">
							<div class="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-4">
								<div class="flex items-center">
									<p class="font-medium text-gray-900">{item.name}</p>
									<span class="ml-2 text-xs text-gray-500 font-mono">{item.item_code}</span>
								</div>
								<p class="text-sm text-gray-600">
									{CATEGORY_LABELS[item.category]} · {(item as any).hall_name || '未知位置'}
								</p>
								<p class="text-sm text-red-600">
									超期 {Math.floor((new Date().getTime() - new Date(item.disposal_due_date!).getTime()) / (1000 * 60 * 60 * 24))} 天
								</p>
							</div>
						</div>
						<div class="flex gap-2">
							<a href="/items/{item.id}" class="btn btn-secondary text-sm">查看详情</a>
							<button on:click={() => openDisposeModal(item.id)} class="btn btn-danger text-sm">处置</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	{#if showDisposeModal && selectedItemId}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 class="text-lg font-semibold mb-4">处置物品</h3>
				<p class="text-sm text-gray-600 mb-4">处置后物品将从保管系统中移除，请谨慎操作。</p>
				<form method="POST" action="?/dispose">
					<input type="hidden" name="itemId" value={selectedItemId} />
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">处置原因 *</label>
						<select name="reason" bind:value={disposeReason} class="form-select" required>
							<option value="">请选择处置原因</option>
							<option value="无人认领">无人认领</option>
							<option value="物品损坏">物品损坏</option>
							<option value="已捐赠">已捐赠</option>
							<option value="已销毁">已销毁</option>
							<option value="其他">其他</option>
						</select>
					</div>
					<div class="flex gap-3">
						<button type="button" on:click={() => showDisposeModal = false} class="btn btn-secondary flex-1">取消</button>
						<button type="submit" class="btn btn-danger flex-1">确认处置</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
