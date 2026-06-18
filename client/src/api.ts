import { GameLevelId, GameState, ReplayStep, GameResult, LevelInfo, Position } from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function getLevels(): Promise<Record<GameLevelId, LevelInfo>> {
  return request<Record<GameLevelId, LevelInfo>>('/levels');
}

export interface StartGameResponse {
  sessionId: string;
  state: GameState;
  replay: ReplayStep[];
}

export function startGame(levelId: GameLevelId): Promise<StartGameResponse> {
  return request<StartGameResponse>('/game/start', {
    method: 'POST',
    body: JSON.stringify({ levelId })
  });
}

export function restoreGame(replay: ReplayStep[]): Promise<StartGameResponse> {
  return request<StartGameResponse>('/game/restore', {
    method: 'POST',
    body: JSON.stringify({ replay })
  });
}

export function getGame(sessionId: string): Promise<{ state: GameState; replay: ReplayStep[] }> {
  return request(`/game/${sessionId}`);
}

export interface MoveResponse {
  state: GameState;
  moved: boolean;
  description: string;
  replayStep: ReplayStep | null;
}

export function movePlayer(sessionId: string, player: 1 | 2, direction: Position): Promise<MoveResponse> {
  return request<MoveResponse>(`/game/${sessionId}/move`, {
    method: 'POST',
    body: JSON.stringify({ player, direction })
  });
}

export interface EventResponse {
  state: GameState;
  success: boolean;
  description: string;
  replayStep: ReplayStep | null;
}

export function useEvent(sessionId: string, eventId: string, choiceIndex?: number): Promise<EventResponse> {
  return request<EventResponse>(`/game/${sessionId}/event`, {
    method: 'POST',
    body: JSON.stringify({ eventId, choiceIndex })
  });
}

export function settleGame(sessionId: string): Promise<GameResult> {
  return request<GameResult>(`/game/${sessionId}/settle`, {
    method: 'POST'
  });
}

export function getReplay(sessionId: string): Promise<{ replay: ReplayStep[] }> {
  return request(`/game/${sessionId}/replay`);
}
