<script lang="ts">
	import { currentUser } from '$lib/stores';
	import type { RecordStatus, SampleType, NodeType, DiffField, VehicleUsageRecord } from '$lib/types';

	let { data } = $props();

	let record = $state<VehicleUsageRecord>(data.record);
	let activeTab = $state('records');
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let submitting = $state(false);
	let modalType = $state<'confirm' | 'return' | 'archive' | null>(null);

	let confirmForm = $state({ conclusion: '', basis: '' });
	let returnForm = $state({ comment: '' });

	const statusLabels: Record<RecordStatus, string> = {
		RECEIVED: '受理',
		PROCESSING: '处理中',
		REVIEW: '复核中',
		ARCHIVED: '已归档'
	};

	const statusColors: Record<RecordStatus, string> = {
		RECEIVED: 'badge-blue',
		PROCESSING: 'badge-yellow',
		REVIEW: 'badge-gray',
		ARCHIVED: 'badge-green'
	};

	const sampleTypeLabels: Record<SampleType, string> = {
		NORMAL: '正常',
		INELIGIBLE: '资格不符',
		TIME_CONFLICT: '时间冲突',
		UNCONFIRMED: '未确认'
	};

	const sampleTypeColors: Record<SampleType, string> = {
		NORMAL: 'badge-green',
		INELIGIBLE: 'badge-red',
		TIME_CONFLICT: 'badge-yellow',
		UNCONFIRMED: 'badge-gray'
	};

	const nodeTypeLabels: Record<NodeType, string> = {
		CREATED: '创建记录',
		ASSIGNED: '分配处理人',
		PROCESSING: '处理中',
		REVIEW_SUBMITTED: '提交复核',
		REVIEW_CONFIRMED: '复核确认',
		REVIEW_RETURNED: '退回补证',
		ARCHIVED: '归档',
		REPROCESSING: '重新处理'
	};

	const nodeTypeColors: Record<NodeType, string> = {
		CREATED: '#3b82f6',
		ASSIGNED: '#8b5cf6',
		PROCESSING: '#f59e0b',
		REVIEW_SUBMITTED: '#06b6d4',
		REVIEW_CONFIRMED: '#059669',
		REVIEW_RETURNED: '#dc2626',
		ARCHIVED: '#64748b',
		REPROCESSING: '#d97706'
	};

	const tabs = [
		{ key: 'records', label: '业务记录 & 现场说明' },
		{ key: 'evidence', label: '证据附件' },
		{ key: 'violations', label: '违章信息' },
		{ key: 'history', label: '处理历史' }
	];

	let isReviewer = $derived($currentUser.role === 'QC_REVIEWER');
	let isReview = $derived(record.status === 'REVIEW');
	let isArchived = $derived(record.status === 'ARCHIVED');
	let canConfirm = $derived(isReview && isReviewer);
	let canArchive = $derived(isReview && isReviewer && !!record.conclusion);

	let diffFieldList = $derived(
		Array.isArray(record.diffFields) ? (record.diffFields as DiffField[]) : []
	);

	function formatDate(d: string | undefined | null) {
		if (!d) return '-';
		return new Date(d).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function getFileIcon(fileType: string) {
		if (fileType.startsWith('image/')) return '🖼️';
		if (fileType === 'application/pdf') return '📄';
		if (fileType.includes('word') || fileType.includes('document')) return '📝';
		if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
		if (fileType.includes('video')) return '🎬';
		return '📎';
	}

	function showMessage(type: 'success' | 'error', text: string) {
		message = { type, text };
		setTimeout(() => { message = null; }, 3000);
	}

	async function refreshRecord() {
		try {
			const res = await fetch(`/api/records/${record.id}`);
			if (res.ok) {
				record = await res.json();
			}
		} catch {
			showMessage('error', '刷新数据失败');
		}
	}

	async function postReviewAction(action: string, payload: Record<string, unknown> = {}) {
		submitting = true;
		try {
			const res = await fetch(`/api/records/${record.id}/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, userId: $currentUser.id, ...payload })
			});
			if (res.ok) {
				await refreshRecord();
				showMessage('success', '操作成功');
				return true;
			} else {
				const err = await res.json();
				showMessage('error', err.error || '操作失败');
				return false;
			}
		} catch {
			showMessage('error', '网络错误，请重试');
			return false;
		} finally {
			submitting = false;
		}
	}

	function openModal(type: 'confirm' | 'return' | 'archive') {
		if (type === 'confirm') {
			confirmForm = { conclusion: record.conclusion ?? '', basis: record.basis ?? '' };
		} else if (type === 'return') {
			returnForm = { comment: '' };
		}
		modalType = type;
	}

	function closeModal() {
		modalType = null;
	}

	async function handleConfirm() {
		if (!confirmForm.conclusion.trim() || !confirmForm.basis.trim()) {
			showMessage('error', '结论和采用依据均为必填');
			return;
		}
		const ok = await postReviewAction('confirm', {
			conclusion: confirmForm.conclusion,
			basis: confirmForm.basis
		});
		if (ok) closeModal();
	}

	async function handleReturn() {
		if (!returnForm.comment.trim()) {
			showMessage('error', '请填写退回原因');
			return;
		}
		const ok = await postReviewAction('return', {
			comment: returnForm.comment
		});
		if (ok) closeModal();
	}

	async function handleArchive() {
		const ok = await postReviewAction('archive');
		if (ok) closeModal();
	}

	async function toggleViolationConfirm(violationId: string, currentConfirmed: boolean) {
		try {
			const res = await fetch(`/api/records/${record.id}/update`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: $currentUser.id,
					violationUpdate: { id: violationId, isConfirmed: !currentConfirmed }
				})
			});
			if (res.ok) {
				await refreshRecord();
				showMessage('success', '违章确认状态已更新');
			} else {
				const err = await res.json();
				showMessage('error', err.error || '更新失败');
			}
		} catch {
			showMessage('error', '网络错误，请重试');
		}
	}
</script>

<div class="review-page">
	{#if message}
		<div class="alert {message.type === 'success' ? 'alert-info' : 'alert-danger'} message-bar">
			{message.type === 'success' ? '✅' : '❌'} {message.text}
		</div>
	{/if}

	<div class="review-header">
		<nav class="breadcrumb">
			<a href="/records">记录列表</a>
			<span class="breadcrumb-sep">›</span>
			<a href="/records/{record.id}">{record.title}</a>
			<span class="breadcrumb-sep">›</span>
			<span class="breadcrumb-current">复核</span>
		</nav>

		<div class="header-title-row mt-sm">
			<h1>{record.title}</h1>
			<span class="badge {statusColors[record.status as RecordStatus]}">
				{statusLabels[record.status as RecordStatus] ?? record.status}
			</span>
			<span class="badge {sampleTypeColors[record.sampleType as SampleType]}">
				{sampleTypeLabels[record.sampleType as SampleType] ?? record.sampleType}
			</span>
		</div>

		{#if record.blockingReason}
			<div class="blocking-banner mt-md">
				<div class="blocking-title">🚫 阻断原因</div>
				<div class="blocking-reason">{record.blockingReason}</div>
			</div>
		{/if}

		<div class="header-meta text-sm text-secondary mt-sm">
			当前处理人: {record.currentAssignee?.name ?? '未分配'}
			{#if record.currentAssignee}
				({record.currentAssignee.department})
			{/if}
		</div>
	</div>

	{#if isArchived}
		<div class="alert alert-info mt-md">
			📋 此记录已归档，所有操作已锁定。
			<a href="/records/{record.id}" class="ml-sm">返回详情</a>
		</div>
	{:else if !isReviewer}
		<div class="alert alert-danger mt-md">
			🚫 您没有复核权限
		</div>
	{:else if !isReview}
		<div class="alert alert-warning mt-md">
			⚠️ 当前记录状态为「{statusLabels[record.status as RecordStatus] ?? record.status}」，无法进行复核操作。仅「复核中」状态的记录可以进行复核。
		</div>
	{/if}

	<div class="summary-card card mt-md">
		<div class="card-header">记录摘要</div>
		<div class="card-body">
			<div class="summary-grid">
				<div class="summary-item">
					<span class="summary-label">来源</span>
					<span class="summary-value">{record.source}</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">申请人</span>
					<span class="summary-value">{record.applicant?.name ?? '-'}</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">车辆</span>
					<span class="summary-value">{record.vehicle?.plateNumber ?? '-'}</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">申请里程 / 实际里程</span>
					<span class="summary-value">{record.appliedMileage} km / {record.actualMileage} km</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">结论</span>
					<span class="summary-value" class:conclusion-empty={!record.conclusion}>
						{record.conclusion ?? '待确认'}
					</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">依据</span>
					<span class="summary-value" class:conclusion-empty={!record.basis}>
						{record.basis ?? '未填写'}
					</span>
				</div>
			</div>
			{#if diffFieldList.length > 0}
				<div class="diff-highlight mt-md">
					<div class="font-semibold text-sm mb-sm">⚠️ 关键差异字段</div>
					{#each diffFieldList as df}
						<div class="diff-field">
							<span class="font-medium">{df.field}:</span>
							<span class="diff-old">{df.oldValue}</span>
							<span>→</span>
							<span class="diff-new">{df.newValue}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<div class="card mt-md">
		<div class="tab-bar">
			{#each tabs as tab}
				<button
					class="tab"
					class:tab-active={activeTab === tab.key}
					onclick={() => (activeTab = tab.key)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		<div class="card-body">
			{#if activeTab === 'records'}
				<div class="section-block">
					<h4 class="section-title">业务记录</h4>
					{#if record.businessRecords && record.businessRecords.length > 0}
						<div class="record-list">
							{#each record.businessRecords as br}
								<div class="record-list-item">
									<div class="flex items-center justify-between">
										<span class="badge badge-blue">{br.recordType}</span>
										<span class="text-xs text-muted">{formatDate(br.createdAt)}</span>
									</div>
									<div class="record-content mt-sm">{br.content}</div>
									<div class="text-xs text-secondary mt-sm">
										创建人: {br.createdBy?.name ?? '-'}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state">暂无业务记录</div>
					{/if}
				</div>

				<div class="section-block mt-lg">
					<h4 class="section-title">现场说明</h4>
					{#if record.onSiteExplanations && record.onSiteExplanations.length > 0}
						<div class="record-list">
							{#each record.onSiteExplanations as exp}
								<div class="record-list-item">
									<div class="record-content">{exp.content}</div>
									<div class="flex items-center justify-between mt-sm">
										<span class="text-xs text-secondary">
											创建人: {exp.createdBy?.name ?? '-'}
										</span>
										<span class="text-xs text-muted">{formatDate(exp.createdAt)}</span>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="empty-state">暂无现场说明</div>
					{/if}
				</div>
			{/if}

			{#if activeTab === 'evidence'}
				{#if record.evidenceAttachments && record.evidenceAttachments.length > 0}
					<div class="record-list">
						{#each record.evidenceAttachments as ea}
							<div class="record-list-item">
								<div class="flex items-center gap-sm">
									<span class="file-icon">{getFileIcon(ea.fileType)}</span>
									<div class="flex-1">
										<div class="font-medium">{ea.fileName}</div>
										<div class="text-xs text-secondary">
											{formatFileSize(ea.fileSize)} · {ea.fileType}
										</div>
									</div>
								</div>
								{#if ea.description}
									<div class="text-sm text-secondary mt-sm">{ea.description}</div>
								{/if}
								<div class="flex items-center justify-between mt-sm">
									<span class="text-xs text-secondary">
										上传人: {ea.uploadedBy?.name ?? '-'}
									</span>
									<span class="text-xs text-muted">{formatDate(ea.createdAt)}</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state">暂无证据附件</div>
				{/if}
			{/if}

			{#if activeTab === 'violations'}
				{#if record.violationInfos && record.violationInfos.length > 0}
					<div class="record-list">
						{#each record.violationInfos as v}
							<div class="record-list-item">
								<div class="flex items-center justify-between">
									<span class="badge badge-red">{v.violationType}</span>
									<span class="badge {v.isConfirmed ? 'badge-green' : 'badge-yellow'}">
										{v.isConfirmed ? '已确认' : '未确认'}
									</span>
								</div>
								<div class="grid grid-2 mt-sm">
									<div class="text-sm">
										<span class="text-secondary">违章日期:</span> {formatDate(v.violationDate)}
									</div>
									<div class="text-sm">
										<span class="text-secondary">地点:</span> {v.location}
									</div>
									<div class="text-sm">
										<span class="text-secondary">罚款:</span>
										<span class="fine-amount">¥{v.fine}</span>
									</div>
									<div class="text-sm">
										<span class="text-secondary">扣分:</span>
										<span class="penalty-points">{v.penaltyPoints} 分</span>
									</div>
								</div>
								<div class="text-sm mt-sm">{v.description}</div>
								{#if canConfirm || isArchived}
									<div class="violation-confirm mt-sm">
										<label class="confirm-checkbox">
											<input
												type="checkbox"
												checked={v.isConfirmed}
												disabled={isArchived}
												onchange={() => toggleViolationConfirm(v.id, v.isConfirmed)}
											/>
											<span>确认此违章记录</span>
										</label>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state">暂无违章信息</div>
				{/if}
			{/if}

			{#if activeTab === 'history'}
				{#if record.processingNodes && record.processingNodes.length > 0}
					<div class="timeline">
						{#each record.processingNodes as node}
							<div class="timeline-item">
								<div class="timeline-title">
									<span class="node-icon" style="color: {nodeTypeColors[node.nodeType as NodeType] ?? '#64748b'}">
										●
									</span>
									{nodeTypeLabels[node.nodeType as NodeType] ?? node.nodeType}
								</div>
								<div class="timeline-time">
									{node.operator?.name ?? '-'} · {node.operator?.role ?? '-'} · {formatDate(node.createdAt)}
								</div>
								<div class="timeline-content">
									<div>{node.action}</div>
									{#if node.comment}
										<div class="mt-sm node-comment">💬 {node.comment}</div>
									{/if}
									{#if node.changedFields && Array.isArray(node.changedFields) && node.changedFields.length > 0}
										<div class="diff-highlight mt-sm">
											{#each node.changedFields as cf}
												<div class="diff-field">
													<span class="font-medium">{cf.field}:</span>
													<span class="diff-old">{cf.oldValue}</span>
													<span>→</span>
													<span class="diff-new">{cf.newValue}</span>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state">暂无处理历史</div>
				{/if}
			{/if}
		</div>
	</div>

	{#if !isArchived && isReviewer}
		<div class="action-bar">
			<div class="action-bar-inner">
				<a href="/records/{record.id}" class="btn btn-outline">返回详情</a>
				<div class="action-buttons">
					<button
						class="btn btn-success"
						onclick={() => openModal('confirm')}
						disabled={!canConfirm || submitting}
					>
						确认结论
					</button>
					<button
						class="btn btn-danger"
						onclick={() => openModal('return')}
						disabled={!canConfirm || submitting}
					>
						退回补证
					</button>
					<button
						class="btn btn-primary"
						onclick={() => openModal('archive')}
						disabled={!canArchive || submitting}
					>
						归档
					</button>
				</div>
			</div>
		</div>
	{/if}

	{#if modalType === 'confirm'}
		<div class="dialog-overlay" onclick={closeModal}>
			<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
				<h3>确认结论</h3>
				<div class="form-group mt-md">
					<label class="form-label">结论 <span class="required">*</span></label>
					<textarea class="form-textarea" bind:value={confirmForm.conclusion} placeholder="请输入结论" disabled={submitting}></textarea>
				</div>
				<div class="form-group">
					<label class="form-label">采用依据 <span class="required">*</span></label>
					<textarea class="form-textarea" bind:value={confirmForm.basis} placeholder="请输入采用依据" disabled={submitting}></textarea>
				</div>
				<div class="dialog-actions">
					<button class="btn btn-outline" onclick={closeModal} disabled={submitting}>取消</button>
					<button class="btn btn-success" onclick={handleConfirm} disabled={submitting}>确认</button>
				</div>
			</div>
		</div>
	{/if}

	{#if modalType === 'return'}
		<div class="dialog-overlay" onclick={closeModal}>
			<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
				<h3>退回补证</h3>
				<p class="text-secondary text-sm mt-sm">退回后记录将回到「处理中」状态，由原处理人补充证据。</p>
				<div class="form-group mt-md">
					<label class="form-label">退回原因 <span class="required">*</span></label>
					<textarea class="form-textarea" bind:value={returnForm.comment} placeholder="请输入退回原因" disabled={submitting}></textarea>
				</div>
				<div class="dialog-actions">
					<button class="btn btn-outline" onclick={closeModal} disabled={submitting}>取消</button>
					<button class="btn btn-danger" onclick={handleReturn} disabled={submitting}>确认退回</button>
				</div>
			</div>
		</div>
	{/if}

	{#if modalType === 'archive'}
		<div class="dialog-overlay" onclick={closeModal}>
			<div class="dialog-box" onclick={(e) => e.stopPropagation()}>
				<h3>确认归档</h3>
				<div class="alert alert-warning mt-md">
					⚠️ 归档后记录将变为只读，重新处理需生成新的处理节点。
				</div>
				<div class="dialog-actions mt-md">
					<button class="btn btn-outline" onclick={closeModal} disabled={submitting}>取消</button>
					<button class="btn btn-primary" onclick={handleArchive} disabled={submitting}>确认归档</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.review-page {
		max-width: 1100px;
		margin: 0 auto;
		padding-bottom: 80px;
	}

	.review-header {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		box-shadow: var(--shadow-sm);
	}

	.breadcrumb {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.breadcrumb a {
		color: var(--color-primary-light);
	}

	.breadcrumb-sep {
		color: var(--color-text-muted);
		margin: 0 2px;
	}

	.breadcrumb-current {
		color: var(--color-text);
		font-weight: 500;
	}

	.header-title-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.header-title-row h1 {
		font-size: 1.375rem;
		margin: 0;
	}

	.message-bar {
		position: fixed;
		top: calc(var(--header-height) + var(--spacing-sm));
		right: var(--spacing-md);
		z-index: 100;
		min-width: 240px;
		box-shadow: var(--shadow-md);
		animation: slideIn 0.2s ease;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.summary-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--spacing-md);
	}

	.summary-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.summary-label {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.summary-value {
		font-size: 0.9375rem;
		color: var(--color-text);
	}

	.conclusion-empty {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.section-block {
		padding: 0;
	}

	.section-title {
		font-size: 1rem;
		color: var(--color-primary);
		margin-bottom: var(--spacing-md);
		padding-bottom: var(--spacing-sm);
		border-bottom: 1px solid var(--color-border-light);
	}

	.tab-bar {
		display: flex;
		border-bottom: 1px solid var(--color-border);
		padding: 0 var(--spacing-lg);
		overflow-x: auto;
	}

	.record-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.record-list-item {
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius);
		padding: var(--spacing-md);
		background-color: var(--color-surface);
		transition: box-shadow 0.15s ease;
	}

	.record-list-item:hover {
		box-shadow: var(--shadow-sm);
	}

	.record-content {
		font-size: 0.875rem;
		color: var(--color-text);
		line-height: 1.6;
	}

	.empty-state {
		text-align: center;
		padding: var(--spacing-2xl);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.node-icon {
		font-size: 0.75rem;
		margin-right: 4px;
	}

	.node-comment {
		background-color: var(--color-bg);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius);
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
	}

	.fine-amount {
		color: var(--color-danger);
		font-weight: 600;
	}

	.penalty-points {
		color: var(--color-warning);
		font-weight: 600;
	}

	.file-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.violation-confirm {
		border-top: 1px solid var(--color-border-light);
		padding-top: var(--spacing-sm);
	}

	.confirm-checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-sm);
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.confirm-checkbox input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-success);
		cursor: pointer;
	}

	.action-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: var(--color-surface);
		border-top: 1px solid var(--color-border);
		box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
		z-index: 50;
	}

	.action-bar-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: var(--spacing-md) var(--spacing-lg);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.action-buttons {
		display: flex;
		gap: var(--spacing-sm);
	}

	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
	}

	.dialog-box {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--spacing-xl);
		min-width: 400px;
		max-width: 520px;
		box-shadow: var(--shadow-lg);
	}

	.dialog-box h3 {
		font-size: 1.125rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}

	.required {
		color: var(--color-danger);
	}

	@media (max-width: 640px) {
		.summary-grid {
			grid-template-columns: 1fr;
		}

		.header-title-row h1 {
			font-size: 1.125rem;
		}

		.action-bar-inner {
			flex-direction: column;
			gap: var(--spacing-sm);
		}

		.action-buttons {
			width: 100%;
			justify-content: stretch;
		}

		.action-buttons .btn {
			flex: 1;
		}

		.dialog-box {
			min-width: auto;
			max-width: none;
			margin: var(--spacing-md);
		}
	}
</style>
