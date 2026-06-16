import type { PlayerProfile, GameHistory } from "~/types/game";
import { defaultPlayerProfile } from "~/data/seedData";

const PLAYER_PROFILE_KEY = "underwater_archaeology_profile";
const GAME_HISTORY_KEY = "underwater_archaeology_history";

export function getPlayerProfile(): PlayerProfile {
  if (typeof localStorage === "undefined") {
    return { ...defaultPlayerProfile, createdAt: Date.now() };
  }
  try {
    const data = localStorage.getItem(PLAYER_PROFILE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Failed to load player profile", e);
  }
  const newProfile = { ...defaultPlayerProfile, createdAt: Date.now() };
  savePlayerProfile(newProfile);
  return newProfile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save player profile", e);
  }
}

export function updatePlayerName(name: string): PlayerProfile {
  const profile = getPlayerProfile();
  profile.name = name;
  savePlayerProfile(profile);
  return profile;
}

export function recordGameCompletion(
  levelId: string,
  score: number,
  won: boolean,
  divesUsed: number,
  relicsFound: number
): PlayerProfile {
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

  const history = getGameHistory();
  const newEntry: GameHistory = {
    id: `history-${Date.now()}`,
    playerId: profile.id,
    levelId,
    score,
    won,
    divesUsed,
    relicsFound,
    timestamp: Date.now()
  };
  history.unshift(newEntry);
  if (history.length > 50) history.pop();
  saveGameHistory(history);

  savePlayerProfile(profile);
  return profile;
}

export function getGameHistory(): GameHistory[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const data = localStorage.getItem(GAME_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveGameHistory(history: GameHistory[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save game history", e);
  }
}

export function getLevelHistory(levelId: string): GameHistory[] {
  return getGameHistory().filter((h) => h.levelId === levelId);
}

export function resetPlayerData(): PlayerProfile {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(PLAYER_PROFILE_KEY);
    localStorage.removeItem(GAME_HISTORY_KEY);
  }
  const newProfile = { ...defaultPlayerProfile, createdAt: Date.now() };
  savePlayerProfile(newProfile);
  return newProfile;
}
