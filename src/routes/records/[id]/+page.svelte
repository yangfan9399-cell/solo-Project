<script lang="ts">
	import { goto } from '$app/navigation';
	import { currentUser } from '$lib/stores';
	import type { RecordStatus, SampleType, NodeType, DiffField } from '$lib/types';

	let { data } = $props();

	const record = $derived(data.record);

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
		{ key: 'basic', label: '基本信息' },
		{ key: 'history', label: '处理历史' },
		{ key: 'business', label: '业务记录' },
		{ key: 'onsite', label: '现场说明' },
		{ key: 'evidence', label: '证据附件' },
		{ key: 'violations', label: '违章信息' }
	];

	let activeTab = $state('basic');

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

	let canProcess = $derived(
		record.status === 'PROCESSING' && $currentUser.role === 'FRONTLINE'
	);

	let canReview = $derived(
		record.status === 'REVIEW' && $currentUser.role === 'QC_REVIEWER'
	);

	let isArchived = $derived(record.status === 'ARCHIVED');

	let mileageDiff = $derived(record.actualMileage - record.appliedMileage);

	let isMileageSignificant = $derived(Math.abs(mileageDiff) > 10);

	let diffFieldList = $derived(
		Array.isArray(record.diffFields) ? (record.diffFields as DiffField[]) : []
	);

	let remediationSteps = $derived(
		record.remediationPath
			? record.remediationPath.split(';').map((s: string) => s.trim()).filter(Boolean)
			: []
	);

	async function handleReprocess() {
		if (!confirm('确定要重新处理此记录吗？')) return;
		try {
			const res = await fetch(`/api/records/${record.id}/reprocess`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId: $currentUser.id })
			});
			if (res.ok) {
				goto(`/records/${record.id}`);
			} else {
				const err = await res.json();
				alert(err.error || '操作失败');
			}
		} catch {
			alert('网络错误，请重试');
		}
	}
</script>

