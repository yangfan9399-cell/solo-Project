<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		getSourceChannelDisplayName,
		getStatusDisplayName,
		getConversionStatusDisplayName
	} from '$lib/auth';

	interface AppointmentDetail {
		appointmentId: number;
		studentName: string;
		studentPhone: string;
		courseName: string;
		teacherName: string | null;
		appointmentStatus: string;
		conversionStatus: string | null;
		scheduledAt: string | null;
		consultantName: string | null;
		channel?: string;
		courseId?: number;
	}

	interface Statistics {
		summary: {
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
		};
		details: {
			byChannel: AppointmentDetail[];
			byCourse: AppointmentDetail[];
			byStatus: AppointmentDetail[];
			byConversion: AppointmentDetail[];
		};
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

	let drillDownType: string | null = null;
	let drillDownKey: string | null = null;
	let drillDownData: AppointmentDetail[] = [];

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

	function formatDate(date: string | null) {
		if (!date) return '-';
		return new Date(date).toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function drillDown(type: string, key: string | number) {
		if (!stats) return;

		drillDownType = type;
		drillDownKey = String(key);

		switch (type) {
			case 'channel':
				drillDownData = stats.details.byChannel.filter((d) => d.channel === key);
				break;
			case 'course':
				drillDownData = stats.details.byCourse.filter((d) => d.courseId === key);
				break;
			case 'status':
				drillDownData = stats.details.byStatus.filter((d) => d.appointmentStatus === key);
				break;
			case 'conversion':
				drillDownData = stats.details.byConversion.filter((d) => d.conversionStatus === key);
				break;
		}
	}

	function closeDrillDown() {
		drillDownType = null;
		drillDownKey = null;
		drillDownData = [];
	}

	function getDrillDownTitle() {
		if (!drillDownType || !drillDownKey) return '';

		switch (drillDownType) {
			case 'channel':
				return `渠道：${getSourceChannelDisplayName(drillDownKey)}`;
			case 'course':
				const course = stats?.summary.byCourse.find((c) => c.courseId === parseInt(drillDownKey));
				return `课程：${course?.courseName || drillDownKey}`;
			case 'status':
				return `状态：${getStatusDisplayName(drillDownKey)}`;
			case 'conversion':
				return `转化：${getConversionStatusDisplayName(drillDownKey)}`;
			default:
				return '';
		}
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
						{stats.summary.byStatus.reduce((sum, s) => sum + s.count, 0)}
					</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<p class="text-sm text-slate-500">已到课</p>
					<p class="text-3xl font-bold text-green-600">
						{stats.summary.byStatus.find((s) => s.status === 'completed')?.count || 0}
					</p>
				</div>
				<div class="bg-white rounded-lg shadow p-6">
					<p class="text-sm text-slate-500">转化成功</p>
					<p class="text-3xl font-bold text-blue-600">
						{stats.summary.byConversion.find((s) => s.status === 'converted')?.count || 0}
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
								on:click={() => {
									activeTab = tab.id;
									closeDrillDown();
								}}
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
					{#if drillDownType && drillDownData.length > 0}
						<div class="mb-6">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-lg font-medium text-slate-800">
									🔍 钻取详情 - {getDrillDownTitle()}
								</h3>
								<button
									on:click={closeDrillDown}
									class="text-sm text-slate-500 hover:text-slate-700"
								>
									✕ 关闭
								</button>
							</div>
							<div class="overflow-x-auto">
								<table class="min-w-full">
									<thead>
										<tr class="text-left text-sm text-slate-500 bg-slate-50">
											<th class="px-3 py-2">学员</th>
											<th class="px-3 py-2">课程</th>
											<th class="px-3 py-2">老师</th>
											<th class="px-3 py-2">预约时间</th>
											<th class="px-3 py-2">状态</th>
											<th class="px-3 py-2">转化</th>
											<th class="px-3 py-2">顾问</th>
											<th class="px-3 py-2">操作</th>
										</tr>
									</thead>
									<tbody>
										{#each drillDownData as item}
											<tr class="border-t border-slate-100 hover:bg-slate-50">
												<td class="px-3 py-2">
													<div class="font-medium text-slate-800">{item.studentName}</div>
													<div class="text-xs text-slate-500">{item.studentPhone}</div>
												</td>
												<td class="px-3 py-2 text-sm text-slate-600">{item.courseName}</td>
												<td class="px-3 py-2 text-sm text-slate-600">{item.teacherName || '-'}</td>
												<td class="px-3 py-2 text-sm text-slate-600">{formatDate(item.scheduledAt)}</td>
												<td class="px-3 py-2">
													<span class="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
														{getStatusDisplayName(item.appointmentStatus)}
													</span>
												</td>
												<td class="px-3 py-2">
													{#if item.conversionStatus}
														<span class="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">
															{getConversionStatusDisplayName(item.conversionStatus)}
														</span>
													{:else}
														<span class="text-xs text-slate-400">-</span>
													{/if}
												</td>
												<td class="px-3 py-2 text-sm text-slate-600">{item.consultantName || '-'}</td>
												<td class="px-3 py-2">
													<a
														href="/appointments/{item.appointmentId}"
														class="text-sm text-blue-600 hover:text-blue-800"
													>
														查看详情 →
													</a>
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
						</div>
					{/if}

					{#if activeTab === 'channel'}
						<div>
							<h3 class="text-lg font-medium text-slate-800 mb-4">按渠道统计
								<span class="text-sm font-normal text-slate-500 ml-2">（点击数字可钻取详情）</span>
							</h3>
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
									{#each stats.summary.byChannel as item}
										<tr class="border-t border-slate-100 hover:bg-slate-50">
											<td class="py-3 font-medium text-slate-800">
												{getSourceChannelDisplayName(item.channel)}
											</td>
											<td class="py-3">
												<button
													on:click={() => drillDown('channel', item.channel)}
													class="text-blue-600 hover:text-blue-800 hover:underline"
												>
													{item.total}
												</button>
											</td>
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
							<h3 class="text-lg font-medium text-slate-800 mb-4">按课程统计
								<span class="text-sm font-normal text-slate-500 ml-2">（点击数字可钻取详情）</span>
							</h3>
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
									{#each stats.summary.byCourse as item}
										{#if item.total > 0}
											<tr class="border-t border-slate-100 hover:bg-slate-50">
												<td class="py-3 font-medium text-slate-800">{item.courseName}</td>
												<td class="py-3">
													<button
														on:click={() => drillDown('course', item.courseId)}
														class="text-blue-600 hover:text-blue-800 hover:underline"
													>
														{item.total}
													</button>
												</td>
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
								<h3 class="text-lg font-medium text-slate-800 mb-4">预约状态分布
									<span class="text-sm font-normal text-slate-500 ml-2">（点击数字可钻取详情）</span>
								</h3>
								<div class="space-y-3">
									{#each stats.summary.byStatus as item}
										<div class="flex items-center">
											<span class="w-32 text-sm text-slate-600">
												{getStatusDisplayName(item.status)}
											</span>
											<button
												on:click={() => drillDown('status', item.status)}
												class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
											>
												{item.count}
											</button>
											<div class="flex-1 bg-slate-100 rounded-full h-6 mx-3">
												<div
													class="bg-blue-500 h-6 rounded-full"
													style="width: {Math.max((item.count / stats.summary.byStatus.reduce((s, x) => s + x.count, 0)) * 100, 5)}%;"
												/>
											</div>
										</div>
									{/each}
								</div>
							</div>
							<div>
								<h3 class="text-lg font-medium text-slate-800 mb-4">转化状态分布
									<span class="text-sm font-normal text-slate-500 ml-2">（点击数字可钻取详情）</span>
								</h3>
								<div class="space-y-3">
									{#each stats.summary.byConversion as item}
										<div class="flex items-center">
											<span class="w-32 text-sm text-slate-600">
												{getConversionStatusDisplayName(item.status)}
											</span>
											<button
												on:click={() => drillDown('conversion', item.status)}
												class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
											>
												{item.count}
											</button>
											<div class="flex-1 bg-slate-100 rounded-full h-6 mx-3">
												<div
													class="bg-green-500 h-6 rounded-full"
													style="width: {Math.max((item.count / stats.summary.byConversion.reduce((s, x) => s + x.count, 0)) * 100, 5)}%;"
												/>
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