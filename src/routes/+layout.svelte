<script lang="ts">
	import '$lib/app.css';
</script>

<div class="app-shell">
	<nav class="nav-bar">
		<a href="/" class="nav-brand">🔬 铅玻璃迷宫</a>
		<div class="nav-links">
			<a href="/">关卡选择</a>
			<a href="/materials">材料库</a>
			<a href="/editor">关卡编辑</a>
			<a href="/results">记录与排行</a>
			<a href="/seeds">种子样本</a>
		</div>
	</nav>
	<main class="main-content">
		<slot />
	</main>
</div>
