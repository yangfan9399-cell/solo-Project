import type { GameState, HistoryStep, StageInfo, GameEvent, GameSettlement } from './types';
import type { GameStageId } from './types';
import * as api from './api';

const STORAGE_KEY = 'silver-salt-session';

export interface AppState {
  view: 'stages' | 'game' | 'settlement';
  stages: StageInfo[];
  sessionId: string | null;
  gameState: GameState | null;
  history: HistoryStep[];
  settlement: GameSettlement | null;
  selectedStep: number | null;
}

const state: AppState = {
  view: 'stages',
  stages: [],
  sessionId: null,
  gameState: null,
  history: [],
  settlement: null,
  selectedStep: null,
};

const listeners = new Set<() => void>();

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

export function getState(): AppState {
  return state;
}

function saveSession(): void {
  if (state.sessionId && state.gameState) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        sessionId: state.sessionId,
        stageId: state.gameState.stageId,
      })
    );
  }
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export async function loadStages(): Promise<void> {
  const data = await api.fetchStages();
  state.stages = data.stages;
  notify();
}

export async function startGame(stageId: GameStageId): Promise<void> {
  const data = await api.createSession(stageId);
  state.sessionId = data.sessionId;
  state.gameState = data.state;
  state.history = data.history;
  state.view = 'game';
  state.settlement = null;
  state.selectedStep = null;
  saveSession();
  notify();
}

export async function executeEvent(eventId: string): Promise<void> {
  if (!state.sessionId) return;

  try {
    const data = await api.executeEvent(state.sessionId, eventId);
    state.gameState = data.state;
    state.history = data.history;
    saveSession();

    if (data.state.isGameOver) {
      await loadSettlement();
      state.view = 'settlement';
    }

    notify();
  } catch (e) {
    console.error('Execute event failed:', e);
  }
}

export async function skipStep(): Promise<void> {
  if (!state.sessionId) return;

  try {
    const data = await api.skipStep(state.sessionId);
    state.gameState = data.state;
    state.history = data.history;
    saveSession();

    if (data.state.isGameOver) {
      await loadSettlement();
      state.view = 'settlement';
    }

    notify();
  } catch (e) {
    console.error('Skip step failed:', e);
  }
}

export async function loadSettlement(): Promise<void> {
  if (!state.sessionId) return;

  try {
    const data = await api.getSettlement(state.sessionId);
    state.settlement = data.settlement;
    notify();
  } catch (e) {
    console.error('Load settlement failed:', e);
  }
}

export async function restoreStep(stepIndex: number): Promise<void> {
  if (!state.sessionId) return;

  try {
    const data = await api.restoreFromHistory(state.sessionId, stepIndex);
    state.gameState = data.state;
    state.history = data.history;
    state.selectedStep = null;
    state.settlement = null;
    state.view = 'game';
    saveSession();
    notify();
  } catch (e) {
    console.error('Restore step failed:', e);
  }
}

export function goToStages(): void {
  state.view = 'stages';
  state.sessionId = null;
  state.gameState = null;
  state.history = [];
  state.settlement = null;
  state.selectedStep = null;
  clearSession();
  notify();
}

export function goToGame(): void {
  state.view = 'game';
  notify();
}

export function setSelectedStep(step: number | null): void {
  state.selectedStep = step;
  notify();
}

export async function restoreLastSession(): Promise<boolean> {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return false;

  try {
    const { sessionId, stageId } = JSON.parse(saved);
    if (!sessionId) return false;

    const data = await api.getSession(sessionId);
    state.sessionId = data.sessionId;
    state.gameState = data.state;
    state.history = data.history;

    if (data.state.isGameOver) {
      await loadSettlement();
      state.view = 'settlement';
    } else {
      state.view = 'game';
    }

    notify();
    return true;
  } catch (e) {
    console.error('Restore session failed:', e);
    clearSession();
    return false;
  }
}

export function getEventById(eventId: string): GameEvent | null {
  if (!state.gameState) return null;
  return state.gameState.availableEvents.find((e) => e.id === eventId) || null;
}
