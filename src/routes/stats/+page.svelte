<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Stats {
		overall: {
			totalOrders: number;
			totalRevenue: number;
			avgPrice: number;
		};
		byRegion: Array<{
			region: string;
			count: number;
			avgPrice: number;
		}>;
		byCleaner: Array<{
			id: string;
			name: string;
			region: string;
			totalOrders: number;
			avgRating: number;
			badReviews: number;
			reworkCount: number;
		}>;
		badReviewReasons: Array<{
			reason: string;
			count: number;
		}>;
		reworkDistribution: Array<{
			reworkCount: number;
			orderCount: number;
		}>;
	}
	
	let stats: Stats | null = null;
	let loading = true;
	
	const badReviewReasonLabels: Record<string, string> = {
		ATTITUDE: '服务态度',
		QUALITY: '服务质量',
		PUNCTUALITY: '准时性',
		COMMUNICATION: '沟通问题',
		OTHER: '其他'
	};
	
	async function loadStats() {
		try {
			const res = await fetch('/api/stats');
			stats = await res.json();
		} catch (e) {
			console.error('加载统计数据失败:', e);
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadStats();
	});
	
	function formatMoney(value: number) {
		return '¥' + value.toFixed(2);
	}
	
	function getMaxValue(arr: Array<{ count: number }>) {
		return Math.max(...arr.map(item => item.count), 1);
	}
</script>

