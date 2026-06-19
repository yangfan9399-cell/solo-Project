import express from 'express';
import cors from 'cors';
import {
  createSession,
  getSession,
  executeEvent,
  skipStep,
  calculateSettlement,
  restoreFromHistory,
} from './game';
import { stageConfigs } from './stages';
import { GameStageId } from './types';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/api/stages', (_req, res) => {
  const stages = Object.values(stageConfigs).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    maxSteps: s.maxSteps,
    winCondition: s.winCondition,
    hasHidden: !!s.hiddenCondition,
  }));
  res.json({ stages });
});

app.post('/api/sessions', (req, res) => {
  const { stageId } = req.body;
  if (!stageId || !stageConfigs[stageId]) {
    return res.status(400).json({ error: 'Invalid stageId' });
  }

  try {
    const session = createSession(stageId as GameStageId);
    res.json({
      sessionId: session.sessionId,
      state: session.currentState,
      history: session.history.map((h) => ({
        stepIndex: h.stepIndex,
        eventId: h.eventId,
        timestamp: h.timestamp,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.sessionId,
    state: session.currentState,
    history: session.history.map((h) => ({
      stepIndex: h.stepIndex,
      eventId: h.eventId,
      timestamp: h.timestamp,
    })),
  });
});

app.get('/api/sessions/:sessionId/history/:stepIndex', (req, res) => {
  const { sessionId, stepIndex } = req.params;
  const session = getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const step = session.history.find((h) => h.stepIndex === parseInt(stepIndex, 10));
  if (!step) {
    return res.status(404).json({ error: 'Step not found' });
  }

  res.json({ step });
});

app.post('/api/sessions/:sessionId/execute', (req, res) => {
  const { sessionId } = req.params;
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ error: 'eventId is required' });
  }

  const session = executeEvent(sessionId, eventId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.sessionId,
    state: session.currentState,
    history: session.history.map((h) => ({
      stepIndex: h.stepIndex,
      eventId: h.eventId,
      timestamp: h.timestamp,
    })),
  });
});

app.post('/api/sessions/:sessionId/skip', (req, res) => {
  const { sessionId } = req.params;
  const session = skipStep(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId: session.sessionId,
    state: session.currentState,
    history: session.history.map((h) => ({
      stepIndex: h.stepIndex,
      eventId: h.eventId,
      timestamp: h.timestamp,
    })),
  });
});

app.get('/api/sessions/:sessionId/settlement', (req, res) => {
  const { sessionId } = req.params;
  const settlement = calculateSettlement(sessionId);
  if (!settlement) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ settlement });
});

app.post('/api/sessions/:sessionId/restore/:stepIndex', (req, res) => {
  const { sessionId, stepIndex } = req.params;
  const session = restoreFromHistory(sessionId, parseInt(stepIndex, 10));
  if (!session) {
    return res.status(404).json({ error: 'Session or step not found' });
  }

  res.json({
    sessionId: session.sessionId,
    state: session.currentState,
    history: session.history.map((h) => ({
      stepIndex: h.stepIndex,
      eventId: h.eventId,
      timestamp: h.timestamp,
    })),
  });
});

app.listen(PORT, () => {
  console.log(`银盐暗房服务器运行在 http://localhost:${PORT}`);
});
