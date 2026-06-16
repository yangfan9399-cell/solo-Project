<script lang="ts">
	import type { SubwayMap, LevelConfig, GameSession } from '$lib/types/game';
	import { getEventTypeName } from '$lib/utils/format';
	import {
		isStationClosed,
		isEscalatorDown
	} from '$lib/game/pathfinding';

	export let map: SubwayMap;
	export let level: LevelConfig;
	export let session: GameSession;
	export let adjacentStations: { stationId: string; lineId: string; time: number }[] = [];
	export let availableTransfers: string[] = [];
	export let suggestedRoute: { stationId: string; lineId: string; isTransfer: boolean; travelTime: number }[] | null = null;
	export let realtimeElapsed: number;
	export let onMove: (stationId: string, lineId: string, time: number) => void;
	export let onTransfer: (lineId: string) => void;
	export let onSelectLine: (lineId: string) => void;

	$: currentStation = map.stations[session.currentStationId];
	$: targetStation = map.stations[level.targetStationId];
	$: visitedStations = getVisitedStations();

	function getVisitedStations(): Set<string> {
		const s = new Set<string>();
		s.add(level.startStationId);
		for (const a of session.history.actions) {
			if (a.type === 'MOVE') s.add(a.toStationId);
		}
		return s;
	}

	function isAdjacent(stationId: string, lineId: string): boolean {
		return adjacentStations.some((a) => a.stationId === stationId && a.lineId === lineId);
	}

	function getAdjacentTime(stationId: string, lineId: string): number {
		const a = adjacentStations.find((x) => x.stationId === stationId && x.lineId === lineId);
		return a?.time || 2;
	}

	function handleStationClick(stationId: string) {
		if (session.status !== 'playing') return;
		if (stationId === session.currentStationId) return;

		if (!session.currentLineId) return;

		const adj = adjacentStations.find((a) => a.stationId === stationId);
		if (adj) {
			onMove(stationId, adj.lineId, adj.time);
		}
	}

	function isInSuggestedPath(stationId: string): boolean {
		if (!suggestedRoute) return false;
		return suggestedRoute.some((s) => s.stationId === stationId);
	}

	function getCurrentLineColor(): string {
		if (!session.currentLineId) return '#64748b';
		return map.lines[session.currentLineId]?.color || '#64748b';
	}

	function buildSuggestedPath(): string {
		if (!suggestedRoute || !map || !session) return '';
		const points: string[] = [`${map.stations[session.currentStationId].x},${map.stations[session.currentStationId].y}`];
		for (const step of suggestedRoute) {
			if (!step.isTransfer) {
				points.push(`${map.stations[step.stationId].x},${map.stations[step.stationId].y}`);
			}
		}
		return points.join(' ');
	}

	function getEventKey(e: { type: string; stationId?: string; lineId?: string }): string {
		switch (e.type) {
			case 'STATION_CLOSED':
				return `${e.type}:${e.stationId}`;
			case 'ESCALATOR_DOWN':
				return `${e.type}:${e.stationId}:${e.lineId}`;
			case 'DELAY':
				return `${e.type}:${e.lineId}`;
			default:
				return e.type;
		}
	}

	function getActiveEvents(): string[] {
		const events: string[] = [];
		for (const e of session.eventState.activeEvents) {
			const key = getEventKey(e);
			const triggeredAt = session.eventState.triggeredAt[key];
			if (triggeredAt === undefined) continue;
			if (realtimeElapsed >= triggeredAt && realtimeElapsed < triggeredAt + e.duration) {
				const eventName = getEventTypeName(e.type);
				switch (e.type) {
					case 'STATION_CLOSED': {
						const s = map.stations[e.stationId];
						events.push(`🚫 ${s?.name || e.stationId} ${eventName}`);
						break;
					}
					case 'ESCALATOR_DOWN': {
						const s = map.stations[e.stationId];
						const l = map.lines[e.lineId];
						events.push(`⚠️ ${s?.name || ''} ${l?.name || ''} ${eventName}`);
						break;
					}
					case 'DELAY': {
						const l = map.lines[e.lineId];
						events.push(`⏱️ ${l?.name || ''} ${eventName} +${e.extraTime}s`);
						break;
					}
				}
			}
		}
		return events;
	}

	function getEscalatorWarnings(): { x: number; y: number }[] {
		const warns: { x: number; y: number }[] = [];
		for (const e of session.eventState.activeEvents) {
			if (e.type !== 'ESCALATOR_DOWN') continue;
			const key = getEventKey(e);
			const triggeredAt = session.eventState.triggeredAt[key];
			if (triggeredAt === undefined) continue;
			if (realtimeElapsed >= triggeredAt && realtimeElapsed < triggeredAt + e.duration) {
				const s = map.stations[e.stationId];
				if (s) warns.push({ x: s.x + 16, y: s.y - 10 });
			}
		}
		return warns;
	}

	$: svgWidth = 640;
	$: svgHeight = 520;
</script>

