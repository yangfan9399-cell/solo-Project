import fs from "node:fs";
import path from "node:path";
import type { GameState, Player, GameSession, WrongAnswer, DailyStreak, ActionHistory } from "~/lib/types";
import { PIPE_STOPS } from "~/lib/stops";
import { LEVELS } from "~/lib/levels";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "game-data.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getInitialState(): GameState {
  return {
    stops: PIPE_STOPS,
    levels: LEVELS,
    players: [],
    sessions: [],
    wrongAnswers: [],
    dailyStreaks: [],
    actionHistory: [],
  };
}

export function readGameData(): GameState {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    const initial = getInitialState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as GameState;
  } catch {
    const initial = getInitialState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
}

export function writeGameData(state: GameState): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

export function getPlayer(playerId: string): Player | null {
  const data = readGameData();
  return data.players.find((p) => p.id === playerId) || null;
}

export function createPlayer(name: string): Player {
  const data = readGameData();
  const player: Player = {
    id: `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: Date.now(),
    totalScore: 0,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayDate: null,
    highestLevel: 1,
    totalPlays: 0,
  };
  data.players.push(player);
  writeGameData(data);
  return player;
}

export function updatePlayer(playerId: string, updates: Partial<Player>): Player | null {
  const data = readGameData();
  const idx = data.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return null;
  data.players[idx] = { ...data.players[idx], ...updates };
  writeGameData(data);
  return data.players[idx];
}

export function getSessionsByPlayer(playerId: string): GameSession[] {
  const data = readGameData();
  return data.sessions.filter((s) => s.playerId === playerId).sort((a, b) => b.startTime - a.startTime);
}

export function getSession(sessionId: string): GameSession | null {
  const data = readGameData();
  return data.sessions.find((s) => s.id === sessionId) || null;
}

export function createSession(session: GameSession): GameSession {
  const data = readGameData();
  data.sessions.push(session);
  writeGameData(data);
  return session;
}

export function updateSession(sessionId: string, updates: Partial<GameSession>): GameSession | null {
  const data = readGameData();
  const idx = data.sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  data.sessions[idx] = { ...data.sessions[idx], ...updates };
  writeGameData(data);
  return data.sessions[idx];
}

export function addWrongAnswer(wrong: Omit<WrongAnswer, "id">): WrongAnswer {
  const data = readGameData();
  const wa: WrongAnswer = {
    ...wrong,
    id: `wrong_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  data.wrongAnswers.push(wa);
  writeGameData(data);
  return wa;
}

export function getWrongAnswersByPlayer(playerId: string, limit = 50): WrongAnswer[] {
  const data = readGameData();
  return data.wrongAnswers
    .filter((w) => w.playerId === playerId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

export function markWrongAnswerReviewed(wrongId: string): WrongAnswer | null {
  const data = readGameData();
  const idx = data.wrongAnswers.findIndex((w) => w.id === wrongId);
  if (idx === -1) return null;
  data.wrongAnswers[idx].reviewed = true;
  writeGameData(data);
  return data.wrongAnswers[idx];
}

export function getDailyStreak(playerId: string, date: string): DailyStreak | null {
  const data = readGameData();
  return data.dailyStreaks.find((d) => d.playerId === playerId && d.date === date) || null;
}

export function updateDailyStreak(playerId: string, date: string, score: number): DailyStreak {
  const data = readGameData();
  const existing = data.dailyStreaks.find((d) => d.playerId === playerId && d.date === date);
  if (existing) {
    existing.score = Math.max(existing.score, score);
    existing.played = true;
    writeGameData(data);
    return existing;
  }
  const streak: DailyStreak = { playerId, date, score, played: true };
  data.dailyStreaks.push(streak);
  writeGameData(data);
  return streak;
}

export function getStreakDays(playerId: string): { current: number; best: number; dates: string[] } {
  const data = readGameData();
  const streaks = data.dailyStreaks
    .filter((d) => d.playerId === playerId && d.played)
    .map((d) => d.date)
    .sort();

  if (streaks.length === 0) return { current: 0, best: 0, dates: [] };

  let best = 1;
  let current = 1;

  for (let i = 1; i < streaks.length; i++) {
    const prev = new Date(streaks[i - 1]);
    const curr = new Date(streaks[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      current++;
      best = Math.max(best, current);
    } else if (diffDays > 1) {
      current = 1;
    }
  }

  const today = new Date().toISOString().split("T")[0];
  const lastPlayed = streaks[streaks.length - 1];
  const diffFromToday = Math.round((new Date(today).getTime() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24));

  if (diffFromToday > 1) {
    current = 0;
  }

  return { current, best, dates: streaks };
}

export function addActionHistory(action: Omit<ActionHistory, "id">): ActionHistory {
  const data = readGameData();
  const ah: ActionHistory = {
    ...action,
    id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
  data.actionHistory.push(ah);
  writeGameData(data);
  return ah;
}

export function getActionHistoryBySession(sessionId: string): ActionHistory[] {
  const data = readGameData();
  return data.actionHistory.filter((a) => a.sessionId === sessionId).sort((a, b) => a.timestamp - b.timestamp);
}

export function initializeDefaultData(): void {
  const data = readGameData();
  if (data.players.length === 0) {
    const demoPlayer: Player = {
      id: "player_demo",
      name: "管风琴学徒",
      createdAt: Date.now() - 86400000 * 7,
      totalScore: 3420,
      currentStreak: 3,
      bestStreak: 7,
      lastPlayDate: new Date().toISOString().split("T")[0],
      highestLevel: 4,
      totalPlays: 23,
    };
    data.players.push(demoPlayer);
    writeGameData(data);
  }
}
