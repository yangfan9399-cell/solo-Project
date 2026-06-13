<script lang="ts">
	import { currentUser } from '$lib/stores';
	import type { RecordStatus, VehicleUsageRecord, BusinessRecord, OnSiteExplanation, EvidenceAttachment } from '$lib/types';

	let { data } = $props();

	let record = $state<VehicleUsageRecord>(data.record);
	let activeTab = $state('business');
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let submitting = $state(false);
	let showConfirmDialog = $state(false);

	let businessForm = $state({ recordType: '出车记录', content: '' });
	let explanationForm = $state({ content: '' });
	let evidenceForm = $state({ fileName: '', fileType: '图片', fileSize: 0, description: '' });
	let keyFieldsForm = $state({
		actualStartTime: '',
		actualEndTime: '',
		actualMileage: 0,
		conclusion: ''
	});

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

	const recordTypes = ['出车记录', '返程记录', '加油记录', '维修记录', '其他'];
	const fileTypes = ['图片', '文档', '视频', '音频', '其他'];

	const tabs = [
		{ key: 'business', label: '补充业务记录' },
		{ key: 'explanation', label: '现场说明' },
		{ key: 'evidence', label: '证据附件' },
		{ key: 'keyfields', label: '修改关键字段' }
	];

	let canProcess = $derived(record.status === 'PROCESSING');
	let isArchived = $derived(record.status === 'ARCHIVED');

	$effect(() => {
		if (record) {
			keyFieldsForm.actualStartTime = record.actualStartTime ?? '';
			keyFieldsForm.actualEndTime = record.actualEndTime ?? '';
			keyFieldsForm.actualMileage = record.actualMileage ?? 0;
			keyFieldsForm.conclusion = record.conclusion ?? '';
		}
	});

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

	async function postAction(action: string, payload: Record<string, unknown> = {}) {
		submitting = true;
		try {
			const res = await fetch(`/api/records/${record.id}/process`, {
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

	async function handleAddBusinessRecord() {
		if (!businessForm.content.trim()) {
			showMessage('error', '请填写记录内容');
			return;
		}
		const ok = await postAction('add_business_record', {
			recordType: businessForm.recordType,
			content: businessForm.content
		});
		if (ok) {
			businessForm.content = '';
		}
	}

	async function handleAddExplanation() {
		if (!explanationForm.content.trim()) {
			showMessage('error', '请填写说明内容');
			return;
		}
		const ok = await postAction('add_explanation', {
			content: explanationForm.content
		});
		if (ok) {
			explanationForm.content = '';
		}
	}

	async function handleAddEvidence() {
		if (!evidenceForm.fileName.trim()) {
			showMessage('error', '请填写文件名称');
			return;
		}
		const ok = await postAction('add_evidence', {
			fileName: evidenceForm.fileName,
			fileType: evidenceForm.fileType,
			fileSize: evidenceForm.fileSize,
			description: evidenceForm.description
		});
		if (ok) {
			evidenceForm = { fileName: '', fileType: '图片', fileSize: 0, description: '' };
		}
	}

	async function handleSaveKeyFields() {
		submitting = true;
		try {
			const res = await fetch(`/api/records/${record.id}/update`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: $currentUser.id,
					actualStartTime: keyFieldsForm.actualStartTime || null,
					actualEndTime: keyFieldsForm.actualEndTime || null,
					actualMileage: keyFieldsForm.actualMileage,
					conclusion: keyFieldsForm.conclusion || null
				})
			});
			if (res.ok) {
				await refreshRecord();
				showMessage('success', '关键字段已保存');
			} else {
				const err = await res.json();
				showMessage('error', err.error || '保存失败');
			}
		} catch {
			showMessage('error', '网络错误，请重试');
		} finally {
			submitting = false;
		}
	}

	async function handleSubmitForReview() {
		showConfirmDialog = false;
		const ok = await postAction('submit_for_review');
		if (ok) {
			showMessage('success', '已提交复核');
		}
	}
</script>

<div class="process-page">
	{#if message}
		<div class="alert {message.type === 'success' ? 'alert-info' : 'alert-danger'} message-bar">
			{message.type === 'success' ? '✅' : '❌'} {message.text}
		</div>
	{/if}

	<div class="process-header">
		<nav class="breadcrumb">
			<a href="/records">记录列表</a>
			<span class="breadcrumb-sep">›</span>
			<a href="/records/{record.id}">{record.title}</a>
			<span class="breadcrumb-sep">›</span>
			<span class="breadcrumb-current">处理台</span>
		</nav>

		<div class="header-title-row mt-sm">
			<h1>{record.title}</h1>
			<span class="badge {statusColors[record.status as RecordStatus]}">
				{statusLabels[record.status as RecordStatus] ?? record.status}
			</span>
		</div>

		{#if record.blockingReason}
			<div class="blocking-banner mt-md">
				<div class="blocking-title">
					🚫 阻断原因
				</div>
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

	{#if !canProcess && !isArchived}
		<div class="alert alert-warning mt-md">
			⚠️ 当前记录状态为「{statusLabels[record.status as RecordStatus] ?? record.status}」，无法进行操作。仅「处理中」状态的记录可以进行操作。
		</div>
	{:else if isArchived}
		<div class="alert alert-info mt-md">
			📋 此记录已归档，仅供查看，无法修改。
		</div>
	{/if}

	{#if !isArchived}
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
				{#if activeTab === 'business'}
					<div class="form-section">
						<h3 class="form-section-title">添加业务记录</h3>
						<div class="form-group">
							<label class="form-label">记录类型</label>
							<select class="form-select" bind:value={businessForm.recordType} disabled={!canProcess}>
								{#each recordTypes as t}
									<option value={t}>{t}</option>
								{/each}
							</select>
						</div>
						<div class="form-group">
							<label class="form-label">内容 <span class="required">*</span></label>
							<textarea class="form-textarea" bind:value={businessForm.content} placeholder="请输入业务记录内容" disabled={!canProcess}></textarea>
						</div>
						<button class="btn btn-primary" onclick={handleAddBusinessRecord} disabled={!canProcess || submitting}>
							添加记录
						</button>
					</div>

					<div class="existing-section mt-lg">
						<h4 class="section-subtitle">已有业务记录</h4>
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
				{/if}

				{#if activeTab === 'explanation'}
					<div class="form-section">
						<h3 class="form-section-title">添加现场说明</h3>
						<div class="form-group">
							<label class="form-label">说明内容 <span class="required">*</span></label>
							<textarea class="form-textarea" bind:value={explanationForm.content} placeholder="请输入现场说明内容" disabled={!canProcess}></textarea>
						</div>
						<button class="btn btn-primary" onclick={handleAddExplanation} disabled={!canProcess || submitting}>
							添加说明
						</button>
					</div>

					<div class="existing-section mt-lg">
						<h4 class="section-subtitle">已有现场说明</h4>
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
					<div class="form-section">
						<h3 class="form-section-title">添加证据附件</h3>
						<div class="grid grid-2">
							<div class="form-group">
								<label class="form-label">文件名称</label>
								<input type="text" class="form-input" bind:value={evidenceForm.fileName} placeholder="请输入文件名称" disabled={!canProcess} />
							</div>
							<div class="form-group">
								<label class="form-label">文件类型</label>
								<select class="form-select" bind:value={evidenceForm.fileType} disabled={!canProcess}>
									{#each fileTypes as ft}
										<option value={ft}>{ft}</option>
									{/each}
								</select>
							</div>
							<div class="form-group">
								<label class="form-label">文件大小 (KB)</label>
								<input type="number" class="form-input" bind:value={evidenceForm.fileSize} min="0" placeholder="0" disabled={!canProcess} />
							</div>
						</div>
						<div class="form-group">
							<label class="form-label">描述</label>
							<textarea class="form-textarea" bind:value={evidenceForm.description} placeholder="请输入附件描述（可选）" disabled={!canProcess}></textarea>
						</div>
						<button class="btn btn-primary" onclick={handleAddEvidence} disabled={!canProcess || submitting}>
							添加附件
						</button>
					</div>

					<div class="existing-section mt-lg">
						<h4 class="section-subtitle">已有证据附件</h4>
						{#if record.evidenceAttachments && record.evidenceAttachments.length > 0}
							<div class="record-list">
								{#each record.evidenceAttachments as ea}
									<div class="record-list-item">
										<div class="flex items-center gap-sm">
											<div class="flex-1">
												<div class="font-medium">{ea.fileName}</div>
												<div class="text-xs text-secondary">
													{ea.fileType} · {ea.fileSize} KB
												</div>
											</div>
										</div>
										{#if ea.description}
											<div class="text-sm text-secondary mt-sm">{ea.description}</div>
										{/if}
										<div class="flex items-center justify-between mt-sm">
											<span class="text-xs text-secondary">
												上传人: {ea.uploader?.name ?? '-'}
											</span>
											<span class="text-xs text-muted">{formatDate(ea.createdAt)}</span>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<div class="empty-state">暂无证据附件</div>
						{/if}
					</div>
				{/if}

				{#if activeTab === 'keyfields'}
					<div class="form-section">
						<h3 class="form-section-title">修改关键字段</h3>
						<div class="alert alert-warning mb-md">
							⚠️ 修改关键字段将被记录在变更历史中，请谨慎操作。
						</div>
						<div class="key-fields-grid">
							<div class="form-group">
								<label class="form-label">实际开始时间</label>
								<input type="datetime-local" class="form-input" bind:value={keyFieldsForm.actualStartTime} disabled={!canProcess} />
							</div>
							<div class="form-group">
								<label class="form-label">实际结束时间</label>
								<input type="datetime-local" class="form-input" bind:value={keyFieldsForm.actualEndTime} disabled={!canProcess} />
							</div>
							<div class="form-group">
								<label class="form-label">实际里程 (km)</label>
								<input type="number" class="form-input" bind:value={keyFieldsForm.actualMileage} min="0" disabled={!canProcess} />
							</div>
							<div class="form-group">
								<label class="form-label">结论</label>
								<textarea class="form-textarea" bind:value={keyFieldsForm.conclusion} placeholder="请输入结论" disabled={!canProcess}></textarea>
							</div>
						</div>
						<button class="btn btn-primary" onclick={handleSaveKeyFields} disabled={!canProcess || submitting}>
							保存修改
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if canProcess}
		<div class="submit-section mt-md">
			<button class="btn btn-success btn-lg submit-btn" onclick={() => (showConfirmDialog = true)} disabled={submitting}>
				提交复核
			</button>
		</div>
	{/if}

	{#if showConfirmDialog}
		<div class="dialog-overlay" onclick={() => (showConfirmDialog = false)}>
			<div class="dialog-box" onclick|stopPropagation>
				<h3>确认提交复核</h3>
				<p class="mt-sm">提交后将进入复核流程，确认要提交吗？</p>
				<div class="dialog-actions mt-md">
					<button class="btn btn-outline" onclick={() => (showConfirmDialog = false)}>取消</button>
					<button class="btn btn-success" onclick={handleSubmitForReview} disabled={submitting}>确认提交</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.process-page {
		max-width: 1100px;
		margin: 0 auto;
	}

	.process-header {
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

	.tab-bar {
		display: flex;
		border-bottom: 1px solid var(--color-border);
		padding: 0 var(--spacing-lg);
		overflow-x: auto;
	}

	.form-section {
		padding: var(--spacing-md);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		background-color: var(--color-bg);
	}

	.form-section-title {
		font-size: 1rem;
		margin-bottom: var(--spacing-md);
		color: var(--color-primary);
	}

	.required {
		color: var(--color-danger);
	}

	.existing-section {
		border-top: 1px solid var(--color-border-light);
		padding-top: var(--spacing-lg);
	}

	.section-subtitle {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
		margin-bottom: var(--spacing-md);
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

	.key-fields-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--spacing-md);
	}

	.key-fields-grid .form-group:last-child {
		grid-column: 1 / -1;
	}

	.submit-section {
		display: flex;
		justify-content: center;
		padding: var(--spacing-lg);
	}

	.submit-btn {
		min-width: 200px;
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
		min-width: 360px;
		box-shadow: var(--shadow-lg);
	}

	.dialog-box h3 {
		font-size: 1.125rem;
	}

	.dialog-box p {
		color: var(--color-text-secondary);
		font-size: 0.9375rem;
	}

	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--spacing-sm);
	}

	@media (max-width: 640px) {
		.header-title-row h1 {
			font-size: 1.125rem;
		}

		.key-fields-grid {
			grid-template-columns: 1fr;
		}

		.dialog-box {
			min-width: auto;
			margin: var(--spacing-md);
		}
	}
</style>
