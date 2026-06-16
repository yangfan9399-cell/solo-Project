import type { PlayerProfile, GameSession, SubwayMap, LevelConfig } from '../types/game';
import { initialSubwayMap, initialLevels } from '../data/initialData';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface DataStore {
	players: Record<string, PlayerProfile>;
	sessions: Record<string, GameSession>;
	maps: Record<string, SubwayMap>;
	levels: Record<string, LevelConfig>;
}

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'game-data.json');

let memoryStore: DataStore | null = null;

function initDataStore(): DataStore {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}

	if (existsSync(DATA_FILE)) {
		try {
			const raw = readFileSync(DATA_FILE, 'utf-8');
			const parsed = JSON.parse(raw) as DataStore;
			if (parsed.players && parsed.sessions && parsed.maps && parsed.levels) {
				return parsed;
			}
		} catch {
			// ignore parse errors, fall through to default
		}
	}

	const defaultStore: DataStore = {
		players: {},
		sessions: {},
		maps: { main: initialSubwayMap },
		levels: Object.fromEntries(initialLevels.map((l) => [l.id, l]))
	};

	writeFileSync(DATA_FILE, JSON.stringify(defaultStore, null, 2));
	return defaultStore;
}

function getStore(): DataStore {
	if (!memoryStore) {
		memoryStore = initDataStore();
	}
	return memoryStore;
}

function saveStore(store: DataStore): void {
	memoryStore = store;
	try {
		writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
	} catch {
		// ignore write errors
	}
}

export const store = {
	getPlayer(id: string): PlayerProfile | null {
		const s = getStore();
		return s.players[id] || null;
	},

	getAllPlayers(): PlayerProfile[] {
		return Object.values(getStore().players);
	},

	savePlayer(player: PlayerProfile): void {
		const s = getStore();
		s.players[player.id] = player;
		saveStore(s);
	},

	getSession(id: string): GameSession | null {
		const s = getStore();
		return s.sessions[id] || null;
	},

	getSessionsByPlayer(playerId: string): GameSession[] {
		return Object.values(getStore().sessions).filter((s) => s.playerId === playerId);
	},

	saveSession(session: GameSession): void {
		const s = getStore();
		s.sessions[session.id] = session;
		saveStore(s);
	},

	getMap(id: string): SubwayMap | null {
		const s = getStore();
		return s.maps[id] || null;
	},

	getLevel(id: string): LevelConfig | null {
		const s = getStore();
		return s.levels[id] || null;
	},

	getAllLevels(): LevelConfig[] {
		return Object.values(getStore().levels);
	}
};
