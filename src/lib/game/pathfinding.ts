import type { SubwayMap, GameEvent, GameEventState, Station, Connection } from '../types/game';

function getEventTriggeredAt(event: GameEvent, eventState: GameEventState): number | undefined {
	let key: string;
	switch (event.type) {
		case 'STATION_CLOSED':
			key = `${event.type}:${event.stationId}`;
			break;
		case 'ESCALATOR_DOWN':
			key = `${event.type}:${event.stationId}:${event.lineId}`;
			break;
		case 'DELAY':
			key = `${event.type}:${event.lineId}`;
			break;
	}
	return eventState.triggeredAt[key];
}

export function isStationClosed(stationId: string, eventState: GameEventState, currentTime: number): boolean {
	return eventState.activeEvents.some((e) => {
		if (e.type !== 'STATION_CLOSED' || e.stationId !== stationId) return false;
		const triggeredAt = getEventTriggeredAt(e, eventState);
		if (triggeredAt === undefined) return false;
		return currentTime >= triggeredAt && currentTime < triggeredAt + e.duration;
	});
}

export function isEscalatorDown(stationId: string, lineId: string, eventState: GameEventState, currentTime: number): boolean {
	return eventState.activeEvents.some((e) => {
		if (e.type !== 'ESCALATOR_DOWN' || e.stationId !== stationId || e.lineId !== lineId) return false;
		const triggeredAt = getEventTriggeredAt(e, eventState);
		if (triggeredAt === undefined) return false;
		return currentTime >= triggeredAt && currentTime < triggeredAt + e.duration;
	});
}

export function getLineDelay(lineId: string, eventState: GameEventState, currentTime: number): number {
	let extra = 0;
	for (const e of eventState.activeEvents) {
		if (e.type !== 'DELAY' || e.lineId !== lineId) continue;
		const triggeredAt = getEventTriggeredAt(e, eventState);
		if (triggeredAt === undefined) continue;
		if (currentTime >= triggeredAt && currentTime < triggeredAt + e.duration) {
			extra += e.extraTime;
		}
	}
	return extra;
}

export interface RouteStep {
	stationId: string;
	lineId: string;
	isTransfer: boolean;
	travelTime: number;
}

export interface PathNode {
	stationId: string;
	lineId: string | null;
	time: number;
	transfers: number;
	parent: PathNode | null;
}

export function findRoute(
	map: SubwayMap,
	fromStationId: string,
	toStationId: string,
	eventState: GameEventState,
	currentTime: number,
	preferTime = true
): RouteStep[] | null {
	const openList: PathNode[] = [];
	const visited = new Map<string, number>();

	const startStation = map.stations[fromStationId];
	if (!startStation) return null;

	for (const lineId of startStation.lineIds) {
		if (isEscalatorDown(fromStationId, lineId, eventState, currentTime)) continue;
		openList.push({
			stationId: fromStationId,
			lineId,
			time: 0,
			transfers: 0,
			parent: null
		});
	}

	while (openList.length > 0) {
		openList.sort((a, b) => (preferTime ? a.time - b.time : a.transfers - b.transfers));
		const current = openList.shift()!;
		const key = `${current.stationId}:${current.lineId}`;

		if (visited.has(key) && visited.get(key)! <= (preferTime ? current.time : current.transfers)) {
			continue;
		}
		visited.set(key, preferTime ? current.time : current.transfers);

		if (current.stationId === toStationId) {
			return reconstructPath(current);
		}

		if (isStationClosed(current.stationId, eventState, currentTime + current.time)) {
			continue;
		}

		const station = map.stations[current.stationId];
		const lineDelays = current.lineId ? getLineDelay(current.lineId, eventState, currentTime + current.time) : 0;

		for (const conn of map.connections) {
			if (conn.from !== current.stationId) continue;
			if (current.lineId && conn.lineId !== current.lineId) continue;

			const nextStation = map.stations[conn.to];
			if (!nextStation) continue;
			if (isStationClosed(conn.to, eventState, currentTime + current.time + conn.travelTime + lineDelays)) continue;

			const newTime = current.time + conn.travelTime + lineDelays;
			const nextKey = `${conn.to}:${conn.lineId}`;
			if (visited.has(nextKey) && visited.get(nextKey)! <= (preferTime ? newTime : current.transfers)) continue;

			openList.push({
				stationId: conn.to,
				lineId: conn.lineId,
				time: newTime,
				transfers: current.transfers,
				parent: current
			});
		}

		if (current.lineId && station.isTransfer) {
			for (const lineId of station.lineIds) {
				if (lineId === current.lineId) continue;
				if (isEscalatorDown(current.stationId, lineId, eventState, currentTime + current.time)) continue;
				const transferTime = 3;
				const newTime = current.time + transferTime;
				const newTransfers = current.transfers + 1;
				const nextKey = `${current.stationId}:${lineId}`;
				if (visited.has(nextKey) && visited.get(nextKey)! <= (preferTime ? newTime : newTransfers)) continue;

				openList.push({
					stationId: current.stationId,
					lineId,
					time: newTime,
					transfers: newTransfers,
					parent: current
				});
			}
		}
	}

	return null;
}

function reconstructPath(endNode: PathNode): RouteStep[] {
	const steps: RouteStep[] = [];
	let current: PathNode | null = endNode;

	while (current && current.parent) {
		const parent: PathNode = current.parent;
		if (parent.stationId === current.stationId && parent.lineId !== current.lineId) {
			steps.unshift({
				stationId: current.stationId,
				lineId: current.lineId || '',
				isTransfer: true,
				travelTime: current.time - parent.time
			});
		} else if (current.lineId) {
			steps.unshift({
				stationId: current.stationId,
				lineId: current.lineId,
				isTransfer: false,
				travelTime: current.time - parent.time
			});
		}
		current = parent;
	}

	return steps;
}

export function getAdjacentStations(
	map: SubwayMap,
	stationId: string,
	lineId: string,
	eventState: GameEventState,
	currentTime: number
): Connection[] {
	const result: Connection[] = [];
	const delay = getLineDelay(lineId, eventState, currentTime);

	for (const conn of map.connections) {
		if (conn.from !== stationId || conn.lineId !== lineId) continue;
		if (isStationClosed(conn.to, eventState, currentTime + conn.travelTime + delay)) continue;
		result.push({ ...conn, travelTime: conn.travelTime + delay });
	}

	return result;
}

export function getAvailableTransfers(
	map: SubwayMap,
	stationId: string,
	currentLineId: string,
	eventState: GameEventState,
	currentTime: number
): string[] {
	const station = map.stations[stationId];
	if (!station || !station.isTransfer) return [];

	return station.lineIds.filter((lineId) => {
		if (lineId === currentLineId) return false;
		return !isEscalatorDown(stationId, lineId, eventState, currentTime);
	});
}

export function getEventKey(event: GameEvent): string {
	switch (event.type) {
		case 'STATION_CLOSED':
			return `${event.type}:${event.stationId}`;
		case 'ESCALATOR_DOWN':
			return `${event.type}:${event.stationId}:${event.lineId}`;
		case 'DELAY':
			return `${event.type}:${event.lineId}`;
	}
}
