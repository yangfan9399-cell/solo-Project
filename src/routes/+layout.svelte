<script lang="ts">
	import { page } from '$app/stores';
	
	let currentRole = 'CUSTOMER_SERVICE';
	
	const roleLabels: Record<string, string> = {
		CUSTOMER_SERVICE: '客服经办人',
		CLEANER: '保洁员',
		QUALITY_INSPECTOR: '质检员'
	};
</script>

<div class="app">
	<header class="header">
		<div class="header-inner">
			<div class="logo">
				<h1>🧹 家政保洁管理平台</h1>
			</div>
			<nav class="nav">
				<a href="/" class:active={$page.url.pathname === '/'}>订单列表</a>
				<a href="/create" class:active={$page.url.pathname === '/create'}>预约订单</a>
				<a href="/stats" class:active={$page.url.pathname === '/stats'}>复盘统计</a>
			</nav>
			<div class="role-selector">
				<select bind:value={currentRole}>
					<option value="CUSTOMER_SERVICE">客服经办人</option>
					<option value="CLEANER">保洁员</option>
					<option value="QUALITY_INSPECTOR">质检员</option>
				</select>
			</div>
		</div>
	</header>
	
	<main class="main">
		<div class="role-badge">
			当前角色：<span>{roleLabels[currentRole]}</span>
		</div>
		<slot />
	</main>
</div>

<style>
	.app {
		min-height: 100vh;
		background: #f5f7fa;
	}
	
	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 0 24px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.15);
	}
	
	.header-inner {
		max-width: 1400px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 64px;
	}
	
	.logo h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
	}
	
	.nav {
		display: flex;
		gap: 8px;
	}
	
	.nav a {
		color: rgba(255,255,255,0.85);
		text-decoration: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		transition: all 0.2s;
	}
	
	.nav a:hover {
		background: rgba(255,255,255,0.15);
		color: white;
	}
	
	.nav a.active {
		background: rgba(255,255,255,0.25);
		color: white;
		font-weight: 500;
	}
	
	.role-selector select {
		padding: 6px 12px;
		border-radius: 6px;
		border: none;
		background: rgba(255,255,255,0.2);
		color: white;
		font-size: 14px;
		cursor: pointer;
	}
	
	.role-selector select option {
		color: #333;
	}
	
	.main {
		max-width: 1400px;
		margin: 0 auto;
		padding: 24px;
	}
	
	.role-badge {
		background: #e3f2fd;
		color: #1976d2;
		padding: 8px 16px;
		border-radius: 8px;
		margin-bottom: 20px;
		font-size: 14px;
		display: inline-block;
	}
	
	.role-badge span {
		font-weight: 600;
	}
</style>
