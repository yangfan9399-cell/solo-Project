<script lang="ts">
	import { goto } from '$app/navigation';

	let email = 'consultant@example.com';
	let password = 'password123';
	let error = '';
	let loading = false;

	async function login() {
		error = '';
		loading = true;

		try {
			const res = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await res.json();

			if (res.ok) {
				goto('/');
			} else {
				error = data.error;
			}
		} catch (e) {
			error = '登录失败，请重试';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
	<div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
		<h1 class="text-2xl font-bold text-center text-slate-800 mb-8">试听课预约与转化回访系统</h1>

		{#if error}
			<div class="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>
		{/if}

		<form on:submit|preventDefault={login} class="space-y-4">
			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1">邮箱</label>
				<input
					type="email"
					bind:value={email}
					class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="请输入邮箱"
					required
				/>
			</div>

			<div>
				<label class="block text-sm font-medium text-slate-700 mb-1">密码</label>
				<input
					type="password"
					bind:value={password}
					class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
					placeholder="请输入密码"
					required
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{loading ? '登录中...' : '登录'}
			</button>
		</form>

		<div class="mt-6 text-sm text-slate-500 space-y-1">
			<p class="font-medium text-slate-600">测试账号：</p>
			<p>顾问：consultant@example.com / password123</p>
			<p>教务：admin@example.com / password123</p>
			<p>主管：supervisor@example.com / password123</p>
		</div>
	</div>
</div>

<style>
	form {
		font-family: system-ui, -apple-system, sans-serif;
	}
</style>