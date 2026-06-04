<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PrescriptionDetail } from '$lib/types';
	import { statusLabels, statusColors, sourceLabels, reviewResultLabels, roleLabels } from '$lib/types';
	import type { ReviewResult, PrescriptionStatus } from '@prisma/client';
	import { currentUser } from '$lib/stores/user';

	let prescription: PrescriptionDetail | null = null;
	let loading = true;
	let reloading = false;
	let showReviewModal = false;
	let showPickupModal = false;
	let showSupplementaryModal = false;
	let showArchiveModal = false;
	let error = '';
	let successMessage = '';

	let reviewResult: ReviewResult = 'APPROVED';
	let reviewComments = '';
	let dosageSuggestion = '';

	let verifierName = '';
	let verifierIdCard = '';
	let relation = '';
	let supplementaryInfoForPickup = '';

	let supplementaryInfoEdit = '';

	let archiveReason = '';
	let archiveResolution = '';
	let archiveDisputed = false;

	let disputeResolution = '';
	let disputeComments = '';

	async function loadPrescriptionDetail() {
		const res = await fetch(`/api/prescriptions/${$page.params.id}`);
		prescription = await res.json();
	}

	onMount(async () => {
		await loadPrescriptionDetail();
		loading = false;
	});

	$: role = $currentUser?.role ?? null;
	$: isPharmacist = role === 'PHARMACIST';
	$: isClerk = role === 'CLERK';
	$: isReviewer = role === 'REVIEWER';

	function canReview(status: PrescriptionStatus) {
		return ['RECEIVED', 'REVIEWING'].includes(status);
	}

	function canPickup(status: PrescriptionStatus) {
		return ['APPROVED', 'READY_FOR_PICKUP'].includes(status);
	}

	function isPickedUp(status: PrescriptionStatus) {
		return status === 'PICKED_UP';
	}

	function canArchive(status: PrescriptionStatus) {
		return ['DOSAGE_ISSUE', 'PATIENT_MISMATCH', 'TIMEOUT', 'REJECTED'].includes(status);
	}

	function isBlocked(status: PrescriptionStatus) {
		return ['DOSAGE_ISSUE', 'PATIENT_MISMATCH', 'REJECTED', 'TIMEOUT', 'ARCHIVED'].includes(status);
	}

	async function submitReview() {
		if (!$currentUser || !isPharmacist) {
			error = '权限不足：仅药师可执行审方操作';
			return;
		}
		error = '';
		successMessage = '';

		const res = await fetch(`/api/prescriptions/${$page.params.id}/review`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				pharmacistId: $currentUser.id,
				result: reviewResult,
				dosageSuggestion: dosageSuggestion || null,
				comments: reviewComments || null
			})
		});

		if (res.ok) {
			showReviewModal = false;
			reviewResult = 'APPROVED';
			reviewComments = '';
			dosageSuggestion = '';
			successMessage = '审方提交成功！';
			reloading = true;
			await loadPrescriptionDetail();
			reloading = false;
			setTimeout(() => { successMessage = ''; }, 3000);
		} else {
			const data = await res.json();
			error = data.error || '审方提交失败，请重试';
		}
	}

	async function submitPickup() {
		if (!$currentUser || !isClerk) {
			error = '权限不足：仅店员可执行取药核销操作';
			return;
		}
		error = '';
		successMessage = '';

		const res = await fetch(`/api/prescriptions/${$page.params.id}/pickup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				clerkId: $currentUser.id,
				verifierName,
				verifierIdCard,
				relation,
				supplementaryInfo: supplementaryInfoForPickup || null
			})
		});

		if (res.ok) {
			showPickupModal = false;
			verifierName = '';
			verifierIdCard = '';
			relation = '';
			supplementaryInfoForPickup = '';
			successMessage = '取药核销成功！';
			reloading = true;
			await loadPrescriptionDetail();
			reloading = false;
			setTimeout(() => { successMessage = ''; }, 3000);
		} else {
			const data = await res.json();
			if (data.alreadyPickedUp) {
				showPickupModal = false;
				error = data.error;
				reloading = true;
				await loadPrescriptionDetail();
				reloading = false;
			} else if (data.blocked) {
				error = data.error;
			} else {
				error = data.error || '核销失败，请重试';
			}
		}
	}

	async function submitSupplementaryInfo() {
		if (!$currentUser || !isClerk) {
			error = '权限不足：仅店员可补充身份信息';
			return;
		}
		if (!supplementaryInfoEdit.trim()) {
			error = '请输入补充的身份信息';
			return;
		}
		error = '';
		successMessage = '';

		const res = await fetch(`/api/prescriptions/${$page.params.id}/pickup`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				clerkId: $currentUser.id,
				supplementaryInfo: supplementaryInfoEdit
			})
		});

		if (res.ok) {
			showSupplementaryModal = false;
			supplementaryInfoEdit = '';
			successMessage = '身份信息补充成功！';
			reloading = true;
			await loadPrescriptionDetail();
			reloading = false;
			setTimeout(() => { successMessage = ''; }, 3000);
		} else {
			const data = await res.json();
			error = data.error;
		}
	}

	async function submitArchive() {
		if (!$currentUser || !isReviewer) {
			error = '权限不足：仅复核人可执行归档操作';
			return;
		}
		error = '';
		successMessage = '';

		const res = await fetch(`/api/prescriptions/${$page.params.id}/archive`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				reviewerId: $currentUser.id,
				reason: archiveReason,
				resolution: archiveResolution || null,
				disputed: archiveDisputed
			})
		});

		if (res.ok) {
			showArchiveModal = false;
			archiveReason = '';
			archiveResolution = '';
			archiveDisputed = false;
			successMessage = archiveDisputed ? '争议归档成功！' : '异常归档成功！';
			reloading = true;
			await loadPrescriptionDetail();
			reloading = false;
			setTimeout(() => { successMessage = ''; }, 3000);
		} else {
			const data = await res.json();
			if (data.hasOpenDispute) {
				showArchiveModal = false;
				error = data.error;
				reloading = true;
				await loadPrescriptionDetail();
				reloading = false;
			} else {
				error = data.error || '归档失败，请重试';
			}
		}
	}

	async function resolveDispute() {
		if (!$currentUser || !isReviewer) {
			error = '权限不足：仅复核人可解决争议';
			return;
		}
		error = '';
		successMessage = '';

		const res = await fetch(`/api/prescriptions/${$page.params.id}/archive`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				reviewerId: $currentUser.id,
				resolution: disputeResolution,
				disputeComments
			})
		});

		if (res.ok) {
			showArchiveModal = false;
			disputeResolution = '';
			disputeComments = '';
			successMessage = '争议解决成功！';
			reloading = true;
			await loadPrescriptionDetail();
			reloading = false;
			setTimeout(() => { successMessage = ''; }, 3000);
		} else {
			const data = await res.json();
			if (data.noOpenDispute || data.invalidStatus) {
				showArchiveModal = false;
				error = data.error;
				reloading = true;
				await loadPrescriptionDetail();
				reloading = false;
			} else {
				error = data.error || '争议解决失败，请重试';
			}
		}
	}

	function formatDate(date: Date | string | null | undefined) {
		if (!date) return '-';
		return new Date(date).toLocaleString('zh-CN');
	}
</script>

{#if loading}
	<div class="text-center py-12 text-gray-500">加载中...</div>
{:else if !prescription}
	<div class="text-center py-12 text-gray-500">处方不存在</div>
{:else}
	<div class="space-y-6">
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
				<span class="mt-0.5">🚫</span>
				<span>{error}</span>
			</div>
		{/if}
		{#if successMessage}
			<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
				<span class="mt-0.5">✅</span>
				<span>{successMessage}</span>
			</div>
		{/if}
		{#if reloading}
			<div class="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start gap-2">
				<span class="mt-0.5 animate-pulse">⏳</span>
				<span>正在刷新数据...</span>
			</div>
		{/if}

		<div class="bg-white shadow-sm rounded-lg border p-6">
			<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
				<div>
					<h2 class="text-2xl font-bold text-gray-900">处方详情</h2>
					<p class="text-gray-500 mt-1 font-mono">{prescription.prescriptionNo}</p>
				</div>
				<div class="flex items-center gap-3">
					<span class="px-3 py-1.5 text-sm font-medium rounded-full {statusColors[prescription.status]}">
						{statusLabels[prescription.status]}
					</span>
				</div>
			</div>

			<div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">处方来源</h3>
					<dl class="space-y-2">
						<div class="flex">
							<dt class="w-24 text-gray-500">来源：</dt>
							<dd class="text-gray-900">{sourceLabels[prescription.source]}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">医院：</dt>
							<dd class="text-gray-900">{prescription.sourceHospital || '-'}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">医生：</dt>
							<dd class="text-gray-900">{prescription.doctorName || '-'}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">科室：</dt>
							<dd class="text-gray-900">{prescription.department || '-'}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">诊断：</dt>
							<dd class="text-gray-900">{prescription.diagnosis || '-'}</dd>
						</div>
					</dl>
				</div>
				<div>
					<h3 class="text-lg font-semibold text-gray-900 mb-3">患者信息</h3>
					<dl class="space-y-2">
						<div class="flex">
							<dt class="w-24 text-gray-500">姓名：</dt>
							<dd class="text-gray-900">{prescription.patient.name}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">身份证：</dt>
							<dd class="text-gray-900">{prescription.patient.idCard}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">电话：</dt>
							<dd class="text-gray-900">{prescription.patient.phone || '-'}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">性别：</dt>
							<dd class="text-gray-900">{prescription.patient.gender || '-'}</dd>
						</div>
						<div class="flex">
							<dt class="w-24 text-gray-500">生日：</dt>
							<dd class="text-gray-900">{formatDate(prescription.patient.birthDate)}</dd>
						</div>
					</dl>
				</div>
			</div>

			<div class="mt-4 pt-4 border-t flex items-center justify-between">
				<div class="text-sm text-gray-500">
					<span>当前责任人：</span>
					<span class="font-medium text-gray-900">{prescription.currentHandler || '-'}</span>
				</div>
				<div class="text-sm text-gray-500">
					<span>接收时间：</span>
					<span class="font-medium text-gray-900">{formatDate(prescription.createdAt)}</span>
				</div>
			</div>

			<div class="mt-6 pt-4 border-t">
				<h4 class="text-sm font-semibold text-gray-700 mb-3">操作区域</h4>

				{#if !$currentUser}
					<div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
						⚠️ 请先在顶部选择当前身份后再进行操作
					</div>
				{:else}
					<div class="space-y-4">
						<div class="flex flex-wrap gap-3">
							{#if isPharmacist && canReview(prescription.status)}
								<button
									on:click={() => { error = ''; successMessage = ''; showReviewModal = true; }}
									class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									🔍 药师审方
								</button>
							{/if}

							{#if isClerk && canPickup(prescription.status) && !isPickedUp(prescription.status) && prescription.pickups.length === 0}
								<button
									on:click={() => { error = ''; successMessage = ''; showPickupModal = true; }}
									class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
								>
									✅ 取药核销
								</button>
							{/if}

							{#if isClerk && prescription.pickups.length > 0}
								<button
									on:click={() => {
										error = '';
										successMessage = '';
										supplementaryInfoEdit = prescription.pickups[0]?.supplementaryInfo || '';
										showSupplementaryModal = true;
									}}
									class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
								>
									📝 补充身份信息
								</button>
							{/if}

							{#if isReviewer && canArchive(prescription.status)}
								<button
									on:click={() => { error = ''; successMessage = ''; showArchiveModal = true; }}
									class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
								>
									📦 异常归档
								</button>
							{/if}

							{#if isReviewer && prescription.status === 'DISPUTED'}
								<button
									on:click={() => { error = ''; successMessage = ''; showArchiveModal = true; }}
									class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
								>
									⚖️ 处理争议
								</button>
							{/if}
						</div>

						{#if isBlocked(prescription.status) && !['ARCHIVED', 'DISPUTED'].includes(prescription.status)}
							<div class="p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
								⚠️ 处方处于异常状态，核销已被阻断。{#if isClerk}请联系药师处理后再取药。{:else}需药师审方或复核人归档后方可继续。{/if}
							</div>
						{/if}

						{#if isPharmacist && !canReview(prescription.status) && !canArchive(prescription.status)}
							<div class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
								ℹ️ 当前处方状态为「{statusLabels[prescription.status]}」，无需药师审方操作。
							</div>
						{/if}

						{#if isClerk && isPickedUp(prescription.status)}
							<div class="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
								✅ 该处方已完成取药，可点击「补充身份信息」完善取药人资料。
							</div>
						{/if}

						{#if isClerk && !canPickup(prescription.status) && !isPickedUp(prescription.status) && prescription.pickups.length === 0}
							<div class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
								ℹ️ 当前处方状态为「{statusLabels[prescription.status]}」，暂不可取药。{#if canReview(prescription.status)}需药师先审方通过。{/if}{#if isBlocked(prescription.status)}该处方已被阻断。{/if}
							</div>
						{/if}

						{#if isReviewer && !canArchive(prescription.status) && prescription.status !== 'DISPUTED'}
							<div class="p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
								ℹ️ 当前处方状态为「{statusLabels[prescription.status]}」，无需归档操作。
							</div>
						{/if}

						<div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-blue-700 text-xs">
							当前操作身份：{$currentUser.name}（{roleLabels[$currentUser.role]}）
							· 仅显示当前角色可执行的操作
						</div>
					</div>
				{/if}
			</div>
		</div>

		<div class="bg-white shadow-sm rounded-lg border p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">📋 药品清单</h3>
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">药品名称</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">规格</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">剂量</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">频次</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">数量</th>
							<th class="px-4 py-3 text-left text-xs font-medium text-gray-500">备注</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each prescription.medicines as med}
							<tr>
								<td class="px-4 py-3 text-sm font-medium text-gray-900">{med.name}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{med.specification}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{med.dosage}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{med.frequency}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{med.quantity} {med.unit}</td>
								<td class="px-4 py-3 text-sm text-gray-500">{med.notes || '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		{#if prescription.reviews.length > 0}
			<div class="bg-white shadow-sm rounded-lg border p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">🔍 审方意见</h3>
				<div class="space-y-4">
					{#each prescription.reviews as review}
						<div class="p-4 bg-gray-50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<span class="font-medium text-gray-900">
									{review.pharmacistName}（药师）
								</span>
								<span class="text-sm text-gray-500">{formatDate(review.reviewedAt)}</span>
							</div>
							<div class="mb-2">
								<span class="px-2 py-1 text-xs font-medium rounded {
									review.result === 'APPROVED' ? 'bg-green-100 text-green-800' :
									review.result === 'DOSAGE_ISSUE' || review.result === 'NEEDS_ADJUSTMENT' ? 'bg-orange-100 text-orange-800' :
									'bg-red-100 text-red-800'
								}">
									{reviewResultLabels[review.result]}
								</span>
							</div>
							{#if review.dosageSuggestion}
								<p class="text-sm text-gray-700">
									<span class="font-medium">剂量建议：</span>{review.dosageSuggestion}
								</p>
							{/if}
							{#if review.comments}
								<p class="text-sm text-gray-700 mt-1">
									<span class="font-medium">备注：</span>{review.comments}
								</p>
							{/if}
							{#if review.result === 'DOSAGE_ISSUE' || review.result === 'NEEDS_ADJUSTMENT'}
								<div class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
									<strong>处理路径：</strong>
									<ul class="list-disc list-inside mt-1">
										<li>调整剂量后重新审核</li>
										<li>退回医生重新开具处方</li>
									</ul>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if prescription.pickups.length > 0}
			<div class="bg-white shadow-sm rounded-lg border p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">📦 取药状态</h3>
				<div class="space-y-4">
					{#each prescription.pickups as pickup}
						<div class="p-4 bg-gray-50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<span class="font-medium text-gray-900">
									{pickup.clerkName}（店员）
								</span>
								<span class="text-sm text-gray-500">{formatDate(pickup.pickupTime || pickup.createdAt)}</span>
							</div>
							<div class="grid grid-cols-2 gap-2 text-sm">
								<p class="text-gray-700">
									<span class="font-medium">取药人：</span>{pickup.verifierName || '-'}
								</p>
								<p class="text-gray-700">
									<span class="font-medium">身份证：</span>{pickup.verifierIdCard || '-'}
								</p>
								<p class="text-gray-700">
									<span class="font-medium">与患者关系：</span>{pickup.relation || '-'}
								</p>
								<p class="text-gray-700">
									<span class="font-medium">状态：</span>
									<span class={pickup.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}>
										{pickup.status === 'COMPLETED' ? '已完成' : '待处理'}
									</span>
								</p>
							</div>
							{#if pickup.supplementaryInfo}
								<p class="text-sm text-gray-700 mt-2">
									<span class="font-medium">补充信息：</span>{pickup.supplementaryInfo}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		{#if prescription.archives.length > 0}
			<div class="bg-white shadow-sm rounded-lg border p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">📦 归档记录</h3>
				<div class="space-y-4">
					{#each prescription.archives as archive}
						<div class="p-4 bg-gray-50 rounded-lg">
							<div class="flex items-center justify-between mb-2">
								<span class="font-medium text-gray-900">
									{archive.reviewerName || '系统'}（复核人）
								</span>
								<span class="text-sm text-gray-500">{formatDate(archive.archivedAt)}</span>
							</div>
							<div class="space-y-1 text-sm">
								<p class="text-gray-700">
									<span class="font-medium">归档原因：</span>{archive.reason}
								</p>
								{#if archive.resolution}
									<p class="text-gray-700">
										<span class="font-medium">处理结果：</span>{archive.resolution}
									</p>
								{/if}
								{#if archive.disputed}
									<p class="text-red-600 font-medium">⚠️ 存在争议</p>
									{#if archive.disputeComments}
										<p class="text-gray-700">
											<span class="font-medium">争议说明：</span>{archive.disputeComments}
										</p>
									{/if}
								{/if}
								{#if archive.resolvedAt}
									<p class="text-green-600 text-sm">✅ 已解决 - {formatDate(archive.resolvedAt)}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="bg-white shadow-sm rounded-lg border p-6">
			<h3 class="text-lg font-semibold text-gray-900 mb-4">📜 历史轨迹</h3>
			<div class="relative">
				<div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
				<div class="space-y-4">
					{#each prescription.histories as history}
						<div class="relative pl-10">
							<div class="absolute left-2.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow"></div>
							<div class="p-3 bg-gray-50 rounded-lg">
								<div class="flex items-center justify-between mb-1">
									<span class="font-medium text-gray-900">{history.action}</span>
									<span class="text-sm text-gray-500">{formatDate(history.timestamp)}</span>
								</div>
								{#if history.operatorName}
									<p class="text-sm text-gray-600">操作人：{history.operatorName}</p>
								{/if}
								{#if history.details}
									<p class="text-sm text-gray-700 mt-1">{history.details}</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	{#if showReviewModal && isPharmacist}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg max-w-md w-full p-6">
				<div class="flex items-center gap-2 mb-4">
					<h3 class="text-lg font-semibold">药师审方</h3>
					<span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">{$currentUser.name}</span>
				</div>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">审核结果</label>
						<select
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							bind:value={reviewResult}
						>
							<option value="APPROVED">审核通过</option>
							<option value="DOSAGE_ISSUE">剂量异常</option>
							<option value="PATIENT_MISMATCH">患者信息不符</option>
							<option value="NEEDS_ADJUSTMENT">需调整</option>
							<option value="RETURN_TO_DOCTOR">退回医生</option>
						</select>
					</div>
					{#if reviewResult === 'DOSAGE_ISSUE' || reviewResult === 'NEEDS_ADJUSTMENT'}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">剂量调整建议</label>
							<textarea
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								rows={3}
								bind:value={dosageSuggestion}
								placeholder="请输入剂量调整建议..."
							></textarea>
						</div>
					{/if}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
						<textarea
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows={2}
							bind:value={reviewComments}
							placeholder="可选，填写其他说明..."
						></textarea>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button
						on:click={() => showReviewModal = false}
						class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						取消
					</button>
					<button
						on:click={submitReview}
						class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
					>
						提交审核
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showPickupModal && isClerk}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg max-w-md w-full p-6">
				<div class="flex items-center gap-2 mb-4">
					<h3 class="text-lg font-semibold">取药核销</h3>
					<span class="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">{$currentUser.name}</span>
				</div>
				<p class="text-sm text-gray-500 mb-4">登记取药人信息并完成取药核销</p>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">取药人姓名 *</label>
						<input
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
							bind:value={verifierName}
							placeholder="请输入取药人姓名"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">身份证号</label>
						<input
							type="text"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
							bind:value={verifierIdCard}
							placeholder="可选，身份证号"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">与患者关系</label>
						<select
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
							bind:value={relation}
						>
							<option value="">请选择</option>
							<option value="本人">本人</option>
							<option value="亲属">亲属</option>
							<option value="朋友">朋友</option>
							<option value="其他">其他</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">补充身份信息</label>
						<textarea
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
							rows={2}
							bind:value={supplementaryInfoForPickup}
							placeholder="可选，补充身份验证信息..."
						></textarea>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button
						on:click={() => showPickupModal = false}
						class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						取消
					</button>
					<button
						on:click={submitPickup}
						class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
						disabled={!verifierName}
					>
						确认核销
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showSupplementaryModal && isClerk}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg max-w-md w-full p-6">
				<div class="flex items-center gap-2 mb-4">
					<h3 class="text-lg font-semibold">补充身份信息</h3>
					<span class="px-2 py-0.5 text-xs bg-teal-100 text-teal-700 rounded">{$currentUser.name}</span>
				</div>
				<p class="text-sm text-gray-500 mb-4">补充或更新取药人身份验证信息</p>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">补充信息 *</label>
						<textarea
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
							rows={4}
							bind:value={supplementaryInfoEdit}
							placeholder="请输入需补充的身份信息，如：家属关系证明、联系方式补充、授权委托书编号等..."
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							提交后将更新取药记录并生成历史轨迹
						</p>
					</div>
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button
						on:click={() => showSupplementaryModal = false}
						class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						取消
					</button>
					<button
						on:click={submitSupplementaryInfo}
						class="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
						disabled={!supplementaryInfoEdit.trim()}
					>
						确认补充
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if showArchiveModal && isReviewer}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div class="bg-white rounded-lg max-w-md w-full p-6">
				<div class="flex items-center gap-2 mb-4">
					<h3 class="text-lg font-semibold">{prescription.status === 'DISPUTED' ? '处理争议' : '异常归档'}</h3>
					<span class="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">{$currentUser.name}</span>
				</div>
				<div class="space-y-4">
					{#if prescription.status === 'DISPUTED'}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">处理结果 *</label>
							<input
								type="text"
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								bind:value={disputeResolution}
								placeholder="请输入争议处理结果..."
							/>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">争议说明</label>
							<textarea
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								rows={2}
								bind:value={disputeComments}
								placeholder="可选，争议处理说明..."
							></textarea>
						</div>
					{:else}
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">归档原因 *</label>
							<textarea
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								rows={3}
								bind:value={archiveReason}
								placeholder="请输入归档原因..."
							></textarea>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">处理结果</label>
							<textarea
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
								rows={2}
								bind:value={archiveResolution}
								placeholder="可选，处理结果..."
							></textarea>
						</div>
						<div class="flex items-center">
							<input
								type="checkbox"
								id="disputed"
								class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
								bind:checked={archiveDisputed}
							/>
							<label for="disputed" class="ml-2 block text-sm text-gray-700">存在争议，需复核</label>
						</div>
					{/if}
				</div>
				<div class="mt-6 flex justify-end gap-3">
					<button
						on:click={() => showArchiveModal = false}
						class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
					>
						取消
					</button>
					<button
						on:click={prescription.status === 'DISPUTED' ? resolveDispute : submitArchive}
						class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
						disabled={prescription.status === 'DISPUTED' ? !disputeResolution : !archiveReason}
					>
						{prescription.status === 'DISPUTED' ? '解决争议' : '确认归档'}
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
