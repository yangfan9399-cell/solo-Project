import type {
  PlayerProfile,
  GameSession,
  FinishedInstrument,
} from '@/types/game';

const PLAYER_PREFIX = 'vl_player_';
const SESSION_PREFIX = 'vl_session_';
const INSTRUMENT_PREFIX = 'vl_instrument_';
const PLAYER_INDEX_KEY = 'vl_player_index';
const SESSION_INDEX_KEY = 'vl_session_index';
const INSTRUMENT_INDEX_KEY = 'vl_instrument_index';
const CURRENT_PLAYER_KEY = 'vl_current_player';
const CURRENT_SESSION_KEY = 'vl_current_session';

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function getIndex(key: string): string[] {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function setIndex(key: string, ids: string[]): void {
  localStorage.setItem(key, JSON.stringify(ids));
}

function addToIndex(indexKey: string, id: string): void {
  const ids = getIndex(indexKey);
  if (ids.indexOf(id) === -1) {
    ids.push(id);
    setIndex(indexKey, ids);
  }
}

function removeFromIndex(indexKey: string, id: string): void {
  const ids = getIndex(indexKey);
  setIndex(
    indexKey,
    ids.filter((i) => i !== id)
  );
}

export function savePlayer(player: PlayerProfile): void {
  localStorage.setItem(PLAYER_PREFIX + player.id, JSON.stringify(player));
  addToIndex(PLAYER_INDEX_KEY, player.id);
}

export function loadPlayer(id: string): PlayerProfile | null {
  const raw = localStorage.getItem(PLAYER_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export function listPlayers(): PlayerProfile[] {
  return getIndex(PLAYER_INDEX_KEY)
    .map((id) => loadPlayer(id))
    .filter((p): p is PlayerProfile => p !== null);
}

export function deletePlayer(id: string): void {
  localStorage.removeItem(PLAYER_PREFIX + id);
  removeFromIndex(PLAYER_INDEX_KEY, id);
  if (getCurrentPlayerId() === id) {
    localStorage.removeItem(CURRENT_PLAYER_KEY);
  }
  listSessionsByPlayer(id).forEach((session) => {
    deleteSession(session.id);
  });
  listInstrumentsByPlayer(id).forEach((instrument) => {
    deleteInstrument(instrument.id);
  });
}

export function setCurrentPlayerId(id: string): void {
  localStorage.setItem(CURRENT_PLAYER_KEY, id);
}

export function getCurrentPlayerId(): string | null {
  return localStorage.getItem(CURRENT_PLAYER_KEY);
}

export function saveSession(session: GameSession): void {
  localStorage.setItem(SESSION_PREFIX + session.id, JSON.stringify(session));
  addToIndex(SESSION_INDEX_KEY, session.id);
}

export function loadSession(id: string): GameSession | null {
  const raw = localStorage.getItem(SESSION_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export function listSessionsByPlayer(playerId: string): GameSession[] {
  return getIndex(SESSION_INDEX_KEY)
    .map((id) => loadSession(id))
    .filter((s): s is GameSession => s !== null && s.playerId === playerId);
}

export function deleteSession(id: string): void {
  localStorage.removeItem(SESSION_PREFIX + id);
  removeFromIndex(SESSION_INDEX_KEY, id);
  if (loadCurrentSessionId() === id) {
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }
}

export function saveCurrentSessionId(id: string): void {
  localStorage.setItem(CURRENT_SESSION_KEY, id);
}

export function loadCurrentSessionId(): string | null {
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

export function saveInstrument(instrument: FinishedInstrument): void {
  localStorage.setItem(
    INSTRUMENT_PREFIX + instrument.id,
    JSON.stringify(instrument)
  );
  addToIndex(INSTRUMENT_INDEX_KEY, instrument.id);
}

export function loadInstrument(id: string): FinishedInstrument | null {
  const raw = localStorage.getItem(INSTRUMENT_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export function listInstrumentsByPlayer(
  playerId: string
): FinishedInstrument[] {
  return getIndex(INSTRUMENT_INDEX_KEY)
    .map((id) => loadInstrument(id))
    .filter(
      (i): i is FinishedInstrument =>
        i !== null && (loadSession(i.sessionId)?.playerId === playerId)
    );
}

export function deleteInstrument(id: string): void {
  localStorage.removeItem(INSTRUMENT_PREFIX + id);
  removeFromIndex(INSTRUMENT_INDEX_KEY, id);
}

export { generateId };
