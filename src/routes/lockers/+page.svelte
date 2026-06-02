<script lang="ts">
	export let data;

	let selectedArea = 'A区';

	const areas = ['A区', 'B区', 'C区'];
</script>

<div class="space-y-6">
	<h1 class="text-2xl font-bold text-gray-900">保管柜看板</h1>

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
			{#each data.lockers.filter((l: any) => l.area === selectedArea) as locker}
				<div
					class="relative p-3 rounded-lg border-2 text-center cursor-pointer transition-all hover:shadow-md"
					class:border-green-300={locker.status === 'available'}
					class:bg-green-50={locker.status === 'available'}
					class:border-yellow-400={locker.status === 'occupied'}
					class:bg-yellow-50={locker.status === 'occupied'}
					class:border-gray-300={locker.status === 'maintenance'}
					class:bg-gray-100={locker.status === 'maintenance'}
					title={locker.status === 'occupied' && locker.item ? (locker.item as any).name : locker.status}
				>
					<div class="text-lg font-mono font-bold
						{locker.status === 'available' ? 'text-green-700' : ''}
						{locker.status === 'occupied' ? 'text-yellow-700' : ''}
						{locker.status === 'maintenance' ? 'text-gray-500' : ''}
					">
						{locker.code.split('-')[1]}
					</div>
					<div class="text-xs mt-1
						{locker.status === 'available' ? 'text-green-600' : ''}
						{locker.status === 'occupied' ? 'text-yellow-600' : ''}
						{locker.status === 'maintenance' ? 'text-gray-400' : ''}
					">
						{locker.status === 'available' ? '空' : locker.status === 'occupied' ? '有' : '维'}
					</div>
					{#if locker.status === 'occupied' && locker.item}
						<a href="/items/{(locker.item as any).id}" class="absolute inset-0"></a>
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
				<span class="w-4 h-4 rounded border-2 border-gray-300 bg-gray-100 mr-2"></span>
				<span>维护中</span>
			</div>
		</div>
	</div>

	{#if data.lockers.filter((l: any) => l.area === selectedArea && l.status === 'occupied').length > 0}
		<div class="card">
			<h2 class="text-lg font-semibold mb-4">存放物品列表</h2>
			<div class="space-y-2">
				{#each data.lockers.filter((l: any) => l.area === selectedArea && l.status === 'occupied' && l.item) as locker}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div class="flex items-center">
							<span class="font-mono font-bold text-indigo-600 w-16">{locker.code}</span>
							<span class="font-medium">{(locker.item as any).name}</span>
							<span class="text-sm text-gray-500 ml-2">{(locker.item as any).item_code}</span>
						</div>
						<a href="/items/{(locker.item as any).id}" class="text-indigo-600 hover:text-indigo-800 text-sm">查看详情</a>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
