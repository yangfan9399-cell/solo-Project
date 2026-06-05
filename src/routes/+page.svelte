<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getStatusDisplayName, getConversionStatusDisplayName } from '$lib/auth';
	import type { User, Appointment } from '$lib/db/schema';
	import NewAppointmentModal from '$lib/components/NewAppointmentModal.svelte';

	interface AppointmentData {
		appointment: Appointment;
		student: { name: string; phone: string };
		course: { name: string };
		teacher: { name: string } | null;
	}

	let user: User | null = null;
	let appointments: AppointmentData[] = [];
	let loading = true;
	let activeTab = 'all';
	let showNewAppointment = false;

	const tabs = [
		{ id: 'all', label: '全部预约' },
		{ id: 'pending_schedule', label: '待排课' },
		{ id: 'scheduled', label: '已排课' },
		{ id: 'completed', label: '已完成' },
		{ id: 'teacher_conflict', label: '老师冲突' },
		{ id: 'no_show', label: '学生爽约' }
	];

	$: filteredAppointments = activeTab === 'all'
		? appointments
		: appointments.filter((a) => a.appointment.status === activeTab);

	onMount(async () => {
		const userRes = await fetch('/api/login');
		const userData = await userRes.json();
		user = userData.user;

		if (!user) {
			goto('/login');
			return;
		}

		await loadAppointments();
		loading = false;
	});

	async function loadAppointments() {
		const res = await fetch('/api/appointments');
		appointments = await res.json();
	}

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			pending_booking: 'bg-yellow-100 text-yellow-800',
			pending_schedule: 'bg-blue-100 text-blue-800',
			scheduled: 'bg-green-100 text-green-800',
			teacher_conflict: 'bg-red-100 text-red-800',
			completed: 'bg-gray-100 text-gray-800',
			no_show: 'bg-orange-100 text-orange-800',
			cancelled: 'bg-gray-100 text-gray-500',
			rescheduled: 'bg-purple-100 text-purple-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function formatDate(date: Date | string | null) {
		if (!date) return '未安排';
		const d = new Date(date);
		return d.toLocaleString('zh-CN', {
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="max-w-7xl mx-auto px-4 py-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-slate-800">预约工作台</h1>
		{#if user?.role === 'consultant'}
			<button
				on:click={() => (showNewAppointment = true)}
				class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
			>
				新建预约
			</button>
		{/if}
	</div>

	<div class="bg-white rounded-lg shadow mb-6">
		<div class="border-b border-slate-200">
			<nav class="flex space-x-8 px-6" aria-label="Tabs">
				{#each tabs as tab}
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
	</div>

	{#if loading}
		<div class="text-center py-12 text-slate-500">加载中...</div>
	{:else if filteredAppointments.length === 0}
		<div class="text-center py-12 text-slate-500">暂无预约记录</div>
	{:else}
		<div class="bg-white rounded-lg shadow overflow-hidden">
			<table class="min-w-full divide-y divide-slate-200">
				<thead class="bg-slate-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">学员</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">课程</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">老师</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">预约时间</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">状态</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">操作</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-slate-200">
					{#each filteredAppointments as item}
						<tr>
							<td class="px-6 py-4">
								<div class="text-sm font-medium text-slate-900">{item.student.name}</div>
								<div class="text-sm text-slate-500">{item.student.phone}</div>
							</td>
							<td class="px-6 py-4 text-sm text-slate-900">{item.course.name}</td>
							<td class="px-6 py-4 text-sm text-slate-900">
								{item.teacher?.name || '未安排'}
							</td>
							<td class="px-6 py-4 text-sm text-slate-900">
								{formatDate(item.appointment.scheduledAt)}
							</td>
							<td class="px-6 py-4">
								<span
									class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(item.appointment.status)}"
								>
									{getStatusDisplayName(item.appointment.status)}
								</span>
							</td>
							<td class="px-6 py-4 text-sm">
								<a
									href="/appointments/{item.appointment.id}"
									class="text-blue-600 hover:text-blue-900"
								>
									查看详情
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

{#if showNewAppointment}
	<NewAppointmentModal on:close={() => (showNewAppointment = false)} on:success={() => {
		showNewAppointment = false;
		loadAppointments();
	}} />
{/if}