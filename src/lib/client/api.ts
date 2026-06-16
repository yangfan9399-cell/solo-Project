import type {
	PlayerProfile,
	GameSession,
	LevelConfig,
	SubwayMap,
	PlayerAction,
	GameResult,
	ScoreBreakdown
} from '../types/game';

const api = {
	async get<T>(path: string): Promise<T> {
		const res = await fetch(path);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json() as T;
	},

	async post<T>(path: string, body: unknown): Promise<T> {
		const res = await fetch(path, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json() as T;
	},

	async put<T>(path: string, body: unknown): Promise<T> {
		const res = await fetch(path, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		return res.json() as T;
	}
};

export const playersApi = {
	async getAll(): Promise<{ players: PlayerProfile[] }> {
		return api.get('/api/players');
	},
	async get(id: string): Promise<{ player: PlayerProfile | null }> {
		return api.get(`/api/players?id=${encodeURIComponent(id)}`);
	},
	async create(name: string, avatar = '🚇'): Promise<{ player: PlayerProfile }> {
		return api.post('/api/players', { name, avatar });
	},
	async update(id: string, updates: Partial<Pick<PlayerProfile, 'name' | 'avatar'>>): Promise<{ player: PlayerProfile }> {
		return api.put('/api/players', { id, ...updates });
	}
};

export const levelsApi = {
	async getAll(): Promise<{ levels: LevelConfig[] }> {
		return api.get('/api/levels');
	},
	async get(id: string): Promise<{ level: LevelConfig | null }> {
		return api.get(`/api/levels?id=${encodeURIComponent(id)}`);
	}
};

export const mapsApi = {
	async get(id = 'main'): Promise<{ map: SubwayMap }> {
		return api.get(`/api/maps?id=${encodeURIComponent(id)}`);
	}
};

export const sessionsApi = {
	async get(id: string): Promise<{ session: GameSession | null }> {
		return api.get(`/api/sessions?id=${encodeURIComponent(id)}`);
	},
	async getByPlayer(playerId: string): Promise<{ sessions: GameSession[] }> {
		return api.get(`/api/sessions?playerId=${encodeURIComponent(playerId)}`);
	},
	async create(playerId: string, levelId: string, mapId = 'main'): Promise<{ session: GameSession; level: LevelConfig; mapId: string }> {
		return api.post('/api/sessions', { playerId, levelId, mapId });
	},
	async action(id: string, action: PlayerAction | 'START' | 'FINISH' | 'PAUSE' | 'RESUME' | 'RESET'): Promise<{
		session: GameSession;
		result?: GameResult;
		rating?: { stars: number; label: string };
		previewScore?: ScoreBreakdown;
	}> {
		return api.post(`/api/sessions/${id}`, { action });
	}
};

const PLAYER_STORAGE_KEY = 'subway_maze_current_player';

export function getLocalPlayerId(): string | null {
	try {
		return localStorage.getItem(PLAYER_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function setLocalPlayerId(id: string | null): void {
	try {
		if (id) {
			localStorage.setItem(PLAYER_STORAGE_KEY, id);
		} else {
			localStorage.removeItem(PLAYER_STORAGE_KEY);
		}
	} catch {
		// ignore
	}
}
