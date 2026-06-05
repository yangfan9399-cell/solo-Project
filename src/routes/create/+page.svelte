<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Customer, Staff } from '@prisma/client';
	
	let customers: Customer[] = [];
	let staff: Staff[] = [];
	let loading = true;
	
	let form = {
		customerId: '',
		source: 'PHONE',
		serviceType: '日常保洁',
		serviceAddress: '',
		region: '朝阳区',
		scheduledDate: '',
		scheduledHours: 4,
		estimatedPrice: 200
	};
	
	let submitting = false;
	let error = '';
	
	async function loadData() {
		try {
			const [customersRes, staffRes] = await Promise.all([
				fetch('/api/customers'),
				fetch('/api/staff?role=CUSTOMER_SERVICE')
			]);
			
			customers = await customersRes.json();
			staff = await staffRes.json();
		} catch (e) {
			console.error('加载数据失败:', e);
		} finally {
			loading = false;
		}
	}
	
	onMount(() => {
		loadData();
	});
	
	function updatePrice() {
		const prices: Record<string, number> = {
			'日常保洁': 50,
			'深度保洁': 60,
			'开荒保洁': 80,
			'擦玻璃': 70
		};
		const rate = prices[form.serviceType] || 50;
		form.estimatedPrice = form.scheduledHours * rate;
	}
	
	$: form.serviceType, form.scheduledHours, updatePrice();
	
	function onCustomerChange() {
		const customer = customers.find(c => c.id === form.customerId);
		if (customer) {
			form.serviceAddress = customer.address;
			form.region = customer.region;
		}
	}
	
	async function handleSubmit() {
		if (!form.customerId || !form.scheduledDate) {
			error = '请填写必填项';
			return;
		}
		
		submitting = true;
		error = '';
		
		try {
			const res = await fetch('/api/orders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...form,
					createdBy: staff[0]?.id
				})
			});
			
			const data = await res.json();
			
			if (data.success) {
				goto('/');
			} else {
				error = data.error || '创建订单失败';
			}
		} catch (e) {
			error = '创建订单失败';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="page">
	<div class="page-header">
		<div>
			<button class="back-btn" on:click={() => goto('/')}>← 返回</button>
			<h2>预约订单</h2>
		</div>
	</div>
	
	{#if loading}
		<div class="loading">加载中...</div>
	{:else}
		<form class="form" on:submit|preventDefault={handleSubmit}>
			{#if error}
				<div class="alert alert-danger">{error}</div>
			{/if}
			
			<div class="form-section">
				<h3>客户信息</h3>
				<div class="form-row">
					<div class="form-group">
						<label>选择客户 <span class="required">*</span></label>
						<select bind:value={form.customerId} on:change={onCustomerChange}>
							<option value="">请选择客户</option>
							{#each customers as customer}
								<option value={customer.id}>{customer.name} - {customer.phone}</option>
							{/each}
						</select>
					</div>
					<div class="form-group">
						<label>订单来源</label>
						<select bind:value={form.source}>
							<option value="PHONE">电话预约</option>
							<option value="WECHAT">微信预约</option>
							<option value="APP">APP预约</option>
							<option value="WALK_IN">到店预约</option>
							<option value="REFERRAL">转介绍</option>
						</select>
					</div>
				</div>
			</div>
			
			<div class="form-section">
				<h3>服务信息</h3>
				<div class="form-row">
					<div class="form-group">
						<label>服务类型</label>
						<select bind:value={form.serviceType}>
							<option value="日常保洁">日常保洁</option>
							<option value="深度保洁">深度保洁</option>
							<option value="开荒保洁">开荒保洁</option>
							<option value="擦玻璃">擦玻璃</option>
						</select>
					</div>
					<div class="form-group">
						<label>服务时长（小时）</label>
						<input type="number" bind:value={form.scheduledHours} min="1" max="12" />
					</div>
				</div>
				<div class="form-row">
					<div class="form-group">
						<label>预约时间 <span class="required">*</span></label>
						<input type="datetime-local" bind:value={form.scheduledDate} />
					</div>
					<div class="form-group">
						<label>预估费用（元）</label>
						<input type="number" bind:value={form.estimatedPrice} readonly class="readonly" />
					</div>
				</div>
				<div class="form-group full-width">
					<label>服务地址</label>
					<input type="text" bind:value={form.serviceAddress} placeholder="请输入服务地址" />
				</div>
				<div class="form-group">
					<label>服务区域</label>
					<select bind:value={form.region}>
						<option value="朝阳区">朝阳区</option>
						<option value="海淀区">海淀区</option>
						<option value="西城区">西城区</option>
						<option value="东城区">东城区</option>
						<option value="丰台区">丰台区</option>
					</select>
				</div>
			</div>
			
			<div class="form-actions">
				<button type="button" class="btn btn-default" on:click={() => goto('/')}>取消</button>
				<button type="submit" class="btn btn-primary" disabled={submitting}>
					{submitting ? '提交中...' : '创建订单'}
				</button>
			</div>
		</form>
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
	
	.loading {
		text-align: center;
		padding: 60px;
		color: #999;
	}
	
	.form {
		max-width: 800px;
	}
	
	.form-section {
		margin-bottom: 32px;
	}
	
	.form-section h3 {
		margin: 0 0 20px 0;
		font-size: 16px;
		color: #333;
		padding-bottom: 8px;
		border-bottom: 2px solid #667eea;
		display: inline-block;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	
	.form-group {
		margin-bottom: 16px;
	}
	
	.form-group.full-width {
		grid-column: 1 / -1;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 6px;
		font-size: 13px;
		font-weight: 500;
		color: #555;
	}
	
	.form-group .required {
		color: #f44336;
	}
	
	.form-group input,
	.form-group select {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		box-sizing: border-box;
	}
	
	.form-group input.readonly {
		background: #f5f5f5;
		color: #666;
	}
	
	.form-group input:focus,
	.form-group select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}
	
	.alert {
		padding: 12px 16px;
		border-radius: 6px;
		margin-bottom: 20px;
		font-size: 14px;
	}
	
	.alert-danger {
		background: #ffebee;
		color: #c62828;
	}
	
	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding-top: 20px;
		border-top: 1px solid #eee;
	}
	
	.btn {
		padding: 10px 24px;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 14px;
		font-weight: 500;
		transition: all 0.2s;
	}
	
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.btn-primary {
		background: #667eea;
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: #5a67d8;
	}
	
	.btn-default {
		background: #f5f5f5;
		color: #666;
	}
	
	.btn-default:hover {
		background: #e0e0e0;
	}
</style>
