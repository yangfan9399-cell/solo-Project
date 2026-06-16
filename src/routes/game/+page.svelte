<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		mapsApi,
		levelsApi,
		sessionsApi,
		getLocalPlayerId,
		playersApi
	} from '$lib/client/api';
	import {
		findRoute,
		getAdjacentStations,
		getAvailableTransfers,
		isStationClosed,
		isEscalatorDown
	} from '$lib/game/pathfinding';
	import type {
		SubwayMap,
		LevelConfig,
		GameSession,
		PlayerAction,
		GameResult,
		ScoreBreakdown
	} from '$lib/types/game';
	import SubwayMapView from '$lib/components/SubwayMapView.svelte';
	import GameControls from '$lib/components/GameControls.svelte';
	import GameHUD from '$lib/components/GameHUD.svelte';
	import ResultModal from '$lib/components/ResultModal.svelte';
	import HistoryPanel from '$lib/components/HistoryPanel.svelte';

	let isLoading = true;
	let error: string | null = null;
	let map: SubwayMap | null = null;
	let level: LevelConfig | null = null;
	let session: GameSession | null = null;
	let result: GameResult | null = null;
	let rating: { stars: number; label: string } | null = null;
	let previewScore: ScoreBreakdown | null = null;

	let adjacentStations: { stationId: string; lineId: string; time: number }[] = [];
	let availableTransfers: string[] = [];
	let suggestedRoute: { stationId: string; lineId: string; isTransfer: boolean; travelTime: number }[] | null = null;

	let realtimeElapsed = 0;
	let tickInterval: ReturnType<typeof setInterval> | null = null;
	let lastUpdateTime = 0;

	$: if (session && map && level) {
		if (session.status === 'playing') {
			adjacentStations = session.currentLineId
				? getAdjacentStations(map, session.currentStationId, session.currentLineId, session.eventState, session.elapsedSeconds).map((c) => ({
						stationId: c.to,
						lineId: c.lineId,
						time: c.travelTime
				  }))
				: [];

			availableTransfers = session.currentLineId
				? getAvailableTransfers(map, session.currentStationId, session.currentLineId, session.eventState, session.elapsedSeconds)
				: map.stations[session.currentStationId]?.lineIds.filter((l) => !isEscalatorDown(session.currentStationId, l, session.eventState, session.elapsedSeconds)) || [];
		}
	}

	$: if (session && map && level && session.status === 'playing') {
		suggestedRoute = findRoute(
			map,
			session.currentStationId,
			level.targetStationId,
			session.eventState,
			session.elapsedSeconds,
			true
		);
	}

	onMount(async () => {
		const levelId = $page.url.searchParams.get('level') || 'lv1';
		const sessionId = $page.url.searchParams.get('session');
		const playerId = getLocalPlayerId();

		if (!playerId) {
			error = '请先创建玩家档案';
			isLoading = false;
			return;
		}

		try {
			const [{ map: m }, { level: l }] = await Promise.all([mapsApi.get('main'), levelsApi.get(levelId)]);
			map = m;
			level = l;

			if (!l) {
				error = '关卡不存在';
				isLoading = false;
				return;
			}

			if (sessionId) {
				const { session: s } = await sessionsApi.get(sessionId);
				session = s;
				if (s) {
					realtimeElapsed = s.elapsedSeconds;
					if (s.status === 'playing') startTick();
				}
			} else {
				const { session: s } = await sessionsApi.create(playerId, levelId);
				session = s;
			}

			isLoading = false;
		} catch (e) {
			error = '加载失败: ' + (e as Error).message;
			isLoading = false;
		}
	});

	onDestroy(() => {
		if (tickInterval) clearInterval(tickInterval);
	});

	function startTick() {
		lastUpdateTime = Date.now();
		tickInterval = setInterval(() => {
			if (!session || session.status !== 'playing') return;
			const now = Date.now();
			realtimeElapsed += (now - lastUpdateTime) / 1000;
			lastUpdateTime = now;
		}, 100);
	}

	async function startGame() {
		if (!session) return;
		const r = await sessionsApi.action(session.id, 'START');
		session = r.session;
		previewScore = r.previewScore || null;
		startTick();
	}

	async function moveTo(stationId: string, lineId: string, time: number) {
		if (!session) return;
		const action: PlayerAction = {
			type: 'MOVE',
			fromStationId: session.currentStationId,
			toStationId: stationId,
			lineId,
			timeSpent: time
		};
		await sendAction(action);
	}

	async function transferTo(lineId: string) {
		if (!session || !session.currentLineId) return;
		const action: PlayerAction = {
			type: 'TRANSFER',
			stationId: session.currentStationId,
			fromLineId: session.currentLineId,
			toLineId: lineId,
			timeSpent: 3
		};
		await sendAction(action);
	}

	async function selectLine(lineId: string) {
		if (!session || session.currentLineId) return;
		const action: PlayerAction = {
			type: 'TRANSFER',
			stationId: session.currentStationId,
			fromLineId: '',
			toLineId: lineId,
			timeSpent: 0
		};
		await sendAction(action);
	}

	async function waitAction(seconds: number) {
		if (!session) return;
		const action: PlayerAction = {
			type: 'WAIT',
			stationId: session.currentStationId,
			timeSpent: seconds
		};
		await sendAction(action);
	}

	async function rewindTo(step: number) {
		if (!session) return;
		const action: PlayerAction = {
			type: 'REWIND',
			toStep: step
		};
		const r = await sessionsApi.action(session.id, action);
		session = r.session;
		realtimeElapsed = session.elapsedSeconds;
		previewScore = r.previewScore || null;
		await tick();
	}

	async function sendAction(action: PlayerAction) {
		if (!session) return;
		if (tickInterval) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
		const r = await sessionsApi.action(session.id, action);
		session = r.session;
		realtimeElapsed = session.elapsedSeconds;
		previewScore = r.previewScore || null;

		if (r.result) {
			result = r.result;
			rating = r.rating || null;
		} else if (session.status === 'playing') {
			startTick();
		}
		await tick();
	}

	async function finishGame() {
		if (!session) return;
		const r = await sessionsApi.action(session.id, 'FINISH');
		session = r.session;
		result = r.result || null;
		rating = r.rating || null;
		realtimeElapsed = session.elapsedSeconds;
		if (tickInterval) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
	}

	async function resetGame() {
		if (!session) return;
		const r = await sessionsApi.action(session.id, 'RESET');
		session = r.session;
		result = null;
		rating = null;
		previewScore = null;
		realtimeElapsed = 0;
		if (tickInterval) {
			clearInterval(tickInterval);
			tickInterval = null;
		}
	}

	function closeResult() {
		result = null;
	}

	$: remainingSeconds = level ? Math.max(0, level.timeLimitSeconds - realtimeElapsed) : 0;
	$: isLastTrain = level ? remainingSeconds <= level.lastTrainCountdown : false;
	$: stationClosed = map && session && level ? isStationClosed(level.targetStationId, session.eventState, session.elapsedSeconds) : false;
