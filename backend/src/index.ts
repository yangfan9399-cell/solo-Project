import express from 'express';
import cors from 'cors';
import {
  createSession,
  getSession,
  listMazes,
  getMaze,
  move,
  calculateSettlement,
} from './gameEngine';
import { DifficultyKey } from './types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.get('/api/mazes', (_req, res) => {
  res.json(listMazes());
});

app.get('/api/mazes/:key', (req, res) => {
  try {
    const maze = getMaze(req.params.key as DifficultyKey);
    res.json(maze);
  } catch (e) {
    res.status(404).json({ error: (e as Error).message });
  }
});

app.post('/api/sessions', (req, res) => {
  const { mazeKey } = req.body;
  try {
    const session = createSession(mazeKey as DifficultyKey);
    res.json(session);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/api/sessions/:id', (req, res) => {
  const session = getSession(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
  } else {
    res.json(session);
  }
});

app.post('/api/sessions/:id/move', (req, res) => {
  const { x, y } = req.body;
  try {
    const session = move(req.params.id, { x, y });
    res.json(session);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/api/sessions/:id/settlement', (req, res) => {
  try {
    const settlement = calculateSettlement(req.params.id);
    res.json(settlement);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`蜡封迷宫推演局 后端服务已启动: http://localhost:${PORT}`);
});
