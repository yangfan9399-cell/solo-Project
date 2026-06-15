<script lang="ts">
	import { onMount } from 'svelte';
	import type { Material } from '$lib/types';

	let materials: Material[] = [];

	onMount(async () => {
		const res = await fetch('/api/materials');
		materials = await res.json();
	});

	function getAbsorptionLevel(rate: number): string {
		if (rate < 0.05) return '极低';
		if (rate < 0.1) return '低';
		if (rate < 0.2) return '中等';
		if (rate < 0.3) return '高';
		return '极高';
	}

	function getAbsorptionBadge(rate: number): string {
		if (rate < 0.05) return 'badge-success';
		if (rate < 0.1) return 'badge-info';
		if (rate < 0.2) return 'badge-warning';
		return 'badge-danger';
	}
</script>

<h1 class="page-title">📚 材料库</h1>
<p style="color:var(--text-secondary); margin-bottom:24px;">
	不同铅玻璃材料具有不同的折射率和吸收损耗。折射率越高，光线偏折越大；吸收率越高，光强损失越多。
</p>

<div class="grid grid-2">
	{#each materials as mat}
		<div class="card material-card">
			<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
				<div
					class="material-swatch"
					style="background:{mat.color};"
				></div>
				<div>
					<h3 style="font-size:16px;">{mat.name}</h3>
					<span class="tag" style="background:{mat.color}33; color:{mat.color};">{mat.id}</span>
				</div>
			</div>
			<p style="color:var(--text-secondary); font-size:13px; margin-bottom:16px;">
				{mat.description}
			</p>
			<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
				<div>
					<div style="color:var(--text-muted); margin-bottom:4px;">折射率</div>
					<div style="font-size:20px; font-weight:700; color:var(--accent);">{mat.refractiveIndex}</div>
				</div>
				<div>
					<div style="color:var(--text-muted); margin-bottom:4px;">吸收损耗</div>
					<div style="font-size:20px; font-weight:700; color:var(--warning);">{(mat.absorptionRate * 100).toFixed(0)}%</div>
				</div>
			</div>
			<div style="margin-top:12px;">
				<span class="badge {getAbsorptionBadge(mat.absorptionRate)}">
					吸收等级: {getAbsorptionLevel(mat.absorptionRate)}
				</span>
			</div>
			<div class="intensity-bar" style="margin-top:8px;">
				<div
					class="intensity-bar-fill"
					style="width:{(1 - mat.absorptionRate) * 100}%; background:{mat.color};"
				></div>
			</div>
			<div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
				透光率: {((1 - mat.absorptionRate) * 100).toFixed(0)}%
			</div>
		</div>
	{/each}
</div>

<style>
	.material-card {
		transition: transform 0.2s;
	}
	.material-card:hover {
		transform: translateY(-2px);
	}
	.material-swatch {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		flex-shrink: 0;
		border: 2px solid rgba(255,255,255,0.1);
	}
</style>
