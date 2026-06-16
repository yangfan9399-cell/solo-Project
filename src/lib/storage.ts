import type { Player, GameState, GameResult, Level } from '../types';

const STORAGE_KEYS = {
  PLAYER: 'ulogistics_player',
  LEVELS: 'ulogistics_levels',
  GAME_STATE: 'ulogistics_game_state_',
  GAME_HISTORY: 'ulogistics_game_history',
  SEED_INITIALIZED: 'ulogistics_seed_initialized'
};

export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.error('Storage read error:', e);
  }
  return defaultValue;
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Storage remove error:', e);
  }
}

export function getPlayer(): Player | null {
  return getFromStorage<Player | null>(STORAGE_KEYS.PLAYER, null);
}

export function savePlayer(player: Player): void {
  setToStorage(STORAGE_KEYS.PLAYER, player);
}

export function getLevels(): Level[] {
  return getFromStorage<Level[]>(STORAGE_KEYS.LEVELS, []);
}

export function saveLevels(levels: Level[]): void {
  setToStorage(STORAGE_KEYS.LEVELS, levels);
}

export function getGameState(gameId: string): GameState | null {
  return getFromStorage<GameState | null>(STORAGE_KEYS.GAME_STATE + gameId, null);
}

export function saveGameState(state: GameState): void {
  setToStorage(STORAGE_KEYS.GAME_STATE + state.id, state);
}

export function removeGameState(gameId: string): void {
  removeFromStorage(STORAGE_KEYS.GAME_STATE + gameId);
}

export function getGameHistory(): GameResult[] {
  return getFromStorage<GameResult[]>(STORAGE_KEYS.GAME_HISTORY, []);
}

export function saveGameResult(result: GameResult): void {
  const history = getGameHistory();
  history.unshift(result);
  if (history.length > 100) {
    history.pop();
  }
  setToStorage(STORAGE_KEYS.GAME_HISTORY, history);
}

export function isSeedInitialized(): boolean {
  return getFromStorage<boolean>(STORAGE_KEYS.SEED_INITIALIZED, false);
}

export function markSeedInitialized(): void {
  setToStorage(STORAGE_KEYS.SEED_INITIALIZED, true);
}
