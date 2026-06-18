<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import { reviewsStore, draftsStore, versionsStore } from '$lib/stores/appStore';
	import { formatDate, getStatusLabel, getStatusColor } from '$lib/utils/helpers';
	
	let filterStatus = 'all';
	
	const statusOptions = [
		{ value: 'all', label: '全部评审' },
		{ value: 'reviewing', label: '评审中' },
		{ value: 'approved', label: '已通过' },
		{ value: 'rejected', label: '已驳回' }
	];
	
	$: filteredReviews = filterStatus === 'all'
		? $reviewsStore
		: $reviewsStore.filter(r => r.status === filterStatus);
	
	$: sortedReviews = [...filteredReviews].sort((a, b) => b.createdAt - a.createdAt);
	
	function getDraftById(id: string) {
		return $draftsStore.find(d => d.id === id);
	}
	
	function getVersionById(id: string) {
		return $versionsStore.find(v => v.id === id);
	}
</script>

<svelte:head>
	<title>评审中心 - 篆刻印稿布局评审平台</title>
</svelte:head>

<Header>
	<span slot="title">评审中心</span>
	<span slot="subtitle">管理和查看所有印稿评审任务</span>
</Header>

<div class="page-content">
	<div class="page-header">
		<h2 class="section-title">评审列表</h2>
		<div class="filter-bar">
			<select class="form-control filter-select" bind:value={filterStatus}>
				{#each statusOptions as opt}
					<option value={opt.value}>{opt.label}</option>
				{/each}
			</select>
			<span class="result-count">共 {sortedReviews.length} 条</span>
		</div>
	</div>
	
	<div class="review-list">
		{#each sortedReviews as review}
			{@const draft = getDraftById(review.draftId)}
			{@const version = getVersionById(review.versionId)}
			{#if draft}
				<a href={`/draft/${draft.id}`} class="review-card">
					<div class="review-card-header">
						<div class="draft-info">
							{#if version}
								<div class="seal-thumb">
									{@html version.imageData}
								</div>
							{/if}
							<div class="draft-meta">
								<h3 class="draft-title">{draft.title}</h3>
								<div class="draft-sub">
									<span>{version?.label || '未知版本'}</span>
									<span>·</span>
									<span>{draft.creator} 提交</span>
								</div>
							</div>
						</div>
						<div class="review-status" style="background-color: {getStatusColor(review.status)}">
							{getStatusLabel(review.status)}
						</div>
					</div>
					
					<div class="review-card-body">
						<div class="score-overview">
							<div class="score-main">
								<span class="score-label">综合评分</span>
								<span class="score-value">{review.overallScore}</span>
							</div>
							<div class="score-bars">
								<div class="score-item">
									<span class="s-label">布局</span>
									<div class="s-bar">
										<div class="s-fill" style="width: {review.layoutScore}%"></div>
									</div>
									<span class="s-num">{review.layoutScore}</span>
								</div>
								<div class="score-item">
									<span class="s-label">朱白</span>
									<div class="s-bar">
										<div class="s-fill" style="width: {review.zhuBaiScore}%"></div>
									</div>
									<span class="s-num">{review.zhuBaiScore}</span>
								</div>
								<div class="score-item">
									<span class="s-label">边栏</span>
									<div class="s-bar">
										<div class="s-fill" style="width: {review.borderScore}%"></div>
									</div>
									<span class="s-num">{review.borderScore}</span>
								</div>
								<div class="score-item">
									<span class="s-label">疏密</span>
									<div class="s-bar">
										<div class="s-fill" style="width: {review.densityScore}%"></div>
									</div>
									<span class="s-num">{review.densityScore}</span>
								</div>
								<div class="score-item">
									<span class="s-label">刀法</span>
									<div class="s-bar">
										<div class="s-fill" style="width: {review.knifeScore}%"></div>
									</div>
									<span class="s-num">{review.knifeScore}</span>
								</div>
							</div>
						</div>
						
						<div class="review-summary-box">
							<div class="reviewer-row">
								<div class="avatar">{review.reviewer.charAt(0)}</div>
								<div class="reviewer-info">
									<span class="reviewer-name">{review.reviewer}</span>
									<span class="review-time">{formatDate(review.createdAt)}</span>
								</div>
							</div>
							<p class="summary-text">{review.summary}</p>
							{#if review.comments.length > 0}
								<span class="comment-count">{review.comments.length} 条意见</span>
							{/if}
						</div>
					</div>
				</a>
			{/if}
		{:else}
			<div class="empty-state">
				<div class="empty-state-icon">📝</div>
				<p>暂无评审记录</p>
			</div>
		{/each}
	</div>
</div>

<style>
	.page-content {
		padding: 24px;
	}
	
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
	}
	
	.section-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.filter-bar {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.filter-select {
		min-width: 140px;
	}
	
	.result-count {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.review-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.review-card {
		display: block;
		background-color: var(--color-bg-card);
		border: 1px solid var(--color-border-light);
		border-radius: var(--radius-md);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: all var(--transition);
		box-shadow: var(--shadow-sm);
	}
	
	.review-card:hover {
		box-shadow: var(--shadow-md);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}
	
	.review-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--color-border-light);
		background-color: var(--color-bg);
	}
	
	.draft-info {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	
	.seal-thumb {
		width: 48px;
		height: 48px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
	}
	
	.seal-thumb :global(svg) {
		width: 100%;
		height: 100%;
	}
	
	.draft-meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.draft-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.draft-sub {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.review-status {
		padding: 5px 12px;
		border-radius: var(--radius-full);
		font-size: 12px;
		font-weight: 500;
		color: white;
	}
	
	.review-card-body {
		padding: 16px 20px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
	}
	
	.score-overview {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	
	.score-main {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}
	
	.score-label {
		font-size: 13px;
		color: var(--color-text-muted);
	}
	
	.score-value {
		font-size: 32px;
		font-weight: 700;
		color: var(--color-primary);
		line-height: 1;
	}
	
	.score-bars {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.score-item {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.s-label {
		width: 36px;
		font-size: 12px;
		color: var(--color-text-secondary);
	}
	
	.s-bar {
		flex: 1;
		height: 8px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-full);
		overflow: hidden;
	}
	
	.s-fill {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
		border-radius: var(--radius-full);
	}
	
	.s-num {
		width: 28px;
		text-align: right;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-secondary);
	}
	
	.review-summary-box {
		padding-left: 20px;
		border-left: 1px solid var(--color-border-light);
	}
	
	.reviewer-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	
	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background-color: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 500;
		flex-shrink: 0;
	}
	
	.reviewer-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	
	.reviewer-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.review-time {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.summary-text {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0 0 8px 0;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.comment-count {
		font-size: 12px;
		color: var(--color-primary);
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: var(--color-text-muted);
		background-color: var(--color-bg-card);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
	}
	
	.empty-state-icon {
		font-size: 48px;
		margin-bottom: 12px;
		opacity: 0.6;
	}
</style>