</script>

<div class="game-page">
	{#if isLoading}
		<div class="loading">
			<div class="text-xl mb-2">🚇 加载游戏资源...</div>
			<div class="text-muted">正在准备地铁网络和关卡配置</div>
		</div>
	{:else if error}
		<div class="loading">
			<div class="text-xl mb-2 text-danger">⚠️ {error}</div>
			<button class="btn-primary mt-4" on:click={() => goto('/')}>返回首页</button>
		</div>
	{:else if map && level && session}
		<GameHUD
			{level}
			{session}
			{realtimeElapsed}
			{remainingSeconds}
			{isLastTrain}
			{previewScore}
			onBack={() => goto('/levels')}
		/>

		<div class="game-layout">
			<div class="map-section">
				<SubwayMapView
					{map}
					{level}
					{session}
					{adjacentStations}
					{availableTransfers}
					{suggestedRoute}
					{realtimeElapsed}
					onMove={moveTo}
					onTransfer={transferTo}
					onSelectLine={selectLine}
				/>
			</div>

			<div class="side-panel">
				<GameControls
					{session}
					{level}
					{map}
					{adjacentStations}
					{availableTransfers}
					{stationClosed}
					onStart={startGame}
					onMove={moveTo}
					onTransfer={transferTo}
					onSelectLine={selectLine}
					onWait={waitAction}
					onFinish={finishGame}
					onReset={resetGame}
				/>
				<HistoryPanel {session} onRewind={rewindTo} />
			</div>
		</div>

		{#if result && rating}
			<ResultModal {result} {rating} {level} onClose={closeResult} onReplay={resetGame} onBack={() => goto('/levels')} />
		{/if}
	{/if}
</div>

<style>
	.game-page {
		min-height: calc(100vh - 70px);
		display: flex;
		flex-direction: column;
	}

	.loading {
		min-height: calc(100vh - 100px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}

	.game-layout {
		display: grid;
		grid-template-columns: 1fr 360px;
		gap: 20px;
		padding: 16px 20px;
		flex: 1;
		min-height: 0;
	}

	@media (max-width: 1024px) {
		.game-layout {
			grid-template-columns: 1fr;
		}
	}

	.map-section {
		background: var(--bg-secondary);
		border-radius: 12px;
		border: 1px solid var(--border);
		padding: 12px;
		min-height: 500px;
		overflow: hidden;
	}

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-height: 0;
	}
</style>
