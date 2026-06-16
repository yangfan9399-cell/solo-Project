<script lang="ts">
	import type { GameState, Level } from '$lib/types/game';
	import { calculateDecodeProgress } from '$lib/game/engine';

	export let gameState: GameState;
	export let level: Level;

	$: decodeInfo = calculateDecodeProgress(gameState, level);
	$: progressPercent = decodeInfo.progress * 100;
	$: isComplete = decodeInfo.progress >= 1;

	function getCharClass(index: number, char: string): string {
		if (index < decodeInfo.decoded.length) {
			return 'char decoded';
		}
		if (index === decodeInfo.decoded.length && decodeInfo.nextChar) {
			return 'char decoding';
		}
		return 'char unknown';
	}
</script>

<div class="telemetry-panel card">
	<div class="card-header">
		<span>遥测解码</span>
		<span class="status">
			{#if isComplete}
				<span class="status-indicator status-live"></span>
				解码完成
			{:else if decodeInfo.progress > 0}
				<span class="status-indicator status-warning"></span>
				解码中...
			{:else}
				<span class="status-indicator status-error"></span>
				信号丢失
			{/if}
		</span>
	</div>

	<div class="decoder-display">
		<div class="message-grid">
			{#each level.telemetryMessage.split('') as char, i}
				<div class="{getCharClass(i, char)}">
					{char === ' ' ? '\u00A0' : char}
				</div>
			{/each}
		</div>

		<div class="progress-container">
			<div class="progress-label">
				<span>解码进度</span>
				<span>{progressPercent.toFixed(0)}%</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
			</div>
		</div>

		<div class="telemetry-info">
			<div class="info-row">
				<span class="info-label">目标消息长度</span>
				<span class="info-value">{level.telemetryMessage.length} 字符</span>
			</div>
			<div class="info-row">
				<span class="info-label">已解码</span>
				<span class="info-value">{decodeInfo.decoded.length} 字符</span>
			</div>
			<div class="info-row">
				<span class="info-label">下一字符</span>
				<span class="info-value next-char">
					{decodeInfo.nextChar || '—'}
				</span>
			</div>
		</div>

		<div class="hint-text">
			{#if isComplete}
				✅ 信号已完全锁定，遥测数据解码成功！
			{:else if decodeInfo.progress > 0.5}
				📶 信号良好，继续校准参数...
			{:else if decodeInfo.progress > 0}
				📡 检测到微弱信号，提高对准精度...
			{:else}
				❌ 信号丢失，请调整频率和天线角度
			{/if}
		</div>
	</div>
</div>

<style>
	.telemetry-panel {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.status {
		font-size: 12px;
		display: flex;
		align-items: center;
		color: var(--text-secondary);
	}

	.decoder-display {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.message-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: 12px;
		background: var(--bg-primary);
		border-radius: 6px;
		border: 1px solid var(--border-color);
		font-family: 'SF Mono', 'Menlo', monospace;
		font-size: 18px;
		font-weight: bold;
	}

	.char {
		width: 28px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.3s ease;
	}

	.char.decoded {
		background: rgba(16, 185, 129, 0.2);
		color: var(--accent-green);
		border: 1px solid var(--accent-green);
		text-shadow: 0 0 10px var(--glow-green);
	}

	.char.decoding {
		background: rgba(245, 158, 11, 0.2);
		color: var(--accent-yellow);
		border: 1px solid var(--accent-yellow);
		animation: pulse 0.5s ease-in-out infinite;
	}

	.char.unknown {
		background: var(--bg-tertiary);
		color: var(--text-muted);
		border: 1px solid var(--border-color);
	}

	.progress-container {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.progress-label {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: var(--text-secondary);
	}

	.telemetry-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 12px;
		background: var(--bg-secondary);
		border-radius: 6px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
	}

	.info-label {
		color: var(--text-muted);
	}

	.info-value {
		color: var(--text-primary);
		font-weight: 500;
	}

	.next-char {
		font-family: 'SF Mono', 'Menlo', monospace;
		font-size: 14px;
		color: var(--accent-yellow);
	}

	.hint-text {
		padding: 10px 12px;
		background: var(--bg-secondary);
		border-radius: 6px;
		font-size: 12px;
		color: var(--text-secondary);
		text-align: center;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
</style>
