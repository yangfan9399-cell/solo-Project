import type { GameState, StepRecord, GamePhase, SettleResult, GameEvent, ResourceAllocation, StainMark } from './types';
import { MAPS, PHASE_CONFIGS, EVENTS } from './config';

export function createInitialState(phase: GamePhase): GameState {
  const cfg = PHASE_CONFIGS[phase];
  const map = MAPS[phase];
  const measurements: Record<string, number> = {};
  const slotFill: Record<string, number> = {};
  map.nodes.forEach(n => { measurements[n.id] = n.initialMeasurement; });
  map.slots.forEach(s => { slotFill[s.id] = 0; });

  return {
    phase,
    round: 1,
    maxRounds: cfg.maxRounds,
    measurements,
    slotFill,
    resources: { ...cfg.initialResources },
    wuRisk: 15,
    dingReward: 0,
    jiFailure: 0,
    stains: [],
    steps: [],
    eventHistory: [],
    hiddenFlags: {},
    gameOver: false
  };
}

export function pickEventForRound(phase: GamePhase, round: number, usedIds: string[]): GameEvent | undefined {
  const cfg = PHASE_CONFIGS[phase];
  const candidates = cfg.eventPool
    .map(id => EVENTS[id])
    .filter(e => e && !usedIds.includes(e.id) && round >= e.roundRange[0] && round <= e.roundRange[1]);
  if (candidates.length === 0) return undefined;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    id: chosen.id,
    phase: chosen.phase,
    round,
    type: chosen.type,
    title: chosen.title,
    description: chosen.description,
    effects: (chosen.effects || []).map(e => ({ ...e })),
    choices: chosen.choices?.map(c => ({
      label: c.label,
      description: c.description,
      effects: c.effects.map(e => ({ ...e }))
    }))
  };
}

export function applyAllocations(state: GameState, allocations: ResourceAllocation[]): GameState {
  const map = MAPS[state.phase];
  const next = cloneState(state);
  const totalByType: Record<string, number> = {};

  for (const alloc of allocations) {
    const slot = map.slots.find(s => s.id === alloc.slotId);
    if (!slot) continue;
    if (alloc.amount < 0) continue;
    const currentFill = next.slotFill[slot.id] || 0;
    const toFill = Math.min(alloc.amount, slot.capacity - currentFill);
    if (toFill <= 0) continue;
    if ((next.resources[slot.resourceType] || 0) < toFill) continue;

    next.resources[slot.resourceType] -= toFill;
    next.slotFill[slot.id] = currentFill + toFill;
    totalByType[slot.resourceType] = (totalByType[slot.resourceType] || 0) + toFill;

    if (slot.requiredForId) {
      const nodeId = slot.requiredForId;
      let delta = 0;
      switch (slot.resourceType) {
        case 'candle': delta = toFill * 3; break;
        case 'oil': delta = toFill * 4; break;
        case 'breeze': delta = toFill * 2.5; break;
        case 'talisman': delta = toFill * 5; break;
      }
      next.measurements[nodeId] = Math.min(100, (next.measurements[nodeId] || 0) + delta);
    }
  }

  return next;
}

export function applyEffects(
  state: GameState,
  effects: { target: string; targetId?: string; delta: number }[]
): GameState {
  const map = MAPS[state.phase];
  const next = cloneState(state);

  for (const eff of effects) {
    switch (eff.target) {
      case 'measurement':
        if (eff.targetId) {
          next.measurements[eff.targetId] = clamp(0, 100, (next.measurements[eff.targetId] || 0) + eff.delta);
        } else {
          map.nodes.forEach(n => {
            next.measurements[n.id] = clamp(0, 100, (next.measurements[n.id] || 0) + eff.delta);
          });
        }
        break;
      case 'resource':
        if (eff.targetId) {
          next.resources[eff.targetId] = Math.max(0, (next.resources[eff.targetId] || 0) + eff.delta);
        }
        break;
      case 'stain':
        if (eff.targetId) {
          const existing = next.stains.find(s => s.nodeId === eff.targetId);
          if (existing) {
            existing.intensity = Math.max(0, existing.intensity + eff.delta);
          } else if (eff.delta > 0) {
            next.stains.push({
              id: `stain-${eff.targetId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              nodeId: eff.targetId,
              intensity: eff.delta,
              round: next.round
            });
          }
        } else {
          map.nodes.forEach(n => {
            if (eff.delta > 0) {
              const existing = next.stains.find(s => s.nodeId === n.id);
              if (existing) existing.intensity += eff.delta;
              else next.stains.push({
                id: `stain-${n.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                nodeId: n.id,
                intensity: eff.delta,
                round: next.round
              });
            } else {
              next.stains = next.stains.map(s => ({ ...s, intensity: Math.max(0, s.intensity + eff.delta) })).filter(s => s.intensity > 0);
            }
          });
        }
        break;
      case 'wuRisk':
        next.wuRisk = Math.max(0, next.wuRisk + eff.delta);
        break;
      case 'dingReward':
        next.dingReward = Math.max(0, next.dingReward + eff.delta);
        break;
      case 'jiFailure':
        next.jiFailure = Math.max(0, next.jiFailure + eff.delta);
        break;
    }
  }

  return next;
}

