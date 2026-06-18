<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { draftsStore, versionsStore, reviewsStore } from '$lib/stores/appStore';
	import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor, formatDate, getShapeLabel, generateExportFilename, downloadFile } from '$lib/utils/helpers';
	import VersionHistory from '$lib/components/VersionHistory.svelte';
	import ZhuBaiAnalysisPanel from '$lib/components/ZhuBaiAnalysisPanel.svelte';
	import BorderAssessmentPanel from '$lib/components/BorderAssessmentPanel.svelte';
	import DensityPanel from '$lib/components/DensityPanel.svelte';
	import KnifeTechniquePanel from '$lib/components/KnifeTechniquePanel.svelte';
	import ReviewPanel from '$lib/components/ReviewPanel.svelte';
	import { getScriptTypeName } from '$lib/utils/sealGenerator';
	import type { DraftExport } from '$lib/types';
	
	let activeTab = 'zhubai';
	let selectedVersionId = '';
	let showExportMenu = false;
	
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
		selectedVersionId = versionId;
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
		window.history.back();
	}
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
				<h1 class="draft-title">{draft.title}</h1>
				<div class="draft-tags">
					<span class="status-badge" style="background-color: {getStatusColor(draft.status)}">
						{getStatusLabel(draft.status)}
					</span>
					<span class="priority-badge" style="background-color: {getPriorityColor(draft.priority)}">
						{getPriorityLabel(draft.priority)}优先级
					</span>
					{#each draft.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			</div>
			
			<div class="header-actions">
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
				<button class="btn btn-primary">
					<span>✍️</span>
					发起评审
				</button>
			</div>
		</div>
		
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
						<p class="description-text">{draft.description}</p>
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
							<button class="tab-btn {activeTab === tab.id ? 'active' : ''}" on:click={() => activeTab = tab.id}>
								<span class="tab-icon">{tab.icon}</span>
								<span class="tab-label">{tab.label}</span>
							</button>
						{/each}
					</div>
					
					<div class="tab-content">
						{#if activeTab === 'zhubai'}
							<ZhuBaiAnalysisPanel analysis={currentVersion.zhuBai} />
						{:else if activeTab === 'border'}
							<BorderAssessmentPanel border={currentVersion.border} />
						{:else if activeTab === 'density'}
							<DensityPanel density={currentVersion.density} />
						{:else if activeTab === 'knife'}
							<KnifeTechniquePanel technique={currentVersion.knifeTechnique} />
						{:else if activeTab === 'review'}
							<ReviewPanel reviews={draftReviews} />
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
</style>
