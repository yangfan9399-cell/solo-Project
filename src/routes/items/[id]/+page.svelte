<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { CATEGORY_LABELS, STATUS_LABELS, type ActivityLogWithJoined, type ItemWithJoined } from '$lib/types';

	export let data: PageData;
	export let form: ActionData | undefined;

	let showStoreModal = false;
	let showExceptionModal = false;
	let showClaimModal = false;
	let selectedLockerId = '';
	let exceptionNote = '';
	let claimantName = '';
	let claimantPhone = '';
	let claimantIdType = '';
	let claimantIdNumber = '';

	function getStatusColor(status: string) {
		switch (status) {
			case 'storing': return 'bg-green-100 text-green-700';
			case 'found': case 'claimed': return 'bg-yellow-100 text-yellow-700';
			case 'returned': return 'bg-blue-100 text-blue-700';
			case 'disposed': return 'bg-gray-100 text-gray-700';
			case 'exception': return 'bg-red-100 text-red-700';
			default: return 'bg-gray-100 text-gray-700';
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<a href="/items" class="text-indigo-600 hover:text-indigo-800 text-sm mb-2 inline-block">← 返回列表</a>
			<h1 class="text-2xl font-bold text-gray-900">物品详情</h1>
		</div>
		<div class="flex gap-2">
			{#if data.item.status === 'found'}
				<button on:click={() => showStoreModal = true} class="btn btn-success">存入保管柜</button>
			{/if}
			{#if data.item.status === 'storing'}
				<button on:click={() => showClaimModal = true} class="btn btn-primary">登记申领</button>
			{/if}
			{#if !['returned', 'disposed'].includes(data.item.status)}
				<button on:click={() => showExceptionModal = true} class="btn btn-warning">标记异常</button>
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
					<span class="text-gray-900">{data.item.name}</span>
					<span class="ml-3 badge {getStatusColor(data.item.status)}">
						{STATUS_LABELS[data.item.status]}
					</span>
				</h2>
				
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-500">物品编号</p>
						<p class="font-mono text-indigo-600">{data.item.item_code}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">分类</p>
						<p>{CATEGORY_LABELS[data.item.category]}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">颜色</p>
						<p>{data.item.color || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">特征描述</p>
						<p>{data.item.distinguishing_features || '-'}</p>
					</div>
				</div>

				{#if data.item.description}
					<div class="mt-4 pt-4 border-t">
						<p class="text-sm text-gray-500">详细描述</p>
						<p class="mt-1">{data.item.description}</p>
					</div>
				{/if}
			</div>

			<div class="card">
				<h3 class="text-lg font-semibold mb-4">拾获信息</h3>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-sm text-gray-500">拾获影厅</p>
						<p>{(data.item as any).hall_name || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">具体位置</p>
						<p>{data.item.found_location || '-'}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">拾获时间</p>
						<p>{new Date(data.item.found_time).toLocaleString()}</p>
					</div>
					<div>
						<p class="text-sm text-gray-500">拾获人</p>
						<p>{(data.item as any).finder_name || '-'}</p>
					</div>
				</div>
			</div>

			{#if data.item.locker_id}
				<div class="card">
					<h3 class="text-lg font-semibold mb-4">保管信息</h3>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<p class="text-sm text-gray-500">保管柜</p>
							<p class="font-semibold">{(data.item as ItemWithJoined).locker_code} ({(data.item as ItemWithJoined).locker_area})</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">入库时间</p>
							<p>{data.item.stored_at ? new Date(data.item.stored_at).toLocaleString() : '-'}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">入库人</p>
							<p>{(data.item as ItemWithJoined).stored_by_name || '-'}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">保管到期</p>
							<p class={new Date(data.item.disposal_due_date!) < new Date() ? 'text-red-600 font-semibold' : ''}>
								{data.item.disposal_due_date ? new Date(data.item.disposal_due_date).toLocaleDateString() : '-'}
							</p>
						</div>
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
			<div class="card bg-indigo-50">
				<h3 class="text-lg font-semibold mb-3">快捷操作</h3>
				<div class="space-y-2">
					<a href="/items" class="block px-4 py-2 bg-white rounded hover:bg-gray-50">查看所有物品</a>
					<a href="/items/new" class="block px-4 py-2 bg-white rounded hover:bg-gray-50">登记新物品</a>
					<a href="/lockers" class="block px-4 py-2 bg-white rounded hover:bg-gray-50">查看保管柜</a>
				</div>
			</div>

			{#if data.item.exception_note}
				<div class="card bg-red-50 border-red-200">
					<h3 class="text-lg font-semibold mb-2 text-red-700">异常备注</h3>
					<p class="text-red-600">{data.item.exception_note}</p>
				</div>
			{/if}
		</div>
	</div>

	{#if showStoreModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 class="text-lg font-semibold mb-4">存入保管柜</h3>
				<form method="POST" action="?/store">
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">选择保管柜</label>
						<select name="lockerId" bind:value={selectedLockerId} class="form-select" required>
							<option value="">请选择保管柜</option>
							{#each data.availableLockers as locker}
								<option value={locker.id}>{locker.code} ({locker.area})</option>
							{/each}
						</select>
					</div>
					<div class="flex gap-3">
						<button type="button" on:click={() => showStoreModal = false} class="btn btn-secondary flex-1">取消</button>
						<button type="submit" class="btn btn-success flex-1">确认存入</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showExceptionModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-full max-w-md">
				<h3 class="text-lg font-semibold mb-4">标记异常</h3>
				<form method="POST" action="?/setException">
					<div class="mb-4">
						<label class="block text-sm font-medium text-gray-700 mb-1">异常说明</label>
						<textarea name="note" bind:value={exceptionNote} class="form-input" rows="3" placeholder="请描述异常情况..." required></textarea>
					</div>
					<div class="flex gap-3">
						<button type="button" on:click={() => showExceptionModal = false} class="btn btn-secondary flex-1">取消</button>
						<button type="submit" class="btn btn-warning flex-1">确认标记</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	{#if showClaimModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div class="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
				<h3 class="text-lg font-semibold mb-4">登记申领</h3>
				<form method="POST" action="?/createClaim">
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">失主姓名 *</label>
							<input type="text" name="claimantName" bind:value={claimantName} class="form-input" required />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">联系电话 *</label>
							<input type="tel" name="claimantPhone" bind:value={claimantPhone} class="form-input" required />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">证件类型</label>
							<select name="claimantIdType" bind:value={claimantIdType} class="form-select">
								<option value="">请选择</option>
								<option value="id_card">身份证</option>
								<option value="passport">护照</option>
								<option value="driver_license">驾驶证</option>
							</select>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">证件号码</label>
							<input type="text" name="claimantIdNumber" bind:value={claimantIdNumber} class="form-input" />
						</div>
					</div>
					<div class="flex gap-3 mt-6">
						<button type="button" on:click={() => showClaimModal = false} class="btn btn-secondary flex-1">取消</button>
						<button type="submit" class="btn btn-primary flex-1">提交申领</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</div>
