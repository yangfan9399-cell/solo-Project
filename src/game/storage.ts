import type { PlayerProfile, GameSession, ActionHistory } from '~/game/types';
import { DEFAULT_PLAYER, INITIAL_LEVELS } from '~/game/levels';

const STORAGE_KEYS = {
  PLAYER: 'awc_player_profile',
  SESSIONS: 'awc_sessions',
  CURRENT_SESSION: 'awc_current_session',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function loadPlayer(): PlayerProfile {
  if (!isBrowser()) {
    return { ...DEFAULT_PLAYER, createdAt: Date.now() };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYER);
    if (raw) {
      return JSON.parse(raw) as PlayerProfile;
    }
  } catch (e) {
    console.error('加载玩家数据失败', e);
  }
  const player = { ...DEFAULT_PLAYER, createdAt: Date.now() };
  savePlayer(player);
  return player;
}

export function savePlayer(player: PlayerProfile): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  } catch (e) {
    console.error('保存玩家数据失败', e);
  }
}

export function loadAllSessions(): GameSession[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (raw) {
      return JSON.parse(raw) as GameSession[];
    }
  } catch (e) {
    console.error('加载会话列表失败', e);
  }
  return [];
}

export function saveAllSessions(sessions: GameSession[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('保存会话列表失败', e);
  }
}

export function loadCurrentSession(): GameSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (raw) {
      return JSON.parse(raw) as GameSession;
    }
  } catch (e) {
    console.error('加载当前会话失败', e);
  }
  return null;
}

export function saveCurrentSession(session: GameSession | null): void {
  if (!isBrowser()) return;
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    }
  } catch (e) {
    console.error('保存当前会话失败', e);
  }
}

export function upsertSession(session: GameSession): void {
  const sessions = loadAllSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  saveAllSessions(sessions);
  saveCurrentSession(session);
}

export function clearAllGameData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.PLAYER);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
}

export function getInitialLevels() {
  return INITIAL_LEVELS;
}

export function getDefaultPlayer() {
  return { ...DEFAULT_PLAYER, createdAt: Date.now() };
}
