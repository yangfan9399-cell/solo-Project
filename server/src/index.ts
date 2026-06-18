import express from 'express';
import cors from 'cors';
import path from 'path';
import { createLevel, levelInfo } from './levels';
import { movePlayer, useManualEvent, calculateResult, getCellAt } from './engine';
import { GameLevelId, GameState, ReplayStep, Position } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const publicDir = path.join(__dirname, '../../client/public');
app.use(express.static(publicDir));

const gameSessions = new Map<string, { state: GameState; replay: ReplayStep[] }>();

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2, 10);
}

app.get('/api/levels', (_req, res) => {
  res.json(levelInfo);
});

app.post('/api/game/start', (req, res) => {
  const { levelId } = req.body as { levelId: GameLevelId };
  if (!levelId || !['wu', 'ding', 'wei'].includes(levelId)) {
    return res.status(400).json({ error: 'Invalid level ID' });
  }

  const state = createLevel(levelId);
  const sessionId = generateSessionId();
  const initialStep: ReplayStep = {
    step: 0,
    state: JSON.parse(JSON.stringify(state)),
    action: { player: 1, action: 'event', description: '游戏开始' },
    timestamp: Date.now()
  };

  gameSessions.set(sessionId, { state, replay: [initialStep] });

  res.json({
    sessionId,
    state,
    replay: [initialStep]
  });
});

app.post('/api/game/restore', (req, res) => {
  const { replay } = req.body as { replay: ReplayStep[] };
  if (!replay || replay.length === 0) {
    return res.status(400).json({ error: 'Invalid replay data' });
  }

  const lastState = replay[replay.length - 1].state;
  const sessionId = generateSessionId();

  gameSessions.set(sessionId, {
    state: JSON.parse(JSON.stringify(lastState)),
    replay: JSON.parse(JSON.stringify(replay))
  });

  res.json({
    sessionId,
    state: lastState,
    replay
  });
});

app.get('/api/game/:sessionId', (req, res) => {
  const session = gameSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ state: session.state, replay: session.replay });
});

app.post('/api/game/:sessionId/move', (req, res) => {
  const session = gameSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.state.status !== 'playing') {
    return res.status(400).json({ error: 'Game is already ended' });
  }

  const { player, direction } = req.body as { player: 1 | 2; direction: Position };
  if (!player || !direction) {
    return res.status(400).json({ error: 'Missing player or direction' });
  }

  const result = movePlayer(session.state, player, direction);
  session.state = result.state;

  if (result.moved) {
    const step: ReplayStep = {
      step: session.replay.length,
      state: JSON.parse(JSON.stringify(result.state)),
      action: {
        player,
        action: 'move',
        direction,
        description: result.description
      },
      timestamp: Date.now()
    };
    session.replay.push(step);
  }

  res.json({
    state: result.state,
    moved: result.moved,
    description: result.description,
    replayStep: result.moved ? session.replay[session.replay.length - 1] : null
  });
});

app.post('/api/game/:sessionId/event', (req, res) => {
  const session = gameSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.state.status !== 'playing') {
    return res.status(400).json({ error: 'Game is already ended' });
  }

  const { eventId, choiceIndex } = req.body as { eventId: string; choiceIndex?: number };
  if (!eventId) {
    return res.status(400).json({ error: 'Missing eventId' });
  }

  const result = useManualEvent(session.state, eventId, choiceIndex);
  session.state = result.state;

  if (result.success) {
    const step: ReplayStep = {
      step: session.replay.length,
      state: JSON.parse(JSON.stringify(result.state)),
      action: {
        player: 1,
        action: 'event',
        description: result.description
      },
      timestamp: Date.now()
    };
    session.replay.push(step);
  }

  res.json({
    state: result.state,
    success: result.success,
    description: result.description,
    replayStep: result.success ? session.replay[session.replay.length - 1] : null
  });
});

app.post('/api/game/:sessionId/settle', (req, res) => {
  const session = gameSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const result = calculateResult(session.state, session.replay.length - 1);
  res.json(result);
});

app.get('/api/game/:sessionId/replay', (req, res) => {
  const session = gameSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({ replay: session.replay });
});

app.listen(PORT, () => {
  console.log(`琉璃温室双人机关局 服务器运行在 http://localhost:${PORT}`);
});

export default app;