<div class="detail-page">
	<div class="detail-header">
		<div class="header-top">
			<div class="header-title-row">
				<h1>{record.title}</h1>
				<span class="badge {statusColors[record.status as RecordStatus]}">
					{statusLabels[record.status as RecordStatus] ?? record.status}
				</span>
				<span class="badge {sampleTypeColors[record.sampleType as SampleType]}">
					{sampleTypeLabels[record.sampleType as SampleType] ?? record.sampleType}
				</span>
			</div>
			<div class="header-meta text-sm text-secondary mt-sm">
				记录ID: {record.id} &nbsp;|&nbsp; 创建时间: {formatDate(record.createdAt)} &nbsp;|&nbsp; 更新时间: {formatDate(record.updatedAt)}
			</div>
		</div>

		{#if record.blockingReason}
			<div class="blocking-banner mt-md">
				<div class="blocking-title">
					🚫 阻断原因: {record.blockingReason}
				</div>
				{#if record.remediationPath}
					<div class="remediation-path mt-sm" style="margin-bottom:0">
						<div class="remediation-title">🔧 补救路径:</div>
						<div class="remediation-steps">
							{#if remediationSteps.length > 1}
								<ol class="step-list">
									{#each remediationSteps as step, i}
										<li>{step}</li>
									{/each}
								</ol>
							{:else}
								{record.remediationPath}
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if diffFieldList.length > 0}
			<div class="diff-highlight mt-md">
				<div class="font-semibold text-sm mb-sm">⚠️ 字段变更记录</div>
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

		<div class="header-actions mt-md flex items-center gap-sm">
			{#if canProcess}
				<a href="/records/{record.id}/process" class="btn btn-primary">进入处理台</a>
			{/if}
			{#if canReview}
				<a href="/records/{record.id}/review" class="btn btn-primary">进入复核</a>
			{/if}
			{#if isArchived}
				<button class="btn btn-warning" onclick={handleReprocess}>重新处理</button>
			{/if}
			<a href="/records" class="btn btn-outline">返回列表</a>
		</div>
	</div>

	<div class="card mt-lg">
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
			{#if activeTab === 'basic'}
				<div class="info-grid">
					<div class="info-item">
						<div class="info-label">来源</div>
						<div class="info-value">{record.source}</div>
					</div>
					<div class="info-item">
						<div class="info-label">当前责任人</div>
						<div class="info-value">{record.currentAssignee?.name ?? '未分配'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">申请人</div>
						<div class="info-value">{record.applicant?.name ?? '-'} ({record.applicant?.department ?? '-'})</div>
					</div>
					<div class="info-item">
						<div class="info-label">申请车辆</div>
						<div class="info-value">{record.vehicle?.plateNumber ?? '-'} ({record.vehicle?.vehicleType ?? '-'})</div>
					</div>
					<div class="info-item">
						<div class="info-label">用车目的</div>
						<div class="info-value">{record.purpose}</div>
					</div>
					<div class="info-item">
						<div class="info-label">所属部门</div>
						<div class="info-value">{record.department}</div>
					</div>
					<div class="info-item">
						<div class="info-label">申请时间</div>
						<div class="info-value">{formatDate(record.usageStartTime)} ~ {formatDate(record.usageEndTime)}</div>
					</div>
					<div class="info-item">
						<div class="info-label">实际时间</div>
						<div class="info-value">
							{record.actualStartTime && record.actualEndTime
								? `${formatDate(record.actualStartTime)} ~ ${formatDate(record.actualEndTime)}`
								: '未填写'}
						</div>
					</div>
					<div class="info-item">
						<div class="info-label">申请里程</div>
						<div class="info-value">{record.appliedMileage} km</div>
					</div>
					<div class="info-item">
						<div class="info-label">实际里程</div>
						<div class="info-value">{record.actualMileage} km</div>
					</div>
					<div class="info-item">
						<div class="info-label">里程差异</div>
						<div class="info-value" class:mileage-highlight={isMileageSignificant}>
							{mileageDiff >= 0 ? '+' : ''}{mileageDiff.toFixed(1)} km
							{#if isMileageSignificant}
								<span class="badge badge-red ml-sm">差异显著</span>
							{/if}
						</div>
					</div>
					<div class="info-item">
						<div class="info-label">结论</div>
						<div class="info-value">{record.conclusion ?? '待确认'}</div>
					</div>
					<div class="info-item">
						<div class="info-label">采用依据</div>
						<div class="info-value">{record.basis ?? '未填写'}</div>
					</div>
				</div>
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

			{#if activeTab === 'business'}
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
			{/if}

			{#if activeTab === 'onsite'}
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
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-state">暂无违章信息</div>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	.detail-page {
		max-width: 1100px;
		margin: 0 auto;
	}

	.detail-header {
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--spacing-lg);
		box-shadow: var(--shadow-sm);
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

	.tab-bar {
		display: flex;
		border-bottom: 1px solid var(--color-border);
		padding: 0 var(--spacing-lg);
		overflow-x: auto;
	}

	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-lg);
	}

	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.info-label {
		font-size: 0.8125rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.info-value {
		font-size: 0.9375rem;
		color: var(--color-text);
	}

	.mileage-highlight {
		color: var(--color-danger);
		font-weight: 600;
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

	.step-list {
		padding-left: var(--spacing-lg);
		margin-top: var(--spacing-xs);
	}

	.step-list li {
		margin-bottom: var(--spacing-xs);
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: var(--spacing-2xl);
		color: var(--color-text-muted);
		font-size: 0.9375rem;
	}

	.fine-amount {
		color: var(--color-danger);
		font-weight: 600;
	}

	.penalty-points {
		color: var(--color-warning);
		font-weight: 600;
	}

	.btn-warning {
		background-color: var(--color-warning);
		color: #ffffff;
		border-color: var(--color-warning);
	}

	.btn-warning:hover:not(:disabled) {
		background-color: #b45309;
		border-color: #b45309;
	}

	.file-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.info-grid {
			grid-template-columns: 1fr;
		}

		.header-title-row h1 {
			font-size: 1.125rem;
		}
	}
</style>
