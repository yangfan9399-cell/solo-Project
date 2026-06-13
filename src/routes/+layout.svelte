<script lang="ts">
	import '../app.css';
	import { currentUser, allUsers, loadUsers } from '$lib/stores';
	import type { UserRole } from '$lib/types';

	let { children } = $props();

	let currentPath = $state('');

	const roleLabels: Record<UserRole, string> = {
		FRONTLINE: '一线人员',
		QC_REVIEWER: '质控审核员',
		ADMIN: '管理员'
	};

	function handleRoleSwitch(user: { id: string; name: string; role: UserRole; department: string }) {
		currentUser.set({ id: user.id, name: user.name, role: user.role, department: user.department });
	}

	$effect(() => {
		loadUsers();
	});

	$effect(() => {
		currentPath = window.location.pathname;
		const onPopState = () => {
			currentPath = window.location.pathname;
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});
</script>

<header class="app-header">
	<div class="header-inner">
		<div class="header-left">
			<a href="/" class="logo">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="1" y="3" width="15" height="13"></rect>
					<polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
					<circle cx="5.5" cy="18.5" r="2.5"></circle>
					<circle cx="18.5" cy="18.5" r="2.5"></circle>
				</svg>
				<span class="logo-text">企业车辆用车申请里程核销与违章复核系统</span>
			</a>
			<nav class="nav-links">
				<a href="/" class="nav-link" class:active={currentPath === '/'}>看板</a>
				<a href="/records" class="nav-link" class:active={currentPath.startsWith('/records')}>记录列表</a>
			</nav>
		</div>
		<div class="header-right">
			<div class="role-switcher">
				<span class="role-switcher-label">当前用户:</span>
				{#each $allUsers as user}
					<button
						class="role-btn"
						class:active={$currentUser.id === user.id}
						onclick={() => handleRoleSwitch(user)}
						title="{user.name} - {user.department} - {roleLabels[user.role]}"
					>
						{user.name}
						<span class="role-tag">{roleLabels[user.role]}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</header>

<main class="app-main">
	{@render children()}
</main>

<style>
	.app-header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--header-height);
		background-color: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		box-shadow: var(--shadow-sm);
		z-index: 100;
	}

	.header-inner {
		max-width: 1400px;
		margin: 0 auto;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 var(--spacing-lg);
		gap: var(--spacing-lg);
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: var(--spacing-xl);
		min-width: 0;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		color: var(--color-primary);
		font-weight: 700;
		font-size: 0.9375rem;
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.logo:hover {
		text-decoration: none;
	}

	.logo-text {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
	}

	.nav-link {
		padding: 6px 14px;
		border-radius: var(--radius);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.nav-link:hover {
		color: var(--color-text);
		background-color: var(--color-bg);
		text-decoration: none;
	}

	.nav-link.active {
		color: var(--color-primary);
		background-color: #eff6ff;
	}

	.header-right {
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.role-switcher {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.role-switcher-label {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		margin-right: var(--spacing-xs);
		white-space: nowrap;
	}

	.role-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 4px 10px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background-color: var(--color-surface);
		color: var(--color-text-secondary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.role-btn:hover {
		border-color: var(--color-primary-light);
		color: var(--color-primary);
	}

	.role-btn.active {
		background-color: var(--color-primary);
		border-color: var(--color-primary);
		color: #ffffff;
	}

	.role-btn.active .role-tag {
		background-color: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	.role-tag {
		font-size: 0.625rem;
		padding: 1px 5px;
		border-radius: 9999px;
		background-color: var(--color-bg);
		color: var(--color-text-muted);
		font-weight: 500;
	}

	.app-main {
		margin-top: var(--header-height);
		min-height: calc(100vh - var(--header-height));
		padding: var(--spacing-lg);
		max-width: 1400px;
		margin-left: auto;
		margin-right: auto;
	}

	@media (max-width: 768px) {
		.header-inner {
			flex-wrap: wrap;
			height: auto;
			padding: var(--spacing-sm) var(--spacing-md);
			gap: var(--spacing-sm);
		}

		.app-header {
			height: auto;
		}

		.app-main {
			margin-top: 100px;
		}

		.logo-text {
			font-size: 0.8125rem;
		}

		.role-switcher {
			flex-wrap: wrap;
		}

		.role-switcher-label {
			width: 100%;
		}
	}
</style>
