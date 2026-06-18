import { create } from "zustand";
import axios from "axios";
import type {
  GameLevel,
  GameLevelId,
  GameStep,
  GameField,
  Position,
  ReplayState,
  SettlementResult,
} from "@cbcp/shared";

const REPLAY_STORAGE_KEY = "cbcp:replay";

interface EventLogEntry {
  stepIndex: number;
  eventId: string;
  message: string;
  timestamp: number;
}

interface GameStore {
  currentLevelId: GameLevelId | null;
  levels: GameLevel[];
  steps: GameStep[];
  currentStepIdx: number;
  currentField: GameField | null;
  currentPosition: Position | null;
  selectedTile: Position | null;
  eventLog: EventLogEntry[];
  settlementResult: SettlementResult | null;
  settleError: string | null;
  levelsError: string | null;
  isPlaying: boolean;

  fetchLevels: () => Promise<void>;
  selectLevel: (id: GameLevelId) => void;
  moveTile: (to: Position) => void;
  undoStep: () => void;
  resetLevel: () => void;
  jumpToStep: (idx: number) => void;
  settleGame: () => Promise<void>;
  setSelectedTile: (pos: Position | null) => void;
}

const cloneField = (field: GameField): GameField => ({ ...field });

const posEq = (a: Position, b: Position) => a.x === b.x && a.y === b.y;

const isAdjacent = (a: Position, b: Position) => {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

const loadReplayFromStorage = (levelId: GameLevelId): ReplayState | null => {
  try {
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return null;
    const replay: ReplayState = JSON.parse(raw);
    if (replay.levelId !== levelId) return null;
    return replay;
  } catch {
    return null;
  }
};

const saveReplayToStorage = (replay: ReplayState) => {
  try {
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(replay));
  } catch {
  }
};

const clearReplayStorage = () => {
  try {
    localStorage.removeItem(REPLAY_STORAGE_KEY);
  } catch {
  }
};

const rebuildFromSteps = (
  level: GameLevel,
  steps: GameStep[],
  upToIdx: number
): { field: GameField; position: Position; events: EventLogEntry[] } => {
  let field = cloneField(level.initialField);
  let position = { ...level.map.start };
  const events: EventLogEntry[] = [];

  for (let i = 0; i <= upToIdx && i < steps.length; i++) {
    const step = steps[i];
    position = { ...step.positionTo };
    field = cloneField(step.fieldAfter);
    for (const eid of step.triggeredEventIds) {
      const ev = level.events.find((e) => e.id === eid);
      if (ev) {
        events.push({
          stepIndex: step.stepIndex,
          eventId: ev.id,
          message: ev.message,
          timestamp: step.timestamp,
        });
      }
    }
  }

  return { field, position, events };
};

