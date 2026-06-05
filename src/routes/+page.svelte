<script lang="ts">
	import { onMount } from 'svelte';
	import type { Order, Assignment, ServiceFeedback, QualityCheck, Customer, Staff } from '@prisma/client';
	
	type OrderWithRelations = Order & {
		customer: Customer;
		creator?: Staff | null;
		assignments: (Assignment & { cleaner: Staff })[];
		serviceFeedback?: ServiceFeedback | null;
		qualityChecks?: (QualityCheck & { inspector: Staff })[];
	};
	
	let orders: OrderWithRelations[] = [];
	let loading = true;
	let filterStatus = '';
	let filterRegion = '';
	
	const statusLabels: Record<string, string> = {
		PENDING: '待派工',
		ASSIGNED: '已派工',
		IN_PROGRESS: '进行中',
		COMPLETED: '待质检',
		CANCELLED: '已取消',
		ARCHIVED: '已归档',
		NEEDS_REWORK: '待返工'
	};
	
	const statusColors: Record<string, string> = {
		PENDING: '#ff9800',
		ASSIGNED: '#2196f3',
		IN_PROGRESS: '#9c27b0',
		COMPLETED: '#00bcd4',
		CANCELLED: '#f44336',
		ARCHIVED: '#4caf50',
		NEEDS_REWORK: '#ff5722'
	};
	
	async function loadOrders() {
		loading = true;
		try {
			const params = new URLSearchParams();
			if (filterStatus) params.append('status', filterStatus);
			if (filterRegion) params.append('region', filterRegion);
			
			const res = await fetch(`/api/orders?${params}`);
			const data = await res.json();
			orders = data.orders;
		} catch (e) {
			console.error('加载订单失败:', e);
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadOrders();
	});
	
	$: filterStatus, filterRegion, loadOrders();
	
	function formatDate(date: string | Date) {
		return new Date(date).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
	
	function getCurrentCleaner(assignments: Assignment[]) {
		const active = assignments.find(a => a.status === 'ACTIVE');
		return active ? (active as any).cleaner?.name : '-';
	}
</script>

<div class="page">
	<div class="page-header">
		<h2>订单列表</h2>
		<div class="filters">
			<select bind:value={filterStatus}>
				<option value="">全部状态</option>
				<option value="PENDING">待派工</option>
				<option value="ASSIGNED">已派工</option>
				<option value="COMPLETED">待质检</option>
				<option value="ARCHIVED">已归档</option>
				<option value="NEEDS_REWORK">待返工</option>
			</select>
			<select bind:value={filterRegion}>
				<option value="">全部区域</option>
				<option value="朝阳区">朝阳区</option>
				<option value="海淀区">海淀区</option>
				<option value="西城区">西城区</option>
			</select>
		</div>
	</div>
	
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<div class="order-list">
			{#each orders as order}
				<a href="/orders/{order.id}" class="order-card">
					<div class="order-header">
						<span class="order-no">{order.orderNo}</span>
						<span class="status-badge" style="background: {statusColors[order.status]}">
							{statusLabels[order.status]}
						</span>
					</div>
					<div class="order-body">
						<div class="order-row">
							<span class="label">客户：</span>
							<span>{order.customer?.name}</span>
						</div>
						<div class="order-row">
							<span class="label">服务：</span>
							<span>{order.serviceType}</span>
						</div>
						<div class="order-row">
							<span class="label">地址：</span>
							<span class="address">{order.serviceAddress}</span>
						</div>
						<div class="order-row">
							<span class="label">预约时间：</span>
							<span>{formatDate(order.scheduledDate)}</span>
						</div>
						<div class="order-row">
							<span class="label">保洁员：</span>
							<span>{getCurrentCleaner(order.assignments)}</span>
						</div>
						{#if order.serviceFeedback?.customerRating}
							<div class="order-row rating">
								<span class="label">客户评分：</span>
								<span class="stars">
									{#each { length: 5 } as _, i}
										<span class="star" class:active={i < order.serviceFeedback.customerRating}>★</span>
									{/each}
								</span>
							</div>
						{/if}
					</div>
					<div class="order-footer">
						<span class="price">¥{order.estimatedPrice}</span>
						<span class="region">{order.region}</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
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
	}
	
	.page-header h2 {
		margin: 0;
		font-size: 22px;
		color: #333;
	}
	
	.filters {
		display: flex;
		gap: 12px;
	}
	
	.filters select {
		padding: 8px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		background: white;
	}
	
	.loading {
		text-align: center;
		padding: 40px;
		color: #999;
	}
	
	.order-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 16px;
	}
	
	.order-card {
		border: 1px solid #eee;
		border-radius: 10px;
		padding: 16px;
		text-decoration: none;
		color: inherit;
		transition: all 0.2s;
		display: block;
	}
	
	.order-card:hover {
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		transform: translateY(-2px);
	}
	
	.order-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding-bottom: 12px;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.order-no {
		font-weight: 600;
		color: #667eea;
	}
	
	.status-badge {
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 12px;
		color: white;
		font-weight: 500;
	}
	
	.order-body {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
	.order-row {
		font-size: 13px;
		color: #666;
	}
	
	.order-row .label {
		color: #999;
	}
	
	.address {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	.rating {
		display: flex;
		align-items: center;
		gap: 4px;
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
	
	.order-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #f0f0f0;
	}
	
	.price {
		font-weight: 600;
		color: #e91e63;
		font-size: 16px;
	}
	
	.region {
		font-size: 12px;
		color: #999;
		background: #f5f5f5;
		padding: 2px 8px;
		border-radius: 10px;
	}
</style>
