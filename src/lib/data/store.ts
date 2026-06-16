import { writable, derived, get } from 'svelte/store';
import type { Player, Session, PlacedBuilding, Operation, Scheme, SensorReading, GameScores, WindCell, Level } from './types';
import { LEVELS, BUILDING_DEFS } from './seed';
import { canPlace } from './wind-engine';

function createPlayerStore() {
	const { subscribe, set, update } = writable<Player>({
		id: 'player-1',
		name: '研究员',
		completedLevels: [],
		bestScores: {},
		createdAt: Date.now()
	});

	return {
		subscribe,
		set,
		load: async () => {
			const res = await fetch('/api/player?id=player-1');
			if (res.ok) {
				const player = await res.json();
				set(player);
			}
		},
		save: async (player: Player) => {
			const res = await fetch('/api/player', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(player)
			});
			if (res.ok) {
				const updated = await res.json();
				set(updated);
			}
		}
	};
}

export const playerStore = createPlayerStore();

function createSessionStore() {
	const { subscribe, set, update } = writable<Session | null>(null);
	const operationStack = writable<Operation[]>([]);
	const redoStack = writable<Operation[]>([]);

	function syncFromServer(session: Session) {
		set(session);
		operationStack.set(session.operations || []);
		redoStack.set([]);
	}

	return {
		subscribe,
		operationStack: { subscribe: operationStack.subscribe },
		redoStack: { subscribe: redoStack.subscribe },
		set,

		startSession: async (levelId: string) => {
			const level = LEVELS.find((l) => l.id === levelId);
			if (!level) return;

			const session: Session = {
				id: `session-${Date.now()}`,
				levelId,
				playerId: 'player-1',
				buildings: [...level.presetBuildings],
				operations: [],
				schemes: [],
				scores: null,
				status: 'playing',
				createdAt: Date.now(),
				updatedAt: Date.now()
			};

			const res = await fetch('/api/session', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(session)
			});

			if (res.ok) {
				const created = await res.json();
				syncFromServer(created);
			}
		},

		findOrStartSession: async (levelId: string) => {
			const playerId = 'player-1';
			const existingRes = await fetch(`/api/session?playerId=${playerId}&levelId=${levelId}`);
			if (existingRes.ok) {
				const sessions = (await existingRes.json()) as Session[];
				const playing = sessions.find((s) => s.status === 'playing');
				if (playing) {
					syncFromServer(playing);
					return;
				}
			}
			await sessionStore.startSession(levelId);
		},

		loadSession: async (sessionId: string) => {
			const res = await fetch(`/api/session?id=${sessionId}`);
			if (res.ok) {
				const session = await res.json();
				syncFromServer(session);
			}
		},

		placeBuilding: async (buildingType: string, row: number, col: number) => {
			const session = get({ subscribe });
			if (!session) return false;

			const level = LEVELS.find((l) => l.id === session.levelId);
			if (!level) return false;

			if (session.buildings.length >= level.presetBuildings.length + level.maxBuildings) {
				return false;
			}

			if (!canPlace(buildingType, row, col, level.gridSize, session.buildings, level.presetBuildings)) {
				return false;
			}

			const building: PlacedBuilding = {
				id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
				type: buildingType as PlacedBuilding['type'],
				cell: { row, col }
			};

			const operation: Operation = {
				id: `op-${Date.now()}`,
				type: 'place',
				building,
				timestamp: Date.now()
			};

			const res = await fetch('/api/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: session.id, operation })
			});

			if (res.ok) {
				const updated = await res.json();
				syncFromServer(updated);
				return true;
			}
			return false;
		},

		removeBuilding: async (buildingId: string) => {
			const session = get({ subscribe });
			if (!session) return;

			const building = session.buildings.find((b) => b.id === buildingId);
			if (!building) return;

			const level = LEVELS.find((l) => l.id === session.levelId);
			if (level?.presetBuildings.some((pb) => pb.id === buildingId)) return;

			const operation: Operation = {
				id: `op-${Date.now()}`,
				type: 'remove',
				building,
				timestamp: Date.now()
			};

			const res = await fetch('/api/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: session.id, operation })
			});

			if (res.ok) {
				const updated = await res.json();
				syncFromServer(updated);
			}
		},

		undo: async () => {
			const session = get({ subscribe });
			if (!session) return;

			const res = await fetch('/api/history', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: session.id, action: 'undo' })
			});

			if (res.ok) {
				const updated: Session = await res.json();
				set(updated);

				const oldOps = get(operationStack);
				if (oldOps.length > 0) {
					const lastOp = oldOps[oldOps.length - 1];
					operationStack.update((s) => s.slice(0, -1));
					redoStack.update((s) => [...s, lastOp]);
				} else {
					operationStack.set(updated.operations || []);
				}
			}
		},

		redo: async () => {
			const session = get({ subscribe });
			if (!session) return;

			const redos = get(redoStack);
			if (redos.length === 0) return;

			const lastRedo = redos[redos.length - 1];
			const res = await fetch('/api/history', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId: session.id, operation: lastRedo })
			});

			if (res.ok) {
				const updated: Session = await res.json();
				syncFromServer(updated);
			}
		},

		saveScheme: async (name: string, sensors: SensorReading[], scores: GameScores): Promise<boolean> => {
			let saved = false;
			let sessionId: string | null = null;

			update((session) => {
				if (!session) return session;
				const scheme: Scheme = {
					id: `scheme-${Date.now()}`,
					name,
					buildings: [...session.buildings],
					sensors: [...sensors],
					scores: { ...scores },
					timestamp: Date.now()
				};
				sessionId = session.id;
				saved = true;
				return { ...session, schemes: [...session.schemes, scheme] };
			});

			if (saved && sessionId) {
				const latest = get({ subscribe });
				if (latest) {
					latest.updatedAt = Date.now();
					const res = await fetch('/api/session', {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(latest)
					});
					if (res.ok) {
						const updated = await res.json();
						set(updated);
						return true;
					}
				}
			}
			return false;
		},

		updateSessionStatus: async (status: 'playing' | 'passed' | 'failed', scores: GameScores | null) => {
			const session = get({ subscribe });
			if (!session) return;

			session.status = status;
			session.scores = scores;
			session.updatedAt = Date.now();

			const res = await fetch('/api/session', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(session)
			});

			if (res.ok) {
				const updated = await res.json();
				set(updated);

				if (status === 'passed' && scores) {
					const player = get(playerStore);
					if (!player.completedLevels.includes(session.levelId)) {
						player.completedLevels.push(session.levelId);
					}
					const existing = player.bestScores[session.levelId];
					if (!existing || scores.total > existing.total) {
						player.bestScores[session.levelId] = scores;
					}
					await playerStore.save(player);
				}
			}
		},

		persistSession: async (): Promise<boolean> => {
			const session = get({ subscribe });
			if (!session) return false;
			session.updatedAt = Date.now();
			const res = await fetch('/api/session', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(session)
			});
			if (res.ok) {
				const updated = await res.json();
				set(updated);
				return true;
			}
			return false;
		}
	};
}

