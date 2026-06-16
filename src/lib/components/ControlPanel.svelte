<script lang="ts">
	import {
		FREQUENCY_MIN,
		FREQUENCY_MAX,
		GAIN_MIN,
		GAIN_MAX,
		ANTENNA_MIN,
		ANTENNA_MAX,
		FILTER_MIN,
		FILTER_MAX
	} from '$lib/game/engine';
	import type { GameState, Level, GameAction } from '$lib/types/game';

	export let gameState: GameState;
	export let level: Level;
	export let onAction: (action: GameAction) => void;

	function updateFrequency(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		const oldValue = gameState.frequency;

		const action: GameAction = {
			timestamp: Date.now(),
			type: 'frequency',
			from: oldValue,
			to: newValue
		};

		gameState.frequency = newValue;
		onAction(action);
	}

	function updateGain(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		const oldValue = gameState.gain;

		const action: GameAction = {
			timestamp: Date.now(),
			type: 'gain',
			from: oldValue,
			to: newValue
		};

		gameState.gain = newValue;
		onAction(action);
	}

	function updateAntenna(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		const oldValue = gameState.antennaAngle;

		const action: GameAction = {
			timestamp: Date.now(),
			type: 'antenna',
			from: oldValue,
			to: newValue
		};

		gameState.antennaAngle = newValue;
		onAction(action);
	}

	function updateFilter(e: Event) {
		const target = e.target as HTMLInputElement;
		const newValue = parseFloat(target.value);
		const oldValue = gameState.noiseFilter;

		const action: GameAction = {
			timestamp: Date.now(),
			type: 'filter',
			from: oldValue,
			to: newValue
		};

		gameState.noiseFilter = newValue;
		onAction(action);
	}

	function getAccuracyColor(current: number, target: number, range: number): string {
		const diff = Math.abs(current - target);
		const ratio = diff / range;
		if (ratio < 0.05) return '#10b981';
		if (ratio < 0.15) return '#f59e0b';
		return '#ef4444';
	}
</script>

<div class="control-panel card">
	<div class="card-header">校准控制台</div>

	<div class="slider-container">
		<div class="slider-label">
			<span class="slider-name">📡 频率 (MHz)</span>
			<span class="slider-value" style="color: {getAccuracyColor(gameState.frequency, level.targetFrequency, FREQUENCY_MAX - FREQUENCY_MIN)}">
				{gameState.frequency.toFixed(2)}
			</span>
		</div>
		<input
			type="range"
			min={FREQUENCY_MIN}
			max={FREQUENCY_MAX}
			step="0.01"
			value={gameState.frequency}
			on:input={updateFrequency}
			disabled={gameState.status !== 'playing'}
		/>
		<div class="hint">目标: {level.targetFrequency.toFixed(2)} MHz</div>
	</div>

	<div class="slider-container">
		<div class="slider-label">
			<span class="slider-name">🔊 增益 (dB)</span>
			<span class="slider-value" style="color: {getAccuracyColor(gameState.gain, level.targetGain, GAIN_MAX - GAIN_MIN)}">
				{gameState.gain.toFixed(1)}
			</span>
		</div>
		<input
			type="range"
			min={GAIN_MIN}
			max={GAIN_MAX}
			step="0.1"
			value={gameState.gain}
			on:input={updateGain}
			disabled={gameState.status !== 'playing'}
		/>
		<div class="hint">目标: {level.targetGain.toFixed(1)} dB</div>
	</div>

	<div class="slider-container">
		<div class="slider-label">
			<span class="slider-name">📐 天线角度 (°)</span>
			<span class="slider-value" style="color: {getAccuracyColor(gameState.antennaAngle, level.targetAntennaAngle, ANTENNA_MAX - ANTENNA_MIN)}">
				{gameState.antennaAngle.toFixed(1)}
			</span>
		</div>
		<input
			type="range"
			min={ANTENNA_MIN}
			max={ANTENNA_MAX}
			step="0.1"
			value={gameState.antennaAngle}
			on:input={updateAntenna}
			disabled={gameState.status !== 'playing'}
		/>
		<div class="hint">目标: {level.targetAntennaAngle.toFixed(1)}°</div>
	</div>

	<div class="slider-container">
		<div class="slider-label">
			<span class="slider-name">🔇 噪声滤波</span>
			<span class="slider-value">
				{(gameState.noiseFilter * 100).toFixed(0)}%
			</span>
		</div>
		<input
			type="range"
			min={FILTER_MIN}
			max={FILTER_MAX}
			step="0.01"
			value={gameState.noiseFilter}
			on:input={updateFilter}
			disabled={gameState.status !== 'playing'}
		/>
		<div class="hint">噪声等级: {(level.noiseLevel * 100).toFixed(0)}%</div>
	</div>
</div>

<style>
	.control-panel {
		height: 100%;
	}

	.hint {
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 4px;
		text-align: right;
	}
</style>
