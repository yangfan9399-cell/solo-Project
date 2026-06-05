<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Order, Assignment, ServiceFeedback, QualityCheck, Customer, Staff } from '@prisma/client';
	
	type OrderWithRelations = Order & {
		customer: Customer;
		creator?: Staff | null;
		assignments: (Assignment & { cleaner: Staff; reassignedBy?: Staff | null; reassignedTo?: Staff | null })[];
		serviceFeedback?: ServiceFeedback | null;
		qualityChecks?: (QualityCheck & { inspector: Staff })[];
	};
	
	let order: OrderWithRelations | null = null;
	let loading = true;
	let showReassignModal = false;
	let showFeedbackModal = false;
	let showQualityModal = false;
	let cleaners: Staff[] = [];
	let inspectors: Staff[] = [];
	
	let reassignCleanerId = '';
	let reassignReason = '';
	
	let feedbackStartTime = '';
	let feedbackEndTime = '';
	let feedbackNotes = '';
	let feedbackRating = 5;
	let feedbackComment = '';
	
	let qualityResult = '';
	let qualityNotes = '';
	let qualityCompensation = 0;
	let qualityError = '';
	
	const statusLabels: Record<string, string> = {
		PENDING: '待派工',
		ASSIGNED: '已派工',
		IN_PROGRESS: '进行中',
		COMPLETED: '待质检',
		CANCELLED: '已取消',
		ARCHIVED: '已归档',
		NEEDS_REWORK: '待返工'
	};
	
	const sourceLabels: Record<string, string> = {
		PHONE: '电话预约',
		WECHAT: '微信预约',
		APP: 'APP预约',
		WALK_IN: '到店预约',
		REFERRAL: '转介绍'
	};
	
	const assignmentStatusLabels: Record<string, string> = {
		ACTIVE: '有效',
		REASSIGNED: '已改派',
		CANCELLED_LEAVE: '阿姨请假'
	};
	
	const qualityResultLabels: Record<string, string> = {
		PASSED: '通过',
		REJECTED: '退回',
		COMPENSATION: '补偿'
	};
	
	const badReviewReasonLabels: Record<string, string> = {
		NOT_APPLICABLE: '-',
		ATTITUDE: '服务态度',
		QUALITY: '服务质量',
		PUNCTUALITY: '准时性',
		COMMUNICATION: '沟通问题',
		OTHER: '其他'
	};
	
	async function loadData() {
		loading = true;
		try {
			const [orderRes, cleanersRes, inspectorsRes] = await Promise.all([
				fetch(`/api/orders/${$page.params.id}`),
				fetch('/api/staff?role=CLEANER'),
				fetch('/api/staff?role=QUALITY_INSPECTOR')
			]);
			
			order = await orderRes.json();
			cleaners = await cleanersRes.json();
			inspectors = await inspectorsRes.json();
		} catch (e) {
			console.error('加载数据失败:', e);
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadData();
	});
	
	function formatDate(date: string | Date) {
		return new Date(date).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	function getCurrentCleaner() {
		const active = order?.assignments?.find(a => a.status === 'ACTIVE');
		return active?.cleaner;
	}
	
	async function handleReassign() {
		if (!reassignCleanerId) return;
		
		try {
			const res = await fetch('/api/assign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order?.id,
					cleanerId: reassignCleanerId,
					reassign: true,
					reassignReason: reassignReason || 'CUSTOMER_REQUEST',
					reassignedById: 'temp',
					notes: '客服改派'
				})
			});
			
			if (res.ok) {
				showReassignModal = false;
				loadData();
			}
		} catch (e) {
			console.error('改派失败:', e);
		}
	}
	
	async function handleFeedback() {
		try {
			const res = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order?.id,
					actualStartTime: feedbackStartTime,
					actualEndTime: feedbackEndTime,
					serviceNotes: feedbackNotes,
					photoEvidence: [],
					customerRating: feedbackRating,
					customerComment: feedbackComment,
					badReviewReason: feedbackRating < 3 ? 'QUALITY' : 'NOT_APPLICABLE'
				})
			});
			
			if (res.ok) {
				showFeedbackModal = false;
				loadData();
			}
		} catch (e) {
			console.error('提交反馈失败:', e);
		}
	}
	
	async function handleQuality() {
		qualityError = '';
		try {
			const res = await fetch('/api/quality-check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					orderId: order?.id,
					inspectorId: inspectors[0]?.id,
					result: qualityResult,
					notes: qualityNotes,
					compensation: qualityResult === 'COMPENSATION' ? qualityCompensation : null,
					needsRework: qualityResult === 'REJECTED',
					reworkReason: qualityResult === 'REJECTED' ? qualityNotes : null
				})
			});
			
			const data = await res.json();
			
			if (!res.ok) {
				qualityError = data.error || '质检处理失败';
				return;
			}
			
			showQualityModal = false;
			loadData();
		} catch (e) {
			console.error('质检失败:', e);
		}
	}
