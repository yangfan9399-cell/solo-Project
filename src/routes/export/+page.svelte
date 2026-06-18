<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { draftsStore, versionsStore, reviewsStore, anomaliesStore } from '$lib/stores/appStore';
	import { generateExportFilename, downloadFile, formatDate } from '$lib/utils/helpers';
	import type { DraftExport, SealDraft, DraftVersion, Review, Anomaly } from '$lib/types';
	
	let selectedFormat = 'json';
	let includeVersions = true;
	let includeReviews = true;
	let includeAnomalies = false;
	
	const formatOptions = [
		{ value: 'json', label: 'JSON 格式', desc: '完整结构化数据，可用于备份和迁移' },
		{ value: 'txt', label: '文本摘要', desc: '人类可读的评审摘要文档' }
	];
	
	$: totalDrafts = $draftsStore.length;
	$: totalVersions = $versionsStore.length;
	$: totalReviews = $reviewsStore.length;
	$: totalAnomalies = $anomaliesStore.length;
	
	$: exportCount = `共 ${totalDrafts} 个印稿` +
		(includeVersions ? `，${totalVersions} 个版本` : '') +
		(includeReviews ? `，${totalReviews} 条评审` : '');
	
	function handleExport() {
		if (selectedFormat === 'json') {
			exportJson();
		} else {
			exportText();
		}
	}
	
	function exportJson() {
		const exportData: DraftExport = {
			draft: $draftsStore[0] || ({} as SealDraft),
			versions: includeVersions ? $versionsStore : [],
			reviews: includeReviews ? $reviewsStore : [],
			anomalies: includeAnomalies ? $anomaliesStore : [],
			exportedAt: Date.now(),
			formatVersion: '1.0'
		};
		
		const content = JSON.stringify({
			drafts: $draftsStore,
			versions: includeVersions ? $versionsStore : [],
			reviews: includeReviews ? $reviewsStore : [],
			anomalies: includeAnomalies ? $anomaliesStore : [],
			exportedAt: Date.now(),
			formatVersion: '1.0'
		}, null, 2);
		
		const filename = `seal_drafts_export_${formatDate(Date.now()).replace(/[-: ]/g, '')}.json`;
		downloadFile(content, filename, 'application/json');
	}
	
	function exportText() {
		const lines: string[] = [];
		lines.push('='.repeat(60));
		lines.push('  篆刻印稿布局评审平台 - 数据导出摘要');
		lines.push('='.repeat(60));
		lines.push('');
		lines.push(`  导出时间：${formatDate(Date.now())}`);
		lines.push(`  印稿数量：${totalDrafts} 个`);
		if (includeVersions) lines.push(`  版本数量：${totalVersions} 个`);
		if (includeReviews) lines.push(`  评审数量：${totalReviews} 条`);
		if (includeAnomalies) lines.push(`  异常记录：${totalAnomalies} 条`);
		lines.push('');
		lines.push('='.repeat(60));
		lines.push('');
		
		$draftsStore.forEach((draft, index) => {
			const versions = $versionsStore.filter(v => v.draftId === draft.id);
			const reviews = $reviewsStore.filter(r => r.draftId === draft.id);
			
			lines.push(`【${index + 1}】${draft.title}`);
			lines.push('-'.repeat(40));
			lines.push(`  状态：${getStatusText(draft.status)}`);
			lines.push(`  形状：${getShapeText(draft.shape)}`);
			lines.push(`  版本数：${draft.versionCount}`);
			lines.push(`  评审数：${draft.reviewCount}`);
			lines.push(`  创建者：${draft.creator}`);
			lines.push(`  创建时间：${formatDate(draft.createdAt)}`);
			lines.push('');
			lines.push(`  描述：${draft.description}`);
			lines.push('');
			
			if (includeVersions && versions.length > 0) {
				lines.push('  版本列表：');
				versions.forEach(v => {
					lines.push(`    ${v.label} - ${v.description}`);
					lines.push(`      朱白类型：${v.zhuBai.type}，疏密：${v.density.overallLevel}`);
				});
				lines.push('');
			}
			
			if (includeReviews && reviews.length > 0) {
				lines.push('  评审记录：');
				reviews.forEach(r => {
					lines.push(`    ${r.reviewer} - ${getStatusText(r.status)} (${r.overallScore}分)`);
				});
				lines.push('');
			}
			
			lines.push('');
		});
		
		lines.push('='.repeat(60));
		lines.push('  导出完成');
		lines.push('='.repeat(60));
		
		const content = lines.join('\n');
		const filename = `seal_drafts_summary_${formatDate(Date.now()).replace(/[-: ]/g, '')}.txt`;
		downloadFile(content, filename, 'text/plain');
	}
	
	function getStatusText(status: string): string {
		const labels: Record<string, string> = {
			draft: '草稿',
			submitted: '已提交',
			reviewing: '评审中',
			approved: '已通过',
			rejected: '已驳回',
			archived: '已归档'
		};
		return labels[status] || status;
	}
	
	function getShapeText(shape: string): string {
		const labels: Record<string, string> = {
			square: '方形',
			rectangle: '长方形',
			round: '圆形',
			oval: '椭圆形',
			irregular: '随形'
		};
		return labels[shape] || shape;
	}
