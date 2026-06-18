<script lang="ts">
	import '../app.css';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import { onMount } from 'svelte';
	import { draftsStore, versionsStore, reviewsStore, anomaliesStore } from '$lib/stores/appStore';
	
	onMount(() => {
		draftsStore.init();
		versionsStore.init();
		reviewsStore.init();
		anomaliesStore.init();
	});
</script>

<div class="app-layout">
	<Sidebar />
	<main class="main-content">
		<slot />
	</main>
</div>

<style>
	.app-layout {
		display: flex;
		min-height: 100vh;
	}
	
	.main-content {
		flex: 1;
		margin-left: var(--sidebar-width);
		min-height: 100vh;
	}
</style>
