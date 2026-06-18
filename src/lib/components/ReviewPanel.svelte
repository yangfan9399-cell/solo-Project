<script lang="ts">
	import { generateId } from '$lib/stores/storage';
	import type { Review, ReviewComment, DraftStatus } from '$lib/types';
	import { formatDate, getStatusLabel, getStatusColor } from '$lib/utils/helpers';
	
	export let reviews: Review[];
	export let draftId: string;
	export let versionId: string;
	export let editable = false;
	export let onAddReview: ((review: Review) => void) | null = null;
	export let onUpdateReview: ((id: string, updates: Partial<Review>) => void) | null = null;
	export let onAddComment: ((reviewId: string, comment: ReviewComment) => void) | null = null;
	export let onUpdateStatus: ((status: DraftStatus) => void) | null = null;
	
	let showCreateForm = false;
	let creatingReview: Partial<Review> = {
		reviewer: '',
		status: 'reviewing',
		overallScore: 75,
		layoutScore: 75,
		zhuBaiScore: 75,
		borderScore: 75,
		densityScore: 75,
		knifeScore: 75,
		summary: '',
		comments: []
	};
	
	let addingCommentTo = '';
	let newComment: Partial<ReviewComment> = {
		author: '',
		content: '',
		topic: 'general',
		resolved: false
	};
	
	let editingReviewId = '';
	let editingReview: Partial<Review> = {};
	
	function getTopicLabel(topic: string): string {
		const labels: Record<string, string> = {
			layout: '布局',
			zhuBai: '朱白',
			border: '边栏',
			density: '疏密',
			knife: '刀法',
			general: '综合'
		};
		return labels[topic] || topic;
	}
	
	function startCreateReview() {
		creatingReview = {
			reviewer: '',
			status: 'reviewing',
			overallScore: 75,
			layoutScore: 75,
			zhuBaiScore: 75,
			borderScore: 75,
			densityScore: 75,
			knifeScore: 75,
			summary: '',
			comments: []
		};
		showCreateForm = true;
	}
	
	function cancelCreate() {
		showCreateForm = false;
	}
	
	function submitReview() {
		if (!creatingReview.reviewer || !creatingReview.summary) return;
		
		const now = Date.now();
		const newReview: Review = {
			id: generateId(),
			draftId,
			versionId,
			reviewer: creatingReview.reviewer,
			status: creatingReview.status as DraftStatus,
			overallScore: creatingReview.overallScore || 75,
			layoutScore: creatingReview.layoutScore || 75,
			zhuBaiScore: creatingReview.zhuBaiScore || 75,
			borderScore: creatingReview.borderScore || 75,
			densityScore: creatingReview.densityScore || 75,
			knifeScore: creatingReview.knifeScore || 75,
			comments: [],
			summary: creatingReview.summary || '',
			createdAt: now,
			updatedAt: now
		};
		
		onAddReview?.(newReview);
		showCreateForm = false;
	}
	
	function startEditReview(review: Review) {
		editingReviewId = review.id;
		editingReview = { ...review };
	}
	
	function cancelEdit() {
		editingReviewId = '';
		editingReview = {};
	}
	
	function saveEdit() {
		if (!editingReviewId) return;
		onUpdateReview?.(editingReviewId, editingReview);
		editingReviewId = '';
		editingReview = {};
	}
	
	function startAddComment(reviewId: string) {
		addingCommentTo = reviewId;
		newComment = {
			author: '',
			content: '',
			topic: 'general',
			resolved: false
		};
	}
	
	function cancelAddComment() {
		addingCommentTo = '';
	}
	
	function submitComment(reviewId: string) {
		if (!newComment.author || !newComment.content) return;
		
		const comment: ReviewComment = {
			id: generateId(),
			reviewId,
			author: newComment.author || '',
			content: newComment.content || '',
			createdAt: Date.now(),
			topic: newComment.topic as ReviewComment['topic'],
			resolved: false
		};
		
		onAddComment?.(reviewId, comment);
		addingCommentTo = '';
	}
	
	function updateOverallScore() {
		const scores = [
			editingReview.layoutScore || creatingReview.layoutScore || 0,
			editingReview.zhuBaiScore || creatingReview.zhuBaiScore || 0,
			editingReview.borderScore || creatingReview.borderScore || 0,
			editingReview.densityScore || creatingReview.densityScore || 0,
			editingReview.knifeScore || creatingReview.knifeScore || 0
		];
		const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
		if (editingReviewId) {
			editingReview.overallScore = avg;
		} else {
			creatingReview.overallScore = avg;
		}
	}
	
	function handleStatusChange(reviewId: string, newStatus: DraftStatus) {
		onUpdateReview?.(reviewId, { status: newStatus });
		if (onUpdateStatus) {
			onUpdateStatus(newStatus);
		}
	}
	
	function toggleCommentResolved(reviewId: string, commentId: string, resolved: boolean) {
		const review = reviews.find(r => r.id === reviewId);
		if (!review) return;
		
		const updatedComments = review.comments.map(c => 
			c.id === commentId ? { ...c, resolved } : c
		);
		
		onUpdateReview?.(reviewId, { comments: updatedComments });
	}
	
	function handleReviewStatusChange(e: Event, reviewId: string) {
		const target = e.target as HTMLSelectElement;
		handleStatusChange(reviewId, target.value as DraftStatus);
	}
	
	function handleCommentResolvedChange(e: Event, reviewId: string, commentId: string) {
		const target = e.target as HTMLInputElement;
		toggleCommentResolved(reviewId, commentId, target.checked);
	}
