import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { PlayerProfile, GameHistory } from "~/types/game";

const DATA_DIR = join(process.cwd(), "data");
const PLAYER_FILE = join(DATA_DIR, "player.json");
const HISTORY_FILE = join(DATA_DIR, "gameHistory.json");

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
  } catch (error) {
    console.error("Failed to reset game history:", error);
  }
  return newProfile;
}
