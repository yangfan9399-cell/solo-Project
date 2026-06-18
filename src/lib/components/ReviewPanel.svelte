<script lang="ts">
	import type { Review } from '$lib/types';
	import { formatDate, getStatusLabel, getStatusColor } from '$lib/utils/helpers';
	
	export let reviews: Review[];
	
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
</script>

<div class="review-panel">
	<h4 class="panel-title">评审记录</h4>
	
	{#if reviews.length === 0}
		<div class="empty-reviews">
			<span class="empty-icon">📝</span>
			<p>暂无评审记录</p>
			<button class="btn btn-primary btn-sm">发起评审</button>
		</div>
	{:else}
		<div class="review-list">
			{#each reviews as review}
				<div class="review-item">
					<div class="review-header">
						<div class="reviewer-info">
							<div class="avatar">{review.reviewer.charAt(0)}</div>
							<div class="reviewer-detail">
								<span class="reviewer-name">{review.reviewer}</span>
								<span class="review-date">{formatDate(review.createdAt)}</span>
							</div>
						</div>
						<span class="review-status" style="background-color: {getStatusColor(review.status)}">
							{getStatusLabel(review.status)}
						</span>
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
										{#if comment.resolved}
											<span class="comment-status">已处理</span>
										{/if}
									</div>
									<p class="comment-content">{comment.content}</p>
								</div>
							{/each}
						</div>
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
	
	.panel-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 16px;
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
	
	.review-status {
		padding: 4px 10px;
		border-radius: var(--radius-full);
		font-size: 12px;
		font-weight: 500;
		color: white;
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
	
	.comment-content {
		font-size: 12px;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin: 0;
	}
</style>
