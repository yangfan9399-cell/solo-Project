<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { draftsStore, versionsStore, reviewsStore, anomaliesStore } from '$lib/stores/appStore';
	import { generateId } from '$lib/stores/storage';
	import { 
		getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, 
		formatDate, getShapeLabel, generateExportFilename, downloadFile 
	} from '$lib/utils/helpers';
	import { 
		generateSealSvg, generateBorderAssessment, generateZhuBaiAnalysis,
		generateDensityAssessment, generateKnifeTechniqueSuggestion, getScriptTypeName 
	} from '$lib/utils/sealGenerator';
	import VersionHistory from '$lib/components/VersionHistory.svelte';
	import ZhuBaiAnalysisPanel from '$lib/components/ZhuBaiAnalysisPanel.svelte';
	import BorderAssessmentPanel from '$lib/components/BorderAssessmentPanel.svelte';
	import DensityPanel from '$lib/components/DensityPanel.svelte';
	import KnifeTechniquePanel from '$lib/components/KnifeTechniquePanel.svelte';
	import ReviewPanel from '$lib/components/ReviewPanel.svelte';
	import type { DraftExport, SealDraft, DraftVersion, Review, ReviewComment, DraftStatus, ZhuBaiAnalysis, BorderAssessment, DensityAssessment, KnifeTechniqueSuggestion } from '$lib/types';
	
	let activeTab = 'zhubai';
	let selectedVersionId = '';
	let showExportMenu = false;
	let isEditing = false;
	let hasUnsavedChanges = false;
	let showNewVersionModal = false;
	let newVersionSummary = '';
	let showReviewModal = false;
	let showEditInfo = false;
	
	let editDraft: Partial<SealDraft> = {};
	let editVersion: {
		zhuBai: ZhuBaiAnalysis;
		border: BorderAssessment;
		density: DensityAssessment;
		knifeTechnique: KnifeTechniqueSuggestion;
	} | null = null;
	
	let originalDraft: SealDraft | null = null;
	let originalVersion: DraftVersion | null = null;
	
	const tabs = [
		{ id: 'zhubai', label: '朱白文分析', icon: '🔴' },
		{ id: 'border', label: '边栏评估', icon: '🔲' },
		{ id: 'density', label: '疏密评估', icon: '📊' },
		{ id: 'knife', label: '刀法建议', icon: '🔪' },
		{ id: 'review', label: '评审记录', icon: '✍️' }
	];
	
	$: draft = $draftsStore.find(d => d.id === $page.params.id);
	
	$: draftVersions = $versionsStore.filter(v => v.draftId === $page.params.id)
		.sort((a, b) => a.versionNumber - b.versionNumber);
	
	$: currentVersion = selectedVersionId
		? draftVersions.find(v => v.id === selectedVersionId)
		: draftVersions.find(v => v.isCurrent) || draftVersions[0];
	
	$: draftReviews = $reviewsStore.filter(r => r.draftId === $page.params.id)
		.sort((a, b) => b.createdAt - a.createdAt);
	
	$: if (draft && !selectedVersionId && draft.currentVersionId) {
		selectedVersionId = draft.currentVersionId;
	}
	
	function selectVersion(versionId: string) {
		if (isEditing) {
			if (!confirm('当前有未保存的更改，切换版本将丢失更改。是否继续？')) {
				return;
			}
			cancelEdit();
		}
		selectedVersionId = versionId;
	}
	
	function startEdit() {
		if (!draft || !currentVersion) return;
		
		originalDraft = { ...draft };
		originalVersion = { ...currentVersion };
		
		editDraft = {
			title: draft.title,
			description: draft.description,
			tags: [...draft.tags],
			priority: draft.priority
		};
		
		editVersion = {
			zhuBai: JSON.parse(JSON.stringify(currentVersion.zhuBai)),
			border: JSON.parse(JSON.stringify(currentVersion.border)),
			density: JSON.parse(JSON.stringify(currentVersion.density)),
			knifeTechnique: JSON.parse(JSON.stringify(currentVersion.knifeTechnique))
		};
		
		isEditing = true;
		hasUnsavedChanges = false;
	}
	
	function cancelEdit() {
		editDraft = {};
		editVersion = null;
		originalDraft = null;
		originalVersion = null;
		isEditing = false;
		hasUnsavedChanges = false;
		showEditInfo = false;
	}
	
	function saveEdit() {
		if (!draft || !currentVersion || !editVersion) return;
		
		draftsStore.updateDraft(draft.id, {
			title: editDraft.title,
			description: editDraft.description,
			tags: editDraft.tags,
			priority: editDraft.priority
		});
		
		versionsStore.updateVersion(currentVersion.id, {
			zhuBai: editVersion.zhuBai,
			border: editVersion.border,
			density: editVersion.density,
			knifeTechnique: editVersion.knifeTechnique
		});
		
		anomaliesStore.addAnomaly({
			id: generateId(),
			draftId: draft.id,
			versionId: currentVersion.id,
			type: 'data_incomplete',
			severity: 'low',
			message: `印稿"${draft.title}"数据已更新`,
			details: { updatedAt: Date.now() },
			resolved: true,
			createdAt: Date.now()
		});
		
		cancelEdit();
	}
	
	function updateZhuBai(data: ZhuBaiAnalysis) {
		if (!editVersion) return;
		editVersion.zhuBai = data;
		hasUnsavedChanges = true;
	}
	
	function updateBorder(data: BorderAssessment) {
		if (!editVersion) return;
		editVersion.border = data;
		hasUnsavedChanges = true;
	}
	
	function updateDensity(data: DensityAssessment) {
		if (!editVersion) return;
		editVersion.density = data;
		hasUnsavedChanges = true;
	}
	
	function updateKnife(data: KnifeTechniqueSuggestion) {
		if (!editVersion) return;
		editVersion.knifeTechnique = data;
		hasUnsavedChanges = true;
	}
	
	function handleAddReview(review: Review) {
		reviewsStore.addReview(review);
		
		if (draft) {
			draftsStore.updateDraft(draft.id, {
				status: review.status,
				reviewCount: draft.reviewCount + 1
			});
			
			anomaliesStore.addAnomaly({
				id: generateId(),
				draftId: draft.id,
				versionId: review.versionId,
				type: review.status === 'rejected' ? 'score_outlier' : 'data_incomplete',
				severity: review.status === 'rejected' ? 'high' : 'low',
				message: `新评审已提交：${review.reviewer} - ${getStatusLabel(review.status)} (${review.overallScore}分)`,
				details: { reviewId: review.id, score: review.overallScore },
				resolved: review.status !== 'rejected',
				createdAt: Date.now()
			});
		}
	}
	
	function handleUpdateReview(id: string, updates: Partial<Review>) {
		reviewsStore.updateReview(id, updates);
		
		if (updates.status && draft) {
			draftsStore.updateDraft(draft.id, {
				status: updates.status as DraftStatus
			});
		}
	}
	
	function handleAddComment(reviewId: string, comment: ReviewComment) {
		reviewsStore.addComment(reviewId, comment);
	}
	
	function handleUpdateStatus(status: DraftStatus) {
		if (draft) {
			draftsStore.updateDraft(draft.id, { status });
		}
	}
	
	function openNewVersionModal() {
		if (isEditing) {
			if (!confirm('当前有未保存的更改，创建新版本将丢失更改。是否继续？')) {
				return;
			}
			cancelEdit();
		}
		newVersionSummary = '';
		showNewVersionModal = true;
	}
	
	function createNewVersion() {
		if (!draft || !currentVersion) return;
		
		const nextVersionNumber = draftVersions.length + 1;
		const chars = currentVersion.characters.map(c => c.character);
		
		const newImageData = generateSealSvg({
			shape: draft.shape,
			scriptType: currentVersion.zhuBai.type,
			borderType: currentVersion.border.type,
			characters: chars,
			size: 200
		});
		
		const newVersion: DraftVersion = {
			id: generateId(),
			draftId: draft.id,
			versionNumber: nextVersionNumber,
			label: `V${nextVersionNumber}`,
			description: newVersionSummary || `基于${currentVersion.label}创建的新版本`,
			imageData: newImageData,
			characters: JSON.parse(JSON.stringify(currentVersion.characters)),
			border: generateBorderAssessment(currentVersion.border.type),
			zhuBai: generateZhuBaiAnalysis(currentVersion.zhuBai.type, chars.length),
			density: generateDensityAssessment(chars.length),
			knifeTechnique: generateKnifeTechniqueSuggestion(chars.length),
			createdAt: Date.now(),
			createdBy: draft.creator,
			parentVersionId: currentVersion.id,
			changeSummary: newVersionSummary ? [newVersionSummary] : [],
			isCurrent: true
		};
		
		versionsStore.setCurrentVersion(draft.id, newVersion.id);
		versionsStore.addVersion(newVersion);
		
		draftsStore.updateDraft(draft.id, {
			currentVersionId: newVersion.id,
			versionCount: draft.versionCount + 1,
			status: 'draft'
		});
		
		anomaliesStore.addAnomaly({
			id: generateId(),
			draftId: draft.id,
			versionId: newVersion.id,
			type: 'data_incomplete',
			severity: 'medium',
			message: `新版本${newVersion.label}已创建`,
			details: { parentVersionId: currentVersion.id, changeSummary: newVersionSummary },
			resolved: false,
			createdAt: Date.now()
		});
		
		selectedVersionId = newVersion.id;
		showNewVersionModal = false;
		newVersionSummary = '';
	}
	
	function startReview() {
		activeTab = 'review';
	}
	
	function handleExport(format: 'json' | 'txt') {
		if (!draft || !currentVersion) return;
		
		if (format === 'json') {
			const exportData: DraftExport = {
				draft,
				versions: draftVersions,
				reviews: draftReviews,
				anomalies: [],
				exportedAt: Date.now(),
				formatVersion: '1.0'
			};
			const content = JSON.stringify(exportData, null, 2);
			const filename = generateExportFilename(draft.title, 'json');
			downloadFile(content, filename, 'application/json');
		} else {
			const content = generateTextSummary();
			const filename = generateExportFilename(draft.title, 'txt');
			downloadFile(content, filename, 'text/plain');
		}
		
		showExportMenu = false;
	}
	
	function generateTextSummary(): string {
		if (!draft || !currentVersion) return '';
		
		const lines: string[] = [];
		lines.push('='.repeat(50));
		lines.push(`  篆刻印稿评审摘要 - ${draft.title}`);
		lines.push('='.repeat(50));
		lines.push('');
		
		lines.push('【基本信息】');
		lines.push(`  印稿标题：${draft.title}`);
		lines.push(`  形状规格：${getShapeLabel(draft.shape)} ${draft.dimension.width}×${draft.dimension.height}${draft.dimension.unit}`);
		lines.push(`  朱白类型：${getScriptTypeName(currentVersion.zhuBai.type)}`);
		lines.push(`  当前版本：V${currentVersion.versionNumber} (${formatDate(currentVersion.createdAt)})`);
		lines.push(`  状态：${getStatusLabel(draft.status)}`);
		lines.push(`  创建者：${draft.creator}`);
		lines.push('');
		
		lines.push('【朱白文分析】');
		lines.push(`  朱白比例：朱文 ${Math.round(currentVersion.zhuBai.zhuRatio * 100)}% / 白文 ${Math.round(currentVersion.zhuBai.baiRatio * 100)}%`);
		lines.push(`  对比评分：${currentVersion.zhuBai.contrastScore}分`);
		lines.push(`  平衡评分：${currentVersion.zhuBai.balanceScore}分`);
		lines.push(`  分析说明：${currentVersion.zhuBai.notes}`);
		lines.push('');
		
		lines.push('【边栏评估】');
		lines.push(`  边栏类型：${currentVersion.border.type}`);
		lines.push(`  边栏粗细：${currentVersion.border.thickness.toFixed(1)}mm`);
		lines.push(`  平衡评分：${currentVersion.border.balanceScore}分`);
		lines.push(`  角部处理：${currentVersion.border.cornerTreatment}`);
		lines.push(`  评估说明：${currentVersion.border.notes}`);
		lines.push('');
		
		lines.push('【疏密评估】');
		lines.push(`  整体疏密：${currentVersion.density.overallLevel}`);
		lines.push(`  朱文密度：${currentVersion.density.zhuDensity}`);
		lines.push(`  白文密度：${currentVersion.density.baiDensity}`);
		lines.push(`  平衡评分：${currentVersion.density.balanceScore}分`);
		lines.push(`  评估说明：${currentVersion.density.notes}`);
		lines.push('');
		
		lines.push('【刀法建议】');
		lines.push(`  推荐刀法：${currentVersion.knifeTechnique.recommended}`);
		lines.push(`  难度等级：${currentVersion.knifeTechnique.difficultyLevel}/5`);
		lines.push(`  总笔画数：${currentVersion.knifeTechnique.strokeAnalysis.totalStrokes}`);
		lines.push('  刻制建议：');
		currentVersion.knifeTechnique.suggestions.forEach((s, i) => {
			lines.push(`    ${i + 1}. ${s}`);
		});
		lines.push('  注意事项：');
		currentVersion.knifeTechnique.warnings.forEach((w, i) => {
			lines.push(`    ${i + 1}. ${w}`);
		});
		lines.push('');
		
		if (draftReviews.length > 0) {
			lines.push('【评审记录】');
			lines.push(`  共 ${draftReviews.length} 次评审`);
			draftReviews.forEach((r, i) => {
				lines.push(`  ${i + 1}. ${r.reviewer} - ${getStatusLabel(r.status)} (${r.overallScore}分)`);
			});
			lines.push('');
		}
		
		lines.push('='.repeat(50));
		lines.push(`  导出时间：${formatDate(Date.now())}`);
		lines.push('='.repeat(50));
		
		return lines.join('\n');
	}
	
	function goBack() {
		if (isEditing && hasUnsavedChanges) {
			if (!confirm('当前有未保存的更改，是否放弃更改并返回？')) {
				return;
			}
		}
		window.history.back();
	}
	
	onMount(() => {
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			if (!target.closest('.export-wrapper')) {
				showExportMenu = false;
			}
		});
	});