<div class="stats-page">
	<div class="page-header">
		<h2>📊 复盘统计</h2>
	</div>
	
	{#if loading}
		<div class="loading">加载中...</div>
	{:else if stats}
		<div class="stats-grid">
			<div class="stat-cards">
				<div class="stat-card primary">
					<div class="stat-icon">📦</div>
					<div class="stat-content">
						<div class="stat-value">{stats.overall.totalOrders}</div>
						<div class="stat-label">总订单数</div>
					</div>
				</div>
				<div class="stat-card success">
					<div class="stat-icon">💰</div>
					<div class="stat-content">
						<div class="stat-value">{formatMoney(stats.overall.totalRevenue)}</div>
						<div class="stat-label">总营收</div>
					</div>
				</div>
				<div class="stat-card warning">
					<div class="stat-icon">📈</div>
					<div class="stat-content">
						<div class="stat-value">{formatMoney(stats.overall.avgPrice)}</div>
						<div class="stat-label">平均客单价</div>
					</div>
				</div>
			</div>
			
			<div class="chart-section">
				<div class="chart-card">
					<h3>🗺️ 按区域统计</h3>
					<div class="bar-chart">
						{#each stats.byRegion as region}
							<div class="bar-item">
								<div class="bar-label">{region.region}</div>
								<div class="bar-track">
									<div class="bar-fill" style="width: {(region.count / getMaxValue(stats.byRegion)) * 100}%">
										<span class="bar-count">{region.count} 单</span>
									</div>
								</div>
								<div class="bar-avg">均价 {formatMoney(region.avgPrice)}</div>
							</div>
						{/each}
					</div>
				</div>
				
				<div class="chart-card">
					<h3>👎 差评原因分布</h3>
					<div class="pie-chart">
						{#each stats.badReviewReasons as reason}
							<div class="pie-item">
								<div class="pie-label">{badReviewReasonLabels[reason.reason] || reason.reason}</div>
								<div class="pie-track">
									<div class="pie-fill" style="width: {(reason.count / getMaxValue(stats.badReviewReasons)) * 100}%">
										<span class="pie-count">{reason.count}</span>
									</div>
								</div>
							</div>
						{:else}
							<div class="empty">暂无差评数据</div>
						{/each}
					</div>
				</div>
				
				<div class="chart-card">
					<h3>🔄 返工次数分布</h3>
					<div class="rework-chart">
						{#each stats.reworkDistribution as item}
							<div class="rework-item">
								<div class="rework-badge">{item.reworkCount} 次返工</div>
								<div class="rework-count">{item.orderCount} 单</div>
							</div>
						{:else}
							<div class="empty">暂无返工数据</div>
						{/each}
					</div>
				</div>
			</div>
			
			<div class="table-section">
				<div class="chart-card full-width">
					<h3>👩 保洁员绩效统计</h3>
					<div class="table-container">
						<table class="stats-table">
							<thead>
								<tr>
									<th>保洁员</th>
									<th>服务区域</th>
									<th>完成订单</th>
									<th>平均评分</th>
									<th>差评数量</th>
									<th>返工次数</th>
								</tr>
							</thead>
							<tbody>
								{#each stats.byCleaner as cleaner}
									<tr>
										<td>
											<div class="cleaner-name">
												<span class="avatar">{cleaner.name.charAt(0)}</span>
												{cleaner.name}
											</div>
										</td>
										<td>{cleaner.region}</td>
										<td><span class="count-badge">{cleaner.totalOrders}</span></td>
										<td>
											<div class="rating">
												{#each { length: 5 } as _, i}
													<span class="star" class:active={i < Math.round(cleaner.avgRating)}>★</span>
												{/each}
												<span class="rating-num">{cleaner.avgRating.toFixed(1)}</span>
											</div>
										</td>
										<td>
											<span class="badge" class:danger={cleaner.badReviews > 0}>
												{cleaner.badReviews}
											</span>
										</td>
										<td>
											<span class="badge" class:warning={cleaner.reworkCount > 0}>
												{cleaner.reworkCount}
											</span>
										</td>
									</tr>
								{:else}
									<tr>
										<td colspan="6" class="empty">暂无数据</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stats-page {
		background: white;
		border-radius: 12px;
		padding: 24px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.06);
	}
	
	.page-header {
		margin-bottom: 24px;
	}
	
	.page-header h2 {
		margin: 0;
		font-size: 22px;
		color: #333;
	}
	
	.loading {
		text-align: center;
		padding: 60px;
		color: #999;
	}
	
	.stat-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}
	
	.stat-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 20px;
		border-radius: 12px;
		color: white;
	}
	
	.stat-card.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.stat-card.success {
		background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
	}
	
	.stat-card.warning {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
	
	.stat-icon {
		font-size: 40px;
		opacity: 0.8;
	}
	
	.stat-value {
		font-size: 28px;
		font-weight: 700;
		margin-bottom: 4px;
	}
	
	.stat-label {
		font-size: 13px;
		opacity: 0.9;
	}
	
	.chart-section {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
		margin-bottom: 24px;
	}
	
	.chart-card {
		background: #fafafa;
		border-radius: 10px;
		padding: 20px;
	}
	
	.chart-card.full-width {
		grid-column: 1 / -1;
	}
	
	.chart-card h3 {
		margin: 0 0 20px 0;
		font-size: 16px;
		color: #333;
	}
	
	.bar-chart, .pie-chart {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.bar-item, .pie-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.bar-label, .pie-label {
		font-size: 13px;
		color: #666;
		font-weight: 500;
	}
	
	.bar-track, .pie-track {
		height: 24px;
		background: #e8e8e8;
		border-radius: 12px;
		overflow: hidden;
	}
	
	.bar-fill, .pie-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 8px;
		min-width: 50px;
		transition: width 0.3s ease;
	}
	
	.pie-fill {
		background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
	}
	
	.bar-count, .pie-count {
		font-size: 12px;
		color: white;
		font-weight: 600;
	}
	
	.bar-avg {
		font-size: 12px;
		color: #999;
	}
	
	.rework-chart {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	
	.rework-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 14px;
		background: white;
		border-radius: 8px;
		border: 1px solid #eee;
	}
	
	.rework-badge {
		font-size: 13px;
		color: #666;
	}
	
	.rework-count {
		font-size: 16px;
		font-weight: 600;
		color: #ff5722;
	}
	
	.table-section {
		margin-top: 16px;
	}
	
	.table-container {
		overflow-x: auto;
	}
	
	.stats-table {
		width: 100%;
		border-collapse: collapse;
	}
	
	.stats-table th,
	.stats-table td {
		padding: 14px 16px;
		text-align: left;
		border-bottom: 1px solid #eee;
	}
	
	.stats-table th {
		background: #f5f5f5;
		font-weight: 600;
		font-size: 13px;
		color: #555;
	}
	
	.stats-table tbody tr:hover {
		background: #fafafa;
	}
	
	.cleaner-name {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.avatar {
		width: 32px;
		height: 32px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 600;
	}
	
	.count-badge {
		background: #e3f2fd;
		color: #1976d2;
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 600;
	}
	
	.rating {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	
	.star {
		color: #ddd;
		font-size: 14px;
	}
	
	.star.active {
		color: #ffc107;
	}
	
	.rating-num {
		font-size: 13px;
		color: #666;
		font-weight: 500;
	}
	
	.badge {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 600;
		background: #e8f5e8;
		color: #388e3c;
	}
	
	.badge.danger {
		background: #ffebee;
		color: #c62828;
	}
	
	.badge.warning {
		background: #fff3e0;
		color: #ef6c00;
	}
	
	.empty {
		text-align: center;
		padding: 20px;
		color: #999;
		font-size: 14px;
	}
	
	@media (max-width: 900px) {
		.stat-cards,
		.chart-section {
			grid-template-columns: 1fr;
		}
	}
</style>