export const useGameStore = create<GameStore>((set, get) => ({
  currentLevelId: null,
  levels: [],
  steps: [],
  currentStepIdx: -1,
  currentField: null,
  currentPosition: null,
  selectedTile: null,
  eventLog: [],
  settlementResult: null,
  settleError: null,
  levelsError: null,
  isPlaying: false,

  fetchLevels: async () => {
    try {
      const res = await axios.get<GameLevel[]>("/api/levels");
      set({ levels: res.data, levelsError: null });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "未知错误";
      set({ levels: [], levelsError: `关卡加载失败：${msg}` });
    }
  },

  selectLevel: (id: GameLevelId) => {
    const { levels } = get();
    const level = levels.find((l) => l.id === id);
    if (!level) return;

    const replay = loadReplayFromStorage(id);

    if (replay && replay.steps.length > 0) {
      const upTo = Math.min(replay.currentStepIndex, replay.steps.length - 1);
      const { field, position, events } = rebuildFromSteps(level, replay.steps, upTo);
      set({
        currentLevelId: id,
        steps: replay.steps,
        currentStepIdx: upTo,
        currentField: field,
        currentPosition: position,
        eventLog: events,
        settlementResult: null,
        settleError: null,
        isPlaying: true,
        selectedTile: null,
      });
    } else {
      set({
        currentLevelId: id,
        steps: [],
        currentStepIdx: -1,
        currentField: cloneField(level.initialField),
        currentPosition: { ...level.map.start },
        eventLog: [],
        settlementResult: null,
        settleError: null,
        isPlaying: true,
        selectedTile: null,
      });
    }
  },

  moveTile: (to: Position) => {
    const {
      currentLevelId,
      levels,
      steps,
      currentStepIdx,
      currentField,
      currentPosition,
      isPlaying,
    } = get();

    if (!isPlaying || !currentLevelId || !currentField || !currentPosition) return;
    if (currentStepIdx !== steps.length - 1 && steps.length > 0) return;

    const level = levels.find((l) => l.id === currentLevelId);
    if (!level) return;

    if (!isAdjacent(currentPosition, to)) return;

    if (to.y < 0 || to.y >= level.map.height || to.x < 0 || to.x >= level.map.width) return;

    const tile = level.map.tiles[to.y][to.x];
    if (tile.type === "OBSTACLE") return;

    const fieldBefore = cloneField(currentField);
    const fieldAfter = cloneField(currentField);
    const triggeredEventIds: string[] = [];
    const newStepIndex = steps.length;
    const triggeredEventKeys = new Set<string>();
    for (const s of steps) {
      for (let i = 0; i < s.triggeredEventIds.length; i++) {
        const eid = s.triggeredEventIds[i];
        const ev = level.events.find((e) => e.id === eid);
        if (ev?.trigger.type === "position") {
          triggeredEventKeys.add(`${eid}-step${s.stepIndex + 1}-pos(${s.positionTo.x},${s.positionTo.y})`);
        } else {
          triggeredEventKeys.add(`${eid}-once`);
        }
      }
    }

    fieldAfter.trackSwitchValue += 1;

    for (const ev of level.events) {
      const trigger = ev.trigger;
      let triggered = false;

      if (trigger.type === "position" && trigger.position) {
        triggered = posEq(trigger.position, to);
      } else if (trigger.type === "step" && trigger.step !== undefined) {
        triggered = newStepIndex + 1 === trigger.step;
      } else if (trigger.type === "value" && trigger.value) {
        const { field: f, operator, threshold } = trigger.value;
        const v = fieldAfter[f];
        switch (operator) {
          case ">":
            triggered = v > threshold;
            break;
          case "<":
            triggered = v < threshold;
            break;
          case ">=":
            triggered = v >= threshold;
            break;
          case "<=":
            triggered = v <= threshold;
            break;
          case "==":
            triggered = v === threshold;
            break;
          case "!=":
            triggered = v !== threshold;
            break;
        }
      }

      if (triggered) {
        const dedupeKey = trigger.type === "position"
          ? `${ev.id}-step${newStepIndex + 1}-pos(${to.x},${to.y})`
          : `${ev.id}-once`;
        if (triggeredEventKeys.has(dedupeKey)) continue;
        triggeredEventKeys.add(dedupeKey);
        triggeredEventIds.push(ev.id);
        if (ev.effect.field !== undefined) {
          if (ev.effect.delta !== undefined) {
            fieldAfter[ev.effect.field] += ev.effect.delta;
          }
          if (ev.effect.setValue !== undefined) {
            fieldAfter[ev.effect.field] = ev.effect.setValue;
          }
        }
      }
    }

    const step: GameStep = {
      stepIndex: newStepIndex,
      positionFrom: { ...currentPosition },
      positionTo: { ...to },
      fieldBefore,
      fieldAfter,
      triggeredEventIds,
      timestamp: Date.now(),
    };

    const newSteps = [...steps, step];
    const newEvents: EventLogEntry[] = [];
    for (const eid of triggeredEventIds) {
      const ev = level.events.find((e) => e.id === eid);
      if (ev) {
        newEvents.push({
          stepIndex: newStepIndex,
          eventId: eid,
          message: ev.message,
          timestamp: step.timestamp,
        });
      }
    }

    const replay: ReplayState = {
      levelId: currentLevelId,
      steps: newSteps,
      currentStepIndex: newStepIndex,
      createdAt: Date.now(),
      savedAt: Date.now(),
    };
    saveReplayToStorage(replay);

    set({
      steps: newSteps,
      currentStepIdx: newStepIndex,
      currentField: fieldAfter,
      currentPosition: { ...to },
      eventLog: [...get().eventLog, ...newEvents],
      settlementResult: null,
      settleError: null,
    });
  },

  undoStep: () => {
    const { currentLevelId, levels, steps, currentStepIdx } = get();
    if (!currentLevelId || steps.length === 0 || currentStepIdx < 0) return;

    const level = levels.find((l) => l.id === currentLevelId);
    if (!level) return;

    const newIdx = currentStepIdx - 1;
    const { field, position, events } = rebuildFromSteps(level, steps, newIdx);

    const replay: ReplayState = {
      levelId: currentLevelId,
      steps: newIdx >= 0 ? steps.slice(0, newIdx + 1) : [],
      currentStepIndex: newIdx,
      createdAt: Date.now(),
      savedAt: Date.now(),
    };
    saveReplayToStorage(replay);

    set({
      steps: newIdx >= 0 ? steps.slice(0, newIdx + 1) : [],
      currentStepIdx: newIdx,
      currentField: field,
      currentPosition: position,
      eventLog: events,
      settlementResult: null,
      settleError: null,
    });
  },

  resetLevel: () => {
    const { currentLevelId, levels } = get();
    if (!currentLevelId) return;

    const level = levels.find((l) => l.id === currentLevelId);
    if (!level) return;

    clearReplayStorage();

    set({
      steps: [],
      currentStepIdx: -1,
      currentField: cloneField(level.initialField),
      currentPosition: { ...level.map.start },
      eventLog: [],
      settlementResult: null,
      settleError: null,
      isPlaying: true,
      selectedTile: null,
    });
  },

  jumpToStep: (idx: number) => {
    const { currentLevelId, levels, steps } = get();
    if (!currentLevelId) return;
    if (idx < -1 || idx >= steps.length) return;

    const level = levels.find((l) => l.id === currentLevelId);
    if (!level) return;

    const { field, position, events } = rebuildFromSteps(level, steps, idx);

    set({
      currentStepIdx: idx,
      currentField: field,
      currentPosition: position,
      eventLog: events,
      settlementResult: null,
      settleError: null,
    });
  },

  settleGame: async () => {
    const { currentLevelId, levels, steps } = get();
    if (!currentLevelId) return;
    const level = levels.find((l) => l.id === currentLevelId);
    if (!level) return;

    try {
      const res = await axios.post<SettlementResult>("/api/settle", {
        levelId: currentLevelId,
        steps,
        initialField: level.initialField,
      });
      set({ settlementResult: res.data, settleError: null });
    } catch (err: any) {
      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        null;
      const msg = backendMsg
        ? `结算失败：${backendMsg}`
        : `结算请求失败：${err instanceof Error ? err.message : "未知错误"}`;
      set({ settlementResult: null, settleError: msg });
    }
  },

  setSelectedTile: (pos: Position | null) => {
    set({ selectedTile: pos });
  },
}));
