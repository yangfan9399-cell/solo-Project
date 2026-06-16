export interface GameState {
  subtitleText: string;
  fontStyle: string;
  fontSize: number;
  timingStart: number;
  timingEnd: number;
  history: HistoryEntry[];
  historyIndex: number;
}

export interface HistoryEntry {
  type: string;
  before: Partial<GameState>;
  after: Partial<GameState>;
}

export const FONT_STYLES = [
  { id: 'serif', name: '宋体', fontFamily: 'Georgia, "Times New Roman", serif' },
  { id: 'serif-bold', name: '粗宋体', fontFamily: 'Georgia, "Times New Roman", serif' },
  { id: 'serif-italic', name: '斜宋体', fontFamily: 'Georgia, "Times New Roman", serif' },
  { id: 'sans', name: '黑体', fontFamily: '"Helvetica Neue", Arial, sans-serif' },
  { id: 'display', name: '装饰体', fontFamily: '"Palatino Linotype", "Book Antiqua", Palatino, serif' }
] as const;

export type FontStyleId = typeof FONT_STYLES[number]['id'];

export function createInitialState(duration: number): GameState {
  return {
    subtitleText: '',
    fontStyle: 'serif',
    fontSize: 42,
    timingStart: Math.round(duration * 0.2),
    timingEnd: Math.round(duration * 0.8),
    history: [],
    historyIndex: -1
  };
}

export function applyAction(
  state: GameState,
  type: string,
  changes: Partial<GameState>
): GameState {
  const before: Partial<GameState> = {};
  for (const key of Object.keys(changes) as (keyof GameState)[]) {
    if (key !== 'history' && key !== 'historyIndex') {
      before[key] = state[key] as never;
    }
  }

  const newState: GameState = {
    ...state,
    ...changes
  };

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({ type, before, after: changes });

  return {
    ...newState,
    history: newHistory,
    historyIndex: newHistory.length - 1
  };
}

export function undo(state: GameState): GameState {
  if (state.historyIndex < 0) return state;

  const entry = state.history[state.historyIndex];
  const newState: GameState = {
    ...state,
    ...entry.before,
    historyIndex: state.historyIndex - 1
  };

  return newState;
}

export function redo(state: GameState): GameState {
  if (state.historyIndex >= state.history.length - 1) return state;

  const entry = state.history[state.historyIndex + 1];
  const newState: GameState = {
    ...state,
    ...entry.after,
    historyIndex: state.historyIndex + 1
  };

  return newState;
}

export function canUndo(state: GameState): boolean {
  return state.historyIndex >= 0;
}

export function canRedo(state: GameState): boolean {
  return state.historyIndex < state.history.length - 1;
}