</script>

<div class="review-panel">
	<div class="panel-header">
		<h4 class="panel-title">评审记录</h4>
		{#if editable}
			<button class="btn btn-primary btn-sm" on:click={startCreateReview}>
				<span>✍️</span>
				发起评审
			</button>
		{/if}
	</div>
	
	{#if showCreateForm}
		<div class="review-form">
			<h5 class="form-title">新建评审</h5>
			
			<div class="form-group">
				<label class="form-label">评审人</label>
				<input 
					type="text" 
					class="form-input" 
					bind:value={creatingReview.reviewer}
					placeholder="请输入评审人姓名"
				/>
			</div>
			
			<div class="form-group">
				<label class="form-label">评审状态</label>
				<select class="form-input" bind:value={creatingReview.status}>
					<option value="reviewing">评审中</option>
					<option value="approved">通过</option>
					<option value="rejected">驳回</option>
				</select>
			</div>
			
			<div class="form-group">
				<label class="form-label">综合评分: {creatingReview.overallScore}</label>
				<input 
					type="range" 
					min="0" 
					max="100" 
					class="score-slider"
					bind:value={creatingReview.overallScore}
				/>
			</div>
			
			<div class="scores-edit-grid">
				<div class="score-edit-item">
					<label class="score-edit-label">布局: {creatingReview.layoutScore}</label>
					<input 
						type="range" 
						min="0" 
						max="100" 
						class="score-slider-sm"
						bind:value={creatingReview.layoutScore}
						on:input={updateOverallScore}
					/>
				</div>
				<div class="score-edit-item">
					<label class="score-edit-label">朱白: {creatingReview.zhuBaiScore}</label>
					<input 
						type="range" 
						min="0" 
						max="100" 
						class="score-slider-sm"
						bind:value={creatingReview.zhuBaiScore}
						on:input={updateOverallScore}
					/>
				</div>
				<div class="score-edit-item">
					<label class="score-edit-label">边栏: {creatingReview.borderScore}</label>
					<input 
						type="range" 
						min="0" 
						max="100" 
						class="score-slider-sm"
						bind:value={creatingReview.borderScore}
						on:input={updateOverallScore}
					/>
				</div>
				<div class="score-edit-item">
					<label class="score-edit-label">疏密: {creatingReview.densityScore}</label>
					<input 
						type="range" 
						min="0" 
						max="100" 
						class="score-slider-sm"
						bind:value={creatingReview.densityScore}
						on:input={updateOverallScore}
					/>
				</div>
				<div class="score-edit-item">
					<label class="score-edit-label">刀法: {creatingReview.knifeScore}</label>
					<input 
						type="range" 
						min="0" 
						max="100" 
						class="score-slider-sm"
						bind:value={creatingReview.knifeScore}
						on:input={updateOverallScore}
					/>
				</div>
			</div>
			
			<div class="form-group">
				<label class="form-label">评审意见</label>
				<textarea 
					class="form-textarea" 
					bind:value={creatingReview.summary}
					placeholder="请输入详细评审意见..."
					rows="4"
				></textarea>
			</div>
			
			<div class="form-actions">
				<button class="btn btn-outline btn-sm" on:click={cancelCreate}>取消</button>
				<button 
					class="btn btn-primary btn-sm" 
					on:click={submitReview}
					disabled={!creatingReview.reviewer || !creatingReview.summary}
				>
					提交评审
				</button>
			</div>
		</div>
	{/if}
	
	{#if reviews.length === 0 && !showCreateForm}
		<div class="empty-reviews">
			<span class="empty-icon">📝</span>
			<p>暂无评审记录</p>
			{#if editable}
				<button class="btn btn-primary btn-sm" on:click={startCreateReview}>发起评审</button>
			{/if}
		</div>
	{:else}
		<div class="review-list">
			{#each reviews as review}
				<div class="review-item">
					{#if editingReviewId === review.id}
						<div class="edit-form">
							<div class="form-group">
								<label class="form-label">评审状态</label>
								<select class="form-input" bind:value={editingReview.status}>
									<option value="reviewing">评审中</option>
									<option value="approved">通过</option>
									<option value="rejected">驳回</option>
								</select>
							</div>
							
							<div class="form-group">
								<label class="form-label">综合评分: {editingReview.overallScore}</label>
								<input 
									type="range" 
									min="0" 
									max="100" 
									class="score-slider"
									bind:value={editingReview.overallScore}
								/>
							</div>
							
							<div class="scores-edit-grid">
								<div class="score-edit-item">
									<label class="score-edit-label">布局: {editingReview.layoutScore}</label>
									<input 
										type="range" 
										min="0" 
										max="100" 
										class="score-slider-sm"
										bind:value={editingReview.layoutScore}
										on:input={updateOverallScore}
									/>
								</div>
								<div class="score-edit-item">
									<label class="score-edit-label">朱白: {editingReview.zhuBaiScore}</label>
									<input 
										type="range" 
										min="0" 
										max="100" 
										class="score-slider-sm"
										bind:value={editingReview.zhuBaiScore}
										on:input={updateOverallScore}
									/>
								</div>
								<div class="score-edit-item">
									<label class="score-edit-label">边栏: {editingReview.borderScore}</label>
									<input 
										type="range" 
										min="0" 
										max="100" 
										class="score-slider-sm"
										bind:value={editingReview.borderScore}
										on:input={updateOverallScore}
									/>
								</div>
								<div class="score-edit-item">
									<label class="score-edit-label">疏密: {editingReview.densityScore}</label>
									<input 
										type="range" 
										min="0" 
										max="100" 
										class="score-slider-sm"
										bind:value={editingReview.densityScore}
										on:input={updateOverallScore}
									/>
								</div>
								<div class="score-edit-item">
									<label class="score-edit-label">刀法: {editingReview.knifeScore}</label>
									<input 
										type="range" 
										min="0" 
										max="100" 
										class="score-slider-sm"
										bind:value={editingReview.knifeScore}
										on:input={updateOverallScore}
									/>
								</div>
							</div>
							
							<div class="form-group">
								<label class="form-label">评审意见</label>
								<textarea 
									class="form-textarea" 
									bind:value={editingReview.summary}
									rows="4"
								></textarea>
							</div>
							
							<div class="form-actions">
								<button class="btn btn-outline btn-sm" on:click={cancelEdit}>取消</button>
								<button class="btn btn-primary btn-sm" on:click={saveEdit}>保存修改</button>
							</div>
						</div>
					{:else}
						<div class="review-header">
							<div class="reviewer-info">
								<div class="avatar">{review.reviewer.charAt(0)}</div>
								<div class="reviewer-detail">
									<span class="reviewer-name">{review.reviewer}</span>
									<span class="review-date">{formatDate(review.createdAt)}</span>
								</div>
							</div>
							<div class="review-actions">
								{#if editable}
									<select 
										class="status-select"
										value={review.status}
										on:change={(e) => handleReviewStatusChange(e, review.id)}
									>
										<option value="reviewing">评审中</option>
										<option value="approved">通过</option>
										<option value="rejected">驳回</option>
									</select>
									<button class="icon-btn" on:click={() => startEditReview(review)} title="编辑">✏️</button>
								{:else}
									<span class="review-status" style="background-color: {getStatusColor(review.status)}">
										{getStatusLabel(review.status)}
									</span>
								{/if}
							</div>
						</div>
						
						<div class="review-scores">
							<div class="score-item">
								<span class="score-label">综合评分</span>
								<div class="score-bar-wrap">
									<div class="score-bar" style="width: {review.overallScore}%"></div>
									<span class="score-value">{review.overallScore}</span>
								</div>
							</div>
							<div class="score-grid">
								<div class="mini-score">
									<span class="mini-label">布局</span>
									<span class="mini-value">{review.layoutScore}</span>
								</div>
								<div class="mini-score">
									<span class="mini-label">朱白</span>
									<span class="mini-value">{review.zhuBaiScore}</span>
								</div>
								<div class="mini-score">
									<span class="mini-label">边栏</span>
									<span class="mini-value">{review.borderScore}</span>
								</div>
								<div class="mini-score">
									<span class="mini-label">疏密</span>
									<span class="mini-value">{review.densityScore}</span>
								</div>
								<div class="mini-score">
									<span class="mini-label">刀法</span>
									<span class="mini-value">{review.knifeScore}</span>
								</div>
							</div>
						</div>
						
						<div class="review-summary">
							<h5 class="summary-title">评审意见</h5>
							<p class="summary-text">{review.summary}</p>
						</div>
						
						{#if review.comments.length > 0}
							<div class="review-comments">
								<h5 class="comments-title">详细意见</h5>
								{#each review.comments as comment}
									<div class="comment-item {comment.resolved ? 'resolved' : ''}">
										<div class="comment-header">
											<span class="comment-author">{comment.author}</span>
											<span class="comment-topic">{getTopicLabel(comment.topic)}</span>
											{#if editable}
												<label class="resolve-checkbox">
													<input 
														type="checkbox" 
														checked={comment.resolved}
														on:change={(e) => handleCommentResolvedChange(e, review.id, comment.id)}
													/>
													{comment.resolved ? '已处理' : '待处理'}
												</label>
											{:else if comment.resolved}
												<span class="comment-status">已处理</span>
											{/if}
										</div>
										<p class="comment-content">{comment.content}</p>
									</div>
								{/each}
							</div>
						{/if}
						
						{#if editable && addingCommentTo === review.id}
							<div class="add-comment-form">
								<div class="form-row">
									<input 
										type="text" 
										class="form-input compact"
										bind:value={newComment.author}
										placeholder="评论人"
									/>
									<select 
										class="form-input compact"
										bind:value={newComment.topic}
									>
										<option value="general">综合</option>
										<option value="layout">布局</option>
										<option value="zhuBai">朱白</option>
										<option value="border">边栏</option>
										<option value="density">疏密</option>
										<option value="knife">刀法</option>
									</select>
								</div>
								<textarea 
									class="form-textarea compact"
									bind:value={newComment.content}
									placeholder="请输入评论内容..."
									rows="2"
								></textarea>
								<div class="form-actions">
									<button class="btn btn-outline btn-sm" on:click={cancelAddComment}>取消</button>
									<button 
										class="btn btn-primary btn-sm" 
										on:click={() => submitComment(review.id)}
										disabled={!newComment.author || !newComment.content}
									>
										添加评论
									</button>
								</div>
							</div>
						{/if}
						
						{#if editable && addingCommentTo !== review.id}
							<button class="btn btn-outline btn-sm add-comment-btn" on:click={() => startAddComment(review.id)}>
								<span>💬</span>
								添加评论
							</button>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.review-panel {
		padding: 4px;
	}
	
	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	
	.panel-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0;
	}
	
	.empty-reviews {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		background-color: var(--color-bg);
		border-radius: var(--radius-md);
		text-align: center;
	}
	
	.empty-icon {
		font-size: 40px;
		margin-bottom: 12px;
		opacity: 0.5;
	}
	
	.empty-reviews p {
		color: var(--color-text-muted);
		margin: 0 0 16px 0;
	}
	
	.review-form,
	.edit-form {
		background-color: var(--color-bg);
		border-radius: var(--radius);
		padding: 20px;
		border: 2px solid var(--color-primary-light);
		margin-bottom: 16px;
	}
	
	.form-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 16px 0;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--color-border-light);
	}
	
	.form-group {
		margin-bottom: 16px;
	}
	
	.form-label {
		display: block;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		margin-bottom: 6px;
	}
	
	.form-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 13px;
		color: var(--color-text);
		background-color: var(--color-bg-card);
		transition: border-color var(--transition-fast);
		box-sizing: border-box;
	}
	
	.form-input:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	.form-input.compact {
		padding: 6px 10px;
		font-size: 12px;
	}
	
	.form-textarea {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 13px;
		color: var(--color-text);
		background-color: var(--color-bg-card);
		font-family: inherit;
		resize: vertical;
		transition: border-color var(--transition-fast);
		box-sizing: border-box;
	}
	
	.form-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	.form-textarea.compact {
		padding: 6px 10px;
		font-size: 12px;
	}
	
	.form-row {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}
	
	.form-row .form-input {
		flex: 1;
	}
	
	.score-slider {
		width: 100%;
		height: 6px;
		accent-color: var(--color-primary);
	}
	
	.score-slider-sm {
		width: 100%;
		height: 4px;
		accent-color: var(--color-primary);
	}
	
	.scores-edit-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 12px;
		margin-bottom: 16px;
	}
	
	.score-edit-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.score-edit-label {
		font-size: 11px;
		color: var(--color-text-muted);
		white-space: nowrap;
	}
	
	.form-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 16px;
	}
	
	.review-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.review-item {
		background-color: var(--color-bg);
		border-radius: var(--radius);
		padding: 16px;
		border: 1px solid var(--color-border-light);
	}
	
	.review-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}
	
	.reviewer-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 500;
	}
	
	.reviewer-detail {
		display: flex;
		flex-direction: column;
	}
	
	.reviewer-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.review-date {
		font-size: 12px;
		color: var(--color-text-muted);
	}
	
	.review-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.review-status {
		padding: 4px 10px;
		border-radius: var(--radius-full);
		font-size: 12px;
		font-weight: 500;
		color: white;
	}
	
	.status-select {
		padding: 4px 8px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 12px;
		background-color: var(--color-bg-card);
		color: var(--color-text);
		cursor: pointer;
	}
	
	.icon-btn {
		padding: 4px 8px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 14px;
		border-radius: var(--radius-sm);
		transition: background-color var(--transition-fast);
	}
	
	.icon-btn:hover {
		background-color: var(--color-bg-alt);
	}
	
	.review-scores {
		margin-bottom: 14px;
	}
	
	.score-item {
		margin-bottom: 10px;
	}
	
	.score-label {
		font-size: 12px;
		color: var(--color-text-muted);
		margin-bottom: 4px;
		display: block;
	}
	
	.score-bar-wrap {
		position: relative;
		height: 24px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-full);
		overflow: hidden;
	}
	
	.score-bar {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
		border-radius: var(--radius-full);
		transition: width var(--transition-slow);
	}
	
	.score-value {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 12px;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.score-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 6px;
	}
	
	.mini-score {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: 8px 4px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-sm);
	}
	
	.mini-label {
		font-size: 11px;
		color: var(--color-text-muted);
	}
	
	.mini-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
	}
	
	.review-summary {
		margin-bottom: 14px;
	}
	
	.summary-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 6px 0;
	}
	
	.summary-text {
		font-size: 13px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
		padding: 10px 12px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-sm);
		border-left: 3px solid var(--color-primary);
	}
	
	.review-comments {
		margin-top: 12px;
	}
	
	.comments-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text-secondary);
		margin: 0 0 8px 0;
	}
	
	.comment-item {
		padding: 10px 12px;
		background-color: var(--color-bg-card);
		border-radius: var(--radius-sm);
		margin-bottom: 6px;
	}
	
	.comment-item:last-child {
		margin-bottom: 0;
	}
	
	.comment-item.resolved {
		opacity: 0.6;
	}
	
	.comment-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}
	
	.comment-author {
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text);
	}
	
	.comment-topic {
		font-size: 11px;
		padding: 1px 6px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-sm);
		color: var(--color-text-muted);
	}
	
	.comment-status {
		font-size: 11px;
		color: var(--color-success);
		margin-left: auto;
	}
	
	.resolve-checkbox {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 11px;
		color: var(--color-text-muted);
		margin-left: auto;
		cursor: pointer;
	}
	
	.resolve-checkbox input {
		margin: 0;
		cursor: pointer;
	}
	
	.comment-content {
		font-size: 12px;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0;
	}
	
	.add-comment-form {
		margin-top: 12px;
		padding: 12px;
		background-color: var(--color-bg-alt);
		border-radius: var(--radius-sm);
	}
	
	.add-comment-btn {
		margin-top: 12px;
	}
</style>
