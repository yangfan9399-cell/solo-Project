import express from 'express';
import cors from 'cors';
import type { LevelId } from './types';
import {
  createSession,
  getSession,
  listLevels,
  applyStep,
  rollbackToStep,
  computeSettlement,
  resumeFromReplay,
} from './engine';

const app = express();
const PORT = 3456;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.get('/api/levels', (_req, res) => {
  res.json({ levels: listLevels() });
});

app.post('/api/game/start', (req, res) => {
  const { levelId, sessionId } = req.body as { levelId?: LevelId; sessionId?: string };
  if (!levelId || !['wu', 'ding', 'wei'].includes(levelId)) {
    return res.status(400).json({ error: '无效的关卡ID' });
  }
  const sid = sessionId || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const state = createSession(levelId, sid);
  res.json({ sessionId: sid, state });
});

app.post('/api/game/resume', (req, res) => {
  const { sessionId, replay, levelId } = req.body as {
    sessionId?: string;
    replay?: any[];
    levelId?: LevelId;
  };
  if (!sessionId || !replay || !levelId) {
    return res.status(400).json({ error: '参数缺失' });
  }
  const state = resumeFromReplay(sessionId, replay, levelId);
  res.json({ sessionId, state });
});

app.get('/api/game/state/:sessionId', (req, res) => {
  const state = getSession(req.params.sessionId);
  if (!state) return res.status(404).json({ error: '会话不存在' });
  res.json({ state });
});

app.post('/api/game/step', (req, res) => {
  const { sessionId, eventId } = req.body as { sessionId?: string; eventId?: string };
  if (!sessionId || !eventId) return res.status(400).json({ error: '参数缺失' });
  const result = applyStep(sessionId, eventId);
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json(result);
});

app.post('/api/game/rollback', (req, res) => {
  const { sessionId, stepIndex } = req.body as { sessionId?: string; stepIndex?: number };
  if (!sessionId || stepIndex == null) return res.status(400).json({ error: '参数缺失' });
  const result = rollbackToStep(sessionId, stepIndex);
  if ('error' in result) return res.status(400).json({ error: result.error });
  res.json({ state: result });
});

app.get('/api/game/settlement/:sessionId', (req, res) => {
  const result = computeSettlement(req.params.sessionId);
  if ('error' in result) return res.status(404).json({ error: result.error });
  res.json({ settlement: result });
});

app.listen(PORT, () => {
  console.log(`[云母矿灯·后端] 已启动 http://localhost:${PORT}`);
});
