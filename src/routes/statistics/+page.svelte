<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		getSourceChannelDisplayName,
		getStatusDisplayName,
		getConversionStatusDisplayName
	} from '$lib/auth';

	interface Statistics {
		byChannel: Array<{
			channel: string;
			total: number;
			attended: number;
			converted: number;
		}>;
		byCourse: Array<{
			courseId: number;
			courseName: string;
			total: number;
			attended: number;
			noShow: number;
			converted: number;
		}>;
		byStatus: Array<{
			status: string;
			count: number;
		}>;
		byConversion: Array<{
			status: string;
			count: number;
		}>;
		missingFeedback: Array<{
			id: number;
			studentName: string;
			courseName: string;
			appointmentDate: string;
		}>;
	}

	let stats: Statistics | null = null;
	let loading = true;
	let activeTab = 'channel';

	onMount(async () => {
		const userRes = await fetch('/api/login');
		const userData = await userRes.json();

		if (!userData.user) {
			goto('/login');
			return;
		}

		const res = await fetch('/api/statistics');
		stats = await res.json();
		loading = false;
	});

	function getRate(num: number, total: number) {
		if (total === 0) return '0%';
		return `${((num / total) * 100).toFixed(1)}%`;
	}
</script>

<div class="max-w-7xl mx-auto px-4 py-6">
	<h1 class="text-2xl font-bold text-slate-800 mb-6">数据复盘</h1>

	{#if loading}
		<div class="text-center py-12 text-slate-500">加载中...</div>
	{:else if stats}
		<div class="space-y-6">
			<div class="grid grid-cols-4 gap-4">
				<div class="bg-white rounded-lg shadow p-6">
					<p class="text-sm text-slate-500">总预约数</p>
					<p class="text-3xl font-bold text-slate-800">
						{stats.byStatus.reduce((sum, s) => sum + s.count, 0)}
					</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<p class="text-sm text-slate-500">已到课</p>
					<p class="text-3xl font-bold text-green-600">
						{stats.byStatus.find((s) => s.status === 'completed')?.count || 0}
					</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<p class="text-sm text-slate-500">转化成功</p>
					<p class="text-3xl font-bold text-blue-600">
						{stats.byConversion.find((s) => s.status === 'converted')?.count || 0}
					</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<p class="text-sm text-slate-500">待回访</p>
					<p class="text-3xl font-bold text-orange-600">
						{stats.missingFeedback.length}
					</p>
				</div>
			</div>

			<div class="bg-white rounded-lg shadow">
				<div class="border-b border-slate-200">
					<nav class="flex space-x-8 px-6" aria-label="Tabs">
						{#each [
							{ id: 'channel', label: '渠道分析' },
							{ id: 'course', label: '课程分析' },
							{ id: 'status', label: '状态分布' },
							{ id: 'missing', label: '回访缺失' }
						] as tab}
							<button
								on:click={() => (activeTab = tab.id)}
								class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === tab.id
									? 'border-blue-500 text-blue-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
							>
								{tab.label}
							</button>
						{/each}
					</nav>
				</div>

				<div class="p-6">
					{#if activeTab === 'channel'}
						<div>
							<h3 class="text-lg font-medium text-slate-800 mb-4">按渠道统计</h3>
							<table class="min-w-full">
								<thead>
									<tr class="text-left text-sm text-slate-500">
										<th class="pb-3">渠道</th>
										<th class="pb-3">学员数</th>
										<th class="pb-3">到课数</th>
										<th class="pb-3">到课率</th>
										<th class="pb-3">转化数</th>
										<th class="pb-3">转化率</th>
									</tr>
								</thead>
								<tbody>
									{#each stats.byChannel as item}
										<tr class="border-t border-slate-100">
											<td class="py-3 font-medium text-slate-800">
												{getSourceChannelDisplayName(item.channel)}
											</td>
											<td class="py-3 text-slate-600">{item.total}</td>
											<td class="py-3 text-slate-600">{item.attended}</td>
											<td class="py-3 text-slate-600">{getRate(item.attended, item.total)}</td>
											<td class="py-3 text-slate-600">{item.converted}</td>
											<td class="py-3 text-slate-600">{getRate(item.converted, item.total)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else if activeTab === 'course'}
						<div>
							<h3 class="text-lg font-medium text-slate-800 mb-4">按课程统计</h3>
							<table class="min-w-full">
								<thead>
									<tr class="text-left text-sm text-slate-500">
										<th class="pb-3">课程</th>
										<th class="pb-3">预约数</th>
										<th class="pb-3">到课数</th>
										<th class="pb-3">爽约数</th>
										<th class="pb-3">转化数</th>
										<th class="pb-3">转化率</th>
									</tr>
								</thead>
								<tbody>
									{#each stats.byCourse as item}
										{#if item.total > 0}
											<tr class="border-t border-slate-100">
												<td class="py-3 font-medium text-slate-800">{item.courseName}</td>
												<td class="py-3 text-slate-600">{item.total}</td>
												<td class="py-3 text-slate-600">{item.attended}</td>
												<td class="py-3 text-slate-600">{item.noShow}</td>
												<td class="py-3 text-slate-600">{item.converted}</td>
												<td class="py-3 text-slate-600">
													{getRate(item.converted, item.attended)}
												</td>
											</tr>
										{/if}
									{/each}
								</tbody>
							</table>
						</div>
					{:else if activeTab === 'status'}
						<div class="grid grid-cols-2 gap-6">
							<div>
								<h3 class="text-lg font-medium text-slate-800 mb-4">预约状态分布</h3>
								<div class="space-y-3">
									{#each stats.byStatus as item}
										<div class="flex items-center">
											<span class="w-32 text-sm text-slate-600">
												{getStatusDisplayName(item.status)}
											</span>
											<div class="flex-1 bg-slate-100 rounded-full h-6 mx-3">
												<div
													class="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
													style="width: {Math.max((item.count / stats.byStatus.reduce((s, x) => s + x.count, 0)) * 100, 5)}%; min-width: 40px;"
												>
													<span class="text-xs text-white">{item.count}</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
							<div>
								<h3 class="text-lg font-medium text-slate-800 mb-4">转化状态分布</h3>
								<div class="space-y-3">
									{#each stats.byConversion as item}
										<div class="flex items-center">
											<span class="w-32 text-sm text-slate-600">
												{getConversionStatusDisplayName(item.status)}
											</span>
											<div class="flex-1 bg-slate-100 rounded-full h-6 mx-3">
												<div
													class="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
													style="width: {Math.max((item.count / stats.byConversion.reduce((s, x) => s + x.count, 0)) * 100, 5)}%; min-width: 40px;"
												>
													<span class="text-xs text-white">{item.count}</span>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{:else if activeTab === 'missing'}
						<div>
							<h3 class="text-lg font-medium text-slate-800 mb-4">回访意见缺失（需跟进）</h3>
							{#if stats.missingFeedback.length === 0}
								<p class="text-slate-500 text-center py-8">暂无缺失回访的记录</p>
							{:else}
								<table class="min-w-full">
									<thead>
										<tr class="text-left text-sm text-slate-500">
											<th class="pb-3">学员</th>
											<th class="pb-3">课程</th>
											<th class="pb-3">试听时间</th>
											<th class="pb-3">操作</th>
										</tr>
									</thead>
									<tbody>
										{#each stats.missingFeedback as item}
											<tr class="border-t border-slate-100">
												<td class="py-3 font-medium text-slate-800">
													{item.studentName}
												</td>
												<td class="py-3 text-slate-600">{item.courseName}</td>
												<td class="py-3 text-slate-600">
													{new Date(item.appointmentDate).toLocaleDateString('zh-CN')}
												</td>
												<td class="py-3">
													<a
														href="/appointments/{item.id}"
														class="text-blue-600 hover:text-blue-800 text-sm"
													>
														填写回访 →
													</a>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>