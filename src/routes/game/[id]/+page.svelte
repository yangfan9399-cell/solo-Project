<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import GameHeader from '$lib/components/GameHeader.svelte';
	import WaveformView from '$lib/components/WaveformView.svelte';
	import ControlPanel from '$lib/components/ControlPanel.svelte';
	import TelemetryDecoder from '$lib/components/TelemetryDecoder.svelte';
	import HistoryPanel from '$lib/components/HistoryPanel.svelte';
	import GameResult from '$lib/components/GameResult.svelte';
	import {
		pushHistory,
		undoAction,
		redoAction,
		calculateDecodeProgress,
		createInitialGameState
	} from '$lib/game/engine';
	import type { GameState, Level, GameAction, GameResult as GameResultType } from '$lib/types/game';

	let gameState: GameState | null = null;
	let level: Level | null = null;
	let result: GameResultType | null = null;
	let showResult = false;
	let loading = true;

	async function loadGame() {
		const $page = get(page);
		const gameId = $page.params.id;

		try {
			const gameRes = await fetch(`/api/games/${gameId}`);
			if (!gameRes.ok) {
				console.error('游戏不存在');
				goto('/');
				return;
			}
			gameState = await gameRes.json();

			const levelRes = await fetch(`/api/levels/${gameState.levelId}`);
			if (!levelRes.ok) {
				console.error('关卡不存在');
				goto('/');
				return;
			}
			level = await levelRes.json();

			if (gameState.status !== 'playing') {
				const settleRes = await fetch(`/api/games/${gameId}/settle`, { method: 'POST' });
				if (settleRes.ok) {
					const data = await settleRes.json();
					result = data.result;
					showResult = true;
				}
			}
		} catch (error) {
			console.error('加载游戏失败:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadGame();

		document.addEventListener('keydown', handleKeydown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
	});

	function handleKeydown(e: KeyboardEvent) {
		if (!gameState || !level || gameState.status !== 'playing') return;

		if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
			e.preventDefault();
			handleUndo();
		}
		if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
			e.preventDefault();
			handleRedo();
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			handleSettle();
		}
	}

	function handleAction(action: GameAction) {
		if (!gameState || !level) return;
		gameState = pushHistory(gameState, action);

		const decodeInfo = calculateDecodeProgress(gameState, level);
		gameState.decodedChars = decodeInfo.decoded;

		saveGameState();
	}

	async function saveGameState() {
		if (!gameState) return;
		try {
			await fetch(`/api/games/${gameState.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					frequency: gameState.frequency,
					gain: gameState.gain,
					antennaAngle: gameState.antennaAngle,
					noiseFilter: gameState.noiseFilter,
					decodedChars: gameState.decodedChars,
					history: gameState.history,
					historyIndex: gameState.historyIndex
				})
			});
		} catch (error) {
			console.error('保存游戏状态失败:', error);
		}
	}

	function handleUndo() {
		if (!gameState || !level || gameState.status !== 'playing') return;
		gameState = undoAction(gameState, level);
		saveGameState();
	}

	function handleRedo() {
		if (!gameState || !level || gameState.status !== 'playing') return;
		gameState = redoAction(gameState, level);
		saveGameState();
	}

	async function handleReset() {
		if (!gameState || !level) return;
		if (!confirm('确定要重置到初始状态吗？所有操作将被清除。')) return;

		const initialState = createInitialGameState(gameState.playerId, level);
		gameState = {
			...initialState,
			id: gameState.id,
			playerId: gameState.playerId,
			levelId: gameState.levelId,
			startTime: gameState.startTime
		};

		await saveGameState();
	}

	async function handleSettle() {
		if (!gameState || gameState.status !== 'playing') return;

		try {
			const res = await fetch(`/api/games/${gameState.id}/settle`, {
				method: 'POST'
			});

			if (res.ok) {
				const data = await res.json();
				gameState = data.game;
				result = data.result;
				showResult = true;
			}
		} catch (error) {
			console.error('结算失败:', error);
		}
	}

	function handleBack() {
		goto('/');
	}

	async function handleRetry() {
		if (!gameState || !level) return;

		try {
			const res = await fetch('/api/games', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					playerId: gameState.playerId,
					levelId: level.id
				})
			});

			if (res.ok) {
				const newGame = await res.json();
				showResult = false;
				result = null;
				goto(`/game/${newGame.id}`);
			}
		} catch (error) {
			console.error('创建新游戏失败:', error);
		}
	}
</script>

<div class="game-page">
	{#if loading}
		<div class="loading">加载中...</div>
	{:else if gameState && level}
		<GameHeader
			gameState={gameState}
			level={level}
			onSettle={handleSettle}
			onBack={handleBack}
		/>

		<div class="game-content">
			<div class="left-panel">
				<ControlPanel
					gameState={gameState}
					level={level}
					onAction={handleAction}
				/>
			</div>

			<div class="center-panel">
				<WaveformView gameState={gameState} level={level} />
				<TelemetryDecoder gameState={gameState} level={level} />
			</div>

			<div class="right-panel">
				<HistoryPanel
					gameState={gameState}
					onUndo={handleUndo}
					onRedo={handleRedo}
					onReset={handleReset}
				/>
			</div>
		</div>

		{#if showResult && result}
			<GameResult
				result={result}
				level={level}
				onRetry={handleRetry}
				onBack={handleBack}
			/>
		{/if}
	{/if}
</div>

<style>
	.game-page {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: var(--text-muted);
	}

	.game-content {
		flex: 1;
		display: grid;
		grid-template-columns: 280px 1fr 280px;
		gap: 16px;
		padding: 16px;
		overflow: hidden;
	}

	.left-panel,
	.right-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow: hidden;
	}

	.center-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		overflow: hidden;
	}

	.center-panel :global(.waveform-container) {
		flex-shrink: 0;
	}

	.center-panel :global(.telemetry-panel) {
		flex: 1;
		min-height: 0;
	}

	.right-panel :global(.history-panel) {
		flex: 1;
		min-height: 0;
	}
</style>
