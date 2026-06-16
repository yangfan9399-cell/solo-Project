import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { PlayerProfile, GameHistory, GameSession, GameState, HistoryAction } from "~/types/game";

const DATA_DIR = join(process.cwd(), "data");
const PLAYER_FILE = join(DATA_DIR, "player.json");
const HISTORY_FILE = join(DATA_DIR, "gameHistory.json");
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

function ensureDataFiles(): void {
  if (!existsSync(PLAYER_FILE)) {
    const defaultPlayer: PlayerProfile = {
      id: "player-1",
      name: "考古探险家",
      avatar: "diver",
      totalScore: 0,
      completedLevels: [],
      highestScores: {},
      gamesPlayed: 0,
      createdAt: Date.now()
    };
    writeFileSync(PLAYER_FILE, JSON.stringify(defaultPlayer, null, 2), "utf-8");
  }

  if (!existsSync(HISTORY_FILE)) {
    writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), "utf-8");
  }

  if (!existsSync(SESSIONS_FILE)) {
    writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

export function getPlayerProfile(): PlayerProfile {
  ensureDataFiles();
  try {
    const data = readFileSync(PLAYER_FILE, "utf-8");
    return JSON.parse(data) as PlayerProfile;
  } catch (error) {
    console.error("Failed to read player profile:", error);
    const defaultPlayer: PlayerProfile = {
      id: "player-1",
      name: "考古探险家",
      avatar: "diver",
      totalScore: 0,
      completedLevels: [],
      highestScores: {},
      gamesPlayed: 0,
      createdAt: Date.now()
    };
    savePlayerProfile(defaultPlayer);
    return defaultPlayer;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  ensureDataFiles();
  try {
    writeFileSync(PLAYER_FILE, JSON.stringify(profile, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save player profile:", error);
  }
}

export function updatePlayerName(name: string): PlayerProfile {
  const profile = getPlayerProfile();
  profile.name = name;
  savePlayerProfile(profile);
  return profile;
}

export function getGameHistory(): GameHistory[] {
  ensureDataFiles();
  try {
    const data = readFileSync(HISTORY_FILE, "utf-8");
    return JSON.parse(data) as GameHistory[];
  } catch (error) {
    console.error("Failed to read game history:", error);
    return [];
  }
}

export function saveGameHistoryEntry(entry: GameHistory): GameHistory[] {
  ensureDataFiles();
  const history = getGameHistory();
  history.unshift(entry);
  if (history.length > 100) {
    history.splice(100);
  }
  try {
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save game history:", error);
  }
  return history;
}

export function getLevelHistory(levelId: string): GameHistory[] {
  return getGameHistory().filter((h) => h.levelId === levelId);
}

export function recordGameResult(
  levelId: string,
  score: number,
  won: boolean,
  divesUsed: number,
  relicsFound: number
): { profile: PlayerProfile; historyEntry: GameHistory } {
  const profile = getPlayerProfile();
  profile.gamesPlayed += 1;

  if (won) {
    profile.totalScore += score;
    if (!profile.completedLevels.includes(levelId)) {
      profile.completedLevels.push(levelId);
    }
    if (!profile.highestScores[levelId] || score > profile.highestScores[levelId]) {
      profile.highestScores[levelId] = score;
    }
  }

  savePlayerProfile(profile);

  const historyEntry: GameHistory = {
    id: `history-${Date.now()}`,
    playerId: profile.id,
    levelId,
    score,
    won,
    divesUsed,
    relicsFound,
    timestamp: Date.now()
  };

  saveGameHistoryEntry(historyEntry);

  return { profile, historyEntry };
}

export function resetPlayerData(): PlayerProfile {
  const newProfile: PlayerProfile = {
    id: "player-1",
    name: "考古探险家",
    avatar: "diver",
    totalScore: 0,
    completedLevels: [],
    highestScores: {},
    gamesPlayed: 0,
    createdAt: Date.now()
  };
  savePlayerProfile(newProfile);
  try {
    writeFileSync(HISTORY_FILE, JSON.stringify([], null, 2), "utf-8");
    writeFileSync(SESSIONS_FILE, JSON.stringify([], null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to reset game data:", error);
  }
  return newProfile;
}

export function getAllSessions(): GameSession[] {
  ensureDataFiles();
  try {
    const data = readFileSync(SESSIONS_FILE, "utf-8");
    return JSON.parse(data) as GameSession[];
  } catch (error) {
    console.error("Failed to read sessions:", error);
    return [];
  }
}

export function saveSessions(sessions: GameSession[]): void {
  ensureDataFiles();
  try {
    writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save sessions:", error);
  }
}

export function getActiveSession(
  playerId: string,
  levelId: string
): GameSession | null {
  const sessions = getAllSessions();
  return (
    sessions.find(
      (s) =>
        s.playerId === playerId && s.levelId === levelId && s.status === "active"
    ) || null
  );
}

export function createSession(
  playerId: string,
  levelId: string,
  gameState: GameState
): GameSession {
  const sessions = getAllSessions();

  const existing = sessions.find(
    (s) =>
      s.playerId === playerId && s.levelId === levelId && s.status === "active"
  );
  if (existing) {
    existing.status = "abandoned";
    existing.updatedAt = Date.now();
  }

  const session: GameSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerId,
    levelId,
    gameState: JSON.parse(JSON.stringify(gameState)),
    history: [],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function updateSessionState(
  sessionId: string,
  gameState: GameState,
  history: HistoryAction[]
): GameSession | null {
  const sessions = getAllSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  session.gameState = JSON.parse(JSON.stringify(gameState));
  session.history = JSON.parse(JSON.stringify(history));
  session.updatedAt = Date.now();
  saveSessions(sessions);
  return session;
}

export function completeSession(sessionId: string): GameSession | null {
  const sessions = getAllSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  session.status = "completed";
  session.updatedAt = Date.now();
  saveSessions(sessions);
  return session;
}

export function abandonSession(sessionId: string): GameSession | null {
  const sessions = getAllSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;

  session.status = "abandoned";
  session.updatedAt = Date.now();
  saveSessions(sessions);
  return session;
}

export function cleanOldSessions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
  const sessions = getAllSessions();
  const now = Date.now();
  const initialCount = sessions.length;

  const activeSessions = sessions.filter(
    (s) => s.status === "active" || now - s.updatedAt < maxAgeMs
  );

  if (activeSessions.length !== initialCount) {
    saveSessions(activeSessions);
  }

  return initialCount - activeSessions.length;
}