</script>

<svelte:head>
	<title>{draft?.title || '印稿详情'} - 篆刻印稿布局评审平台</title>
</svelte:head>

{#if draft && currentVersion}
	<div class="detail-page">
		<div class="detail-header">
			<button class="back-btn" on:click={goBack}>
				<span>←</span>
				返回台账
			</button>
			
			<div class="draft-title-section">
				{#if isEditing}
					<input 
						type="text" 
						class="title-input"
						bind:value={editDraft.title}
						on:input={() => hasUnsavedChanges = true}
						placeholder="印稿标题"
					/>
				{:else}
					<h1 class="draft-title">{draft.title}</h1>
				{/if}
				<div class="draft-tags">
					<span class="status-badge" style="background-color: {getStatusColor(draft.status)}">
						{getStatusLabel(draft.status)}
					</span>
					<span class="priority-badge" style="background-color: {getPriorityColor(draft.priority)}">
						{getPriorityLabel(draft.priority)}优先级
					</span>
					{#each (isEditing ? (editDraft.tags || []) : draft.tags) as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
			
			<div class="header-actions">
				{#if isEditing}
					<button class="btn btn-outline" on:click={cancelEdit}>
						<span>✕</span>
						取消
					</button>
					<button 
						class="btn btn-primary" 
						on:click={saveEdit}
						disabled={!hasUnsavedChanges}
					>
						<span>💾</span>
						保存
					</button>
				{:else}
					<div class="export-wrapper">
						<button class="btn btn-outline" on:click={() => showExportMenu = !showExportMenu}>
							<span>📤</span>
							导出
						</button>
						{#if showExportMenu}
							<div class="export-menu" on:click|stopPropagation>
								<button class="export-item" on:click={() => handleExport('json')}>
									<span>📄</span>
									<div>
										<div class="export-name">JSON 格式</div>
										<div class="export-desc">完整数据导出</div>
									</div>
								</button>
								<button class="export-item" on:click={() => handleExport('txt')}>
									<span>📝</span>
									<div>
										<div class="export-name">文本摘要</div>
										<div class="export-desc">评审摘要导出</div>
									</div>
								</button>
							</div>
						{/if}
					</div>
					<button class="btn btn-outline" on:click={startEdit}>
						<span>✏️</span>
						编辑
					</button>
					<button class="btn btn-outline" on:click={openNewVersionModal}>
						<span>📋</span>
						新建版本
					</button>
					<button class="btn btn-primary" on:click={startReview}>
						<span>✍️</span>
						发起评审
					</button>
				{/if}
			</div>
		</div>
		
		{#if isEditing && hasUnsavedChanges}
			<div class="unsaved-banner">
				<span>⚠️ 有未保存的更改</span>
			</div>
		{/if}
		
		<div class="detail-content">
			<div class="main-area">
				<div class="seal-display-section">
					<div class="seal-display">
						<div class="seal-main">
							{@html currentVersion.imageData}
						</div>
						<div class="seal-info">
							<div class="info-row">
								<span class="info-label">版本</span>
								<span class="info-value">{currentVersion.label}</span>
							</div>
							<div class="info-row">
								<span class="info-label">形状</span>
								<span class="info-value">{getShapeLabel(draft.shape)}</span>
							</div>
							<div class="info-row">
								<span class="info-label">尺寸</span>
								<span class="info-value">{draft.dimension.width}×{draft.dimension.height} {draft.dimension.unit}</span>
							</div>
							<div class="info-row">
								<span class="info-label">朱白</span>
								<span class="info-value">{getScriptTypeName(currentVersion.zhuBai.type)}</span>
							</div>
							<div class="info-row">
								<span class="info-label">创建时间</span>
								<span class="info-value">{formatDate(currentVersion.createdAt)}</span>
							</div>
						</div>
					</div>
					
					<div class="description-section">
						<h3 class="section-title">设计说明</h3>
						{#if isEditing}
							<textarea 
								class="description-edit"
								bind:value={editDraft.description}
								on:input={() => hasUnsavedChanges = true}
								placeholder="请输入设计说明..."
								rows="4"
							></textarea>
						{:else}
							<p class="description-text">{draft.description}</p>
						{/if}
						{#if currentVersion.changeSummary.length > 0}
							<div class="change-log">
								<h4 class="change-title">本次更新</h4>
								<ul>
									{#each currentVersion.changeSummary as change}
										<li>{change}</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</div>
				
				<div class="analysis-tabs">
					<div class="tab-nav">
						{#each tabs as tab}
							<button 
								class="tab-btn {activeTab === tab.id ? 'active' : ''}" 
								on:click={() => activeTab = tab.id}
							>
								<span class="tab-icon">{tab.icon}</span>
								<span class="tab-label">{tab.label}</span>
							</button>
						{/each}
					</div>
					
					<div class="tab-content">
						{#if activeTab === 'zhubai'}
							<ZhuBaiAnalysisPanel 
								analysis={isEditing && editVersion ? editVersion.zhuBai : currentVersion.zhuBai}
								editable={isEditing}
								onChange={updateZhuBai}
							/>
						{:else if activeTab === 'border'}
							<BorderAssessmentPanel 
								border={isEditing && editVersion ? editVersion.border : currentVersion.border}
								editable={isEditing}
								onChange={updateBorder}
							/>
						{:else if activeTab === 'density'}
							<DensityPanel 
								density={isEditing && editVersion ? editVersion.density : currentVersion.density}
								editable={isEditing}
								onChange={updateDensity}
							/>
						{:else if activeTab === 'knife'}
							<KnifeTechniquePanel 
								technique={isEditing && editVersion ? editVersion.knifeTechnique : currentVersion.knifeTechnique}
								editable={isEditing}
								onChange={updateKnife}
							/>
						{:else if activeTab === 'review'}
							<ReviewPanel 
								reviews={draftReviews}
								draftId={draft.id}
								versionId={currentVersion.id}
								editable={true}
								onAddReview={handleAddReview}
								onUpdateReview={handleUpdateReview}
								onAddComment={handleAddComment}
								onUpdateStatus={handleUpdateStatus}
							/>
						{/if}
					</div>
				</div>
			</div>
			
			<div class="sidebar-area">
				<VersionHistory
					versions={draftVersions}
					currentVersionId={currentVersion.id}
					onSelect={selectVersion}
				/>
				
				<div class="info-card">
					<h4 class="card-title">项目信息</h4>
					<div class="info-list">
						<div class="info-item">
							<span class="info-label">创建者</span>
							<span class="info-value">{draft.creator}</span>
						</div>
						<div class="info-item">
							<span class="info-label">负责人</span>
							<span class="info-value">{draft.owner}</span>
						</div>
						<div class="info-item">
							<span class="info-label">创建时间</span>
							<span class="info-value">{formatDate(draft.createdAt)}</span>
						</div>
						<div class="info-item">
							<span class="info-label">更新时间</span>
							<span class="info-value">{formatDate(draft.updatedAt)}</span>
						</div>
						{#if draft.dueDate}
							<div class="info-item">
								<span class="info-label">截止日期</span>
								<span class="info-value">{formatDate(draft.dueDate)}</span>
							</div>
						{/if}
						{#if draft.batchId}
							<div class="info-item">
								<span class="info-label">批次</span>
								<span class="info-value batch">{draft.batchId}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
	
	{#if showNewVersionModal}
		<div class="modal-overlay" on:click={() => showNewVersionModal = false}>
			<div class="modal-content" on:click|stopPropagation>
				<h3 class="modal-title">新建版本</h3>
				<p class="modal-desc">
					基于当前版本 <strong>{currentVersion.label}</strong> 创建新版本
				</p>
				<div class="form-group">
					<label class="form-label">变更摘要</label>
					<textarea 
						class="form-textarea"
						bind:value={newVersionSummary}
						placeholder="请输入本次版本的变更内容..."
						rows="4"
					></textarea>
				</div>
				<div class="modal-actions">
					<button class="btn btn-outline" on:click={() => showNewVersionModal = false}>
						取消
					</button>
					<button class="btn btn-primary" on:click={createNewVersion}>
						<span>📋</span>
						创建新版本
					</button>
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="loading">
		<p>加载中...</p>
	</div>
{/if}

<style>
	.detail-page {
		min-height: 100vh;
		background-color: var(--color-bg);
	}
	
	.detail-header {
		background-color: var(--color-bg-card);
		border-bottom: 1px solid var(--color-border-light);
		padding: 16px 24px;
		display: flex;
		align-items: center;
		gap: 20px;
		position: sticky;
		top: 0;
		z-index: 50;
	}
	
	.back-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background-color: transparent;
		color: var(--color-text-secondary);
		font-size: 14px;
		transition: all var(--transition-fast);
		cursor: pointer;
	}
	
	.back-btn:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	
	.draft-title-section {
		flex: 1;
		min-width: 0;
	}
	
	.draft-title {
		font-size: 22px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 8px 0;
	}
	
	.title-input {
		font-size: 22px;
		font-weight: 600;
		color: var(--color-text);
		padding: 4px 8px;
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-sm);
		background-color: var(--color-bg);
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 8px;
	}
	
	.draft-tags {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	
	.status-badge,
	.priority-badge {
		padding: 3px 10px;
		border-radius: var(--radius-full);
		font-size: 12px;
		font-weight: 500;
		color: white;
	}
	
	.tag {
		padding: 2px 8px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-sm);
		font-size: 12px;
		color: var(--color-text-secondary);
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.export-wrapper {
		position: relative;
	}
	
	.export-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 240px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		border: 1px solid var(--color-border-light);
		overflow: hidden;
		z-index: 100;
	}
	
	.export-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px 16px;
		text-align: left;
		transition: background-color var(--transition-fast);
		border: none;
		background: none;
		cursor: pointer;
	}
	
	.export-item:hover {
		background-color: var(--color-bg);
	}
	
	.export-item > span:first-child {
		font-size: 24px;
	}
	
	.export-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.export-desc {
		font-size: 12px;
		color: var(--color-text-muted);
		margin-top: 2px;
	}
	
	.unsaved-banner {
		background-color: var(--color-warning-bg);
		color: var(--color-warning-text);
		padding: 8px 24px;
		font-size: 13px;
		font-weight: 500;
		text-align: center;
		border-bottom: 1px solid var(--color-warning-border);
	}
	
	.detail-content {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 24px;
		padding: 24px;
		align-items: start;
	}
	
	.main-area {
		display: flex;
		flex-direction: column;
		gap: 24px;
		min-width: 0;
	}
	
	.seal-display-section {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}
	
	.seal-display {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	
	.seal-main {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
		min-height: 240px;
	}
	
	.seal-main :global(svg) {
		width: 200px;
		height: 200px;
	}
	
	.seal-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.info-row:last-child {
		border-bottom: none;
	}
	
	.info-label {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.info-value {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.info-value.batch {
		font-family: var(--font-mono);
		background-color: var(--color-bg-alt);
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-size: 12px;
	}
	
	.description-section {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 20px;
	}
	
	.section-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 10px 0;
	}
	
	.description-text {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.7;
		margin: 0;
	}
	
	.description-edit {
		width: 100%;
		padding: 10px 12px;
		border: 2px solid var(--color-primary);
		border-radius: var(--radius-sm);
		font-size: 14px;
		color: var(--color-text);
		background-color: var(--color-bg);
		font-family: inherit;
		line-height: 1.7;
		resize: vertical;
		box-sizing: border-box;
	}
	
	.change-log {
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--color-border-light);
	}
	
	.change-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 8px 0;
	}
	
	.change-log ul {
		margin: 0;
		padding-left: 20px;
	}
	
	.change-log li {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin-bottom: 4px;
	}
	
	.analysis-tabs {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	
	.tab-nav {
		display: flex;
		border-bottom: 1px solid var(--color-border-light);
		background-color: var(--color-bg);
		overflow-x: auto;
	}
	
	.tab-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 12px 18px;
		font-size: 13px;
		color: var(--color-text-secondary);
		white-space: nowrap;
		border-bottom: 2px solid transparent;
		transition: all var(--transition-fast);
		border: none;
		background: none;
		cursor: pointer;
	}
	
	.tab-btn:hover {
		color: var(--color-text);
		background-color: rgba(0, 0, 0, 0.02);
	}
	
	.tab-btn.active {
		color: var(--color-primary);
		border-bottom-color: var(--color-primary);
		background-color: var(--color-bg-card);
	}
	
	.tab-icon {
		font-size: 16px;
	}
	
	.tab-content {
		padding: 20px;
	}
	
	.sidebar-area {
		display: flex;
		flex-direction: column;
		gap: 20px;
		position: sticky;
		top: 80px;
	}
	
	.info-card {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	
	.card-title {
		padding: 14px 16px;
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		border-bottom: 1px solid var(--color-border-light);
		background-color: var(--color-bg);
	}
	
	.info-list {
		padding: 12px 16px;
	}
	
	.info-item {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
	}
	
	.info-item .info-label {
		font-size: 12px;
	}
	
	.info-item .info-value {
		font-size: 12px;
	}
	
	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		color: var(--color-text-muted);
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		padding: 24px;
		width: 100%;
		max-width: 480px;
		box-shadow: var(--shadow-xl);
	}
	
	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 8px 0;
	}
	
	.modal-desc {
		font-size: 14px;
		color: var(--color-text-secondary);
		margin: 0 0 20px 0;
	}
	
	.form-group {
		margin-bottom: 20px;
	}
	
	.form-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: 6px;
	}
	
	.form-textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 14px;
		color: var(--color-text);
		background-color: var(--color-bg);
		font-family: inherit;
		line-height: 1.6;
		resize: vertical;
		box-sizing: border-box;
	}
	
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	.modal-actions {
		display: flex;
		gap: 10px;
		justify-content: flex-end;
	}
</style>