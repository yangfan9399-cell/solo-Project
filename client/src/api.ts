import type { GameState, GameStep, LevelId, LevelInfo, Settlement } from './types';

const BASE = '/api';

async function req<T>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(BASE + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  listLevels: () => req<{ levels: LevelInfo[] }>('/levels'),
  start: (levelId: LevelId, sessionId: string) =>
    req<{ sessionId: string; state: GameState }>('/game/start', 'POST', { levelId, sessionId }),
  resume: (sessionId: string, replay: GameStep[], levelId: LevelId) =>
    req<{ sessionId: string; state: GameState }>('/game/resume', 'POST', { sessionId, replay, levelId }),
  getState: (sessionId: string) => req<{ state: GameState }>(`/game/state/${sessionId}`),
  applyStep: (sessionId: string, eventId: string) =>
    req<{ state: GameState; step: GameStep }>('/game/step', 'POST', { sessionId, eventId }),
  rollback: (sessionId: string, stepIndex: number) =>
    req<{ state: GameState }>('/game/rollback', 'POST', { sessionId, stepIndex }),
  settlement: (sessionId: string) => req<{ settlement: Settlement }>(`/game/settlement/${sessionId}`),
};
