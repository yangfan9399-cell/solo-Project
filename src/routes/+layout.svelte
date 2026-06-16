<script lang="ts">
	import '../app.css';
</script>

<main class="app-container">
	<slot />
</main>

<style>
	.app-container {
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		position: relative;
	}
</style>
