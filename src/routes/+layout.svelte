<script lang="ts">
	import { page } from '$app/stores';
	import { roleLabels } from '$lib/types';
	import type { UserInfo } from '$lib/types';
	import { onMount } from 'svelte';

	let users: UserInfo[] = [];
	let selectedUser: UserInfo | null = null;

	onMount(async () => {
		const res = await fetch('/api/users');
		users = await res.json();
		if (users.length > 0) {
			selectedUser = users[0];
		}
	});

	const navItems = [
		{ path: '/', label: '处方列表', icon: '📋' },
		{ path: '/new', label: '接收处方', icon: '➕' },
		{ path: '/archives', label: '异常归档', icon: '📦' }
	];
</script>

<div class="min-h-screen bg-gray-50">
	<header class="bg-white shadow-sm border-b">
		<div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<span class="text-2xl">💊</span>
					<h1 class="text-xl font-bold text-gray-900">处方流转审方系统</h1>
				</div>
				<div class="flex items-center space-x-4">
					<select
						class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						bind:value={selectedUser}
					>
						{#each users as user}
							<option value={user}>{user.name} - {roleLabels[user.role]}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</header>

	<nav class="bg-white border-b">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex space-x-8">
				{#each navItems as item}
					<a
						href={item.path}
						class="py-4 px-1 border-b-2 transition-colors {
							$page.url.pathname === item.path
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}"
					>
						<span class="mr-2">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</div>
		</div>
	</nav>

	<main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
		<slot />
	</main>
</div>

<style>
</style>
