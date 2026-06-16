import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Player, Session } from '$lib/data/types';
import { DEFAULT_PLAYER } from '$lib/data/seed';

const DATA_DIR = join(process.cwd(), 'data');
const PLAYERS_FILE = join(DATA_DIR, 'players.json');
const SESSIONS_FILE = join(DATA_DIR, 'sessions.json');

interface DB {
	players: Player[];
	sessions: Session[];
}

async function ensureDir(): Promise<void> {
	if (!existsSync(DATA_DIR)) {
		await mkdir(DATA_DIR, { recursive: true });
	}
}

async function readDB(): Promise<DB> {
	await ensureDir();
	if (!existsSync(PLAYERS_FILE)) {
		const initial: DB = {
			players: [{ ...DEFAULT_PLAYER }],
			sessions: []
		};
		await writeFile(PLAYERS_FILE, JSON.stringify(initial.players, null, 2));
		await writeFile(SESSIONS_FILE, JSON.stringify(initial.sessions, null, 2));
		return initial;
	}
	const players = JSON.parse(await readFile(PLAYERS_FILE, 'utf-8')) as Player[];
	const sessions = existsSync(SESSIONS_FILE)
		? (JSON.parse(await readFile(SESSIONS_FILE, 'utf-8')) as Session[])
		: [];
	return { players, sessions };
}

async function writePlayers(players: Player[]): Promise<void> {
	await writeFile(PLAYERS_FILE, JSON.stringify(players, null, 2));
}

async function writeSessions(sessions: Session[]): Promise<void> {
	await writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export async function getPlayer(id: string): Promise<Player | null> {
	const db = await readDB();
	return db.players.find((p) => p.id === id) ?? null;
}

export async function updatePlayer(player: Player): Promise<Player> {
	const db = await readDB();
	const idx = db.players.findIndex((p) => p.id === player.id);
	if (idx >= 0) {
		db.players[idx] = player;
	} else {
		db.players.push(player);
	}
	await writePlayers(db.players);
	return player;
}

export async function createSession(session: Session): Promise<Session> {
	const db = await readDB();
	db.sessions.push(session);
	await writeSessions(db.sessions);
	return session;
}

export async function getSession(id: string): Promise<Session | null> {
	const db = await readDB();
	return db.sessions.find((s) => s.id === id) ?? null;
}

export async function updateSession(session: Session): Promise<Session> {
	const db = await readDB();
	const idx = db.sessions.findIndex((s) => s.id === session.id);
	if (idx >= 0) {
		db.sessions[idx] = session;
	} else {
		db.sessions.push(session);
	}
	await writeSessions(db.sessions);
	return session;
}

export async function getSessionsForPlayer(playerId: string): Promise<Session[]> {
	const db = await readDB();
	return db.sessions.filter((s) => s.playerId === playerId);
}

export async function getSessionsForLevel(playerId: string, levelId: string): Promise<Session[]> {
	const db = await readDB();
	return db.sessions.filter((s) => s.playerId === playerId && s.levelId === levelId);
}
