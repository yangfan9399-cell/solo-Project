import { GameSession, MazeConfig, DifficultyKey, MazeMeta, Settlement } from './types';

const BASE = '';

export async function listMazes(): Promise<MazeMeta[]> {
  const res = await fetch(`${BASE}/api/mazes`);
  return res.json();
}

export async function getMaze(key: DifficultyKey): Promise<MazeConfig> {
  const res = await fetch(`${BASE}/api/mazes/${key}`);
  return res.json();
}

export async function createSession(mazeKey: DifficultyKey): Promise<GameSession> {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mazeKey }),
  });
  return res.json();
}

export async function getSession(id: string): Promise<GameSession> {
  const res = await fetch(`${BASE}/api/sessions/${id}`);
  return res.json();
}

export async function makeMove(sessionId: string, x: number, y: number): Promise<GameSession> {
  const res = await fetch(`${BASE}/api/sessions/${sessionId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ x, y }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '移动失败' }));
    throw new Error(err.error || '移动失败');
  }
  return res.json();
}

export async function getSettlement(sessionId: string): Promise<Settlement> {
  const res = await fetch(`${BASE}/api/sessions/${sessionId}/settlement`);
  return res.json();
}
