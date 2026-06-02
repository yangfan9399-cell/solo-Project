<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import type { ItemWithJoined, LockerWithItem } from '$lib/types';

	export let data: PageData;
	export let form: ActionData | undefined;

	let selectedArea = 'A区';
	let showMaintenanceModal = false;
	let showRestoreModal = false;
	let modalLockerId = 0;
	let modalLockerCode = '';
	let modalReason = '';

	function openMaintenanceModal(locker: LockerWithItem) {
		modalLockerId = locker.id;
		modalLockerCode = locker.code;
		modalReason = '';
		showMaintenanceModal = true;
	}

	function openRestoreModal(locker: LockerWithItem) {
		modalLockerId = locker.id;
		modalLockerCode = locker.code;
		modalReason = '';
		showRestoreModal = true;
	}

	const areas = ['A区', 'B区', 'C区'];
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">保管柜看板</h1>

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
			{form.error}
		</div>
	{/if}

	<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
		<div class="card">
			<p class="text-sm text-gray-500">总柜数</p>
			<p class="text-2xl font-bold text-gray-900">{data.stats.total}</p>
		</div>
		<div class="card">
			<p class="text-sm text-gray-500">可用</p>
			<p class="text-2xl font-bold text-green-600">{data.stats.available}</p>
		</div>
		<div class="card">
			<p class="text-sm text-gray-500">占用</p>
			<p class="text-2xl font-bold text-yellow-600">{data.stats.occupied}</p>
		</div>
		<div class="card">
			<p class="text-sm text-gray-500">维护中</p>
			<p class="text-2xl font-bold text-gray-400">{data.stats.maintenance}</p>
		</div>
	</div>

	<div class="flex gap-2 mb-4">
		{#each areas as area}
			<button
				class="px-4 py-2 rounded-md font-medium transition-colors"
				class:bg-indigo-600={selectedArea === area}
				class:text-white={selectedArea === area}
				class:bg-gray-100={selectedArea !== area}
				class:text-gray-700={selectedArea !== area}
				on:click={() => selectedArea = area}
			>
				{area}
			</button>
		{/each}
	</div>

	<div class="card">
		<div class="grid grid-cols-5 md:grid-cols-10 gap-3">
			{#each data.lockers.filter((l: LockerWithItem) => l.area === selectedArea) as locker}
				<div
					class="relative p-3 rounded-lg border-2 text-center transition-all hover:shadow-md"
					class:border-green-300={locker.status === 'available'}
					class:bg-green-50={locker.status === 'available'}
					class:border-yellow-400={locker.status === 'occupied'}
					class:bg-yellow-50={locker.status === 'occupied'}
					class:border-orange-400={locker.status === 'maintenance'}
					class:bg-orange-50={locker.status === 'maintenance'}
				>
					<div class="text-lg font-mono font-bold
						{locker.status === 'available' ? 'text-green-700' : ''}
						{locker.status === 'occupied' ? 'text-yellow-700' : ''}
						{locker.status === 'maintenance' ? 'text-orange-600' : ''}
					">
						{locker.code.split('-')[1]}
					</div>
					<div class="text-xs mt-1
						{locker.status === 'available' ? 'text-green-600' : ''}
						{locker.status === 'occupied' ? 'text-yellow-600' : ''}
						{locker.status === 'maintenance' ? 'text-orange-500' : ''}
					">
						{locker.status === 'available' ? '空' : locker.status === 'occupied' ? '有' : '维'}
					</div>
					{#if locker.status === 'available'}
						<button
							class="mt-1 text-xs text-gray-400 hover:text-orange-600 transition-colors"
							title="标记维护"
							on:click={() => openMaintenanceModal(locker)}
						>🔧</button>
					{:else if locker.status === 'maintenance'}
						<button
							class="mt-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
							title="恢复可用"
							on:click={() => openRestoreModal(locker)}
						>✅</button>
					{:else if locker.status === 'occupied' && locker.item}
						<a href="/items/{(locker.item as ItemWithJoined).id}" class="absolute inset-0" title={(locker.item as ItemWithJoined).name}></a>
					{/if}
				</div>
			{/each}
		</div>

		<div class="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-sm">
			<div class="flex items-center">
				<span class="w-4 h-4 rounded border-2 border-green-300 bg-green-50 mr-2"></span>
				<span>可用</span>
			</div>
			<div class="flex items-center">
				<span class="w-4 h-4 rounded border-2 border-yellow-400 bg-yellow-50 mr-2"></span>
				<span>占用</span>
			</div>
			<div class="flex items-center">
				<span class="w-4 h-4 rounded border-2 border-orange-400 bg-orange-50 mr-2"></span>
				<span>维护中</span>
			</div>
		</div>
	</div>

	{#if data.lockers.filter((l: LockerWithItem) => l.area === selectedArea && l.status === 'occupied').length > 0}
		<div class="card">
			<h2 class="text-lg font-semibold mb-4">存放物品列表</h2>
			<div class="space-y-2">
				{#each data.lockers.filter((l: LockerWithItem) => l.area === selectedArea && l.status === 'occupied' && l.item) as locker}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex items-center">
							<span class="font-mono font-bold text-indigo-600 w-16">{locker.code}</span>
							<span class="font-medium">{(locker.item as ItemWithJoined).name}</span>
							<span class="text-sm text-gray-500 ml-2">{(locker.item as ItemWithJoined).item_code}</span>
						</div>
						<a href="/items/{(locker.item as ItemWithJoined).id}" class="text-indigo-600 hover:text-indigo-800 text-sm">查看详情</a>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if data.lockers.filter((l: LockerWithItem) => l.area === selectedArea && l.status === 'maintenance').length > 0}
		<div class="card border-orange-200">
			<h2 class="text-lg font-semibold mb-4 text-orange-800">维护中柜位</h2>
			<div class="space-y-2">
				{#each data.lockers.filter((l: LockerWithItem) => l.area === selectedArea && l.status === 'maintenance') as locker}
					<div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
						<div class="flex items-center">
							<span class="font-mono font-bold text-orange-600 w-16">{locker.code}</span>
							<span class="text-orange-700">{locker.area}</span>
						</div>
						<form method="POST" action="?/set_available">
							<input type="hidden" name="lockerId" value={locker.id} />
							<button type="submit" class="btn btn-success text-sm">恢复可用</button>
						</form>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if showMaintenanceModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold mb-2">标记维护中</h3>
			<p class="text-sm text-gray-500 mb-4">保管柜 <span class="font-mono font-bold text-orange-600">{modalLockerCode}</span> 将标记为维护中，不再可用于物品入库。</p>

			<form method="POST" action="?/set_maintenance">
				<input type="hidden" name="lockerId" value={modalLockerId} />
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-1">维护原因</label>
					<textarea name="reason" bind:value={modalReason} class="form-input" rows="2" placeholder="如：柜门损坏、清洁消毒…"></textarea>
				</div>
				<div class="flex gap-3">
					<button type="button" on:click={() => showMaintenanceModal = false} class="btn btn-secondary flex-1">取消</button>
					<button type="submit" class="btn btn-danger flex-1">确认维护</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showRestoreModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg p-6 w-full max-w-md">
			<h3 class="text-lg font-semibold mb-2">恢复可用</h3>
			<p class="text-sm text-gray-500 mb-4">保管柜 <span class="font-mono font-bold text-green-600">{modalLockerCode}</span> 将恢复为可用状态，可正常用于物品入库。</p>

			<form method="POST" action="?/set_available">
				<input type="hidden" name="lockerId" value={modalLockerId} />
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-1">备注（选填）</label>
					<textarea name="reason" bind:value={modalReason} class="form-input" rows="2" placeholder="如：维修完成、清洁完毕…"></textarea>
				</div>
				<div class="flex gap-3">
					<button type="button" on:click={() => showRestoreModal = false} class="btn btn-secondary flex-1">取消</button>
					<button type="submit" class="btn btn-success flex-1">确认恢复</button>
				</div>
			</form>
		</div>
	</div>
{/if}
