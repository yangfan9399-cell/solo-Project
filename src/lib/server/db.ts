import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import process from 'process';
import type { PlayerProfile, Level, GameState } from '$lib/types/game';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findProjectRoot(): string {
	let dir = __dirname;
	while (dir !== path.parse(dir).root) {
		if (fs.existsSync(path.join(dir, 'package.json'))) {
			return dir;
		}
		dir = path.dirname(dir);
	}
	return process.cwd();
}

const PROJECT_ROOT = findProjectRoot();
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const LEVELS_FILE = path.join(DATA_DIR, 'levels.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

interface DataStore<T> {
	items: T[];
}

function ensureDataDir() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
}

function readStore<T>(filePath: string, defaultItems: T[] = []): DataStore<T> {
	ensureDataDir();
	if (!fs.existsSync(filePath)) {
		const store: DataStore<T> = { items: defaultItems };
		fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
		return store;
	}
	try {
		const raw = fs.readFileSync(filePath, 'utf-8');
		return JSON.parse(raw) as DataStore<T>;
	} catch {
		const store: DataStore<T> = { items: defaultItems };
		fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
		return store;
	}
}

function writeStore<T>(filePath: string, store: DataStore<T>): void {
	ensureDataDir();
	fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
}

export const playersDb = {
	getAll(): PlayerProfile[] {
		return readStore<PlayerProfile>(PLAYERS_FILE).items;
	},
	getById(id: string): PlayerProfile | undefined {
		return readStore<PlayerProfile>(PLAYERS_FILE).items.find((p) => p.id === id);
	},
	create(player: PlayerProfile): PlayerProfile {
		const store = readStore<PlayerProfile>(PLAYERS_FILE);
		store.items.push(player);
		writeStore(PLAYERS_FILE, store);
		return player;
	},
	update(id: string, updates: Partial<PlayerProfile>): PlayerProfile | undefined {
		const store = readStore<PlayerProfile>(PLAYERS_FILE);
		const index = store.items.findIndex((p) => p.id === id);
		if (index === -1) return undefined;
		store.items[index] = { ...store.items[index], ...updates };
		writeStore(PLAYERS_FILE, store);
		return store.items[index];
	}
};

export const levelsDb = {
	getAll(): Level[] {
		return readStore<Level>(LEVELS_FILE).items;
	},
	getById(id: string): Level | undefined {
		return readStore<Level>(LEVELS_FILE).items.find((l) => l.id === id);
	},
	bulkUpsert(levels: Level[]): void {
		const store = readStore<Level>(LEVELS_FILE);
		for (const level of levels) {
			const index = store.items.findIndex((l) => l.id === level.id);
			if (index === -1) {
				store.items.push(level);
			} else {
				store.items[index] = level;
			}
		}
		writeStore(LEVELS_FILE, store);
	}
};

export const gamesDb = {
	getAll(): GameState[] {
		return readStore<GameState>(GAMES_FILE).items;
	},
	getById(id: string): GameState | undefined {
		return readStore<GameState>(GAMES_FILE).items.find((g) => g.id === id);
	},
	getByPlayerId(playerId: string): GameState[] {
		return readStore<GameState>(GAMES_FILE).items.filter((g) => g.playerId === playerId);
	},
	create(game: GameState): GameState {
		const store = readStore<GameState>(GAMES_FILE);
		store.items.push(game);
		writeStore(GAMES_FILE, store);
		return game;
	},
	update(id: string, updates: Partial<GameState>): GameState | undefined {
		const store = readStore<GameState>(GAMES_FILE);
		const index = store.items.findIndex((g) => g.id === id);
		if (index === -1) return undefined;
		store.items[index] = { ...store.items[index], ...updates };
		writeStore(GAMES_FILE, store);
		return store.items[index];
	}
};
