<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		mapsApi,
		levelsApi,
		sessionsApi,
		getLocalPlayerId,
		playersApi,
		setLocalPlayerId
	} from '$lib/client/api';
	import { formatTime, formatTransferCount } from '$lib/utils/format';
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
	let noPlayer = false;
	let map: SubwayMap | null = null;
	let level: LevelConfig | null = null;
	let session: GameSession | null = null;
	let result: GameResult | null = null;
	let rating: { stars: number; label: string } | null = null;
	let previewScore: ScoreBreakdown | null = null;
	let showQuickCreate = false;
	let quickName = '';
	let quickAvatar = '🚇';

	let adjacentStations: { stationId: string; lineId: string; time: number }[] = [];
	let availableTransfers: string[] = [];
	let suggestedRoute: { stationId: string; lineId: string; isTransfer: boolean; travelTime: number }[] | null = null;

	let realtimeElapsed = 0;
	let tickInterval: ReturnType<typeof setInterval> | null = null;
	let lastUpdateTime = 0;
	let accumulatedTickTime = 0;
	let tickSyncInProgress = false;

	$: if (session && map && level) {
		const s = session;
		if (s.status === 'playing') {
			adjacentStations = s.currentLineId
				? getAdjacentStations(map, s.currentStationId, s.currentLineId, s.eventState, realtimeElapsed).map((c) => ({
						stationId: c.to,
						lineId: c.lineId,
						time: c.travelTime
				  }))
				: [];

			availableTransfers = s.currentLineId
				? getAvailableTransfers(map, s.currentStationId, s.currentLineId, s.eventState, realtimeElapsed)
				: map.stations[s.currentStationId]?.lineIds.filter((l) => !isEscalatorDown(s.currentStationId, l, s.eventState, realtimeElapsed)) || [];
		}
	}

	$: if (session && map && level && session.status === 'playing') {
		const s = session;
		suggestedRoute = findRoute(
			map,
			s.currentStationId,
			level.targetStationId,
			s.eventState,
			realtimeElapsed,
			true
		);
	}

	const quickAvatars = ['🚇', '🚉', '🚈', '🚝', '🚄', '🚅', '🎮', '🎯', '🏆', '⭐'];

	async function quickCreatePlayer() {
		if (!quickName.trim()) return;
		const { player } = await playersApi.create(quickName, quickAvatar);
		setLocalPlayerId(player.id);
		noPlayer = false;
		showQuickCreate = false;
		quickName = '';
		const levelId = $page.url.searchParams.get('level') || 'lv1';
		const [{ map: m }, { level: l }, { session: s }] = await Promise.all([
			mapsApi.get('main'),
			levelsApi.get(levelId),
			sessionsApi.create(player.id, levelId)
		]);
		map = m;
		level = l;
		session = s;
		isLoading = false;
	}

	onMount(async () => {
		const levelId = $page.url.searchParams.get('level') || 'lv1';
		const sessionId = $page.url.searchParams.get('session');
		const playerId = getLocalPlayerId();

		if (!playerId) {
			noPlayer = true;
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
		accumulatedTickTime = 0;
		tickInterval = setInterval(async () => {
			if (!session || session.status !== 'playing') return;
			const now = Date.now();
			const delta = (now - lastUpdateTime) / 1000;
			realtimeElapsed += delta;
			accumulatedTickTime += delta;
			lastUpdateTime = now;

			if (accumulatedTickTime >= 2 && !tickSyncInProgress) {
				tickSyncInProgress = true;
				const tickSeconds = Math.floor(accumulatedTickTime);
				accumulatedTickTime -= tickSeconds;
				try {
					const action: PlayerAction = { type: 'TICK', timeSpent: tickSeconds };
					const r = await sessionsApi.action(session.id, action);
					session = r.session;
					if (r.result) {
						result = r.result;
						rating = r.rating || null;
						if (tickInterval) {
							clearInterval(tickInterval);
							tickInterval = null;
						}
					}
				} finally {
					tickSyncInProgress = false;
				}
			}
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
	$: stationClosed = map && session && level ? isStationClosed(level.targetStationId, session.eventState, realtimeElapsed) : false;
</script>

<div class="game-page">
	{#if isLoading}
		<div class="loading">
			<div class="text-xl mb-2">🚇 加载游戏资源...</div>
			<div class="text-muted">正在准备地铁网络和关卡配置</div>
		</div>
	{:else if noPlayer}
		<div class="loading">
			<div class="text-xl mb-2">👤 需要玩家档案</div>
			<div class="text-muted mb-4">创建玩家档案以保存你的游戏进度和分数</div>
			{#if !showQuickCreate}
				<div class="flex gap-3">
					<button class="btn-primary" on:click={() => (showQuickCreate = true)}>快速创建玩家</button>
					<button class="btn-secondary" on:click={() => goto('/')}>返回首页</button>
				</div>
			{:else}
				<div class="card quick-create">
					<div class="flex flex-col gap-4">
						<div>
							<label class="block mb-2 text-sm">玩家昵称</label>
							<input
								bind:value={quickName}
								placeholder="输入你的昵称"
								maxlength={20}
								style="width: 100%;"
							/>
						</div>
						<div>
							<label class="block mb-2 text-sm">选择头像</label>
							<div class="flex gap-2 flex-wrap">
								{#each quickAvatars as a}
									<button
										class="avatar-btn {quickAvatar === a ? 'selected' : ''}"
										on:click={() => (quickAvatar = a)}
									>
										{a}
									</button>
								{/each}
							</div>
						</div>
						<div class="flex gap-3 justify-end">
							<button class="btn-secondary" on:click={() => (showQuickCreate = false)}>取消</button>
							<button class="btn-primary" on:click={quickCreatePlayer} disabled={!quickName.trim()}>开始游戏</button>
						</div>
					</div>
				</div>
			{/if}
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

	.quick-create {
		width: 90%;
		max-width: 420px;
		text-align: left;
	}

	.avatar-btn {
		width: 48px;
		height: 48px;
		font-size: 24px;
		background: var(--bg-card);
		border: 2px solid transparent;
		border-radius: 10px;
		padding: 0;
	}

	.avatar-btn.selected {
		border-color: var(--accent);
		background: rgba(59, 130, 246, 0.1);
	}
</style>
