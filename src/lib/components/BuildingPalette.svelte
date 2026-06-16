<script lang="ts">
	import { selectedBuildingType } from '$lib/data/store';
	import { BUILDING_DEFS } from '$lib/data/seed';
	import type { BuildingType } from '$lib/data/types';

	let selected = $derived($selectedBuildingType);
	let buildingTypes: BuildingType[] = ['low-rise', 'mid-rise', 'high-rise', 'wind-corridor', 'green-belt'];

	function select(type: BuildingType | null) {
		selectedBuildingType.set(type);
	}
</script>

<div class="palette">
	<h3>🏗️ 建筑面板</h3>
	<div class="building-list">
		<button
			class="building-item"
			class:selected={selected === null}
			onclick={() => select(null)}
		>
			<div class="building-icon" style="background: var(--bg-card);">🖱️</div>
			<div class="building-label">选择</div>
		</button>
		{#each buildingTypes as type}
			{@const def = BUILDING_DEFS[type]}
			<button
				class="building-item"
				class:selected={selected === type}
				onclick={() => select(type)}
			>
				<div class="building-icon" style="background: {def.color};">
					{type === 'low-rise' ? '🏠' : type === 'mid-rise' ? '🏢' : type === 'high-rise' ? '🏙️' : type === 'wind-corridor' ? '💨' : '🌳'}
				</div>
				<div class="building-info">
					<div class="building-label">{def.label}</div>
					<div class="building-height">高度{def.height}层 | {def.width}格宽</div>
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.palette {
		padding: 12px;
	}

	.palette h3 {
		font-size: 16px;
		margin-bottom: 12px;
		color: var(--accent);
	}

	.building-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.building-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px;
		background: var(--bg-card);
		border: 2px solid transparent;
		border-radius: 8px;
		color: var(--text-primary);
		text-align: left;
		width: 100%;
		transition: all 0.2s;
	}

	.building-item:hover {
		border-color: var(--border);
	}

	.building-item.selected {
		border-color: var(--accent);
		background: rgba(56, 189, 248, 0.1);
	}

	.building-icon {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 18px;
		flex-shrink: 0;
	}

	.building-info {
		flex: 1;
		min-width: 0;
	}

	.building-label {
		font-size: 13px;
		font-weight: 600;
	}

	.building-height {
		font-size: 11px;
		color: var(--text-secondary);
	}
</style>