<div class="map-container">
	<div class="map-legend">
		{#each Object.values(map.lines) as line}
			<div class="legend-item">
				<span class="legend-line" style="background: {line.color};"></span>
				<span class="text-sm">{line.name}</span>
			</div>
		{/each}
	</div>

	<svg viewBox="0 0 {svgWidth} {svgHeight}" class="map-svg" preserveAspectRatio="xMidYMid meet">
		{#each Object.values(map.lines) as line}
			<polyline
				fill="none"
				stroke={line.color}
				stroke-width="6"
				stroke-linecap="round"
				stroke-linejoin="round"
				opacity={session.currentLineId === line.id ? 1 : 0.6}
				points={line.stationIds.map((sid) => `${map.stations[sid].x},${map.stations[sid].y}`).join(' ')}
			/>
		{/each}

		{#if suggestedRoute && suggestedRoute.length > 0}
			<polyline
				fill="none"
				stroke="#fbbf24"
				stroke-width="10"
				stroke-linecap="round"
				stroke-linejoin="round"
				opacity="0.3"
				stroke-dasharray="12 8"
				points={buildSuggestedPath()}
			/>
		{/if}

		{#each Object.values(map.stations) as station}
			{@const isCurrent = station.id === session.currentStationId}
			{@const isTarget = station.id === level.targetStationId}
			{@const isStart = station.id === level.startStationId}
			{@const isVisited = visitedStations.has(station.id)}
			{@const closed = isStationClosed(station.id, session.eventState, realtimeElapsed)}
			{@const canClick = session.status === 'playing' && isAdjacent(station.id, session.currentLineId || '')}

			<g
				on:click={() => handleStationClick(station.id)}
				class="station-group {canClick ? 'clickable' : ''} {closed ? 'closed' : ''}"
				transform={`translate(${station.x}, ${station.y})`}
			>
				{#if isCurrent}
					<circle r="24" fill={getCurrentLineColor()} opacity="0.25">
						<animate attributeName="r" values="20;28;20" dur="1.5s" repeatCount="indefinite" />
					</circle>
				{/if}

				{#if isTarget}
					<circle r="18" fill="none" stroke="#fbbf24" stroke-width="3" stroke-dasharray="4 3" />
				{/if}

				<circle
					r={station.isTransfer ? 11 : 8}
					fill={closed ? '#475569' : isCurrent ? getCurrentLineColor() : isVisited ? '#60a5fa' : isInSuggestedPath(station.id) ? '#fbbf24' : '#1e293b'}
					stroke={station.isTransfer ? '#f1f5f9' : '#475569'}
					stroke-width="2"
				/>

				{#if isStart && !isCurrent}
					<text y="-18" text-anchor="middle" fill="#10b981" font-size="11" font-weight="600">起</text>
				{/if}
				{#if isTarget}
					<text y="-18" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="600">终</text>
				{/if}

				<text
					y={station.y < 120 ? 26 : station.y > 400 ? -16 : 20}
					text-anchor="middle"
					fill={closed ? '#64748b' : '#e2e8f0'}
					font-size="12"
					font-weight={isCurrent || isTarget ? '700' : '500'}
				>
					{station.name}
				</text>

				{#if closed}
					<text y="5" text-anchor="middle" font-size="14" fill="#ef4444">🚫</text>
				{/if}
			</g>
		{/each}

		{#each getEscalatorWarnings() as w}
			<g transform={`translate(${w.x}, ${w.y})`}>
				<circle r="10" fill="#ef4444" opacity="0.8" />
				<text y="4" text-anchor="middle" font-size="11">⚠</text>
			</g>
		{/each}
	</svg>

	<div class="event-ticker">
		{#if getActiveEvents().length > 0}
			<div class="ticker-title">⚠️ 活动事件:</div>
			{#each getActiveEvents() as ev}
				<span class="event-badge">{ev}</span>
			{/each}
		{:else}
			<div class="text-muted text-sm">当前无活动事件</div>
		{/if}
	</div>
</div>

<style>
	.map-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.map-legend {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		padding: 8px 4px 12px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.legend-line {
		width: 24px;
		height: 4px;
		border-radius: 2px;
	}

	.map-svg {
		width: 100%;
		flex: 1;
		min-height: 400px;
		user-select: none;
	}

	.station-group {
		cursor: default;
	}

	.station-group.clickable {
		cursor: pointer;
	}

	.station-group.clickable:hover circle:first-of-type + circle,
	.station-group.clickable:hover circle:nth-child(2) {
		filter: brightness(1.3);
	}

	.station-group.closed {
		cursor: not-allowed;
	}

	.event-ticker {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		background: var(--bg-card);
		border-radius: 8px;
		margin-top: 8px;
		min-height: 40px;
	}

	.ticker-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--warning);
	}

	.event-badge {
		font-size: 11px;
		background: rgba(239, 68, 68, 0.15);
		color: var(--danger);
		padding: 4px 8px;
		border-radius: 4px;
	}
</style>