</script>

<svelte:head>
	<title>导出中心 - 篆刻印稿布局评审平台</title>
</svelte:head>

<Header>
	<span slot="title">导出中心</span>
	<span slot="subtitle">导出印稿数据和评审摘要</span>
</Header>

<div class="page-content">
	<div class="export-layout">
		<div class="export-main">
			<div class="card">
				<div class="card-header">
					<h3 class="card-title">导出设置</h3>
				</div>
				<div class="card-body">
					<div class="form-group">
						<label class="form-label">导出格式</label>
						<div class="format-options">
							{#each formatOptions as format}
								<label class="format-card {selectedFormat === format.value ? 'selected' : ''}">
									<input type="radio" bind:group={selectedFormat} value={format.value}>
									<div class="format-content">
										<span class="format-icon">{format.value === 'json' ? '📄' : '📝'}</span>
										<span class="format-name">{format.label}</span>
										<span class="format-desc">{format.desc}</span>
									</div>
								</label>
							{/each}
						</div>
					</div>
					
					<div class="form-group">
						<label class="form-label">包含内容</label>
						<div class="checkbox-group">
							<label class="checkbox-item">
								<input type="checkbox" bind:checked={includeVersions}>
								<span class="checkbox-label">版本历史</span>
								<span class="checkbox-count">({totalVersions})</span>
							</label>
							<label class="checkbox-item">
								<input type="checkbox" bind:checked={includeReviews}>
								<span class="checkbox-label">评审记录</span>
								<span class="checkbox-count">({totalReviews})</span>
							</label>
							<label class="checkbox-item">
								<input type="checkbox" bind:checked={includeAnomalies}>
								<span class="checkbox-label">异常记录</span>
								<span class="checkbox-count">({totalAnomalies})</span>
							</label>
						</div>
					</div>
					
					<div class="export-info">
						<div class="info-icon">ℹ️</div>
						<p class="info-text">{exportCount}</p>
					</div>
					
					<button class="btn btn-primary w-full" on:click={handleExport}>
						<span>📤</span>
						导出数据
					</button>
				</div>
			</div>
			
			<div class="card">
				<div class="card-header">
					<h3 class="card-title">批量操作</h3>
				</div>
				<div class="card-body">
					<div class="action-list">
						<div class="action-item">
							<div class="action-icon">📦</div>
							<div class="action-info">
								<h4 class="action-title">导出全部数据</h4>
								<p class="action-desc">导出所有印稿、版本和评审数据的完整备份</p>
							</div>
							<button class="btn btn-outline btn-sm" on:click={exportJson}>
								导出 JSON
							</button>
						</div>
						
						<div class="action-item">
							<div class="action-icon">📊</div>
							<div class="action-info">
								<h4 class="action-title">生成评审摘要</h4>
								<p class="action-desc">生成所有印稿的评审摘要文本报告</p>
							</div>
							<button class="btn btn-outline btn-sm" on:click={exportText}>
								生成摘要
							</button>
						</div>
						
						<div class="action-item">
							<div class="action-icon">🔄</div>
							<div class="action-info">
								<h4 class="action-title">重置示例数据</h4>
								<p class="action-desc">将数据恢复为初始示例状态</p>
							</div>
							<button class="btn btn-secondary btn-sm" on:click={() => {
								if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
									localStorage.clear();
									window.location.reload();
								}
							}}>
								重置数据
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		
		<div class="export-sidebar">
			<div class="card">
				<div class="card-header">
					<h3 class="card-title">数据概览</h3>
				</div>
				<div class="card-body">
					<div class="overview-list">
						<div class="overview-item">
							<span class="overview-label">印稿总数</span>
							<span class="overview-value">{totalDrafts}</span>
						</div>
						<div class="overview-item">
							<span class="overview-label">版本总数</span>
							<span class="overview-value">{totalVersions}</span>
						</div>
						<div class="overview-item">
							<span class="overview-label">评审总数</span>
							<span class="overview-value">{totalReviews}</span>
						</div>
						<div class="overview-item">
							<span class="overview-label">异常记录</span>
							<span class="overview-value">{totalAnomalies}</span>
						</div>
					</div>
				</div>
			</div>
			
			<div class="card">
				<div class="card-header">
					<h3 class="card-title">格式说明</h3>
				</div>
				<div class="card-body">
					<div class="format-desc-list">
						<div class="desc-item">
							<h5 class="desc-title">JSON 格式</h5>
							<p class="desc-text">
								完整的结构化数据导出，包含所有印稿、版本、评审等信息。
								可用于数据备份、系统迁移或进一步分析。
							</p>
						</div>
						<div class="desc-item">
							<h5 class="desc-title">文本摘要</h5>
							<p class="desc-text">
								人类可读的文本格式，包含印稿基本信息、评审结果和评分摘要。
								适合打印存档或邮件分享。
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.page-content {
		padding: 24px;
	}
	
	.export-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 24px;
		align-items: start;
	}
	
	.export-main {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	
	.card {
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	
	.card-header {
		padding: 14px 20px;
		border-bottom: 1px solid var(--color-border-light);
		background-color: var(--color-bg);
	}
	
	.card-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.card-body {
		padding: 20px;
	}
	
	.form-group {
		margin-bottom: 20px;
	}
	
	.form-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-secondary);
		margin-bottom: 10px;
	}
	
	.format-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	
	.format-card {
		position: relative;
		display: block;
		padding: 16px;
		border: 2px solid var(--color-border);
		border-radius: var(--radius);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	
	.format-card:hover {
		border-color: var(--color-primary-light);
	}
	
	.format-card.selected {
		border-color: var(--color-primary);
		background-color: rgba(196, 30, 58, 0.03);
	}
	
	.format-card input {
		position: absolute;
		opacity: 0;
		pointer-events: none;
	}
	
	.format-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		text-align: center;
	}
	
	.format-icon {
		font-size: 28px;
	}
	
	.format-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.format-desc {
		font-size: 12px;
		color: var(--color-text-muted);
		line-height: 1.4;
	}
	
	.checkbox-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	
	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
		cursor: pointer;
		transition: background-color var(--transition-fast);
	}
	
	.checkbox-item:hover {
		background-color: var(--color-bg-alt);
	}
	
	.checkbox-item input {
		cursor: pointer;
	}
	
	.checkbox-label {
		flex: 1;
		font-size: 13px;
		color: var(--color-text);
	}
	
	.checkbox-count {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.export-info {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 12px 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
		border-left: 3px solid var(--color-info);
		margin-bottom: 16px;
	}
	
	.info-icon {
		font-size: 18px;
	}
	
	.info-text {
		font-size: 13px;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}
	
	.w-full {
		width: 100%;
	}
	
	.action-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.action-item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px;
		background-color: var(--color-bg);
		border-radius: var(--radius);
	}
	
	.action-icon {
		font-size: 24px;
		flex-shrink: 0;
	}
	
	.action-info {
		flex: 1;
		min-width: 0;
	}
	
	.action-title {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
		margin: 0 0 2px 0;
	}
	
	.action-desc {
		font-size: 12px;
		color: var(--color-text-muted);
		margin: 0;
		line-height: 1.4;
	}
	
	.export-sidebar {
		display: flex;
		flex-direction: column;
		gap: 20px;
		position: sticky;
		top: 80px;
	}
	
	.overview-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	
	.overview-item {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.overview-item:last-child {
		border-bottom: none;
	}
	
	.overview-label {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.overview-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.format-desc-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	
	.desc-item {
		padding-bottom: 14px;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.desc-item:last-child {
		padding-bottom: 0;
		border-bottom: none;
	}
	
	.desc-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 6px 0;
	}
	
	.desc-text {
		font-size: 12px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}
</style>
