import express from 'express';
import cors from 'cors';
import type { GamePhase, StepRecord, ResourceAllocation } from './types';
import { MAPS, PHASE_CONFIGS, EVENTS, RESOURCE_LABELS } from './config';
import { createInitialState, pickEventForRound, settleGame, applyAllocations, applyEffects, rebuildStateFromSteps } from './engine';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/meta/phases', (_req, res) => {
  const result = Object.values(PHASE_CONFIGS).map(cfg => ({
    phase: cfg.phase,
    phaseName: cfg.phaseName,
    description: cfg.description,
    teaching: cfg.teaching,
    maxRounds: cfg.maxRounds,
    victoryThreshold: cfg.victoryThreshold,
    hiddenCondition: cfg.hiddenCondition ? {
      name: cfg.hiddenCondition.name,
      description: cfg.hiddenCondition.description,
      bonus: cfg.hiddenCondition.bonus
    } : null
  }));
  res.json({ phases: result, resourceLabels: RESOURCE_LABELS });
});

app.get('/api/map/:phase', (req, res) => {
  const phase = req.params.phase as GamePhase;
  const map = MAPS[phase];
  if (!map) return res.status(404).json({ error: '未知局段' });
  res.json({ map, config: { ...PHASE_CONFIGS[phase], winFormula: undefined } });
});

app.post('/api/game/init', (req, res) => {
  const { phase } = req.body as { phase: GamePhase };
  if (!phase || !MAPS[phase]) return res.status(400).json({ error: '非法局段' });
  const state = createInitialState(phase);
  const ev = pickEventForRound(phase, state.round, []);
  res.json({ state, event: ev });
});

app.post('/api/game/step', (req, res) => {
  const { phase, steps, allocations, eventId, choiceIndex } = req.body as {
    phase: GamePhase;
    steps: StepRecord[];
    allocations: ResourceAllocation[];
    eventId?: string;
    choiceIndex?: number;
  };
  if (!phase || !MAPS[phase]) return res.status(400).json({ error: '非法局段' });

  let state = rebuildStateFromSteps(phase, steps || []);
  const map = MAPS[phase];

  const stepIndex = steps.length;
  const round = state.round;

  state = applyAllocations(state, allocations || []);

  if (eventId) {
    const ev = EVENTS[eventId];
    if (ev) {
      let effects = ev.effects || [];
      if (ev.choices && choiceIndex !== undefined && ev.choices[choiceIndex]) {
        effects = ev.choices[choiceIndex].effects;
      }
      state = applyEffects(state, (effects || []).map(e => ({ ...e })));
      state.eventHistory = [...state.eventHistory, eventId];
    }
  }

  const record: StepRecord = {
    stepIndex,
    round,
    allocations: allocations || [],
    eventId,
    choiceIndex,
    measurements: { ...state.measurements },
    wuRisk: state.wuRisk,
    dingReward: state.dingReward,
    jiFailure: state.jiFailure,
    stains: state.stains.map(s => ({ ...s })),
    remainingResources: { ...state.resources },
    timestamp: Date.now()
  };

  const nextSteps = [...steps, record];
  const nextRound = round + 1;
  state.round = nextRound;
  state.steps = nextSteps;

  const isLastRound = nextRound > state.maxRounds;
  state.gameOver = isLastRound;
  const nextEvent = isLastRound ? undefined : pickEventForRound(phase, nextRound, state.eventHistory);

  res.json({
    state,
    event: isLastRound ? undefined : nextEvent,
    lastStep: record,
    gameOver: isLastRound
  });
});

app.post('/api/game/settle', (req, res) => {
  const { phase, steps } = req.body as { phase: GamePhase; steps: StepRecord[] };
  if (!phase || !MAPS[phase]) return res.status(400).json({ error: '非法局段' });
  const result = settleGame(phase, steps || []);
  res.json({ result });
});

app.post('/api/game/rebuild', (req, res) => {
  const { phase, steps } = req.body as { phase: GamePhase; steps: StepRecord[] };
  if (!phase || !MAPS[phase]) return res.status(400).json({ error: '非法局段' });
  const state = rebuildStateFromSteps(phase, steps || []);
  res.json({ state });
});

app.get('/api/events/:phase', (req, res) => {
  const phase = req.params.phase as GamePhase;
  const cfg = PHASE_CONFIGS[phase];
  if (!cfg) return res.status(404).json({ error: '未知局段' });
  const events = cfg.eventPool.map(id => EVENTS[id]).filter(Boolean);
  res.json({ events });
});

import path from 'path';
const publicDir = path.join(__dirname, '..', 'public');
app.use('/assets', express.static(path.join(publicDir, 'assets')));
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});
app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[雾港灯阵] 服务启动于 http://localhost:${PORT}`);
});