</script>

{#if loading}
	<div class="loading">加载中...</div>
{:else if order}
	<div class="detail-page">
		<div class="page-header">
			<div>
				<button class="back-btn" on:click={() => goto('/')}>← 返回</button>
				<h2>订单详情 - {order.orderNo}</h2>
			</div>
			<div class="actions">
				{#if order.status === 'PENDING' || order.status === 'ASSIGNED'}
					<button class="btn btn-primary" on:click={() => showReassignModal = true}>派工/改派</button>
				{/if}
				{#if order.status === 'ASSIGNED' || order.status === 'IN_PROGRESS'}
					<button class="btn btn-success" on:click={() => showFeedbackModal = true}>提交服务反馈</button>
				{/if}
				{#if order.status === 'COMPLETED' || order.status === 'NEEDS_REWORK'}
					<button class="btn btn-warning" on:click={() => showQualityModal = true}>质量检查</button>
				{/if}
			</div>
		</div>
		
		<div class="content-grid">
			<div class="main-content">
				<div class="card">
					<h3>📋 基本信息</h3>
					<div class="info-grid">
						<div class="info-item">
							<span class="label">订单状态</span>
							<span class="value status">{statusLabels[order.status]}</span>
						</div>
						<div class="info-item">
							<span class="label">订单来源</span>
							<span class="value">{sourceLabels[order.source]}</span>
						</div>
						<div class="info-item">
							<span class="label">服务类型</span>
							<span class="value">{order.serviceType}</span>
						</div>
						<div class="info-item">
							<span class="label">服务地址</span>
							<span class="value">{order.serviceAddress}</span>
						</div>
						<div class="info-item">
							<span class="label">所属区域</span>
							<span class="value">{order.region}</span>
						</div>
						<div class="info-item">
							<span class="label">预约时间</span>
							<span class="value">{formatDate(order.scheduledDate)}</span>
						</div>
						<div class="info-item">
							<span class="label">预约时长</span>
							<span class="value">{order.scheduledHours} 小时</span>
						</div>
						<div class="info-item">
							<span class="label">预估费用</span>
							<span class="value price">¥{order.estimatedPrice}</span>
						</div>
						<div class="info-item">
							<span class="label">创建人</span>
							<span class="value">{order.creator?.name || '-'}</span>
						</div>
						<div class="info-item">
							<span class="label">返工次数</span>
							<span class="value">{order.reworkCount} 次</span>
						</div>
					</div>
				</div>
				
				<div class="card">
					<h3>👤 客户信息</h3>
					<div class="info-grid">
						<div class="info-item">
							<span class="label">客户姓名</span>
							<span class="value">{order.customer?.name}</span>
						</div>
						<div class="info-item">
							<span class="label">联系电话</span>
							<span class="value">{order.customer?.phone}</span>
						</div>
					</div>
				</div>
				
				<div class="card">
					<h3>🔄 派工历史</h3>
					<div class="timeline">
						{#each order.assignments as assignment, index}
							<div class="timeline-item">
								<div class="timeline-dot"></div>
								<div class="timeline-content">
									<div class="timeline-header">
										<span class="cleaner-name">{assignment.cleaner.name}</span>
										<span class="badge" class:active={assignment.status === 'ACTIVE'}>
											{assignmentStatusLabels[assignment.status]}
										</span>
									</div>
									<div class="timeline-time">
										派工时间：{formatDate(assignment.assignedAt)}
									</div>
									{#if assignment.reassignedReason}
										<div class="timeline-reason">
											改派原因：{assignment.reassignedReason}
										</div>
									{/if}
									{#if assignment.notes}
										<div class="timeline-notes">备注：{assignment.notes}</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
				
				{#if order.serviceFeedback}
					<div class="card">
						<h3>📝 服务反馈</h3>
						<div class="info-grid">
							<div class="info-item">
								<span class="label">实际开始</span>
								<span class="value">{formatDate(order.serviceFeedback.actualStartTime)}</span>
							</div>
							<div class="info-item">
								<span class="label">实际结束</span>
								<span class="value">{formatDate(order.serviceFeedback.actualEndTime)}</span>
							</div>
							<div class="info-item">
								<span class="label">实际时长</span>
								<span class="value" class:warning={Number(order.serviceFeedback.actualHours) < order.scheduledHours * 0.9}>
									{order.serviceFeedback.actualHours} 小时
									{#if Number(order.serviceFeedback.actualHours) < order.scheduledHours * 0.9}
										<span class="warn-tag">时长不足</span>
									{/if}
								</span>
							</div>
							<div class="info-item">
								<span class="label">客户评分</span>
								<span class="value stars">
									{#each { length: 5 } as _, i}
										<span class="star" class:active={i < (order.serviceFeedback.customerRating || 0)}>★</span>
									{/each}
								</span>
							</div>
						</div>
						<div class="section">
							<span class="label">服务说明：</span>
							<p>{order.serviceFeedback.serviceNotes}</p>
						</div>
						{#if order.serviceFeedback.customerComment}
							<div class="section">
								<span class="label">客户评价：</span>
								<p class="comment">{order.serviceFeedback.customerComment}</p>
							</div>
						{/if}
						{#if order.serviceFeedback.badReviewReason !== 'NOT_APPLICABLE'}
							<div class="section">
								<span class="label">差评原因：</span>
								<span class="bad-reason">{badReviewReasonLabels[order.serviceFeedback.badReviewReason]}</span>
							</div>
						{/if}
						{#if order.serviceFeedback.photoEvidence?.length > 0}
							<div class="section">
								<span class="label">服务照片：</span>
								<div class="photos">
									{#each order.serviceFeedback.photoEvidence as photo}
										<div class="photo-placeholder">📷 {photo}</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
				
				{#if order.qualityChecks?.length}
					<div class="card">
						<h3>✅ 质检记录</h3>
						{#each order.qualityChecks as check}
							<div class="quality-record">
								<div class="quality-header">
									<span class="quality-result" class:passed={check.result === 'PASSED'} class:rejected={check.result === 'REJECTED'} class:compensation={check.result === 'COMPENSATION'}>
										{qualityResultLabels[check.result]}
									</span>
									<span class="quality-time">{formatDate(check.checkedAt)}</span>
								</div>
								<div class="quality-info">
									<span>质检人：{check.inspector.name}</span>
									{#if check.hoursDeficit && check.hoursDeficit > 0}
										<span class="hours-deficit">时长缺口：{check.hoursDeficit} 小时</span>
									{/if}
									{#if check.compensation}
										<span class="compensation">补偿金额：¥{check.compensation}</span>
									{/if}
								</div>
								<div class="quality-notes">
									<span class="label">质检说明：</span>
									{check.notes}
								</div>
								{#if check.reworkReason}
									<div class="rework-reason">
										<span class="label">返工原因：</span>
										{check.reworkReason}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
			
			<div class="side-content">
				<div class="card">
					<h3>👩 当前保洁员</h3>
					{#if getCurrentCleaner()}
						<div class="cleaner-info">
							<div class="avatar">{getCurrentCleaner()?.name?.charAt(0)}</div>
							<div>
								<div class="name">{getCurrentCleaner()?.name}</div>
								<div class="region">{getCurrentCleaner()?.region}</div>
							</div>
						</div>
					{:else}
						<div class="empty">暂未派工</div>
					{/if}
				</div>
				
				<div class="card">
					<h3>⚠️ 责任人</h3>
					<div class="responsibles">
						<div class="responsible-item">
							<span class="role">创建人</span>
							<span>{order.creator?.name || '-'}</span>
						</div>
						<div class="responsible-item">
							<span class="role">经办人</span>
							<span>{order.creator?.name || '-'}</span>
						</div>
						<div class="responsible-item">
							<span class="role">服务人</span>
							<span>{getCurrentCleaner()?.name || '-'}</span>
						</div>
						{#if order.qualityChecks?.[0]}
							<div class="responsible-item">
								<span class="role">质检人</span>
								<span>{order.qualityChecks[0].inspector.name}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
	
	{#if showReassignModal}
		<div class="modal-overlay" on:click={() => showReassignModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>派工/改派</h3>
					<button class="close" on:click={() => showReassignModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-group">
						<label>选择保洁员</label>
						<select bind:value={reassignCleanerId}>
							<option value="">请选择</option>
							{#each cleaners as cleaner}
								<option value={cleaner.id}>{cleaner.name} - {cleaner.region}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label>改派原因</label>
						<select bind:value={reassignReason}>
							<option value="">正常派工</option>
							<option value="LEAVE">阿姨请假</option>
							<option value="CUSTOMER_REQUEST">客户要求更换</option>
							<option value="OTHER">其他原因</option>
						</select>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-default" on:click={() => showReassignModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleReassign}>确认派工</button>
				</div>
			</div>
		</div>
	{/if}
	
	{#if showFeedbackModal}
		<div class="modal-overlay" on:click={() => showFeedbackModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>提交服务反馈</h3>
					<button class="close" on:click={() => showFeedbackModal = false}>×</button>
				</div>
				<div class="modal-body">
					<div class="form-row">
						<div class="form-group">
							<label>实际开始时间</label>
							<input type="datetime-local" bind:value={feedbackStartTime} />
						</div>
						<div class="form-group">
							<label>实际结束时间</label>
							<input type="datetime-local" bind:value={feedbackEndTime} />
						</div>
					</div>
					<div class="form-group">
						<label>服务说明</label>
						<textarea bind:value={feedbackNotes} rows={4} placeholder="请描述服务内容..."></textarea>
					</div>
					<div class="form-group">
						<label>客户评分</label>
						<div class="rating-input">
							{#each { length: 5 } as _, i}
								<span class="star-input" class:active={i < feedbackRating} on:click={() => feedbackRating = i + 1}>★</span>
							{/each}
						</div>
					</div>
					<div class="form-group">
						<label>客户评价</label>
						<textarea bind:value={feedbackComment} rows={3} placeholder="客户反馈内容..."></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-default" on:click={() => showFeedbackModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleFeedback}>提交</button>
				</div>
			</div>
		</div>
	{/if}
	
	{#if showQualityModal}
		<div class="modal-overlay" on:click={() => showQualityModal = false}>
			<div class="modal" on:click|stopPropagation>
				<div class="modal-header">
					<h3>质量检查</h3>
					<button class="close" on:click={() => showQualityModal = false}>×</button>
				</div>
				<div class="modal-body">
					{#if qualityError}
						<div class="alert alert-danger">
							{qualityError}
						</div>
					{/if}
					
					{#if order?.serviceFeedback && Number(order.serviceFeedback.actualHours) < order.scheduledHours * 0.9}
						<div class="alert alert-warning">
							⚠️ 服务时长不足！预约 {order.scheduledHours} 小时，实际 {order.serviceFeedback.actualHours} 小时
							<br>请选择处理方式：安排补服务、申请补偿或退回返工
						</div>
					{/if}
					
					<div class="form-group">
						<label>质检结果</label>
						<select bind:value={qualityResult}>
							<option value="">请选择</option>
							<option value="PASSED">通过 - 正常归档</option>
							<option value="REJECTED">退回 - 需要返工</option>
							<option value="COMPENSATION">补偿 - 协商解决</option>
						</select>
					</div>
					
					{#if qualityResult === 'COMPENSATION'}
						<div class="form-group">
							<label>补偿金额 (元)</label>
							<input type="number" bind:value={qualityCompensation} min="0" />
						</div>
					{/if}
					
					<div class="form-group">
						<label>质检说明</label>
						<textarea bind:value={qualityNotes} rows={4} placeholder="请详细说明质检结论..."></textarea>
					</div>
				</div>
				<div class="modal-footer">
					<button class="btn btn-default" on:click={() => showQualityModal = false}>取消</button>
					<button class="btn btn-primary" on:click={handleQuality}>确认质检</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.loading {
		text-align: center;
		padding: 60px;
		color: #999;
	}
	
	.detail-page {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
		padding-bottom: 16px;
		border-bottom: 1px solid #eee;
	}
	
	.page-header h2 {
		margin: 0;
		display: inline-block;
		margin-left: 12px;
	}
	
	.back-btn {
		background: none;
		border: none;
		color: #667eea;
		cursor: pointer;
		font-size: 14px;
		padding: 4px 0;
	}
	
	.back-btn:hover {
		text-decoration: underline;
	}
	
	.actions {
		display: flex;
		gap: 12px;
	}
	
	.btn {
		padding: 10px 20px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s;
	}
	
	.btn-primary {
		background: #667eea;
		color: white;
	}
	
	.btn-primary:hover {
		background: #5a67d8;
	}
	
	.btn-success {
		background: #4caf50;
		color: white;
	}
	
	.btn-success:hover {
		background: #45a049;
	}
	
	.btn-warning {
		background: #ff9800;
		color: white;
	}
	
	.btn-warning:hover {
		background: #f57c00;
	}
	
	.btn-default {
		background: #f5f5f5;
		color: #666;
	}
	
	.btn-default:hover {
		background: #e0e0e0;
	}
	
	.content-grid {
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 24px;
	}
	
	.card {
		background: #fafafa;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}
	
	.card h3 {
		margin: 0 0 16px 0;
		font-size: 16px;
		color: #333;
	}
	
	.info-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}
	
	.info-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.info-item .label {
		font-size: 12px;
		color: #999;
	}
	
	.info-item .value {
		font-size: 14px;
		color: #333;
		font-weight: 500;
	}
	
	.info-item .value.status {
		color: #667eea;
	}
	
	.info-item .value.price {
		color: #e91e63;
		font-size: 18px;
	}
	
	.info-item .value.warning {
		color: #ff5722;
	}
	
	.warn-tag {
		background: #ff5722;
		color: white;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 11px;
		margin-left: 8px;
	}
	
	.stars {
		display: flex;
		gap: 2px;
	}
	
	.star {
		color: #ddd;
	}
	
	.star.active {
		color: #ffc107;
	}
	
	.section {
		margin-top: 16px;
	}
	
	.section .label {
		font-size: 12px;
		color: #999;
		display: block;
		margin-bottom: 4px;
	}
	
	.section p {
		margin: 0;
		line-height: 1.6;
		color: #555;
	}
	
	.comment {
		background: #fff3e0;
		padding: 12px;
		border-radius: 6px;
		border-left: 3px solid #ff9800;
	}
	
	.bad-reason {
		background: #ffebee;
		color: #c62828;
		padding: 4px 12px;
		border-radius: 4px;
		font-size: 13px;
	}
	
	.photos {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
		margin-top: 8px;
	}
	
	.photo-placeholder {
		width: 80px;
		height: 80px;
		background: #e3f2fd;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		color: #1976d2;
	}
	
	.timeline {
		position: relative;
		padding-left: 24px;
	}
	
	.timeline-item {
		position: relative;
		padding-bottom: 20px;
	}
	
	.timeline-item:last-child {
		padding-bottom: 0;
	}
	
	.timeline-dot {
		position: absolute;
		left: -24px;
		top: 4px;
		width: 12px;
		height: 12px;
		background: #667eea;
		border-radius: 50%;
	}
	
	.timeline-content {
		background: white;
		padding: 12px;
		border-radius: 6px;
		border: 1px solid #eee;
	}
	
	.timeline-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	
	.cleaner-name {
		font-weight: 600;
		color: #333;
	}
	
	.badge {
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 11px;
		background: #eee;
		color: #666;
	}
	
	.badge.active {
		background: #4caf50;
		color: white;
	}
	
	.timeline-time {
		font-size: 12px;
		color: #999;
		margin-bottom: 4px;
	}
	
	.timeline-reason {
		font-size: 12px;
		color: #ff5722;
		background: #fff3e0;
		padding: 4px 8px;
		border-radius: 4px;
		margin-bottom: 4px;
	}
	
	.timeline-notes {
		font-size: 12px;
		color: #666;
	}
	
	.quality-record {
		background: white;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #eee;
		margin-bottom: 12px;
	}
	
	.quality-record:last-child {
		margin-bottom: 0;
	}
	
	.quality-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}
	
	.quality-result {
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 500;
		color: white;
	}
	
	.quality-result.passed {
		background: #4caf50;
	}
	
	.quality-result.rejected {
		background: #f44336;
	}
	
	.quality-result.compensation {
		background: #ff9800;
	}
	
	.quality-time {
		font-size: 12px;
		color: #999;
	}
	
	.quality-info {
		display: flex;
		gap: 20px;
		font-size: 13px;
		color: #666;
		margin-bottom: 8px;
	}
	
	.hours-deficit {
		color: #ff5722;
	}
	
	.compensation {
		color: #e91e63;
	}
	
	.quality-notes, .rework-reason {
		font-size: 13px;
		color: #555;
		line-height: 1.6;
	}
	
	.rework-reason {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px dashed #eee;
		color: #f44336;
	}
	
	.cleaner-info {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.avatar {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		font-weight: 600;
	}
	
	.cleaner-info .name {
		font-weight: 600;
		color: #333;
	}
	
	.cleaner-info .region {
		font-size: 12px;
		color: #999;
	}
	
	.empty {
		text-align: center;
		color: #999;
		padding: 20px;
	}
	
	.responsibles {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.responsible-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 13px;
	}
	
	.responsible-item .role {
		color: #999;
	}
	
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #eee;
	}
	
	.modal-header h3 {
		margin: 0;
		font-size: 18px;
	}
	
	.modal-header .close {
		background: none;
		border: none;
		font-size: 24px;
		cursor: pointer;
		color: #999;
	}
	
	.modal-body {
		padding: 20px;
	}
	
	.modal-footer {
		padding: 20px;
		border-top: 1px solid #eee;
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
	
	.form-group {
		margin-bottom: 16px;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 13px;
		font-weight: 500;
		color: #555;
	}
	
	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
	}
	
	.form-group textarea {
		resize: vertical;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	
	.rating-input {
		display: flex;
		gap: 4px;
	}
	
	.star-input {
		font-size: 24px;
		color: #ddd;
		cursor: pointer;
		transition: color 0.2s;
	}
	
	.star-input.active {
		color: #ffc107;
	}
	
	.alert {
		padding: 12px 16px;
		border-radius: 6px;
		margin-bottom: 16px;
		font-size: 13px;
	}
	
	.alert-danger {
		background: #ffebee;
		color: #c62828;
	}
	
	.alert-warning {
		background: #fff3e0;
		color: #e65100;
		line-height: 1.6;
	}
</style>
