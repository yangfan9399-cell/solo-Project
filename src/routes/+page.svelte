<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import DraftCard from '$lib/components/DraftCard.svelte';
	import { filteredDrafts, versionsStore, draftsStore, anomaliesStore, filterStore } from '$lib/stores/appStore';
	import { generateId } from '$lib/stores/storage';
	import { resetSampleData } from '$lib/utils/sampleData';
	import { 
		generateSealSvg, generateBorderAssessment, generateZhuBaiAnalysis,
		generateDensityAssessment, generateKnifeTechniqueSuggestion,
		getScriptTypeName, getBorderName, generateCharacterPositions
	} from '$lib/utils/sealGenerator';
	import type { SealDraft, DraftVersion, SealShape, SealScriptType, BorderType, Priority } from '$lib/types';
	import { getShapeLabel } from '$lib/utils/helpers';
	
	let showCreateModal = false;
	
	let newDraft = {
		title: '',
		description: '',
		characters: '',
		shape: 'square' as SealShape,
		scriptType: 'zhuwen' as SealScriptType,
		borderType: 'single' as BorderType,
		priority: 'medium' as Priority,
		tags: ''
	};
	
	const shapeOptions: { value: SealShape; label: string; icon: string }[] = [
		{ value: 'square', label: '方形', icon: '⬜' },
		{ value: 'rectangle', label: '长方', icon: '▭' },
		{ value: 'round', label: '圆形', icon: '⭕' },
		{ value: 'oval', label: '椭圆', icon: '⬭' },
		{ value: 'irregular', label: '随形', icon: '⬠' }
	];
	
	const scriptTypeOptions: { value: SealScriptType; label: string }[] = [
		{ value: 'zhuwen', label: '朱文（阳刻）' },
		{ value: 'baiwen', label: '白文（阴刻）' },
		{ value: 'mixed', label: '朱白相间' }
	];
	
	const borderTypeOptions: { value: BorderType; label: string }[] = [
		{ value: 'none', label: '无边' },
		{ value: 'single', label: '单边' },
		{ value: 'double', label: '双边' },
		{ value: 'thick', label: '粗边' },
		{ value: 'broken', label: '残破边' }
	];
	
	const priorityOptions: { value: Priority; label: string }[] = [
		{ value: 'high', label: '高' },
		{ value: 'medium', label: '中' },
		{ value: 'low', label: '低' }
	];
	
	$: charsArray = newDraft.characters
		.replace(/\s+/g, '')
		.split('')
		.filter(c => c);
	
	$: previewSvg = charsArray.length > 0
		? generateSealSvg({
				shape: newDraft.shape,
				scriptType: newDraft.scriptType,
				borderType: newDraft.borderType,
				characters: charsArray,
				size: 200
			})
		: '';
	
	function handleReset() {
		if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
			resetSampleData();
			window.location.reload();
		}
	}
	
	function openCreateModal() {
		newDraft = {
			title: '',
			description: '',
			characters: '',
			shape: 'square',
			scriptType: 'zhuwen',
			borderType: 'single',
			priority: 'medium',
			tags: ''
		};
		showCreateModal = true;
	}
	
	function closeCreateModal() {
		showCreateModal = false;
	}
	
	function createDraft() {
		if (!newDraft.title || charsArray.length === 0) return;
		
		const now = Date.now();
		const draftId = generateId();
		const versionId = generateId();
		
		const imageData = generateSealSvg({
			shape: newDraft.shape,
			scriptType: newDraft.scriptType,
			borderType: newDraft.borderType,
			characters: charsArray,
			size: 300
		});
		
		const tags = newDraft.tags
			.split(/[,，]/)
			.map(t => t.trim())
			.filter(t => t);
		
		const draft: SealDraft = {
			id: draftId,
			title: newDraft.title,
			description: newDraft.description,
			shape: newDraft.shape,
			dimension: {
				width: newDraft.shape === 'rectangle' ? 40 : 25,
				height: newDraft.shape === 'rectangle' ? 25 : 25,
				unit: 'mm'
			},
			status: 'draft',
			priority: newDraft.priority,
			creator: '张治印',
			owner: '李印人',
			tags,
			currentVersionId: versionId,
			versionCount: 1,
			reviewCount: 0,
			createdAt: now,
			updatedAt: now
		};
		
		const version: DraftVersion = {
			id: versionId,
			draftId,
			versionNumber: 1,
			label: 'V1',
			description: `${newDraft.title} - 初稿`,
			imageData,
			characters: generateCharacterPositions({
				shape: newDraft.shape,
				scriptType: newDraft.scriptType,
				borderType: newDraft.borderType,
				characters: charsArray,
				size: 300
			}),
			border: generateBorderAssessment(newDraft.borderType),
			zhuBai: generateZhuBaiAnalysis(newDraft.scriptType, charsArray.length),
			density: generateDensityAssessment(charsArray.length),
			knifeTechnique: generateKnifeTechniqueSuggestion(charsArray.length),
			createdAt: now,
			createdBy: draft.creator,
			changeSummary: ['初始版本', '确定印面布局', '选择边栏样式'],
			isCurrent: true
		};
		
		draftsStore.addDraft(draft);
		versionsStore.addVersion(version);
		
		anomaliesStore.addAnomaly({
			id: generateId(),
			draftId,
			versionId,
			type: 'data_incomplete',
			severity: 'medium',
			message: `新印稿"${newDraft.title}"已创建`,
			details: { characterCount: charsArray.length, shape: newDraft.shape },
			resolved: false,
			createdAt: now
		});
		
		showCreateModal = false;
		goto(`/draft/${draftId}`);
	}