export function settleGame(phase: GamePhase, steps: StepRecord[]): SettleResult {
  const cfg = PHASE_CONFIGS[phase];
  const map = MAPS[phase];

  const rebuilt = rebuildStateFromSteps(phase, steps);
  const winResult = cfg.winFormula(rebuilt, steps);
  const score = winResult.score;

  return {
    phase,
    phaseName: cfg.phaseName,
    victory: winResult.victory,
    finalScore: score,
    measurementScore: rebuilt.measurements ? Object.values(rebuilt.measurements).reduce((a, b) => a + b, 0) : 0,
    wuRiskPenalty: Math.max(0, rebuilt.wuRisk - (phase === 'ding' ? 50 : phase === 'wu' ? 60 : 70)) * (phase === 'ding' ? 3 : 2),
    dingRewardBonus: rebuilt.dingReward * (phase === 'ding' ? 5 : phase === 'wu' ? 3 : 4),
    jiFailurePenalty: rebuilt.jiFailure * (phase === 'wu' ? 5 : phase === 'ding' ? 4 : 6),
    stainPenalty: rebuilt.stains.reduce((a, b) => a + b.intensity, 0) * (phase === 'ding' ? 3 : 2),
    efficiencyBonus: Math.max(0, (phase === 'wu' ? 80 : phase === 'ding' ? 60 : 70) - steps.length * (phase === 'wu' ? 3 : 2)),
    hiddenConditionTriggered: winResult.hiddenTriggered,
    hiddenConditionName: winResult.hiddenName,
    stepsCount: steps.length,
    details: winResult.details
  };
}

export function rebuildStateFromSteps(phase: GamePhase, steps: StepRecord[]): GameState {
  let state = createInitialState(phase);
  const map = MAPS[phase];

  for (const step of steps) {
    if (step.allocations && step.allocations.length > 0) {
      state = applyAllocations(state, step.allocations);
    }

    if (step.eventId) {
      const ev = EVENTS[step.eventId];
      if (ev) {
        let effects = ev.effects || [];
        if (ev.choices && step.choiceIndex !== undefined && ev.choices[step.choiceIndex]) {
          effects = ev.choices[step.choiceIndex].effects;
        }
        state = applyEffects(state, (effects || []).map(e => ({ ...e })));
      }
    }

    state.round = step.round + 1;
  }

  state.steps = steps;
  if (steps.length > 0) {
    const nextRound = steps[steps.length - 1].round + 1;
    state.round = nextRound;
    state.gameOver = nextRound > state.maxRounds;
  }

  return state;
}

export function getStainsForNode(stains: StainMark[], nodeId: string): StainMark[] {
  return stains.filter(s => s.nodeId === nodeId);
}

function clamp(min: number, max: number, v: number): number {
  return Math.max(min, Math.min(max, v));
}

function cloneState(s: GameState): GameState {
  return {
    ...s,
    measurements: { ...s.measurements },
    slotFill: { ...s.slotFill },
    resources: { ...s.resources },
    stains: s.stains.map(st => ({ ...st })),
    steps: s.steps.map(st => ({ ...st, allocations: [...st.allocations], measurements: { ...st.measurements }, remainingResources: { ...st.remainingResources }, stains: st.stains.map(x => ({ ...x })) })),
    eventHistory: [...s.eventHistory],
    hiddenFlags: { ...s.hiddenFlags },
    currentEvent: s.currentEvent ? { ...s.currentEvent, effects: (s.currentEvent.effects || []).map(e => ({ ...e })), choices: s.currentEvent.choices?.map(c => ({ ...c, effects: c.effects.map(e => ({ ...e })) })) } : undefined
  };
}
