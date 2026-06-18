import { create } from 'zustand';
import type { GameState, GamePhase, ResourceAllocation, StepRecord, SettleResult, GameEvent, GameMap } from './types';
import { MAPS } from './config';

const STORAGE_KEY = 'fog-harbor-save-v1';

interface PersistData {
  phase: GamePhase;
  steps: StepRecord[];
  savedAt: number;
}

interface GameStore {
  phase: GamePhase;
  map: GameMap;
  state: GameState | null;
  currentEvent: GameEvent | null;
  pendingAllocations: Record<string, number>;
  settleResult: SettleResult | null;
  phaseMetaList: any[];
  resourceLabels: Record<string, string>;
  isLoading: boolean;
  showSettle: boolean;
  error: string | null;

  loadMeta: () => Promise<void>;
  startPhase: (phase: GamePhase) => Promise<void>;
  resumeFromSave: () => Promise<boolean>;
  setAllocation: (slotId: string, amount: number) => void;
  submitStep: (choiceIndex?: number) => Promise<void>;
  triggerSettle: () => Promise<void>;
  resetPhase: () => Promise<void>;
  clearSave: () => void;
  replayToStep: (stepIndex: number) => Promise<void>;
  setShowSettle: (v: boolean) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'wu',
  map: MAPS.wu,
  state: null,
  currentEvent: null,
  pendingAllocations: {},
  settleResult: null,
  phaseMetaList: [],
  resourceLabels: { candle: '烛芯', oil: '灯油', breeze: '风引', talisman: '镇符' },
  isLoading: false,
  showSettle: false,
  error: null,

  loadMeta: async () => {
    try {
      const r = await fetch('/api/meta/phases');
      const j = await r.json();
      set({ phaseMetaList: j.phases, resourceLabels: j.resourceLabels });
    } catch (e) {
      set({ error: '无法加载元数据，请确认后端已启动' });
    }
  },

  startPhase: async (phase) => {
    set({ isLoading: true, error: null });
    try {
      const r = await fetch('/api/game/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase })
      });
      const j = await r.json();
      const map = MAPS[phase];
      localStorage.removeItem(STORAGE_KEY);
      set({
        phase,
        map,
        state: j.state,
        currentEvent: j.event,
        pendingAllocations: {},
        settleResult: null,
        showSettle: false,
        isLoading: false
      });
    } catch (e) {
      set({ error: '启动失败：' + (e as Error).message, isLoading: false });
    }
  },

  resumeFromSave: async () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      const data: PersistData = JSON.parse(raw);
      if (!data.phase || !data.steps) return false;
      set({ isLoading: true, error: null });
      const r = await fetch('/api/game/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: data.phase, steps: data.steps })
      });
      const j = await r.json();
      const map = MAPS[data.phase];
      const state = j.state;
      let event: GameEvent | null = null;
      if (!state.gameOver && state.round <= state.maxRounds) {
        const usedIds = data.steps.map(s => s.eventId).filter(Boolean) as string[];
        const r2 = await fetch(`/api/events/${data.phase}`);
        const j2 = await r2.json();
        const candidates = (j2.events || []).filter((e: any) =>
          !usedIds.includes(e.id) && state.round >= e.roundRange[0] && state.round <= e.roundRange[1]
        );
        if (candidates.length > 0) {
          const ce = candidates[Math.floor(Math.random() * candidates.length)];
          event = { ...ce, round: state.round, effects: ce.effects, choices: ce.choices };
        }
      }
      set({
        phase: data.phase,
        map,
        state,
        currentEvent: event,
        pendingAllocations: {},
        settleResult: null,
        isLoading: false
      });
      return true;
    } catch (e) {
      set({ error: '恢复存档失败', isLoading: false });
      return false;
    }
  },

  setAllocation: (slotId, amount) => {
    const { pendingAllocations, state, map } = get();
    if (!state) return;
    const slot = map.slots.find(s => s.id === slotId);
    if (!slot) return;
    const currentFill = state.slotFill[slotId] || 0;
    const maxCanAdd = slot.capacity - currentFill;
    const resAvailable = state.resources[slot.resourceType] || 0;
    const allocatedByType = Object.entries(pendingAllocations).reduce((acc, [sid, v]) => {
      const s = map.slots.find(x => x.id === sid);
      if (s && s.resourceType === slot.resourceType) return acc + v;
      return acc;
    }, 0);
    const realMax = Math.min(maxCanAdd, resAvailable - allocatedByType + (pendingAllocations[slotId] || 0));
    const v = Math.max(0, Math.min(realMax, amount));
    set({ pendingAllocations: { ...pendingAllocations, [slotId]: v } });
  },

  submitStep: async (choiceIndex) => {
    const { state, pendingAllocations, currentEvent, phase, map } = get();
    if (!state) return;
    set({ isLoading: true, error: null });
    try {
      const allocations: ResourceAllocation[] = Object.entries(pendingAllocations)
        .filter(([, v]) => v > 0)
        .map(([slotId, amount]) => ({ slotId, amount }));
      const r = await fetch('/api/game/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase,
          steps: state.steps,
          allocations,
          eventId: currentEvent?.id,
          choiceIndex
        })
      });
      const j = await r.json();
      const saveData: PersistData = {
        phase,
        steps: j.state.steps,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));

      set({
        state: j.state,
        currentEvent: j.event || null,
        pendingAllocations: {},
        isLoading: false
      });

      if (j.gameOver) {
        setTimeout(() => get().triggerSettle(), 400);
      }
    } catch (e) {
      set({ error: '提交步骤失败：' + (e as Error).message, isLoading: false });
    }
  },

  triggerSettle: async () => {
    const { state, phase } = get();
    if (!state) return;
    set({ isLoading: true });
    try {
      const r = await fetch('/api/game/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, steps: state.steps })
      });
      const j = await r.json();
      set({ settleResult: j.result, showSettle: true, isLoading: false });
    } catch (e) {
      set({ error: '结算失败：' + (e as Error).message, isLoading: false });
    }
  },

  resetPhase: async () => {
    const { phase } = get();
    await get().startPhase(phase);
  },

  clearSave: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  replayToStep: async (stepIndex) => {
    const { state, phase } = get();
    if (!state) return;
    const subSteps = state.steps.slice(0, stepIndex);
    set({ isLoading: true });
    try {
      const r = await fetch('/api/game/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, steps: subSteps })
      });
      const j = await r.json();
      const rebuilt = j.state;
      rebuilt.steps = subSteps;

      const saveData: PersistData = {
        phase,
        steps: subSteps,
        savedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));

      let event: GameEvent | null = null;
      if (!rebuilt.gameOver && rebuilt.round <= rebuilt.maxRounds) {
        const usedIds = subSteps.map(s => s.eventId).filter(Boolean) as string[];
        const r2 = await fetch(`/api/events/${phase}`);
        const j2 = await r2.json();
        const candidates = (j2.events || []).filter((e: any) =>
          !usedIds.includes(e.id) && rebuilt.round >= e.roundRange[0] && rebuilt.round <= e.roundRange[1]
        );
        if (candidates.length > 0) {
          const ce = candidates[Math.floor(Math.random() * candidates.length)];
          event = { ...ce, round: rebuilt.round, effects: ce.effects, choices: ce.choices };
        }
      }
      set({
        state: rebuilt,
        currentEvent: event,
        pendingAllocations: {},
        settleResult: null,
        showSettle: false,
        isLoading: false
      });
    } catch (e) {
      set({ error: '回退失败：' + (e as Error).message, isLoading: false });
    }
  },

  setShowSettle: (v) => set({ showSettle: v })
}));
