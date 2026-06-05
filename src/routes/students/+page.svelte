<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getSourceChannelDisplayName } from '$lib/auth';

	interface Student {
		student: {
			id: number;
			name: string;
			phone: string;
			age?: number;
			sourceChannel: string;
			createdAt: string;
		};
		consultant: {
			name: string;
		};
	}

	let students: Student[] = [];
	let loading = true;

	onMount(async () => {
		const userRes = await fetch('/api/login');
		const userData = await userRes.json();

		if (!userData.user) {
			goto('/login');
			return;
		}

		const res = await fetch('/api/students');
		students = await res.json();
		loading = false;
	});
</script>

<div class="max-w-7xl mx-auto px-4 py-6">
	<h1 class="text-2xl font-bold text-slate-800 mb-6">学员管理</h1>

	{#if loading}
		<div class="text-center py-12 text-slate-500">加载中...</div>
	{:else if students.length === 0}
		<div class="text-center py-12 text-slate-500">暂无学员数据</div>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-slate-200">
				<thead class="bg-slate-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">学员</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">年龄</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">来源渠道</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">顾问</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">添加时间</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-slate-200">
					{#each students as item}
						<tr class="hover:bg-slate-50">
							<td class="px-6 py-4">
								<div class="text-sm font-medium text-slate-900">{item.student.name}</div>
								<div class="text-sm text-slate-500">{item.student.phone}</div>
							</td>
							<td class="px-6 py-4 text-sm text-slate-900">
								{item.student.age ? `${item.student.age}岁` : '-'}
							</td>
							<td class="px-6 py-4 text-sm text-slate-900">
								{getSourceChannelDisplayName(item.student.sourceChannel)}
							</td>
							<td class="px-6 py-4 text-sm text-slate-900">
								{item.consultant?.name || '-'}
							</td>
							<td class="px-6 py-4 text-sm text-slate-500">
								{new Date(item.student.createdAt).toLocaleDateString('zh-CN')}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>