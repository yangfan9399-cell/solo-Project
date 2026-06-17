import { create } from 'zustand';
import type { Call, Extension, Action, Shift, PlayerProfile, LevelConfig, Priority } from '@/types/game';
import { CALLERS, EXTENSIONS, LEVEL_CONFIGS, DEFAULT_PLAYER } from '@/data/mockData';

interface GameStore {
  player: PlayerProfile;
  currentLevel: LevelConfig;
  shifts: Shift[];
  calls: Call[];
  extensions: Extension[];
  selectedCall: Call | null;
  isPlaying: boolean;
  timeRemaining: number;
  score: number;
  actions: Action[];
  startTime: number;
  initPlayer: (profile?: PlayerProfile) => void;
  selectLevel: (level: number) => void;
  startShift: () => void;
  endShift: () => void;
  generateCall: () => void;
  connectCall: (callId: string, extensionId: string) => void;
  disconnectCall: (callId: string) => void;
  interruptCall: (targetCallId: string) => void;
  selectCall: (call: Call | null) => void;
  updateTimers: () => void;
  loadPlayerFromStorage: () => void;
  savePlayerToStorage: () => void;
  saveGameState: () => void;
  loadGameState: () => Promise<boolean>;
  clearGameState: () => void;
  getAvailableExtensions: () => Extension[];
  getWaitingCalls: () => Call[];
  getConnectedCalls: () => Call[];
  calculateScore: (shift: Shift) => number;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getRandomPriority(config: LevelConfig): Priority {
  const rand = Math.random();
  if (rand < config.emergencyChance) return 'emergency';
  if (rand < config.emergencyChance + config.importantChance) return 'important';
  if (rand < config.emergencyChance + config.importantChance + config.lowChance) return 'low';
  return 'normal';
}

function getRandomExtension(extensions: Extension[]): string {
  const available = extensions.filter(e => e.status === 'available');
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)].id;
  }
  return extensions[Math.floor(Math.random() * extensions.length)].id;
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: DEFAULT_PLAYER,
  currentLevel: LEVEL_CONFIGS[0],
  shifts: [],
  calls: [],
  extensions: [...EXTENSIONS],
  selectedCall: null,
  isPlaying: false,
  timeRemaining: 0,
  score: 0,
  actions: [],
  startTime: 0,

  initPlayer: (profile) => {
    set({ player: profile || DEFAULT_PLAYER });
  },

  selectLevel: (level) => {
    const config = LEVEL_CONFIGS.find(c => c.level === level) || LEVEL_CONFIGS[0];
    set({ 
      currentLevel: config,
      extensions: EXTENSIONS.slice(0, config.maxExtensions).map(e => ({ ...e, status: 'available' as const }))
    });
  },

  startShift: () => {
    const { currentLevel, player } = get();
    const startTime = Date.now();
    const newShift: Shift = {
      id: generateId(),
      level: currentLevel.level,
      startTime,
      duration: currentLevel.duration,
      callsHandled: 0,
      callsMissed: 0,
      emergencyCallsHandled: 0,
      averageWaitTime: 0,
      totalScore: 0,
      actions: [],
      status: 'in-progress',
    };
    
    set({
      isPlaying: true,
      timeRemaining: currentLevel.duration,
      score: 0,
      calls: [],
      actions: [],
      extensions: EXTENSIONS.slice(0, currentLevel.maxExtensions).map(e => ({ ...e, status: 'available' as const })),
      player: { ...player, currentShift: newShift },
      startTime,
    });

    get().saveGameState();
  },

  endShift: async () => {
    const { player, calls, actions, currentLevel, score } = get();
    const handled = calls.filter(c => c.status === 'completed').length;
    const missed = calls.filter(c => c.status === 'missed').length;
    const emergencyHandled = calls.filter(c => c.status === 'completed' && c.priority === 'emergency').length;
    const totalWaitTime = calls.filter(c => c.status === 'completed').reduce((sum, c) => sum + (c.waitTime || 0), 0);
    const avgWaitTime = handled > 0 ? totalWaitTime / handled : 0;
    
    let finalScore = score;
    try {
      const response = await fetch('/api/calculate-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions, levelConfig: currentLevel }),
      });
      const result = await response.json();
      if (result.finalScore !== undefined) {
        finalScore = result.finalScore;
      }
    } catch {
      console.error('Failed to calculate score from server, using local score');
    }
    
    const shift: Shift = {
      id: player.currentShift?.id || generateId(),
      level: currentLevel.level,
      startTime: player.currentShift?.startTime || Date.now(),
      endTime: Date.now(),
      duration: currentLevel.duration,
      callsHandled: handled,
      callsMissed: missed,
      emergencyCallsHandled: emergencyHandled,
      averageWaitTime: avgWaitTime,
      totalScore: finalScore,
      actions: actions,
      status: missed > handled * 0.5 ? 'failed' : 'completed',
    };

    const newHistory = [...player.history, shift];
    const newTotalScore = player.totalScore + finalScore;
    const newHighestScore = Math.max(player.highestScore, finalScore);
    const newLevel = Math.min(Math.max(1, Math.floor(newTotalScore / 1000) + 1), LEVEL_CONFIGS.length);

    set({
      isPlaying: false,
      score: finalScore,
      player: {
        ...player,
        totalScore: newTotalScore,
        highestScore: newHighestScore,
        shiftsCompleted: player.shiftsCompleted + 1,
        level: newLevel,
        history: newHistory,
        currentShift: undefined,
        bestShiftId: newHighestScore === finalScore ? shift.id : player.bestShiftId,
      },
    });

    get().savePlayerToStorage();
    get().clearGameState();
  },

  generateCall: () => {
    const { currentLevel, extensions } = get();
    const caller = CALLERS[Math.floor(Math.random() * CALLERS.length)];
    const targetExt = getRandomExtension(extensions);
    const priority = getRandomPriority(currentLevel);

    const newCall: Call = {
      id: generateId(),
      caller,
      targetExtension: targetExt,
      priority,
      arrivalTime: Date.now(),
      waitTime: 0,
      status: 'waiting',
    };

    set(state => ({ calls: [...state.calls, newCall] }));
    get().saveGameState();
  },

  connectCall: (callId: string, extensionId: string) => {
    const { calls, extensions, currentLevel, actions, score } = get();
    const call = calls.find(c => c.id === callId);
    const extension = extensions.find(e => e.id === extensionId);

    if (!call || !extension || call.status !== 'waiting' || extension.status !== 'available') {
      return;
    }

    const waitScore = Math.max(0, Math.floor((currentLevel.maxWaitTime - call.waitTime) * 2));
    const priorityMultiplier = call.priority === 'emergency' ? 3 : call.priority === 'important' ? 2 : 1;
    const baseScore = 10;
    const totalScoreChange = (baseScore + waitScore) * priorityMultiplier * currentLevel.scoreMultiplier;

    const action: Action = {
      id: generateId(),
      type: 'connect',
      timestamp: Date.now(),
      callId,
      toExtension: extension.number,
      scoreChange: totalScoreChange,
      reason: `接通 ${call.caller.name} 到 ${extension.name}`,
    };

    const now = Date.now();
    const callDuration = 8000 + Math.random() * 7000;
    const expectedDisconnectTime = now + callDuration;

    set(state => ({
      calls: state.calls.map(c => 
        c.id === callId ? { ...c, status: 'connected', connectedAt: now, expectedDisconnectTime } : c
      ),
      extensions: state.extensions.map(e => 
        e.id === extensionId ? { ...e, status: 'busy' as const, currentCall: { ...call, status: 'connected', connectedAt: now, expectedDisconnectTime } } : e
      ),
      score: score + totalScoreChange,
      actions: [...actions, action],
    }));

    get().saveGameState();

    setTimeout(() => {
      get().disconnectCall(callId);
    }, callDuration);
  },

  disconnectCall: (callId: string) => {
    const { calls, extensions, actions } = get();
    const call = calls.find(c => c.id === callId);
    const extension = extensions.find(e => e.currentCall?.id === callId);

    if (!call || call.status !== 'connected') return;

    const duration = call.connectedAt ? (Date.now() - call.connectedAt) / 1000 : 0;

    const action: Action = {
      id: generateId(),
      type: 'disconnect',
      timestamp: Date.now(),
      callId,
      fromExtension: extension?.number,
      duration,
      scoreChange: 0,
      reason: `${extension?.name} 通话结束`,
    };

    set(state => ({
      calls: state.calls.map(c => 
        c.id === callId ? { ...c, status: 'completed', disconnectedAt: Date.now() } : c
      ),
      extensions: state.extensions.map(e => 
        e.currentCall?.id === callId ? { ...e, status: 'available' as const, currentCall: undefined } : e
      ),
      actions: [...actions, action],
    }));

    get().saveGameState();
  },

  interruptCall: (targetCallId: string) => {
    const { calls, extensions, actions, score, currentLevel } = get();
    const targetCall = calls.find(c => c.id === targetCallId);
    const targetExtension = extensions.find(e => e.currentCall?.id === targetCallId);

    if (!targetCall || !targetExtension || targetCall.status !== 'connected') return;

    const isEmergency = calls.some(c => c.status === 'waiting' && c.priority === 'emergency');
    if (!isEmergency) return;

    const interruptedCall = targetExtension.currentCall;

    const penalty = -10 * currentLevel.scoreMultiplier;

    const action: Action = {
      id: generateId(),
      type: 'interrupt',
      timestamp: Date.now(),
      callId: targetCallId,
      fromExtension: targetExtension.number,
      scoreChange: penalty,
      reason: `打断 ${targetExtension.name} 的通话`,
    };

    set(state => ({
      calls: state.calls.map(c => {
        if (c.id === targetCallId) {
          return { ...c, status: 'completed', isInterrupted: true };
        }
        if (c.status === 'waiting' && c.priority === 'emergency') {
          return { ...c, status: 'connected', connectedAt: Date.now() };
        }
        return c;
      }),
      extensions: state.extensions.map(e => {
        if (e.id === targetExtension.id) {
          const emergencyCall = state.calls.find(c => c.status === 'waiting' && c.priority === 'emergency');
          return { 
            ...e, 
            currentCall: emergencyCall ? { ...emergencyCall, status: 'connected' } : undefined,
          };
        }
        return e;
      }),
      score: score + penalty,
      actions: [...actions, action],
    }));

    get().saveGameState();
  },

  selectCall: (call) => {
    set({ selectedCall: call });
  },

  updateTimers: () => {
    const { calls, timeRemaining, isPlaying, currentLevel } = get();

    if (!isPlaying) return;

    const newTimeRemaining = Math.max(0, timeRemaining - 1);
    
    const updatedCalls = calls.map(call => {
      if (call.status === 'waiting') {
        const newWaitTime = call.waitTime + 1;
        if (newWaitTime >= currentLevel.maxWaitTime) {
          return { ...call, status: 'missed' as const, waitTime: newWaitTime };
        }
        return { ...call, waitTime: newWaitTime };
      }
      return call;
    });

    set({ calls: updatedCalls, timeRemaining: newTimeRemaining });

    if (newTimeRemaining === 0) {
      get().endShift();
    } else {
      get().saveGameState();
    }
  },

  loadPlayerFromStorage: async () => {
    try {
      const response = await fetch('/api/player');
      if (response.ok) {
        const profile = await response.json();
        set({ player: profile });
      }
    } catch {
      console.error('Failed to load player from storage');
    }
  },

  savePlayerToStorage: async () => {
    try {
      const { player } = get();
      await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player),
      });
    } catch {
      console.error('Failed to save player to storage');
    }
  },

  saveGameState: async () => {
    try {
      const { isPlaying, timeRemaining, score, calls, extensions, actions, currentLevel, startTime } = get();
      await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPlaying,
          timeRemaining,
          score,
          calls,
          extensions,
          actions,
          currentLevel,
          startTime,
        }),
      });
    } catch {
      console.error('Failed to save game state');
    }
  },

  loadGameState: async () => {
    try {
      const response = await fetch('/api/game-state');
      if (response.ok) {
        const state = await response.json();
        if (state.isPlaying && state.timeRemaining > 0) {
          const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
          const remaining = Math.max(0, state.timeRemaining - elapsed);
          
          const now = Date.now();
          const updatedCalls = state.calls.map((call: Call) => {
            if (call.status === 'waiting') {
              const waitElapsed = Math.floor((Date.now() - call.arrivalTime) / 1000);
              const newWaitTime = call.waitTime + waitElapsed;
              if (newWaitTime >= state.currentLevel.maxWaitTime) {
                return { ...call, status: 'missed' as const, waitTime: newWaitTime };
              }
              return { ...call, waitTime: newWaitTime };
            } else if (call.status === 'connected' && call.expectedDisconnectTime) {
              if (now >= call.expectedDisconnectTime) {
                return { ...call, status: 'completed' as const, disconnectedAt: now };
              }
              return call;
            }
            return call;
          });

          const updatedExtensions = state.extensions.map((ext: Extension) => {
            if (ext.status === 'busy' && ext.currentCall?.expectedDisconnectTime) {
              if (now >= ext.currentCall.expectedDisconnectTime) {
                return { ...ext, status: 'available' as const, currentCall: undefined };
              }
              return ext;
            }
            return ext;
          });

          set({
            isPlaying: true,
            timeRemaining: remaining,
            score: state.score,
            calls: updatedCalls,
            extensions: updatedExtensions,
            actions: state.actions,
            currentLevel: state.currentLevel,
            startTime: Date.now(),
          });

          const store = get();
          updatedCalls.forEach((call: Call) => {
            if (call.status === 'connected' && call.expectedDisconnectTime) {
              const remainingTime = call.expectedDisconnectTime - now;
              if (remainingTime > 0) {
                setTimeout(() => {
                  store.disconnectCall(call.id);
                }, remainingTime);
              }
            }
          });

          return true;
        }
      }
    } catch {
      console.error('Failed to load game state');
    }
    return false;
  },

  clearGameState: async () => {
    try {
      await fetch('/api/game-state', { method: 'DELETE' });
    } catch {
      console.error('Failed to clear game state');
    }
  },

  getAvailableExtensions: () => {
    return get().extensions.filter(e => e.status === 'available');
  },

  getWaitingCalls: () => {
    return get().calls.filter(c => c.status === 'waiting').sort((a, b) => {
      const priorityOrder = { emergency: 0, important: 1, normal: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  getConnectedCalls: () => {
    return get().calls.filter(c => c.status === 'connected');
  },

  calculateScore: (shift) => {
    return shift.actions.reduce((sum, action) => sum + action.scoreChange, 0);
  },
}));
