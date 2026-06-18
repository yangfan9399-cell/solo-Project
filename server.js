const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const games = require('./data/games');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data', 'sessions');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const sessions = new Map();

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadSession(sessionId) {
  if (sessions.has(sessionId)) {
    return sessions.get(sessionId);
  }
  const filePath = path.join(DATA_DIR, `${sessionId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      sessions.set(sessionId, data);
      return data;
    } catch (e) {
      console.error('Failed to load session:', e);
    }
  }
  return null;
}

function saveSession(sessionId, session) {
  sessions.set(sessionId, session);
  const filePath = path.join(DATA_DIR, `${sessionId}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

function generateSessionId() {
  return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createSession(gameId) {
  const game = games[gameId];
  if (!game) return null;

  const sessionId = generateSessionId();
  const initialState = deepClone(game.initialState);
  
  const session = {
    sessionId,
    gameId,
    currentState: initialState,
    replayHistory: [
      {
        step: 0,
        timestamp: Date.now(),
        type: 'init',
        eventId: null,
        eventName: '游戏开始',
        state: deepClone(initialState),
        delta: null
      }
    ],
    currentStep: 0,
    isFinished: false,
    result: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  saveSession(sessionId, session);
  return session;
}

function executeEvent(session, eventId) {
  const game = games[session.gameId];
  const event = game.events.find(e => e.id === eventId);
  
  if (!event) {
    return { success: false, error: '事件不存在' };
  }

  if (session.isFinished) {
    return { success: false, error: '游戏已结束' };
  }

  if (session.currentStep >= game.maxSteps) {
    return { success: false, error: '已达到最大步数' };
  }

  if (event.cost) {
    if (event.cost.riskC && session.currentState.riskC < event.cost.riskC) {
      return { success: false, error: '丙号风险不足' };
    }
    if (event.cost.rewardM && session.currentState.rewardM < event.cost.rewardM) {
      return { success: false, error: '卯号奖励不足' };
    }
  }

  const prevState = deepClone(session.currentState);
  const newState = deepClone(session.currentState);

  if (event.cost) {
    if (event.cost.riskC) newState.riskC -= event.cost.riskC;
    if (event.cost.rewardM) newState.rewardM -= event.cost.rewardM;
  }

  try {
    const effectFn = event.effect;
    effectFn(newState);
  } catch (e) {
    return { success: false, error: '事件执行失败: ' + e.message };
  }

  const delta = {
    invertedValue: newState.invertedValue - prevState.invertedValue,
    balanceSlots: newState.balanceSlots.map((v, i) => v - prevState.balanceSlots[i]),
    riskC: newState.riskC - prevState.riskC,
    rewardM: newState.rewardM - prevState.rewardM,
    failureY: newState.failureY - prevState.failureY
  };

  newState.measureTraces = newState.measureTraces || [];
  if (newState.measureTraces.length === prevState.measureTraces.length) {
    newState.measureTraces.push({
      time: Date.now(),
      value: newState.invertedValue,
      stable: Math.abs(newState.invertedValue - prevState.invertedValue) < 5
    });
  }

  session.currentStep += 1;
  session.currentState = newState;
  session.updatedAt = Date.now();

  const replayStep = {
    step: session.currentStep,
    timestamp: Date.now(),
    type: 'action',
    eventId: event.id,
    eventName: event.name,
    eventDescription: event.description,
    cost: event.cost,
    state: deepClone(newState),
    delta: delta
  };
  session.replayHistory.push(replayStep);

  let result = null;
  if (game.winCondition(newState)) {
    result = { type: 'win', message: '时序修复成功！温室恢复稳定。' };
  } else if (game.loseCondition(newState)) {
    result = { type: 'lose', message: '修复失败，温室崩溃了...' };
  } else if (session.currentStep >= game.maxSteps) {
    result = { type: 'lose', message: '步数耗尽，修复未完成。' };
  }

  if (result) {
    session.isFinished = true;
    session.result = result;
    replayStep.result = result;
  }

  saveSession(session.sessionId, session);

  return {
    success: true,
    session: sanitizeSession(session),
    delta,
    result
  };
}

function recalculateSettlement(session) {
  const game = games[session.gameId];
  const history = session.replayHistory;
  
  const recalcState = deepClone(game.initialState);
  const steps = [];
  
  for (let i = 1; i < history.length; i++) {
    const record = history[i];
    const event = game.events.find(e => e.id === record.eventId);
    
    if (!event) continue;
    
    const prevState = deepClone(recalcState);
    
    if (event.cost) {
      if (event.cost.riskC) recalcState.riskC -= event.cost.riskC;
      if (event.cost.rewardM) recalcState.rewardM -= event.cost.rewardM;
    }
    
    event.effect(recalcState);
    
    if (recalcState.measureTraces.length === prevState.measureTraces.length) {
      recalcState.measureTraces.push({
        time: record.timestamp,
        value: recalcState.invertedValue,
        stable: Math.abs(recalcState.invertedValue - prevState.invertedValue) < 5
      });
    }
    
    const stepResult = {
      step: i,
      eventId: record.eventId,
      eventName: record.eventName,
      valid: true,
      recalcState: deepClone(recalcState),
      winCheck: game.winCondition(recalcState),
      loseCheck: game.loseCondition(recalcState)
    };
    steps.push(stepResult);
  }
  
  const finalWin = game.winCondition(recalcState);
  const finalLose = game.loseCondition(recalcState);
  
  const invertedScore = recalcState.invertedValue;
  const balanceScore = recalcState.balanceSlots.reduce((sum, s) => sum + Math.abs(s - 50), 0);
  const riskBonus = recalcState.riskC * 10;
  const rewardBonus = recalcState.rewardM * 15;
  const failurePenalty = recalcState.failureY * 20;
  const stepPenalty = (history.length - 1) * 2;
  
  const totalScore = invertedScore + (200 - balanceScore) + riskBonus + rewardBonus - failurePenalty - stepPenalty;
  
  return {
    sessionId: session.sessionId,
    gameId: session.gameId,
    recalculated: true,
    steps,
    finalState: recalcState,
    finalResult: {
      win: finalWin,
      lose: finalLose,
      type: finalWin ? 'win' : (finalLose ? 'lose' : 'incomplete')
    },
    score: {
      invertedScore,
      balanceScore,
      riskBonus,
      rewardBonus,
      failurePenalty,
      stepPenalty,
      total: Math.max(0, totalScore)
    },
    winFormula: game.winFormula,
    loseFormula: game.loseFormula,
    verifiedAt: Date.now()
  };
}

function sanitizeSession(session) {
  return {
    sessionId: session.sessionId,
    gameId: session.gameId,
    currentState: session.currentState,
    currentStep: session.currentStep,
    isFinished: session.isFinished,
    result: session.result,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    replayCount: session.replayHistory.length
  };
}

app.get('/api/games', (req, res) => {
  const gameList = Object.values(games).map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    difficulty: g.difficulty,
    maxSteps: g.maxSteps,
    theme: g.map.theme,
    winFormula: g.winFormula,
    loseFormula: g.loseFormula
  }));
  res.json({ games: gameList });
});

app.get('/api/games/:gameId', (req, res) => {
  const game = games[req.params.gameId];
  if (!game) {
    return res.status(404).json({ error: '游戏不存在' });
  }
  res.json({
    id: game.id,
    name: game.name,
    description: game.description,
    difficulty: game.difficulty,
    maxSteps: game.maxSteps,
    initialState: game.initialState,
    events: game.events.map(e => ({
      id: e.id,
      name: e.name,
      description: e.description,
      cost: e.cost
    })),
    map: game.map,
    winFormula: game.winFormula,
    loseFormula: game.loseFormula
  });
});

app.post('/api/sessions', (req, res) => {
  const { gameId } = req.body;
  const session = createSession(gameId);
  if (!session) {
    return res.status(400).json({ error: '无效的游戏ID' });
  }
  res.json({ session: sanitizeSession(session) });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = loadSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  res.json({ session: sanitizeSession(session) });
});

app.post('/api/sessions/:sessionId/execute', (req, res) => {
  const { eventId } = req.body;
  const session = loadSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  const result = executeEvent(session, eventId);
  res.json(result);
});

app.get('/api/sessions/:sessionId/replay', (req, res) => {
  const session = loadSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  res.json({
    sessionId: session.sessionId,
    gameId: session.gameId,
    history: session.replayHistory,
    currentStep: session.currentStep
  });
});

app.get('/api/sessions/:sessionId/replay/:step', (req, res) => {
  const session = loadSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  const step = parseInt(req.params.step);
  if (step < 0 || step >= session.replayHistory.length) {
    return res.status(400).json({ error: '无效的步骤' });
  }
  res.json({
    step: session.replayHistory[step],
    isLatest: step === session.currentStep
  });
});

app.post('/api/sessions/:sessionId/settle', (req, res) => {
  const session = loadSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  const settlement = recalculateSettlement(session);
  res.json(settlement);
});

app.post('/api/sessions/:sessionId/reset', (req, res) => {
  const session = loadSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: '会话不存在' });
  }
  const newSession = createSession(session.gameId);
  res.json({ session: sanitizeSession(newSession) });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`琉璃温室节拍修复场服务器启动于 http://localhost:${PORT}`);
  console.log(`三局游戏已加载: ${Object.keys(games).join(', ')}`);
});

module.exports = app;
