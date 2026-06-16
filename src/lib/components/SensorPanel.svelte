<script lang="ts">
	import { windStore } from '$lib/data/store';
	import type { SensorReading, Direction } from '$lib/data/types';

	let windData = $derived($windStore);
	let sensors = $derived(windData.sensors);

	const DIR_LABEL: Record<Direction, string> = {
		N: '↑ 北',
		S: '↓ 南',
		E: '→ 东',
		W: '← 西'
	};

	function speedColor(speed: number): string {
		if (speed < 1.5) return 'var(--text-secondary)';
		if (speed <= 5) return 'var(--success)';
		if (speed <= 8) return 'var(--warning)';
		return 'var(--danger)';
	}

	function vortexColor(intensity: number): string {
		if (intensity <= 0.2) return 'var(--success)';
		if (intensity <= 0.4) return 'var(--warning)';
		return 'var(--danger)';
	}
</script>

<div class="sensor-panel card">
	<h3>📡 传感器数据</h3>
	{#if sensors.length === 0}
		<div class="no-data">点击"运行模拟"获取传感器读数</div>
	{:else}
		<div class="sensor-list">
			{#each sensors as sensor, i}
				<div class="sensor-item">
					<div class="sensor-header">
						<span class="sensor-id">S{i + 1}</span>
						<span class="sensor-pos">({sensor.cell.row},{sensor.cell.col})</span>
					</div>
					<div class="sensor-readings">
						<div class="reading">
							<span class="reading-label">风速</span>
							<span class="reading-value" style="color: {speedColor(sensor.windSpeed)}">
								{sensor.windSpeed.toFixed(1)} m/s
							</span>
						</div>
						<div class="reading">
							<span class="reading-label">方向</span>
							<span class="reading-value">{DIR_LABEL[sensor.direction]}</span>
						</div>
						<div class="reading">
							<span class="reading-label">涡流</span>
							<span class="reading-value" style="color: {vortexColor(sensor.vortexIntensity)}">
								{sensor.vortexIntensity.toFixed(2)}
								{#if sensor.vortexIntensity > 0.4}⚠️{/if}
							</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.sensor-panel {
		max-height: 500px;
		overflow-y: auto;
	}

	.sensor-panel h3 {
		font-size: 16px;
		color: var(--accent);
		margin-bottom: 12px;
	}

	.no-data {
		color: var(--text-secondary);
		font-size: 13px;
		text-align: center;
		padding: 20px 0;
	}

	.sensor-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.sensor-item {
		background: var(--bg-card);
		border-radius: 8px;
		padding: 8px 12px;
	}

	.sensor-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 6px;
	}

	.sensor-id {
		font-weight: 700;
		font-size: 13px;
		color: var(--warning);
	}

	.sensor-pos {
		font-size: 11px;
		color: var(--text-secondary);
	}

	.sensor-readings {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 4px;
	}

	.reading {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.reading-label {
		font-size: 10px;
		color: var(--text-secondary);
		text-transform: uppercase;
	}

	.reading-value {
		font-size: 12px;
		font-weight: 600;
	}
</style>
