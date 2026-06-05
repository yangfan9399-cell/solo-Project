<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getRoleDisplayName } from '$lib/auth';
	import type { User } from '$lib/db/schema';

	let user: User | null = null;

	onMount(async () => {
		const res = await fetch('/api/login');
		const data = await res.json();
		user = data.user;

		if (!$page.url.pathname.startsWith('/login') && !user) {
			goto('/login');
		}
	});

	async function logout() {
		await fetch('/api/login', { method: 'DELETE' });
		user = null;
		goto('/login');
	}

	$: isLoginPage = $page.url.pathname === '/login';
</script>

<svelte:head>
	<title>试听课预约与转化回访系统</title>
</svelte:head>

{#if !isLoginPage}
	<nav class="bg-slate-800 text-white">
		<div class="max-w-7xl mx-auto px-4">
			<div class="flex items-center justify-between h-16">
				<div class="flex items-center space-x-8">
					<span class="text-xl font-bold">教育CRM</span>
					{#if user}
						<a href="/" class="hover:text-slate-300">工作台</a>
						<a href="/students" class="hover:text-slate-300">学员管理</a>
						<a href="/statistics" class="hover:text-slate-300">数据复盘</a>
					{/if}
				</div>
				{#if user}
					<div class="flex items-center space-x-4">
						<span class="text-sm text-slate-300">
							{user.name} ({getRoleDisplayName(user.role)})
						</span>
						<button
							on:click={logout}
							class="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded text-sm"
						>
							退出
						</button>
					</div>
				{/if}
			</div>
		</div>
	</nav>
{/if}

<main class={isLoginPage ? '' : 'bg-slate-100 min-h-screen'}>
	<slot />
</main>

<style>
	main {
		font-family: system-ui, -apple-system, sans-serif;
	}
</style>