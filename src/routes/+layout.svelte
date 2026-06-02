<script lang="ts">
	import { page } from '$app/stores';
	import '$lib/app.css';
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="bg-indigo-600 text-white shadow-lg">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center">
					<svg class="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
					<span class="text-xl font-bold">影院遗失物管理系统</span>
				</div>
				<div class="flex items-center space-x-4">
					<span class="text-sm opacity-80">当前用户：张经理</span>
				</div>
			</div>
		</div>
	</nav>

	<div class="flex">
		<aside class="w-64 bg-white shadow-md min-h-screen">
			<nav class="mt-5 px-2">
				<a href="/" class="group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" class:active={$page.url.pathname === '/'}>
					<svg class="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					控制台
				</a>
				<a href="/items" class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" class:active={$page.url.pathname.startsWith('/items')}>
					<svg class="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
					</svg>
					物品管理
				</a>
				<a href="/items/new" class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" class:active={$page.url.pathname === '/items/new'}>
					<svg class="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					拾物登记
				</a>
				<a href="/claims" class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" class:active={$page.url.pathname.startsWith('/claims')}>
					<svg class="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
					申领管理
				</a>
				<a href="/lockers" class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" class:active={$page.url.pathname === '/lockers'}>
					<svg class="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
					</svg>
					保管柜看板
				</a>
				<a href="/overdue" class="mt-1 group flex items-center px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-indigo-50 hover:text-indigo-600" class:active={$page.url.pathname === '/overdue'}>
					<svg class="mr-4 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					超期处理
				</a>
			</nav>
		</aside>

		<main class="flex-1 p-6">
			<slot />
		</main>
	</div>
</div>

<style>
	.active {
		background-color: rgb(238 242 255);
		color: rgb(79 70 229);
	}
</style>