export const sessionStore = createSessionStore();

export const currentLevel = derived(sessionStore, ($session) => {
	if (!$session) return null;
	return LEVELS.find((l) => l.id === $session.levelId) ?? null;
});

function createWindStore() {
	const { subscribe, set } = writable<{
		grid: WindCell[][] | null;
		sensors: SensorReading[];
		scores: GameScores | null;
		passed: boolean | null;
		loading: boolean;
	}>({
		grid: null,
		sensors: [],
		scores: null,
		passed: null,
		loading: false
	});

	return {
		subscribe,
		set,
		simulate: async (levelId: string, buildings: PlacedBuilding[]) => {
			set({ grid: null, sensors: [], scores: null, passed: null, loading: true });
			try {
				const res = await fetch('/api/simulate', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ levelId, buildings })
				});
				if (res.ok) {
					const data = await res.json();
					set({
						grid: data.windGrid,
						sensors: data.sensors,
						scores: data.scores,
						passed: data.passed,
						loading: false
					});
				} else {
					set({ grid: null, sensors: [], scores: null, passed: null, loading: false });
				}
			} catch {
				set({ grid: null, sensors: [], scores: null, passed: null, loading: false });
			}
		},

		submitScore: async (levelId: string, buildings: PlacedBuilding[]) => {
			try {
				const res = await fetch('/api/score', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ levelId, buildings })
				});
				if (res.ok) {
					return await res.json();
				}
			} catch {
				return null;
			}
			return null;
		},

		reset: () => {
			set({ grid: null, sensors: [], scores: null, passed: null, loading: false });
		}
	};
}

export const windStore = createWindStore();

export const selectedBuildingType = writable<string | null>(null);
