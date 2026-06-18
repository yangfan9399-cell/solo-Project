<script lang="ts">
	let currentPath = '';
	
	$: if (typeof window !== 'undefined') {
		currentPath = window.location.pathname;
	}
	
	const menuItems = [
		{ path: '/', label: '印稿台账', icon: '📋' },
		{ path: '/reviews', label: '评审中心', icon: '✍️' },
		{ path: '/anomalies', label: '异常监控', icon: '⚠️' },
		{ path: '/export', label: '导出中心', icon: '📤' }
	];
</script>

<aside class="sidebar">
	<div class="sidebar-header">
		<div class="logo">
			<span class="logo-icon">印</span>
			<span class="logo-text">篆刻评审</span>
		</div>
	</div>
	
	<nav class="sidebar-nav">
		{#each menuItems as item}
			<a href={item.path} class="nav-item {currentPath === item.path ? 'active' : ''}">
				<span class="nav-icon">{item.icon}</span>
				<span class="nav-label">{item.label}</span>
			</a>
		{/each}
	</nav>
	
	<div class="sidebar-footer">
		<div class="user-info">
			<div class="avatar">张</div>
			<div class="user-details">
				<div class="user-name">张治印</div>
				<div class="user-role">篆刻设计师</div>
			</div>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		width: var(--sidebar-width);
		height: 100vh;
		background-color: var(--color-bg-sidebar);
		color: var(--color-text-sidebar);
		display: flex;
		flex-direction: column;
		position: fixed;
		left: 0;
		top: 0;
		z-index: 100;
		transition: width var(--transition);
	}
	
	.sidebar-header {
		padding: 20px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.logo-icon {
		width: 40px;
		height: 40px;
		background-color: var(--color-primary);
		color: white;
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-serif);
		font-size: 22px;
		font-weight: bold;
	}
	
	.logo-text {
		font-size: 16px;
		font-weight: 600;
		color: white;
	}
	
	.sidebar-nav {
		flex: 1;
		padding: 16px 12px;
		overflow-y: auto;
	}
	
	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: var(--radius);
		color: var(--color-text-sidebar);
		text-decoration: none;
		margin-bottom: 4px;
		transition: all var(--transition-fast);
	}
	
	.nav-item:hover {
		background-color: rgba(255, 255, 255, 0.08);
		color: white;
	}
	
	.nav-item.active {
		background-color: var(--color-primary);
		color: white;
	}
	
	.nav-icon {
		font-size: 18px;
		width: 24px;
		text-align: center;
	}
	
	.nav-label {
		font-size: 14px;
		font-weight: 500;
	}
	
	.sidebar-footer {
		padding: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.user-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background-color: var(--color-primary-light);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 500;
	}
	
	.user-details {
		flex: 1;
		min-width: 0;
	}
	
	.user-name {
		font-size: 13px;
		font-weight: 500;
		color: white;
	}
	
	.user-role {
		font-size: 11px;
		color: var(--color-text-muted);
	}
</style>
