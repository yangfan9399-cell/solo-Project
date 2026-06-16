<script lang="ts">
	import '../app.css';
</script>

<div class="app-layout">
	<nav class="top-nav">
		<a href="/" class="nav-brand">🏙️ 城市风洞实验室</a>
		<div class="nav-links">
			<a href="/">关卡选择</a>
		</div>
	</nav>
	<main class="main-content">
		<slot />
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.top-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
	}

	.nav-brand {
		font-size: 20px;
		font-weight: 800;
		color: var(--text-primary);
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 16px;
	}

	.nav-links a {
		color: var(--text-secondary);
		font-size: 14px;
		text-decoration: none;
		transition: color 0.2s;
	}

	.nav-links a:hover {
		color: var(--accent);
	}

	.main-content {
		flex: 1;
		padding: 24px;
	}
</style>
