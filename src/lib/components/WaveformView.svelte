<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { GameState, Level } from '$lib/types/game';
	import { generateWaveform, calculateSignalQuality } from '$lib/game/engine';

	export let gameState: GameState;
	export let level: Level;

	let canvas: HTMLCanvasElement;
	let animationFrame: number;
	let waveformData: number[] = [];
	let scanlineY = 0;

	$: quality = calculateSignalQuality(gameState, level);
	$: if (canvas && gameState && level) {
		waveformData = generateWaveform(gameState, level, 300);
	}

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const w = canvas.width;
		const h = canvas.height;

		ctx.fillStyle = '#0a0e1a';
		ctx.fillRect(0, 0, w, h);

		ctx.strokeStyle = 'rgba(59, 130, 246, 0.1)';
		ctx.lineWidth = 1;
		const gridSize = 30;
		for (let x = 0; x < w; x += gridSize) {
			ctx.beginPath();
			ctx.moveTo(x, 0);
			ctx.lineTo(x, h);
			ctx.stroke();
		}
		for (let y = 0; y < h; y += gridSize) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();
		}

		ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
		ctx.lineWidth = 1;
		ctx.setLineDash([5, 5]);
		ctx.beginPath();
		ctx.moveTo(0, h / 2);
		ctx.lineTo(w, h / 2);
		ctx.stroke();
		ctx.setLineDash([]);

		const centerY = h / 2;
		const amplitude = (h / 2) * 0.8;

		const gradient = ctx.createLinearGradient(0, 0, w, 0);
		gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
		gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.8)');
		gradient.addColorStop(1, 'rgba(6, 182, 212, 0.3)');

		ctx.strokeStyle = '#06b6d4';
		ctx.lineWidth = 2;
		ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
		ctx.shadowBlur = 10;

		ctx.beginPath();
		for (let i = 0; i < waveformData.length; i++) {
			const x = (i / (waveformData.length - 1)) * w;
			const y = centerY - waveformData[i] * amplitude;
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.stroke();

		ctx.shadowBlur = 0;
		ctx.fillStyle = 'rgba(6, 182, 212, 0.1)';
		ctx.beginPath();
		for (let i = 0; i < waveformData.length; i++) {
			const x = (i / (waveformData.length - 1)) * w;
			const y = centerY - waveformData[i] * amplitude;
			if (i === 0) {
				ctx.moveTo(x, y);
			} else {
				ctx.lineTo(x, y);
			}
		}
		ctx.lineTo(w, centerY);
		ctx.lineTo(0, centerY);
		ctx.closePath();
		ctx.fill();

		scanlineY = (scanlineY + 1) % h;
		const scanGradient = ctx.createLinearGradient(0, scanlineY - 20, 0, scanlineY + 20);
		scanGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
		scanGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
		scanGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
		ctx.fillStyle = scanGradient;
		ctx.fillRect(0, scanlineY - 20, w, 40);

		animationFrame = requestAnimationFrame(draw);
	}

	onMount(() => {
		if (canvas) {
			draw();
		}
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
	});
</script>

<div class="waveform-container">
	<div class="waveform-header">
		<span class="label">波形视图</span>
		<span class="quality">
			<span class="status-indicator status-live"></span>
			信号质量: {(quality.overall * 100).toFixed(1)}%
		</span>
	</div>
	<div class="waveform-canvas-wrapper">
		<canvas
		bind:this={canvas}
		width={600}
		height={200}
	></canvas>
	</div>
	<div class="waveform-stats">
		<div class="stat">
			<span class="stat-label">SNR</span>
			<span class="stat-value">{(quality.snr * 100).toFixed(0)}%</span>
		</div>
		<div class="stat">
			<span class="stat-label">频率匹配</span>
			<span class="stat-value">{(quality.frequencyMatch * 100).toFixed(0)}%</span>
		</div>
		<div class="stat">
			<span class="stat-label">增益匹配</span>
			<span class="stat-value">{(quality.gainMatch * 100).toFixed(0)}%</span>
		</div>
		<div class="stat">
			<span class="stat-label">天线对准</span>
			<span class="stat-value">{(quality.antennaMatch * 100).toFixed(0)}%</span>
		</div>
	</div>
</div>

<style>
	.waveform-container {
		background: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
	}

	.waveform-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 16px;
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
	}

	.label {
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--text-secondary);
	}

	.quality {
		font-size: 13px;
		color: var(--accent-green);
		display: flex;
		align-items: center;
	}

	.waveform-canvas-wrapper {
		padding: 12px;
		background: var(--bg-primary);
	}

	canvas {
		width: 100%;
		height: 200px;
		display: block;
		border-radius: 4px;
	}

	.waveform-stats {
		display: flex;
		gap: 16px;
		padding: 10px 16px;
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-label {
		font-size: 10px;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.stat-value {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}
</style>
