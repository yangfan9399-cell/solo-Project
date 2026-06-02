<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { CLAIM_STATUS_LABELS, STATUS_LABELS, type ClaimWithJoined, type ActivityLogWithJoined, type ItemWithJoined } from '$lib/types';

	export let data: PageData;
	export let form: ActionData | undefined;

	let showRejectModal = false;
	let rejectReason = '';

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending': case 'verifying': return 'bg-yellow-100 text-yellow-700';
			case 'approved': return 'bg-green-100 text-green-700';
			case 'rejected': case 'cancelled': return 'bg-red-100 text-red-700';
			case 'completed': return 'bg-blue-100 text-blue-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<a href="/claims" class="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">← 返回列表</a>
			<h1 class="text-2xl font-bold text-gray-900">申领详情 #{data.claim.id}</h1>
		</div>
		<div class="flex gap-2">
			{#if data.claim.status === 'pending'}
				<button on:click={() => showRejectModal = true} class="btn btn-danger">拒绝</button>
				<form method="POST" action="?/approve">
					<button type="submit" class="btn btn-success">通过核验</button>
				</form>
			{/if}
			{#if data.claim.status === 'approved'}
				<form method="POST" action="?/complete">
					<button type="submit" class="btn btn-primary">确认领取</button>
				</form>
			{/if}
		</div>
	</div>

	{#if form?.error}
		<div class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
			{form.error}
		</div>
	{/if}

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<div class="lg:col-span-2 space-y-6">
			<div class="card">
				<h2 class="text-lg font-semibold mb-4 flex items-center">
					申领状态
					<span class="ml-3 badge {getStatusColor(data.claim.status)}">
						{CLAIM_STATUS_LABELS[data.claim.status]}
					</span>
				</h2>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-500">申领时间</p>
						<p>{new Date(data.claim.claim_time).toLocaleString()}</p>
					</div>
					{#if data.claim.verification_time}
						<div>
							<p class="text-sm text-gray-500">核验时间</p>
							<p>{new Date(data.claim.verification_time).toLocaleString()}</p>
						</div>
					{/if}
					{#if data.claim.return_time}
						<div>
							<p class="text-sm text-gray-500">领取时间</p>
							<p>{new Date(data.claim.return_time).toLocaleString()}</p>
						</div>
					{/if}
				</div>

				{#if data.claim.rejection_reason}
					<div class="mt-4 pt-4 border-t">
						<p class="text-sm text-red-600 font-medium">拒绝原因</p>
						<p class="text-red-700 mt-1">{data.claim.rejection_reason}</p>
					</div>
				{/if}

				{#if data.claim.verification_notes}
					<div class="mt-4 pt-4 border-t">
						<p class="text-sm text-gray-500">核验备注</p>
						<p class="mt-1">{data.claim.verification_notes}</p>
					</div>
				{/if}
			</div>

			<div class="card">
				<h3 class="text-lg font-semibold mb-4">失主信息</h3>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-500">姓名</p>
						<p class="font-medium">{(data.claim as ClaimWithJoined).claimant_name}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">联系电话</p>
						<p>{(data.claim as ClaimWithJoined).claimant_phone}</p>
					</div>
				</div>
			</div>

			<div class="card">
				<h3 class="text-lg font-semibold mb-4">操作日志</h3>
				{#if data.activityLogs.length === 0}
					<p class="text-gray-500 text-center py-4">暂无操作记录</p>
				{:else}
					<div class="space-y-3">
						{#each data.activityLogs as log}
							<div class="flex items-start">
								<div class="w-2 h-2 mt-2 rounded-full bg-indigo-500 flex-shrink-0"></div>
								<div class="ml-3">
									<p class="text-sm">
										<span class="font-medium">{(log as ActivityLogWithJoined).user_name || '系统'}</span>
										<span class="text-gray-600"> · {log.action}</span>
									</p>
									{#if log.details}
										<p class="text-sm text-gray-500">{log.details}</p>
									{/if}
									<p class="text-xs text-gray-400 mt-1">{new Date(log.created_at).toLocaleString()}</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="space-y-6">
			<div class="card">
				<h3 class="text-lg font-semibold mb-4">物品信息</h3>
				{#if data.item}
					<div class="space-y-3">
						<div class="flex items-center">
							<span class="w-16 text-sm text-gray-500">名称</span>
							<span class="font-medium">{data.item.name}</span>
						</div>
						<div class="flex items-center">
							<span class="w-16 text-sm text-gray-500">编号</span>
							<span class="font-mono text-indigo-600">{data.item.item_code}</span>
						</div>
						<div class="flex items-center">
							<span class="w-16 text-sm text-gray-500">状态</span>
							<span class="badge bg-gray-100 text-gray-700">{STATUS_LABELS[data.item.status]}</span>
						</div>
						{#if (data.item as ItemWithJoined).locker_code}
							<div class="flex items-center">
								<span class="w-16 text-sm text-gray-500">保管柜</span>
								<span>{(data.item as ItemWithJoined).locker_code}</span>
							</div>
						{/if}
					</div>
					<div class="mt-4 pt-4 border-t">
						<a href="/items/{data.item.id}" class="text-indigo-600 hover:text-indigo-800 text-sm">查看物品详情 →</a>
					</div>
				{/if}
			</div>
		</div>
	</div>

	{#if showRejectModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 class="text-lg font-semibold mb-4">拒绝申领</h3>
				<form method="POST" action="?/reject">
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">拒绝原因</label>
						<textarea name="reason" bind:value={rejectReason} class="form-input" rows="3" placeholder="请填写拒绝原因..." required></textarea>
					</div>
					<div class="flex gap-3">
						<button type="button" on:click={() => showRejectModal = false} class="btn btn-secondary flex-1">取消</button>
						<button type="submit" class="btn btn-danger flex-1">确认拒绝</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