</script>

<svelte:head>
	<title>印稿台账 - 篆刻印稿布局评审平台</title>
</svelte:head>

<Header>
	<span slot="title">印稿台账</span>
	<span slot="subtitle">管理所有篆刻印稿设计项目</span>
</Header>

<div class="page-content">
	<StatsGrid />
	
	<div class="page-header">
		<h2 class="section-title">印稿列表</h2>
		<div class="header-actions">
			<button class="btn btn-secondary btn-sm" on:click={handleReset}>重置数据</button>
			<button class="btn btn-primary btn-sm" on:click={openCreateModal}>
				<span>+ 新建印稿</span>
			</button>
		</div>
	</div>
	
	<FilterBar />
	
	<div class="drafts-grid">
		{#each $filteredDrafts as draft}
			{@const version = $versionsStore.find(v => v.id === draft.currentVersionId)}
			<DraftCard {draft} {version} />
		{:else}
			<div class="empty-state">
			<div class="empty-state-icon">📭</div>
			<p>没有找到符合条件的印稿</p>
			<button class="btn btn-secondary btn-sm mt-3">清除筛选条件</button>
		</div>
		{/each}
	</div>
	
	{#if $filteredDrafts.length > 0}
		<div class="list-footer">
			<span class="result-count">共 {$filteredDrafts.length} 条记录</span>
		</div>
	{/if}
</div>

{#if showCreateModal}
	<div class="modal-overlay" on:click={closeCreateModal}>
		<div class="modal-content large" on:click|stopPropagation>
			<div class="modal-header">
				<h3 class="modal-title">新建印稿</h3>
				<button class="close-btn" on:click={closeCreateModal}>✕</button>
			</div>
			
			<div class="modal-body">
				<div class="create-form-grid">
					<div class="form-section">
						<div class="form-group">
							<label class="form-label">印稿标题 <span class="required">*</span></label>
							<input 
								type="text" 
								class="form-input"
								bind:value={newDraft.title}
								placeholder="请输入印稿标题"
							/>
						</div>
						
						<div class="form-group">
							<label class="form-label">印文内容 <span class="required">*</span></label>
							<input 
								type="text" 
								class="form-input"
								bind:value={newDraft.characters}
								placeholder="请输入印章文字，如：墨云轩主"
							/>
							<p class="form-hint">已输入 {charsArray.length} 个字</p>
						</div>
						
						<div class="form-group">
							<label class="form-label">设计说明</label>
							<textarea 
								class="form-textarea"
								bind:value={newDraft.description}
								placeholder="请输入设计说明..."
								rows="3"
							></textarea>
						</div>
						
						<div class="form-group">
							<label class="form-label">标签</label>
							<input 
								type="text" 
								class="form-input"
								bind:value={newDraft.tags}
								placeholder="多个标签用逗号分隔，如：闲章, 朱文, 四字印"
							/>
						</div>
						
						<div class="form-row">
							<div class="form-group">
								<label class="form-label">形状</label>
								<div class="shape-options">
									{#each shapeOptions as opt}
										<label class="shape-option {newDraft.shape === opt.value ? 'active' : ''}">
											<input 
												type="radio" 
												bind:group={newDraft.shape} 
												value={opt.value}
												class="hidden"
											/>
											<span class="shape-icon">{opt.icon}</span>
											<span class="shape-label">{opt.label}</span>
										</label>
									{/each}
								</div>
							</div>
						</div>
						
						<div class="form-row">
							<div class="form-group flex-1">
								<label class="form-label">朱白类型</label>
								<select class="form-input" bind:value={newDraft.scriptType}>
									{#each scriptTypeOptions as opt}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							</div>
							<div class="form-group flex-1">
								<label class="form-label">边栏类型</label>
								<select class="form-input" bind:value={newDraft.borderType}>
									{#each borderTypeOptions as opt}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							</div>
						</div>
						
						<div class="form-group">
							<label class="form-label">优先级</label>
							<div class="priority-options">
								{#each priorityOptions as opt}
									<label class="priority-option {newDraft.priority === opt.value ? 'active' : ''}">
										<input 
											type="radio" 
											bind:group={newDraft.priority} 
											value={opt.value}
											class="hidden"
										/>
										<span>{opt.label}</span>
									</label>
								{/each}
							</div>
						</div>
					</div>
					
					<div class="preview-section">
						<h4 class="preview-title">实时预览</h4>
						<div class="preview-box">
							{#if previewSvg}
								<div class="seal-preview">
									{@html previewSvg}
								</div>
								<div class="preview-info">
									<div class="info-item">
										<span class="info-label">形状</span>
										<span class="info-value">{getShapeLabel(newDraft.shape)}</span>
									</div>
									<div class="info-item">
										<span class="info-label">朱白</span>
										<span class="info-value">{getScriptTypeName(newDraft.scriptType)}</span>
									</div>
									<div class="info-item">
										<span class="info-label">边栏</span>
										<span class="info-value">{getBorderName(newDraft.borderType)}</span>
									</div>
								</div>
							{:else}
								<div class="preview-placeholder">
									<span class="placeholder-icon">🔮</span>
									<p>输入印文内容后<br/>此处将显示预览</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
			
			<div class="modal-footer">
				<button class="btn btn-outline" on:click={closeCreateModal}>取消</button>
				<button 
					class="btn btn-primary" 
					on:click={createDraft}
					disabled={!newDraft.title || charsArray.length === 0}
				>
					<span>✨</span>
					创建印稿
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-content {
		padding: 24px;
	}
	
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	
	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.header-actions {
		display: flex;
		gap: 10px;
	}
	
	.drafts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
	}
	
	.empty-state {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: var(--color-text-muted);
		text-align: center;
		background-color: var(--color-bg-card);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	
	.empty-state-icon {
		font-size: 48px;
		margin-bottom: 12px;
		opacity: 0.6;
	}
	
	.list-footer {
		margin-top: 20px;
		text-align: center;
	}
	
	.result-count {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.mt-3 {
		margin-top: 12px;
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
		padding: 20px;
	}
	
	.modal-content {
		background-color: var(--color-bg-card);
		border-radius: var(--radius-md);
		width: 100%;
		max-width: 560px;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-xl);
	}
	
	.modal-content.large {
		max-width: 880px;
	}
	
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.close-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		cursor: pointer;
		border-radius: var(--radius-sm);
		font-size: 16px;
		color: var(--color-text-muted);
		transition: all var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.close-btn:hover {
		background-color: var(--color-bg-alt);
		color: var(--color-text);
	}
	
	.modal-body {
		padding: 24px;
		overflow-y: auto;
		flex: 1;
	}
	
	.modal-footer {
		padding: 16px 24px;
		border-top: 1px solid var(--color-border-light);
		display: flex;
		gap: 10px;
		justify-content: flex-end;
	}
	
	.create-form-grid {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 24px;
	}
	
	.form-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.form-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.required {
		color: var(--color-danger);
	}
	
	.form-input {
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 14px;
		color: var(--color-text);
		background-color: var(--color-bg);
		transition: border-color var(--transition-fast);
	}
	
	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	.form-textarea {
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 14px;
		color: var(--color-text);
		background-color: var(--color-bg);
		font-family: inherit;
		line-height: 1.6;
		resize: vertical;
		transition: border-color var(--transition-fast);
	}
	
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	.form-hint {
		font-size: 12px;
		color: var(--color-text-muted);
		margin: 0;
	}
	
	.form-row {
		display: flex;
		gap: 12px;
	}
	
	.flex-1 {
		flex: 1;
	}
	
	.hidden {
		display: none;
	}
	
	.shape-options {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	
	.shape-option {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		min-width: 60px;
	}
	
	.shape-option:hover {
		border-color: var(--color-primary-light);
		background-color: var(--color-bg);
	}
	
	.shape-option.active {
		border-color: var(--color-primary);
		background-color: var(--color-primary-bg);
	}
	
	.shape-icon {
		font-size: 20px;
	}
	
	.shape-label {
		font-size: 11px;
		color: var(--color-text-secondary);
	}
	
	.priority-options {
		display: flex;
		gap: 8px;
	}
	
	.priority-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-size: 13px;
		color: var(--color-text-secondary);
		transition: all var(--transition-fast);
	}
	
	.priority-option:hover {
		border-color: var(--color-primary-light);
	}
	
	.priority-option.active {
		border-color: var(--color-primary);
		background-color: var(--color-primary-bg);
		color: var(--color-primary);
		font-weight: 500;
	}
	
	.preview-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.preview-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.preview-box {
		background-color: var(--color-bg);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		padding: 20px;
		min-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
	
	.seal-preview {
		margin-bottom: 16px;
	}
	
	.seal-preview :global(svg) {
		width: 180px;
		height: 180px;
	}
	
	.preview-info {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.preview-info .info-item {
		display: flex;
		justify-content: space-between;
		padding: 6px 0;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.preview-info .info-label {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.preview-info .info-value {
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.preview-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: var(--color-text-muted);
	}
	
	.placeholder-icon {
		font-size: 48px;
		margin-bottom: 12px;
		opacity: 0.5;
	}
	
	.preview-placeholder p {
		font-size: 13px;
		margin: 0;
		line-height: 1.6;
	}
</style>
