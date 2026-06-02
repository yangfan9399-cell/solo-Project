<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { CLAIM_STATUS_LABELS, STATUS_LABELS, type ClaimWithJoined, type ActivityLogWithJoined, type ItemWithJoined } from '$lib/types';

	export let data: PageData;
	export let form: ActionData | undefined;

	let showRejectModal = false;
	let rejectReason = '';

	let showSignModal = false;
	let signReceiver = '';
	let signIdLast4 = '';
	let signVoucher = '';
	let signNotes = '';

	function openSignModal() {
		const claimantName = (data.claim as ClaimWithJoined).claimant_name || '';
		signReceiver = claimantName;
		signIdLast4 = '';
		signVoucher = '';
		signNotes = '';
		showSignModal = true;
	}

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
				<button on:click={openSignModal} class="btn btn-primary">领取签收</button>
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

			{#if data.claim.status === 'completed' && (data.claim.sign_receiver || data.claim.sign_id_last4 || data.claim.sign_voucher || data.claim.sign_notes)}
				<div class="card border-green-200 bg-green-50">
					<h3 class="text-lg font-semibold mb-4 text-green-800">签收信息</h3>
					<div class="grid grid-cols-2 gap-4">
						{#if data.claim.sign_receiver}
							<div>
								<p class="text-sm text-green-600">签收人</p>
								<p class="font-medium text-green-900">{data.claim.sign_receiver}</p>
							</div>
						{/if}
						{#if data.claim.sign_id_last4}
							<div>
								<p class="text-sm text-green-600">证件后四位</p>
								<p class="font-mono font-medium text-green-900">{data.claim.sign_id_last4}</p>
							</div>
						{/if}
						{#if data.claim.sign_voucher}
							<div>
								<p class="text-sm text-green-600">签收凭据</p>
								<p class="text-green-900">{data.claim.sign_voucher}</p>
							</div>
						{/if}
						{#if data.claim.sign_notes}
							<div>
								<p class="text-sm text-green-600">备注</p>
								<p class="text-green-900">{data.claim.sign_notes}</p>
							</div>
						{/if}
					</div>
					{#if data.claim.return_time}
						<div class="mt-3 pt-3 border-t border-green-200">
							<p class="text-sm text-green-600">签收时间</p>
							<p class="text-green-900">{new Date(data.claim.return_time).toLocaleString()}</p>
						</div>
					{/if}
				</div>
			{/if}

			{#if data.claim.status === 'approved'}
				<div class="card border-indigo-200 bg-indigo-50">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-lg font-semibold text-indigo-800">待签收</h3>
							<p class="text-sm text-indigo-600 mt-1">核验已通过，请确认签收人信息后完成领取</p>
						</div>
						<button on:click={openSignModal} class="btn btn-primary">录入签收</button>
					</div>
				</div>
			{/if}

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
										<p class="text-sm text-gray-500 whitespace-pre-line">{log.details}</p>
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

			<div class="card bg-gray-50">
				<h3 class="text-lg font-semibold mb-3">流程指引</h3>
				<div class="space-y-2 text-sm">
					<div class="flex items-center gap-2">
						<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold {data.claim.status === 'pending' ? 'bg-yellow-400 text-white' : 'bg-green-500 text-white'}">1</span>
						<span class={data.claim.status === 'pending' ? 'font-medium text-yellow-700' : 'text-gray-600'}>待审核</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold {data.claim.status === 'approved' ? 'bg-green-500 text-white' : ['rejected', 'cancelled'].includes(data.claim.status) ? 'bg-red-400 text-white' : 'bg-gray-300 text-white'}">2</span>
						<span class={data.claim.status === 'approved' ? 'font-medium text-green-700' : ['rejected', 'cancelled'].includes(data.claim.status) ? 'text-red-600' : 'text-gray-600'}>核验{data.claim.status === 'approved' ? '（已通过）' : data.claim.status === 'rejected' ? '（已拒绝）' : ''}</span>
					</div>
					<div class="flex items-center gap-2">
						<span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold {data.claim.status === 'completed' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-white'}">3</span>
						<span class={data.claim.status === 'completed' ? 'font-medium text-blue-700' : 'text-gray-600'}>签收领取{data.claim.status === 'completed' ? '（已完成）' : ''}</span>
					</div>
				</div>
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

	{#if showSignModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
				<h3 class="text-lg font-semibold mb-2">领取签收</h3>
				<p class="text-sm text-gray-500 mb-5">请录入签收人信息，确认后物品将标记为已归还。</p>

				<form method="POST" action="?/complete">
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								签收人姓名 <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="receiver"
								bind:value={signReceiver}
								class="form-input"
								placeholder="实际领取人姓名"
								required
							/>
							<p class="text-xs text-gray-400 mt-1">默认为失主姓名，可修改为代领人</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								证件后四位
							</label>
							<input
								type="text"
								name="idLast4"
								bind:value={signIdLast4}
								class="form-input"
								placeholder="如：X567"
								maxlength="4"
								pattern="[A-Za-z0-9]{0,4}"
							/>
							<p class="text-xs text-gray-400 mt-1">身份证/护照/驾驶证后四位，用于身份核验留痕</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								签收凭据
							</label>
							<input
								type="text"
								name="voucher"
								bind:value={signVoucher}
								class="form-input"
								placeholder="如：本人签字确认 / 委托书编号"
							/>
							<p class="text-xs text-gray-400 mt-1">签名文本、委托书编号或其他签收凭据</p>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">
								备注
							</label>
							<textarea
								name="notes"
								bind:value={signNotes}
								class="form-input"
								rows="2"
								placeholder="其他需要备注的信息..."
							></textarea>
						</div>
					</div>

					<div class="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
						确认签收后，物品状态将变更为「已归还」，保管柜将释放。此操作不可撤销。
					</div>

					<div class="flex gap-3 mt-5">
						<button type="button" on:click={() => showSignModal = false} class="btn btn-secondary flex-1">取消</button>
						<button type="submit" class="btn btn-primary flex-1">确认签收</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
