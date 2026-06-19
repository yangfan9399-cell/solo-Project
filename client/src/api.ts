import type { GameState, HistoryStep, GameSettlement, StageInfo } from './types';
import type { GameStageId } from './types';

const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function fetchStages(): Promise<{ stages: StageInfo[] }> {
  return request<{ stages: StageInfo[] }>('/stages');
}

export function createSession(stageId: GameStageId): Promise<{
  sessionId: string;
  state: GameState;
  history: HistoryStep[];
}> {
  return request('/sessions', {
    method: 'POST',
    body: JSON.stringify({ stageId }),
  });
}

export function getSession(sessionId: string): Promise<{
  sessionId: string;
  state: GameState;
  history: HistoryStep[];
}> {
  return request(`/sessions/${sessionId}`);
}

export function executeEvent(sessionId: string, eventId: string): Promise<{
  sessionId: string;
  state: GameState;
  history: HistoryStep[];
}> {
  return request(`/sessions/${sessionId}/execute`, {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });
}

export function skipStep(sessionId: string): Promise<{
  sessionId: string;
  state: GameState;
  history: HistoryStep[];
}> {
  return request(`/sessions/${sessionId}/skip`, {
    method: 'POST',
  });
}

export function getSettlement(sessionId: string): Promise<{ settlement: GameSettlement }> {
  return request(`/sessions/${sessionId}/settlement`);
}

export function restoreFromHistory(sessionId: string, stepIndex: number): Promise<{
  sessionId: string;
  state: GameState;
  history: HistoryStep[];
}> {
  return request(`/sessions/${sessionId}/restore/${stepIndex}`, {
    method: 'POST',
  });
}
