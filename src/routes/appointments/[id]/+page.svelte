<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		getStatusDisplayName,
		getConversionStatusDisplayName,
		getSourceChannelDisplayName
	} from '$lib/auth';
	import type { User, Appointment, FollowUp, AppointmentChange } from '$lib/db/schema';

	interface AppointmentDetail {
		appointment: Appointment;
		student: { name: string; phone: string; age?: number; parentName?: string; sourceChannel: string; sourceNote?: string };
		course: { name: string; duration?: number; description?: string };
		teacher: { name: string; specialties?: string[] } | null;
		consultant: { name: string };
		changes: Array<{
			change: AppointmentChange;
			changedBy: { name: string };
		}>;
		followUps: Array<{
			followUp: FollowUp;
			consultant: { name: string };
			supervisor: { name: string } | null;
		}>;
	}

	interface Teacher {
		id: number;
		name: string;
		specialties: string[];
	}

	let user: User | null = null;
	let detail: AppointmentDetail | null = null;
	let teachers: Teacher[] = [];
	let loading = true;
	let showReschedule = false;
	let showFollowUp = false;
	let showSchedule = false;
	let showReview = false;
	let conflictInfo: any = null;

	let newTeacherId = '';
	let newScheduledAt = '';
	let rescheduleReason = '';

	let followUpContent = '';
	let followUpFeedback = '';
	let followUpInterest = 3;
	let followUpSuggestion = '';

	let reviewStatus = '';
	let reviewNote = '';

	let scheduleTeacherId = '';
	let scheduleScheduledAt = '';

	$: appointmentId = $page.params.id;

	onMount(async () => {
		const userRes = await fetch('/api/login');
		const userData = await userRes.json();
		user = userData.user;

		if (!user) {
			goto('/login');
			return;
		}

		const [detailRes, teachersRes] = await Promise.all([
			fetch(`/api/appointments/${appointmentId}`),
			fetch('/api/teachers')
		]);

		detail = await detailRes.json();
		teachers = await teachersRes.json();
		loading = false;
	});

	async function submitSchedule() {
		if (!scheduleTeacherId || !scheduleScheduledAt) return;

		const res = await fetch(`/api/appointments/${appointmentId}/schedule`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				teacherId: parseInt(scheduleTeacherId),
				scheduledAt: scheduleScheduledAt
			})
		});

		const data = await res.json();

		if (res.status === 409) {
			conflictInfo = data;
		} else if (res.ok) {
			showSchedule = false;
			await reloadDetail();
		}
	}

	async function submitReschedule() {
		if (!newTeacherId || !newScheduledAt) return;

		const res = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				teacherId: parseInt(newTeacherId),
				scheduledAt: newScheduledAt,
				reason: rescheduleReason
			})
		});

		if (res.ok) {
			const newAppt = await res.json();
			goto(`/appointments/${newAppt.id}`);
		}
	}

	async function submitFollowUp() {
		if (!detail?.followUps[0]) return;

		const res = await fetch(`/api/followups/${detail.followUps[0].followUp.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: followUpContent,
				studentFeedback: followUpFeedback,
				interestLevel: followUpInterest,
				conversionSuggestion: followUpSuggestion
			})
		});

		if (res.ok) {
			showFollowUp = false;
			await reloadDetail();
		}
	}

	async function submitReview() {
		if (!detail?.followUps[0] || !reviewStatus) return;

		const res = await fetch(`/api/followups/${detail.followUps[0].followUp.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				conversionStatus: reviewStatus,
				supervisorNote: reviewNote
			})
		});

		if (res.ok) {
			showReview = false;
			await reloadDetail();
		}
	}

	async function reloadDetail() {
		const res = await fetch(`/api/appointments/${appointmentId}`);
		detail = await res.json();
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

	function getConversionColor(status: string) {
		const colors: Record<string, string> = {
			pending_review: 'bg-yellow-100 text-yellow-800',
			converted: 'bg-green-100 text-green-800',
			not_converted: 'bg-gray-100 text-gray-800',
			returned: 'bg-red-100 text-red-800'
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	}

	function formatDate(date: Date | string | null) {
		if (!date) return '未安排';
		const d = new Date(date);
		return d.toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	$: if (detail?.followUps[0]) {
		const fu = detail.followUps[0].followUp;
		followUpContent = fu.content || '';
		followUpFeedback = fu.studentFeedback || '';
		followUpInterest = fu.interestLevel || 3;
		followUpSuggestion = fu.conversionSuggestion || '';
	}
</script>

<div class="max-w-6xl mx-auto px-4 py-6">
	<div class="mb-6">
		<a href="/" class="text-blue-600 hover:text-blue-800 text-sm">← 返回工作台</a>
	</div>

	{#if loading}
		<div class="text-center py-12 text-slate-500">加载中...</div>
	{:else if detail}
		<div class="grid grid-cols-3 gap-6">
			<div class="col-span-2 space-y-6">
				<div class="bg-white rounded-lg shadow p-6">
					<div class="flex items-start justify-between">
						<div>
							<h1 class="text-xl font-bold text-slate-800 mb-2">
								{detail.student.name} - {detail.course.name}
							</h1>
							<div class="flex items-center space-x-3">
								<span
									class="px-3 py-1 text-sm font-medium rounded-full {getStatusColor(detail.appointment.status)}"
								>
									{getStatusDisplayName(detail.appointment.status)}
								</span>
								{#if detail.followUps[0]}
									<span
										class="px-3 py-1 text-sm font-medium rounded-full {getConversionColor(detail.followUps[0].followUp.conversionStatus)}"
									>
										{getConversionStatusDisplayName(detail.followUps[0].followUp.conversionStatus)}
									</span>
								{/if}
							</div>
						</div>
						<div class="flex space-x-2">
							{#if user?.role === 'consultant' && detail.appointment.status !== 'rescheduled'}
								<button
									on:click={() => (showReschedule = true)}
									class="px-3 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
								>
									改期
								</button>
							{/if}
							{#if user?.role === 'admin' && (detail.appointment.status === 'pending_schedule' || detail.appointment.status === 'teacher_conflict')}
								<button
									on:click={() => (showSchedule = true)}
									class="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
								>
									确认排课
								</button>
							{/if}
							{#if user?.role === 'consultant' && detail.appointment.status === 'completed'}
								<button
									on:click={() => (showFollowUp = true)}
									class="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
								>
									{detail.followUps[0]?.followUp.content ? '编辑回访' : '填写回访'}
								</button>
							{/if}
							{#if user?.role === 'supervisor' && detail.followUps[0]?.followUp.conversionStatus === 'pending_review' && detail.followUps[0]?.followUp.content}
								<button
									on:click={() => (showReview = true)}
									class="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
								>
									复核转化
								</button>
							{/if}
						</div>
					</div>
				</div>

				{#if detail.appointment.status === 'teacher_conflict'}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4">
						<div class="flex items-start">
							<span class="text-red-500 mr-3">⚠️</span>
							<div>
								<h3 class="font-medium text-red-800">老师时间冲突</h3>
								<p class="text-sm text-red-700 mt-1">{detail.appointment.notes || '请联系教务调整排课或更换老师'}</p>
								{#if user?.role === 'consultant'}
									<button
										on:click={() => (showReschedule = true)}
										class="mt-3 text-sm text-red-700 underline hover:text-red-900"
									>
										立即改期或更换老师
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">学员信息</h2>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<span class="text-sm text-slate-500">学员姓名</span>
							<p class="font-medium">{detail.student.name}</p>
						</div>
						<div>
							<span class="text-sm text-slate-500">联系电话</span>
							<p class="font-medium">{detail.student.phone}</p>
						</div>
						{#if detail.student.age}
							<div>
								<span class="text-sm text-slate-500">年龄</span>
								<p class="font-medium">{detail.student.age}岁</p>
							</div>
						{/if}
						{#if detail.student.parentName}
							<div>
								<span class="text-sm text-slate-500">家长姓名</span>
								<p class="font-medium">{detail.student.parentName}</p>
							</div>
						{/if}
						<div>
							<span class="text-sm text-slate-500">来源渠道</span>
							<p class="font-medium">{getSourceChannelDisplayName(detail.student.sourceChannel)}</p>
						</div>
						{#if detail.student.sourceNote}
							<div class="col-span-2">
								<span class="text-sm text-slate-500">来源备注</span>
								<p class="font-medium">{detail.student.sourceNote}</p>
							</div>
						{/if}
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">课程与老师</h2>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<span class="text-sm text-slate-500">课程名称</span>
							<p class="font-medium">{detail.course.name}</p>
						</div>
						<div>
							<span class="text-sm text-slate-500">授课老师</span>
							<p class="font-medium">{detail.teacher?.name || '待安排'}</p>
						</div>
						<div>
							<span class="text-sm text-slate-500">课程时长</span>
							<p class="font-medium">{detail.course.duration || detail.appointment.duration}分钟</p>
						</div>
						<div>
							<span class="text-sm text-slate-500">预约时间</span>
							<p class="font-medium">{formatDate(detail.appointment.scheduledAt)}</p>
						</div>
					</div>
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">回访记录</h2>
					{#if detail.followUps.length === 0 || !detail.followUps[0]?.followUp.content}
						<div class="text-center py-8 text-slate-500">
							{#if detail.appointment.status === 'completed'}
								暂无回访记录，请填写回访意见
							{:else}
								待试听完成后填写回访
							{/if}
						</div>
					{:else}
						{#each detail.followUps as item}
							<div class="border-b border-slate-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
								<div class="flex items-center justify-between mb-2">
									<span class="text-sm text-slate-500">
										回访顾问：{item.consultant.name}
									</span>
									<span class="text-sm text-slate-500">
										{formatDate(item.followUp.createdAt)}
									</span>
								</div>
								<div class="space-y-2">
									{#if item.followUp.content}
										<p class="text-sm"><span class="text-slate-500">回访内容：</span>{item.followUp.content}</p>
									{/if}
									{#if item.followUp.studentFeedback}
										<p class="text-sm"><span class="text-slate-500">学员反馈：</span>{item.followUp.studentFeedback}</p>
									{/if}
									{#if item.followUp.interestLevel}
										<p class="text-sm">
											<span class="text-slate-500">兴趣度：</span>
											{#each Array(5) as _, i}
												<span class={i < item.followUp.interestLevel! ? 'text-yellow-500' : 'text-gray-300'}>★</span>
											{/each}
										</p>
									{/if}
									{#if item.followUp.conversionSuggestion}
										<p class="text-sm"><span class="text-slate-500">转化建议：</span>{item.followUp.conversionSuggestion}</p>
									{/if}
								</div>
								{#if item.followUp.supervisorNote || item.supervisor}
									<div class="mt-3 p-3 bg-purple-50 rounded">
										<div class="flex items-center justify-between mb-1">
											<span class="text-sm font-medium text-purple-700">主管复核</span>
											<span
												class="px-2 py-0.5 text-xs font-medium rounded {getConversionColor(item.followUp.conversionStatus)}"
											>
												{getConversionStatusDisplayName(item.followUp.conversionStatus)}
											</span>
										</div>
										{#if item.supervisor}
											<p class="text-xs text-purple-600">复核人：{item.supervisor.name}</p>
										{/if}
										{#if item.followUp.supervisorNote}
											<p class="text-sm text-purple-800 mt-1">{item.followUp.supervisorNote}</p>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>

				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">预约变更记录</h2>
					{#if detail.changes.length === 0}
						<div class="text-center py-8 text-slate-500">暂无变更记录</div>
					{:else}
						<div class="space-y-4">
							{#each detail.changes as item}
								<div class="flex items-start">
									<div class="flex-shrink-0 w-2 h-2 mt-2 bg-slate-300 rounded-full"></div>
									<div class="ml-3 flex-1">
										<div class="flex items-center justify-between">
											<span class="text-sm font-medium text-slate-700">
												{item.changeType === 'reschedule' ? '改期' : item.changeType === 'schedule_confirmed' ? '排课确认' : item.changeType === 'conflict_detected' ? '冲突检测' : '更新'}
											</span>
											<span class="text-xs text-slate-500">{formatDate(item.change.createdAt)}</span>
										</div>
										<p class="text-xs text-slate-500">操作人：{item.changedBy?.name}</p>
										{#if item.change.reason}
											<p class="text-sm text-slate-600 mt-1">{item.change.reason}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-6">
				<div class="bg-white rounded-lg shadow p-6">
					<h2 class="text-lg font-medium text-slate-800 mb-4">责任人</h2>
					<div class="flex items-center">
						<div class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
							<span class="text-slate-600 font-medium">{detail.consultant.name.charAt(0)}</span>
						</div>
						<div class="ml-3">
							<p class="font-medium text-slate-800">{detail.consultant.name}</p>
							<p class="text-sm text-slate-500">招生顾问</p>
						</div>
					</div>
				</div>

				{#if detail.appointment.notes}
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-lg font-medium text-slate-800 mb-4">备注</h2>
						<p class="text-sm text-slate-600">{detail.appointment.notes}</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if showSchedule}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-md">
			<div class="px-6 py-4 border-b border-slate-200">
				<h3 class="text-lg font-medium text-slate-900">确认排课</h3>
			</div>

			{#if conflictInfo}
				<div class="px-6 py-4">
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
						<h4 class="font-medium text-red-800 mb-2">⚠️ 老师时间冲突</h4>
						<p class="text-sm text-red-700">{conflictInfo.message}</p>
						{#if conflictInfo.alternativeTeachers?.length > 0}
							<div class="mt-3">
								<p class="text-sm font-medium text-red-700">推荐替代老师：</p>
								<ul class="mt-1 space-y-1">
									{#each conflictInfo.alternativeTeachers as t}
										<li class="text-sm text-red-600">• {t.name} ({t.specialties?.join(', ')})</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
					<button
						on:click={() => (conflictInfo = null)}
						class="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
					>
						重新选择
					</button>
				</div>
			{:else}
				<div class="px-6 py-4 space-y-4">
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">选择老师</label>
						<select
							bind:value={scheduleTeacherId}
							class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						>
							<option value="">请选择老师</option>
							{#each teachers as teacher}
								<option value={teacher.id}>{teacher.name} ({teacher.specialties?.join(', ')})</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-slate-700 mb-1">上课时间</label>
						<input
							type="datetime-local"
							bind:value={scheduleScheduledAt}
							class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						/>
					</div>
				</div>
				<div class="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
					<button
						on:click={() => (showSchedule = false)}
						class="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
					>
						取消
					</button>
					<button
						on:click={submitSchedule}
						disabled={!scheduleTeacherId || !scheduleScheduledAt}
						class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
					>
						确认排课
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}

{#if showReschedule}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-md">
			<div class="px-6 py-4 border-b border-slate-200">
				<h3 class="text-lg font-medium text-slate-900">改期预约</h3>
			</div>
			<div class="px-6 py-4 space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">选择老师</label>
					<select
						bind:value={newTeacherId}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
					>
						<option value="">请选择老师</option>
						{#each teachers as teacher}
							<option value={teacher.id}>{teacher.name} ({teacher.specialties?.join(', ')})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">新时间</label>
					<input
						type="datetime-local"
						bind:value={newScheduledAt}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">改期原因</label>
					<textarea
						bind:value={rescheduleReason}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						rows="2"
						placeholder="请说明改期原因..."
					/>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
				<button
					on:click={() => (showReschedule = false)}
					class="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
				>
					取消
				</button>
				<button
					on:click={submitReschedule}
					disabled={!newTeacherId || !newScheduledAt}
					class="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
				>
					确认改期
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showFollowUp}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
			<div class="px-6 py-4 border-b border-slate-200">
				<h3 class="text-lg font-medium text-slate-900">填写回访记录</h3>
			</div>
			<div class="px-6 py-4 space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">回访内容</label>
					<textarea
						bind:value={followUpContent}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						rows="3"
						placeholder="请记录回访沟通内容..."
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">学员反馈</label>
					<textarea
						bind:value={followUpFeedback}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						rows="2"
						placeholder="学员对课程的反馈意见..."
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-2">学员兴趣度</label>
					<div class="flex space-x-2">
						{#each [1, 2, 3, 4, 5] as star}
							<button
								type="button"
								on:click={() => (followUpInterest = star)}
								class="text-2xl focus:outline-none"
								class:text-yellow-500={star <= followUpInterest}
								class:text-gray-300={star > followUpInterest}
							>
								★
							</button>
						{/each}
					</div>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">转化建议</label>
					<textarea
						bind:value={followUpSuggestion}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						rows="2"
						placeholder="针对转化的建议..."
					/>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
				<button
					on:click={() => (showFollowUp = false)}
					class="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
				>
					取消
				</button>
				<button
					on:click={submitFollowUp}
					disabled={!followUpContent}
					class="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
				>
					保存
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showReview}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-white rounded-lg shadow-xl w-full max-w-md">
			<div class="px-6 py-4 border-b border-slate-200">
				<h3 class="text-lg font-medium text-slate-900">复核转化结论</h3>
			</div>
			<div class="px-6 py-4 space-y-4">
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">转化状态</label>
					<select
						bind:value={reviewStatus}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
					>
						<option value="">请选择</option>
						<option value="converted">转化成功</option>
						<option value="not_converted">未转化</option>
						<option value="returned">退回重跟进</option>
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700 mb-1">复核意见</label>
					<textarea
						bind:value={reviewNote}
						class="w-full px-3 py-2 border border-slate-300 rounded text-sm"
						rows="3"
						placeholder="请输入复核意见..."
					/>
				</div>
			</div>
			<div class="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
				<button
					on:click={() => (showReview = false)}
					class="px-4 py-2 border border-slate-300 rounded text-sm hover:bg-slate-50"
				>
					取消
				</button>
				<button
					on:click={submitReview}
					disabled={!reviewStatus}
					class="px-4 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
				>
					确认复核
				</button>
			</div>
		</div>
	</div>
{/if}